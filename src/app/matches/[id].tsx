import { useLocalSearchParams } from "expo-router";
import { Text, XStack, YStack } from "tamagui";
import { Badge } from "@/components/Badge";
import { Button } from "@/components/Button";
import { CourtPreview } from "@/components/CourtPreview";
import { PageHeader } from "@/components/PageHeader";
import { Screen } from "@/components/Screen";
import { StepList } from "@/components/StepList";
import { colors } from "@/constants/theme";
import { getMatch } from "@/data/mockMatches";
import { statusLabel } from "@/utils/format";

export default function MatchDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const match = getMatch(id ?? "match-demo");

  return (
    <Screen>
      <PageHeader eyebrow={match.venue} title={match.title} description={`Duree ${match.duration}`} />

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
        <CourtPreview compact />
        <YStack gap="$2">
          <Badge tone="warning">{statusLabel(match.status)}</Badge>
          <Text style={{ color: colors.ink, fontSize: 21, fontWeight: "900" }}>Analyse du match</Text>
          <Text style={{ color: colors.inkMuted, fontSize: 15, lineHeight: 22 }}>
            Calibration, joueurs, revue des echanges et rapport final.
          </Text>
        </YStack>
      </YStack>

      <XStack flexWrap="wrap" gap="$3">
        <Button href={{ pathname: "/calibration/[id]", params: { id: match.id } }} icon="scan-outline">
          Calibrer
        </Button>
        <Button
          href={{ pathname: "/players/[id]", params: { id: match.id } }}
          icon="people-outline"
          variant="secondary"
        >
          Joueurs
        </Button>
        <Button href="/review" icon="list-outline" variant="secondary">
          Revue
        </Button>
        <Button href="/report" icon="stats-chart-outline" variant="secondary">
          Rapport
        </Button>
      </XStack>

      <StepList
        steps={[
          {
            title: "Video importee",
            description: "La video est associee au match et prete pour le traitement.",
            done: true
          },
          {
            title: "Terrain calibre",
            description: "Les coins servent a transformer les positions en metres.",
            done: true
          },
          {
            title: "Joueurs assignes",
            description: "Chaque track IA est rattache a un joueur lisible.",
            done: true
          },
          {
            title: "Echanges a taguer",
            description: "Les fins d'echange sont revues en faute ou point gagnant.",
            done: false
          }
        ]}
      />
    </Screen>
  );
}
