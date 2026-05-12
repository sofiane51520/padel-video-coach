import { VideoPlayer, VideoView, useVideoPlayer } from "expo-video";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  GestureResponderEvent,
  LayoutChangeEvent,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View
} from "react-native";
import { Text, XStack, YStack } from "tamagui";
import { Button } from "@/components/Button";
import { CourtPreview } from "@/components/CourtPreview";
import { PageHeader } from "@/components/PageHeader";
import { Screen } from "@/components/Screen";
import { colors } from "@/constants/theme";
import { BackendCalibrationSuggestion, suggestCourtCalibration } from "@/services/backendApi";
import { useMatchStore } from "@/store/matchStore";
import { CalibrationPoint } from "@/types/match";

const calibrationLabels = [
  "Coin arriere gauche",
  "Coin arriere droit",
  "Coin avant droit",
  "Coin avant gauche"
];
const defaultVideoAspectRatio = 16 / 9;

export default function CalibrationScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getMatch, selectMatch, setCalibrationPoints, setMatchStatus } = useMatchStore();
  const match = getMatch(id);
  const [calibrationSuggestion, setCalibrationSuggestion] =
    useState<BackendCalibrationSuggestion | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSuggesting, setIsSuggesting] = useState(false);

  if (!match) {
    return (
      <Screen>
        <PageHeader title="Match introuvable" description="Retourne a la liste des matchs." />
      </Screen>
    );
  }

  const currentMatch = match;
  const points = currentMatch.calibrationPoints ?? [];

  function handleAddPoint(point: CalibrationPoint) {
    if (points.length >= 4) {
      return;
    }

    setError(null);
    setCalibrationPoints(currentMatch.id, [...points, point]);
  }

  function handleReset() {
    setError(null);
    setCalibrationSuggestion(null);
    setCalibrationPoints(currentMatch.id, []);
  }

  async function handleSuggestCalibration() {
    if (!currentMatch.video) {
      setError("Importe une video avant de demander une suggestion de calibration.");
      return;
    }

    try {
      setError(null);
      setIsSuggesting(true);
      const suggestion = await suggestCourtCalibration(currentMatch.video);
      setCalibrationSuggestion(suggestion);
      setCalibrationPoints(
        currentMatch.id,
        suggestion.points.map((point, index) => ({
          id: point.id || `calibration-${index + 1}`,
          label: point.label || calibrationLabels[index],
          x: point.x,
          y: point.y
        }))
      );
    } catch (suggestionError) {
      setError(getErrorMessage(suggestionError));
    } finally {
      setIsSuggesting(false);
    }
  }

  function handleValidate() {
    if (points.length < 4) {
      setError("Place les quatre coins du terrain avant de valider.");
      return;
    }

    selectMatch(currentMatch.id);
    setMatchStatus(currentMatch.id, "draft");
    router.push({ pathname: "/players/[id]", params: { id: currentMatch.id } });
  }

  return (
    <Screen>
      <PageHeader
        eyebrow={currentMatch.title}
        title="Calibration du terrain"
        description="Place les quatre coins pour convertir les mouvements en metres."
      />

      <YStack
        gap="$4"
        style={{
          backgroundColor: colors.surface,
          borderColor: colors.line,
          borderWidth: 1,
          borderRadius: 8,
          padding: 18
        }}
      >
        <CalibrationSurface
          points={points}
          videoUri={currentMatch.video?.uri}
          onAddPoint={handleAddPoint}
        />
        <YStack gap="$2">
          <Text style={{ color: colors.ink, fontSize: 18, fontWeight: "900" }}>Points terrain</Text>
          {calibrationSuggestion ? (
            <Text style={{ color: colors.inkMuted, fontSize: 14, lineHeight: 20 }}>
              Suggestion {Math.round(calibrationSuggestion.confidence * 100)}% via{" "}
              {calibrationSuggestion.method}.
            </Text>
          ) : null}
          {calibrationLabels.map((label, index) => (
            <Text key={label} style={{ color: colors.inkMuted, fontSize: 15 }}>
              {index + 1}. {label} {points[index] ? "ok" : ""}
            </Text>
          ))}
        </YStack>
      </YStack>

      {error ? <Text style={{ color: colors.danger, fontWeight: "800" }}>{error}</Text> : null}

      <XStack flexWrap="wrap" gap="$3">
        <Button
          disabled={isSuggesting}
          icon="sparkles-outline"
          variant="secondary"
          onPress={handleSuggestCalibration}
        >
          {isSuggesting ? "Suggestion..." : "Suggerer les coins"}
        </Button>
        <Button icon="checkmark-circle-outline" onPress={handleValidate}>
          Valider la calibration
        </Button>
        {points.length > 0 ? (
          <Button icon="refresh-outline" variant="secondary" onPress={handleReset}>
            Recommencer
          </Button>
        ) : null}
        <Button
          href={{ pathname: "/matches/[id]", params: { id: currentMatch.id } }}
          icon="arrow-back-outline"
          variant="secondary"
        >
          Retour au match
        </Button>
      </XStack>
    </Screen>
  );
}

function CalibrationSurface({
  onAddPoint,
  points,
  videoUri
}: {
  onAddPoint: (point: CalibrationPoint) => void;
  points: CalibrationPoint[];
  videoUri?: string;
}) {
  if (videoUri) {
    return <VideoCalibrationSurface onAddPoint={onAddPoint} points={points} uri={videoUri} />;
  }

  return <StaticCalibrationSurface onAddPoint={onAddPoint} points={points} />;
}

function StaticCalibrationSurface({
  onAddPoint,
  points
}: {
  onAddPoint: (point: CalibrationPoint) => void;
  points: CalibrationPoint[];
}) {
  const [layout, setLayout] = useState({ width: 0, height: 0 });

  function handleLayout(event: LayoutChangeEvent) {
    const { height, width } = event.nativeEvent.layout;
    setLayout({ height, width });
  }

  function handlePress(event: GestureResponderEvent) {
    if (!layout.width || !layout.height || points.length >= 4) {
      return;
    }

    const { locationX, locationY } = event.nativeEvent;
    const index = points.length;

    onAddPoint({
      id: `calibration-${index + 1}`,
      label: calibrationLabels[index],
      x: locationX / layout.width,
      y: locationY / layout.height
    });
  }

  return (
    <YStack gap="$3">
      <Pressable onLayout={handleLayout} onPress={handlePress} style={styles.staticSurface}>
        <CourtPreview />
        <View style={styles.markerLayer}>
          {points.map((point, index) => (
            <View
              key={point.id}
              style={[
                styles.marker,
                {
                  left: `${point.x * 100}%`,
                  top: `${point.y * 100}%`
                }
              ]}
            >
              <Text style={styles.markerLabel}>{index + 1}</Text>
            </View>
          ))}
        </View>
      </Pressable>
    </YStack>
  );
}

function VideoCalibrationSurface({
  onAddPoint,
  points,
  uri
}: {
  onAddPoint: (point: CalibrationPoint) => void;
  points: CalibrationPoint[];
  uri: string;
}) {
  const player = useCalibrationVideoPlayer(uri);
  const windowDimensions = useWindowDimensions();
  const [availableWidth, setAvailableWidth] = useState(0);
  const [layout, setLayout] = useState({ width: 0, height: 0 });
  const [videoAspectRatio, setVideoAspectRatio] = useState(defaultVideoAspectRatio);
  const surfaceSize = useMemo(
    () =>
      getContainedSurfaceSize({
        aspectRatio: videoAspectRatio,
        availableWidth,
        viewportHeight: windowDimensions.height
      }),
    [availableWidth, videoAspectRatio, windowDimensions.height]
  );

  useEffect(() => {
    const intervalId = setInterval(() => {
      const size = player.videoTrack?.size ?? player.availableVideoTracks[0]?.size;

      if (size?.width && size.height) {
        setVideoAspectRatio(size.width / size.height);
      }
    }, 250);

    return () => clearInterval(intervalId);
  }, [player]);

  function handleLayout(event: LayoutChangeEvent) {
    const { height, width } = event.nativeEvent.layout;
    setLayout({ height, width });
  }

  function handleContainerLayout(event: LayoutChangeEvent) {
    setAvailableWidth(event.nativeEvent.layout.width);
  }

  function handlePress(event: GestureResponderEvent) {
    if (!layout.width || !layout.height || points.length >= 4) {
      return;
    }

    const { locationX, locationY } = event.nativeEvent;
    const index = points.length;

    onAddPoint({
      id: `calibration-${index + 1}`,
      label: calibrationLabels[index],
      x: locationX / layout.width,
      y: locationY / layout.height
    });
  }

  return (
    <YStack gap="$3" onLayout={handleContainerLayout}>
      <Pressable
        onLayout={handleLayout}
        onPress={handlePress}
        style={[
          styles.videoSurface,
          {
            width: surfaceSize.width,
            height: surfaceSize.height
          }
        ]}
      >
        <VideoView
          contentFit="contain"
          nativeControls={false}
          player={player}
          style={styles.videoView}
        />
        <View pointerEvents="none" style={styles.markerLayer}>
          {points.map((point, index) => (
            <View
              key={point.id}
              style={[
                styles.marker,
                {
                  left: `${point.x * 100}%`,
                  top: `${point.y * 100}%`
                }
              ]}
            >
              <Text style={styles.markerLabel}>{index + 1}</Text>
            </View>
          ))}
        </View>
      </Pressable>
      <CalibrationVideoControls player={player} />
    </YStack>
  );
}

function CalibrationVideoControls({ player }: { player: VideoPlayer }) {
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [progressLayout, setProgressLayout] = useState({ width: 0 });
  const safeDuration = duration > 0 ? duration : 0;
  const progress = safeDuration > 0 ? Math.min(1, currentTime / safeDuration) : 0;

  useEffect(() => {
    const intervalId = setInterval(() => {
      setCurrentTime(player.currentTime || 0);
      setDuration(player.duration || 0);
    }, 250);

    return () => clearInterval(intervalId);
  }, [player]);

  function seekTo(seconds: number) {
    const nextTime = clamp(seconds, 0, safeDuration || seconds);
    player.pause();
    player.currentTime = nextTime;
    setCurrentTime(nextTime);
  }

  function handleProgressLayout(event: LayoutChangeEvent) {
    setProgressLayout({ width: event.nativeEvent.layout.width });
  }

  function handleProgressPress(event: GestureResponderEvent) {
    if (!progressLayout.width || safeDuration <= 0) {
      return;
    }

    seekTo((event.nativeEvent.locationX / progressLayout.width) * safeDuration);
  }

  return (
    <YStack gap="$3" style={styles.videoControls}>
      <XStack style={{ alignItems: "center", justifyContent: "space-between" }}>
        <Text style={styles.videoTime}>{formatVideoTime(currentTime)}</Text>
        <Text style={styles.videoTimeMuted}>{formatVideoTime(safeDuration)}</Text>
      </XStack>

      <Pressable onLayout={handleProgressLayout} onPress={handleProgressPress} style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
        <View style={[styles.progressHandle, { left: `${progress * 100}%` }]} />
      </Pressable>

      <XStack flexWrap="wrap" gap="$2">
        <Button icon="play-skip-back-outline" variant="secondary" onPress={() => seekTo(0)}>
          Debut
        </Button>
        <Button icon="play-back-outline" variant="secondary" onPress={() => seekTo(currentTime - 5)}>
          -5 s
        </Button>
        <Button icon="chevron-back-outline" variant="secondary" onPress={() => seekTo(currentTime - 1)}>
          -1 s
        </Button>
        <Button icon="chevron-forward-outline" variant="secondary" onPress={() => seekTo(currentTime + 1)}>
          +1 s
        </Button>
        <Button icon="play-forward-outline" variant="secondary" onPress={() => seekTo(currentTime + 5)}>
          +5 s
        </Button>
      </XStack>
    </YStack>
  );
}

function useCalibrationVideoPlayer(uri: string) {
  return useVideoPlayer(uri, (videoPlayer) => {
    videoPlayer.muted = true;
    videoPlayer.currentTime = 0;
    videoPlayer.pause();
  });
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function formatVideoTime(totalSeconds: number): string {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(safeSeconds / 60);
  const seconds = safeSeconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function getContainedSurfaceSize({
  aspectRatio,
  availableWidth,
  viewportHeight
}: {
  aspectRatio: number;
  availableWidth: number;
  viewportHeight: number;
}) {
  const width = Math.max(0, availableWidth);
  const maxHeight = Math.max(220, Math.min(620, viewportHeight * 0.58));

  if (!width) {
    return {
      width: "100%" as const,
      height: undefined
    };
  }

  const heightFromWidth = width / aspectRatio;

  if (heightFromWidth <= maxHeight) {
    return {
      width,
      height: heightFromWidth
    };
  }

  return {
    width: maxHeight * aspectRatio,
    height: maxHeight
  };
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "Impossible de proposer une calibration automatiquement.";
}

const styles = StyleSheet.create({
  staticSurface: {
    width: "100%",
    aspectRatio: defaultVideoAspectRatio,
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: colors.courtDark
  },
  videoSurface: {
    alignSelf: "center",
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: "#050807"
  },
  videoView: {
    width: "100%",
    height: "100%"
  },
  markerLayer: {
    ...StyleSheet.absoluteFillObject
  },
  marker: {
    position: "absolute",
    width: 30,
    height: 30,
    marginLeft: -15,
    marginTop: -15,
    borderRadius: 15,
    backgroundColor: colors.gold,
    alignItems: "center",
    justifyContent: "center",
    borderColor: colors.surface,
    borderWidth: 2
  },
  markerLabel: {
    color: colors.ink,
    fontWeight: "900"
  },
  progressFill: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    borderRadius: 999,
    backgroundColor: colors.court
  },
  progressHandle: {
    position: "absolute",
    top: -6,
    width: 20,
    height: 20,
    marginLeft: -10,
    borderRadius: 10,
    backgroundColor: colors.gold,
    borderColor: colors.surface,
    borderWidth: 2
  },
  progressTrack: {
    height: 8,
    borderRadius: 999,
    backgroundColor: colors.line
  },
  videoControls: {
    borderColor: colors.line,
    borderRadius: 8,
    borderWidth: 1,
    padding: 14,
    backgroundColor: colors.background
  },
  videoTime: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: "900"
  },
  videoTimeMuted: {
    color: colors.inkMuted,
    fontSize: 14,
    fontWeight: "800"
  }
});
