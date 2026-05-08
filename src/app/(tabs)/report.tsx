import { Text, XStack, YStack } from "tamagui";
import { PageHeader } from "@/components/PageHeader";
import { Screen } from "@/components/Screen";
import { StatTile } from "@/components/StatTile";
import { colors } from "@/constants/theme";
import { matches, getPlayer } from "@/data/mockMatches";
import { formatDistance } from "@/utils/format";

export default function ReportScreen() {
  const match = matches[0];

  return (
    <Screen>
      <PageHeader
        eyebrow="Rapport"
        title="Statistiques par joueur"
        description="Distance parcourue, fautes directes et points gagnants."
      />

      {match.stats.map((stat) => {
        const player = getPlayer(match, stat.playerId);

        return (
          <YStack key={stat.playerId} gap="$3">
            <XStack gap="$3" style={{ alignItems: "center" }}>
              <YStack style={{ width: 16, height: 16, borderRadius: 8, backgroundColor: player.color }} />
              <YStack>
                <Text style={{ color: colors.ink, fontSize: 18, fontWeight: "900" }}>{player.label}</Text>
                <Text style={{ color: colors.inkMuted, marginTop: 4 }}>Equipe {player.team}</Text>
              </YStack>
            </XStack>
            <XStack flexWrap="wrap" gap="$3">
              <StatTile
                label="Distance"
                value={formatDistance(stat.distanceMeters)}
                accent={player.color}
              />
              <StatTile label="Fautes" value={String(stat.faults)} accent={colors.danger} />
              <StatTile label="Points gagnants" value={String(stat.winners)} accent={colors.gold} />
            </XStack>
          </YStack>
        );
      })}
    </Screen>
  );
}
