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

type CalibrationReference = {
  id: string;
  label: string;
  courtX: number;
  courtY: number;
};

const minimumCalibrationPoints = 4;
const maximumCalibrationPoints = 4;
const calibrationReferences: CalibrationReference[] = [
  { id: "back-left", label: "Fond gauche", courtX: 0, courtY: 1 },
  { id: "back-right", label: "Fond droit", courtX: 1, courtY: 1 },
  { id: "net-left", label: "Filet gauche", courtX: 0, courtY: 0.5 },
  { id: "net-right", label: "Filet droit", courtX: 1, courtY: 0.5 },
  { id: "service-left", label: "Service gauche", courtX: 0.25, courtY: 0.85 },
  { id: "service-right", label: "Service droit", courtX: 0.75, courtY: 0.85 },
  { id: "center-net", label: "Centre filet", courtX: 0.5, courtY: 0.5 },
  { id: "center-back", label: "Centre fond", courtX: 0.5, courtY: 1 }
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
  const [selectedReferenceId, setSelectedReferenceId] = useState(calibrationReferences[0].id);

  if (!match) {
    return (
      <Screen>
        <PageHeader title="Match introuvable" description="Retourne a la liste des matchs." />
      </Screen>
    );
  }

  const currentMatch = match;
  const points = currentMatch.calibrationPoints ?? [];
  const selectedReference =
    calibrationReferences.find((reference) => reference.id === selectedReferenceId) ??
    calibrationReferences[0];

  function handleAddPoint(point: CalibrationPoint) {
    const hasExistingPoint = points.some((currentPoint) => currentPoint.id === point.id);

    if (!hasExistingPoint && points.length >= maximumCalibrationPoints) {
      setError("Tu as deja 4 reperes. Selectionne un repere pose pour le repositionner.");
      return;
    }

    setError(null);
    setCalibrationPoints(
      currentMatch.id,
      hasExistingPoint
        ? points.map((currentPoint) => (currentPoint.id === point.id ? point : currentPoint))
        : [...points, point]
    );
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
          id: point.id || calibrationReferences[index].id,
          label: point.label || calibrationReferences[index].label,
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
    if (points.length < minimumCalibrationPoints) {
      setError("Place au moins 4 reperes visibles du terrain avant de valider.");
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
        description="Place 4 reperes visibles connus pour convertir les mouvements en metres."
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
          selectedReference={selectedReference}
          videoUri={currentMatch.video?.uri}
          onAddPoint={handleAddPoint}
        />
        <YStack gap="$2">
          <Text style={{ color: colors.ink, fontSize: 18, fontWeight: "900" }}>
            Reperes terrain
          </Text>
          <Text style={{ color: colors.inkMuted, fontSize: 14, lineHeight: 20 }}>
            Choisis un repere visible, puis touche sa position dans la video. Tu peux
            repositionner un repere deja pose.
          </Text>
          {calibrationSuggestion ? (
            <Text style={{ color: colors.inkMuted, fontSize: 14, lineHeight: 20 }}>
              Suggestion {Math.round(calibrationSuggestion.confidence * 100)}% via{" "}
              {calibrationSuggestion.method}.
            </Text>
          ) : null}
          <XStack flexWrap="wrap" gap="$2">
            {calibrationReferences.map((reference) => {
              const isPlaced = points.some((point) => point.id === reference.id);
              const isSelected = selectedReference.id === reference.id;

              return (
                <Pressable
                  key={reference.id}
                  onPress={() => setSelectedReferenceId(reference.id)}
                  style={[
                    styles.referenceChip,
                    isSelected ? styles.referenceChipSelected : null,
                    isPlaced ? styles.referenceChipPlaced : null
                  ]}
                >
                  <Text
                    style={[
                      styles.referenceChipText,
                      isSelected ? styles.referenceChipTextSelected : null
                    ]}
                  >
                    {reference.label}
                  </Text>
                </Pressable>
              );
            })}
          </XStack>
          <Text style={{ color: colors.inkMuted, fontSize: 14, fontWeight: "800" }}>
            {points.length}/{minimumCalibrationPoints} reperes poses
          </Text>
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
          {isSuggesting ? "Suggestion..." : "Suggerer les reperes"}
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
  selectedReference,
  videoUri
}: {
  onAddPoint: (point: CalibrationPoint) => void;
  points: CalibrationPoint[];
  selectedReference: CalibrationReference;
  videoUri?: string;
}) {
  if (videoUri) {
    return (
      <VideoCalibrationSurface
        onAddPoint={onAddPoint}
        points={points}
        selectedReference={selectedReference}
        uri={videoUri}
      />
    );
  }

  return (
    <StaticCalibrationSurface
      onAddPoint={onAddPoint}
      points={points}
      selectedReference={selectedReference}
    />
  );
}

function StaticCalibrationSurface({
  onAddPoint,
  points,
  selectedReference
}: {
  onAddPoint: (point: CalibrationPoint) => void;
  points: CalibrationPoint[];
  selectedReference: CalibrationReference;
}) {
  const [layout, setLayout] = useState({ width: 0, height: 0 });

  function handleLayout(event: LayoutChangeEvent) {
    const { height, width } = event.nativeEvent.layout;
    setLayout({ height, width });
  }

  function handlePress(event: GestureResponderEvent) {
    const hasExistingPoint = points.some((point) => point.id === selectedReference.id);

    if (
      !layout.width ||
      !layout.height ||
      (!hasExistingPoint && points.length >= maximumCalibrationPoints)
    ) {
      return;
    }

    const { locationX, locationY } = event.nativeEvent;

    onAddPoint({
      id: selectedReference.id,
      label: selectedReference.label,
      courtX: selectedReference.courtX,
      courtY: selectedReference.courtY,
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
  selectedReference,
  uri
}: {
  onAddPoint: (point: CalibrationPoint) => void;
  points: CalibrationPoint[];
  selectedReference: CalibrationReference;
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
    const hasExistingPoint = points.some((point) => point.id === selectedReference.id);

    if (
      !layout.width ||
      !layout.height ||
      (!hasExistingPoint && points.length >= maximumCalibrationPoints)
    ) {
      return;
    }

    const { locationX, locationY } = event.nativeEvent;

    onAddPoint({
      id: selectedReference.id,
      label: selectedReference.label,
      courtX: selectedReference.courtX,
      courtY: selectedReference.courtY,
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
  referenceChip: {
    minHeight: 38,
    borderRadius: 8,
    borderColor: colors.line,
    borderWidth: 1,
    justifyContent: "center",
    paddingHorizontal: 12,
    backgroundColor: colors.background
  },
  referenceChipPlaced: {
    borderColor: colors.court
  },
  referenceChipSelected: {
    backgroundColor: colors.court,
    borderColor: colors.court
  },
  referenceChipText: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: "800"
  },
  referenceChipTextSelected: {
    color: colors.surface
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
