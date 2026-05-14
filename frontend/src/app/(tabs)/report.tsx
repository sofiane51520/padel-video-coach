import { Text, XStack, YStack } from "tamagui";
import { PageHeader } from "@/components/PageHeader";
import { Screen } from "@/components/Screen";
import { StatTile } from "@/components/StatTile";
import { colors } from "@/constants/theme";
import { useMatchStore } from "@/store/matchStore";
import { formatDistance } from "@/utils/format";
import { computePlayerStats, getPlayer } from "@/utils/stats";

export default function ReportScreen() {
  const { activeMatch: match } = useMatchStore();

  if (!match) {
    return (
      <Screen>
        <PageHeader title="Aucun rapport" description="Importe une video pour generer des statistiques." />
      </Screen>
    );
  }

  const stats = computePlayerStats(match);

  return (
    <Screen>
      <PageHeader
        eyebrow="Rapport"
        title="Statistiques par joueur"
        description="Distance estimee, fautes directes et points gagnants."
      />

      {stats.map((stat) => {
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
                label="Distance estimee"
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
