import Ionicons from "@expo/vector-icons/Ionicons";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Pressable, View } from "react-native";
import { Text, XStack, YStack } from "tamagui";
import { useVideoPlayer, VideoView } from "expo-video";
import { Button } from "@/components/Button";
import { PageHeader } from "@/components/PageHeader";
import { Screen } from "@/components/Screen";
import { colors } from "@/constants/theme";
import { useMatchStore } from "@/store/matchStore";
import { Match, Rally } from "@/types/match";

export default function RallyDebugScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getMatch, selectMatch } = useMatchStore();
  const match = getMatch(id);

  useEffect(() => {
    if (match) {
      selectMatch(match.id);
    }
  }, [match, selectMatch]);

  if (!match) {
    return (
      <Screen>
        <PageHeader title="Match introuvable" description="Retourne a la liste des matchs." />
      </Screen>
    );
  }

  if (!match.video) {
    return (
      <Screen>
        <PageHeader
          title="Aucune video"
          description="Ce match n'a pas de video locale a verifier."
        />
        <Button href={{ pathname: "/matches/[id]", params: { id: match.id } }} variant="secondary">
          Retour au match
        </Button>
      </Screen>
    );
  }

  return <RallyDebugContent match={match} />;
}

function RallyDebugContent({ match }: { match: Match }) {
  const [activeRallyId, setActiveRallyId] = useState<string | null>(match.rallies[0]?.id ?? null);
  const [currentTime, setCurrentTime] = useState(0);
  const videoUri = match.video?.uri ?? "";
  const activeRally = useMemo(
    () => match.rallies.find((rally) => rally.id === activeRallyId) ?? match.rallies[0],
    [activeRallyId, match.rallies]
  );
  const videoAspectRatio = match.videoProbe
    ? Math.max(1, match.videoProbe.width) / Math.max(1, match.videoProbe.height)
    : 16 / 9;
  const player = useVideoPlayer(videoUri, (createdPlayer) => {
    createdPlayer.loop = false;
  });

  useEffect(() => {
    const intervalId = setInterval(() => {
      setCurrentTime(player.currentTime ?? 0);
    }, 200);

    return () => {
      clearInterval(intervalId);
    };
  }, [player]);

  useEffect(() => {
    if (!activeRally) {
      return;
    }

    const endSeconds = parseClock(activeRally.endTime);
    const intervalId = setInterval(() => {
      if ((player.currentTime ?? 0) >= endSeconds) {
        player.pause();
        player.currentTime = endSeconds;
      }
    }, 120);

    return () => {
      clearInterval(intervalId);
    };
  }, [activeRally, player]);

  function playRally(rally: Rally) {
    const startSeconds = parseClock(rally.startTime);

    setActiveRallyId(rally.id);
    player.currentTime = startSeconds;
    setCurrentTime(startSeconds);
    player.play();
  }

  function replayActiveRally() {
    if (activeRally) {
      playRally(activeRally);
    }
  }

  const activeStart = activeRally ? parseClock(activeRally.startTime) : 0;
  const activeEnd = activeRally ? parseClock(activeRally.endTime) : 0;
  const activeProgress =
    activeEnd > activeStart
      ? Math.min(1, Math.max(0, (currentTime - activeStart) / (activeEnd - activeStart)))
      : 0;

  return (
    <Screen>
      <PageHeader
        eyebrow={match.title}
        title="Verification du decoupage"
        description="Lis chaque segment detecte pour valider rapidement les bornes des echanges."
      />

      <YStack
        gap="$3"
        style={{
          backgroundColor: colors.surface,
          borderColor: colors.line,
          borderRadius: 8,
          borderWidth: 1,
          padding: 12
        }}
      >
        <View
          style={{
            width: "100%",
            aspectRatio: videoAspectRatio,
            minHeight: 220,
            maxHeight: 620,
            overflow: "hidden",
            borderRadius: 8,
            backgroundColor: "#050706"
          }}
        >
          <VideoView
            player={player}
            nativeControls
            contentFit="contain"
            fullscreenOptions={{ enable: true }}
            style={{ width: "100%", height: "100%" }}
          />
        </View>

        <XStack flexWrap="wrap" gap="$3" style={{ alignItems: "center" }}>
          <Button icon="play-outline" onPress={replayActiveRally} disabled={!activeRally}>
            Relire segment
          </Button>
          <Button
            href={{ pathname: "/matches/[id]", params: { id: match.id } }}
            icon="arrow-back-outline"
            variant="secondary"
          >
            Retour au match
          </Button>
          <Text style={{ color: colors.inkMuted, fontSize: 14, fontWeight: "800" }}>
            Position {formatClock(currentTime)}
          </Text>
        </XStack>

        {activeRally ? (
          <YStack gap="$2">
            <XStack style={{ justifyContent: "space-between" }}>
              <Text style={{ color: colors.ink, fontSize: 16, fontWeight: "900" }}>
                Echange {activeRally.index}
              </Text>
              <Text style={{ color: colors.inkMuted, fontSize: 14, fontWeight: "800" }}>
                {activeRally.startTime} - {activeRally.endTime}
              </Text>
            </XStack>
            <View
              style={{
                height: 8,
                overflow: "hidden",
                borderRadius: 8,
                backgroundColor: colors.surfaceMuted
              }}
            >
              <View
                style={{
                  width: `${activeProgress * 100}%`,
                  height: "100%",
                  backgroundColor: colors.court
                }}
              />
            </View>
          </YStack>
        ) : null}
      </YStack>

      <YStack gap="$2">
        <Text style={{ color: colors.ink, fontSize: 18, fontWeight: "900" }}>
          Segments detectes ({match.rallies.length})
        </Text>
        {match.rallies.map((rally) => (
          <RallySegmentRow
            key={rally.id}
            rally={rally}
            isActive={rally.id === activeRally?.id}
            onPress={() => playRally(rally)}
          />
        ))}
      </YStack>
    </Screen>
  );
}

function RallySegmentRow({
  isActive,
  onPress,
  rally
}: {
  isActive: boolean;
  onPress: () => void;
  rally: Rally;
}) {
  const duration = parseClock(rally.endTime) - parseClock(rally.startTime);

  return (
    <Pressable onPress={onPress}>
      <XStack
        gap="$3"
        style={{
          minHeight: 62,
          alignItems: "center",
          justifyContent: "space-between",
          backgroundColor: isActive ? colors.surfaceMuted : colors.surface,
          borderColor: isActive ? colors.court : colors.line,
          borderRadius: 8,
          borderWidth: 1,
          padding: 14
        }}
      >
        <XStack gap="$3" style={{ alignItems: "center", flex: 1 }}>
          <Ionicons
            name={isActive ? "play-circle" : "play-circle-outline"}
            size={24}
            color={isActive ? colors.court : colors.inkMuted}
          />
          <YStack gap="$1" style={{ flex: 1 }}>
            <Text style={{ color: colors.ink, fontSize: 16, fontWeight: "900" }}>
              Echange {rally.index}
            </Text>
            <Text style={{ color: colors.inkMuted, fontSize: 13, fontWeight: "800" }}>
              {rally.startTime} - {rally.endTime}
            </Text>
          </YStack>
        </XStack>
        <Text style={{ color: colors.ink, fontSize: 14, fontWeight: "900" }}>
          {Math.max(0, duration)} s
        </Text>
      </XStack>
    </Pressable>
  );
}

function parseClock(clock: string): number {
  const parts = clock.split(":").map((part) => Number.parseInt(part, 10));

  if (parts.some((part) => Number.isNaN(part))) {
    return 0;
  }

  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }

  if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  }

  return parts[0] ?? 0;
}

function formatClock(totalSeconds: number): string {
  const roundedSeconds = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(roundedSeconds / 60);
  const seconds = roundedSeconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}
