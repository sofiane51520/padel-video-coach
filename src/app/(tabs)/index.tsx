import { Text, XStack, YStack } from "tamagui";
import { Button } from "@/components/Button";
import { CourtPreview } from "@/components/CourtPreview";
import { MatchCard } from "@/components/MatchCard";
import { PageHeader } from "@/components/PageHeader";
import { Screen } from "@/components/Screen";
import { StepList } from "@/components/StepList";
import { colors } from "@/constants/theme";
import { matches } from "@/data/mockMatches";

export default function MatchesScreen() {
  return (
    <Screen>
      <PageHeader
        eyebrow="Padel Video Coach"
        title="Matchs"
        description="Tes analyses video, les distances parcourues et les fins d'echange a valider."
      />

      <YStack
        gap="$4"
        style={{
          backgroundColor: colors.courtDark,
          borderRadius: 8,
          padding: 18,
          overflow: "hidden"
        }}
      >
        <XStack flexWrap="wrap" gap="$4" style={{ alignItems: "center" }}>
          <YStack flex={1} gap="$3" style={{ minWidth: 260 }}>
            <Text style={{ color: "#dceee7", fontSize: 13, fontWeight: "900" }}>
              ANALYSE ACTIVE
            </Text>
            <Text style={{ color: colors.surface, fontSize: 26, lineHeight: 32, fontWeight: "900" }}>
              Distance, fautes et points gagnants prets pour la revue.
            </Text>
            <XStack flexWrap="wrap" gap="$2">
              <Button href="/upload" icon="add-circle-outline">
                Importer
              </Button>
              <Button href="/review" icon="list-outline" variant="secondary">
                Revue
              </Button>
            </XStack>
          </YStack>
          <YStack flex={1} style={{ minWidth: 260 }}>
            <CourtPreview compact />
          </YStack>
        </XStack>
      </YStack>

      <YStack gap="$3">
        {matches.map((match) => (
          <MatchCard key={match.id} match={match} />
        ))}
      </YStack>

      <StepList
        steps={[
          {
            title: "Importer",
            description: "Selectionner une video en paysage depuis le telephone ou le navigateur.",
            done: true
          },
          {
            title: "Calibrer",
            description: "Cliquer les quatre coins du terrain pour convertir les pixels en metres.",
            done: true
          },
          {
            title: "Identifier",
            description: "Nommer les quatre joueurs et verifier les equipes.",
            done: true
          },
          {
            title: "Taguer",
            description: "Associer chaque echange a une faute ou un point gagnant.",
            done: false
          }
        ]}
      />
    </Screen>
  );
}
