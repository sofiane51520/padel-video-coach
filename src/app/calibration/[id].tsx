import { VideoView, useVideoPlayer } from "expo-video";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { GestureResponderEvent, LayoutChangeEvent, Pressable, StyleSheet, View } from "react-native";
import { Text, XStack, YStack } from "tamagui";
import { Button } from "@/components/Button";
import { CourtPreview } from "@/components/CourtPreview";
import { PageHeader } from "@/components/PageHeader";
import { Screen } from "@/components/Screen";
import { colors } from "@/constants/theme";
import { useMatchStore } from "@/store/matchStore";
import { CalibrationPoint } from "@/types/match";

const calibrationLabels = [
  "Coin arriere gauche",
  "Coin arriere droit",
  "Coin avant droit",
  "Coin avant gauche"
];

export default function CalibrationScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getMatch, selectMatch, setCalibrationPoints, setMatchStatus } = useMatchStore();
  const match = getMatch(id);
  const [error, setError] = useState<string | null>(null);

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
    setCalibrationPoints(currentMatch.id, []);
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
          {calibrationLabels.map((label, index) => (
            <Text key={label} style={{ color: colors.inkMuted, fontSize: 15 }}>
              {index + 1}. {label} {points[index] ? "ok" : ""}
            </Text>
          ))}
        </YStack>
      </YStack>

      {error ? <Text style={{ color: colors.danger, fontWeight: "800" }}>{error}</Text> : null}

      <XStack flexWrap="wrap" gap="$3">
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
    <Pressable onLayout={handleLayout} onPress={handlePress} style={styles.surface}>
      {videoUri ? <CalibrationVideo uri={videoUri} /> : <CourtPreview />}
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
  );
}

function CalibrationVideo({ uri }: { uri: string }) {
  const player = useVideoPlayer(uri, (videoPlayer) => {
    videoPlayer.muted = true;
    videoPlayer.currentTime = 0;
    videoPlayer.pause();
  });

  return (
    <VideoView
      contentFit="contain"
      nativeControls={false}
      player={player}
      style={StyleSheet.absoluteFill}
    />
  );
}

const styles = StyleSheet.create({
  surface: {
    width: "100%",
    aspectRatio: 1.78,
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: colors.courtDark
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
  }
});
