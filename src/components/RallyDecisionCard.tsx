import { Text, XStack, YStack } from "tamagui";
import { Button } from "@/components/Button";
import { colors } from "@/constants/theme";
import { Player, Rally, RallyDecision, RallyLabel } from "@/types/match";

type RallyDecisionCardProps = {
  rally: Rally;
  players: Player[];
  decision?: RallyDecision;
  onDecision: (rallyId: string, playerId: string, label: RallyLabel) => void;
};

export function RallyDecisionCard({
  rally,
  players,
  decision,
  onDecision
}: RallyDecisionCardProps) {
  const selectedPlayer = players.find((player) => player.id === decision?.playerId);
  const decisionText =
    decision && selectedPlayer
      ? `${decision.label === "fault" ? "Faute" : "Point gagnant"} - ${selectedPlayer.label}`
      : "A taguer";

  return (
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
      <XStack
        gap="$3"
        flexWrap="wrap"
        style={{ alignItems: "flex-start", justifyContent: "space-between" }}
      >
        <YStack gap="$1">
          <Text style={{ color: colors.ink, fontSize: 18, fontWeight: "900" }}>
            Echange {rally.index}
          </Text>
          <Text style={{ color: colors.inkMuted, fontSize: 13, fontWeight: "700" }}>
            {rally.startTime} - {rally.endTime}
          </Text>
        </YStack>
        <Text
          style={{
            color: decision ? colors.courtDark : colors.inkMuted,
            fontSize: 13,
            fontWeight: "900"
          }}
        >
          {decisionText}
        </Text>
      </XStack>

      <YStack gap="$4">
        {players.map((player) => (
          <YStack key={player.id} gap="$2">
            <XStack gap="$2" style={{ alignItems: "center" }}>
              <YStack style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: player.color }} />
              <Text style={{ color: colors.ink, fontWeight: "900" }}>
                {player.label}
              </Text>
            </XStack>
            <XStack flexWrap="wrap" gap="$2">
              <Button
                variant="secondary"
                icon="close-circle-outline"
                onPress={() => onDecision(rally.id, player.id, "fault")}
                style={{ flexGrow: 1 }}
              >
                Faute
              </Button>
              <Button
                variant="secondary"
                icon="flash-outline"
                onPress={() => onDecision(rally.id, player.id, "winner")}
                style={{ flexGrow: 1 }}
              >
                Gagnant
              </Button>
            </XStack>
          </YStack>
        ))}
      </YStack>
    </YStack>
  );
}
