import { useLocalSearchParams } from "expo-router";
import { useEffect } from "react";
import { Text, XStack, YStack } from "tamagui";
import { Badge } from "@/components/Badge";
import { Button } from "@/components/Button";
import { CourtPreview } from "@/components/CourtPreview";
import { PageHeader } from "@/components/PageHeader";
import { Screen } from "@/components/Screen";
import { StepList } from "@/components/StepList";
import { colors } from "@/constants/theme";
import { useMatchStore } from "@/store/matchStore";
import { statusLabel } from "@/utils/format";
import { getTaggedRallyCount } from "@/utils/stats";

export default function MatchDetailScreen() {
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

  const calibrationDone = (match.calibrationPoints?.length ?? 0) >= 4;
  const taggedRallies = getTaggedRallyCount(match);

  return (
    <Screen>
      <PageHeader
        eyebrow={match.venue}
        title={match.title}
        description={`Duree ${match.duration} - ${match.rallies.length} echanges prepares`}
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
            done: Boolean(match.video)
          },
          {
            title: "Terrain calibre",
            description: "Les coins servent a transformer les positions en metres.",
            done: calibrationDone
          },
          {
            title: "Joueurs assignes",
            description: "Chaque track IA est rattache a un joueur lisible.",
            done: match.players.every((player) => player.label.trim().length > 0)
          },
          {
            title: "Echanges a taguer",
            description: `${taggedRallies}/${match.rallies.length} fins d'echange taguees.`,
            done: taggedRallies === match.rallies.length
          }
        ]}
      />
    </Screen>
  );
}
