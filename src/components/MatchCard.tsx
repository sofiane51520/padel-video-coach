import Ionicons from "@expo/vector-icons/Ionicons";
import { router } from "expo-router";
import { ComponentProps } from "react";
import { Text, XStack, YStack } from "tamagui";
import { Badge } from "@/components/Badge";
import { colors } from "@/constants/theme";
import { useMatchStore } from "@/store/matchStore";
import { Match } from "@/types/match";
import { statusLabel } from "@/utils/format";

type MatchCardProps = {
  match: Match;
};

export function MatchCard({ match }: MatchCardProps) {
  const { selectMatch } = useMatchStore();

  return (
    <YStack
      gap="$4"
      onPress={() => {
        selectMatch(match.id);
        router.push({ pathname: "/matches/[id]", params: { id: match.id } });
      }}
      pressStyle={{ scale: 0.99, opacity: 0.82 }}
      hoverStyle={{ opacity: 0.94 }}
      style={{
        backgroundColor: colors.surface,
        borderColor: colors.line,
        borderWidth: 1,
        borderRadius: 8,
        padding: 18
      }}
    >
      <XStack gap="$3" flexWrap="wrap" style={{ alignItems: "flex-start", justifyContent: "space-between" }}>
        <YStack flex={1} gap="$1" style={{ minWidth: 220 }}>
          <Text style={{ color: colors.ink, fontSize: 20, fontWeight: "900" }}>
            {match.title}
          </Text>
          <Text style={{ color: colors.inkMuted, fontSize: 14, fontWeight: "600" }}>
            {match.venue}
          </Text>
        </YStack>
        <Badge tone={match.status === "completed" ? "success" : "warning"}>
          {statusLabel(match.status)}
        </Badge>
      </XStack>

      <XStack flexWrap="wrap" gap="$4">
        <Metric icon="time-outline" label={match.duration} />
        <Metric icon="repeat-outline" label={`${match.rallies.length} echanges`} />
        <Metric icon="people-outline" label="4 joueurs" />
      </XStack>
    </YStack>
  );
}

function Metric({
  icon,
  label
}: {
  icon: ComponentProps<typeof Ionicons>["name"];
  label: string;
}) {
  return (
    <XStack
      gap="$2"
      style={{
        alignItems: "center",
        backgroundColor: colors.surfaceMuted,
        borderRadius: 6,
        paddingHorizontal: 12,
        paddingVertical: 8
      }}
    >
      <Ionicons name={icon} size={17} color={colors.inkMuted} />
      <Text style={{ color: colors.inkMuted, fontSize: 13, fontWeight: "800" }}>
        {label}
      </Text>
    </XStack>
  );
}
