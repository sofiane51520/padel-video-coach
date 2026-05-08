import { useLocalSearchParams } from "expo-router";
import { Text, XStack, YStack } from "tamagui";
import { Button } from "@/components/Button";
import { PageHeader } from "@/components/PageHeader";
import { Screen } from "@/components/Screen";
import { StepList } from "@/components/StepList";
import { colors } from "@/constants/theme";
import { getMatch } from "@/data/mockMatches";

export default function AnalysisScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const match = getMatch(id ?? "match-demo");

  return (
    <Screen>
      <PageHeader
        eyebrow={match.title}
        title="Analyse video"
        description="Suivi du traitement, du tracking joueurs et du calcul de distance."
      />

      <YStack
        gap="$2"
        style={{
          backgroundColor: colors.courtDark,
          borderRadius: 8,
          padding: 28
        }}
      >
        <Text style={{ color: colors.surface, fontSize: 46, fontWeight: "900" }}>68%</Text>
        <Text style={{ color: "#dceee7", fontSize: 16, fontWeight: "800" }}>
          Tracking des joueurs en cours
        </Text>
      </YStack>

      <StepList
        steps={[
          {
            title: "Extraction video",
            description: "Frames et metadonnees preparees par ffmpeg.",
            done: true
          },
          {
            title: "Detection joueurs",
            description: "Les quatre joueurs sont detectes sur les frames clefs.",
            done: true
          },
          {
            title: "Tracking",
            description: "Chaque joueur conserve son identite dans la timeline.",
            done: false
          },
          {
            title: "Stats",
            description: "Distance et echanges seront sauvegardes pour la revue.",
            done: false
          }
        ]}
      />

      <XStack flexWrap="wrap" gap="$3">
        <Button href="/review" icon="list-outline">
          Aller a la revue
        </Button>
        <Button
          href={{ pathname: "/matches/[id]", params: { id: match.id } }}
          icon="arrow-back-outline"
          variant="secondary"
        >
          Retour au match
        </Button>
      </XStack>
    </Screen>
  );
}
