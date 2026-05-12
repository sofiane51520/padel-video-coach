import { type Href } from "expo-router";
import { Text, XStack } from "tamagui";
import { Button } from "@/components/Button";
import { PageHeader } from "@/components/PageHeader";
import { RallyDecisionCard } from "@/components/RallyDecisionCard";
import { Screen } from "@/components/Screen";
import { colors } from "@/constants/theme";
import { useMatchStore } from "@/store/matchStore";
import { RallyLabel } from "@/types/match";
import { getTaggedRallyCount } from "@/utils/stats";

export default function ReviewScreen() {
  const { activeMatch: match, setRallyDecision } = useMatchStore();

  if (!match) {
    return (
      <Screen>
        <PageHeader title="Aucun match" description="Importe une video pour commencer une revue." />
      </Screen>
    );
  }

  const currentMatch = match;
  const completion = `${getTaggedRallyCount(currentMatch)}/${currentMatch.rallies.length}`;

  function handleDecision(rallyId: string, playerId: string, label: RallyLabel) {
    setRallyDecision(currentMatch.id, rallyId, playerId, label);
  }

  return (
    <Screen>
      <PageHeader
        eyebrow="Revue"
        title="Fins d'echange"
        description="Valide chaque echange avec une faute directe ou un point gagnant."
      />

      <XStack
        flexWrap="wrap"
        gap="$2"
        style={{
          backgroundColor: colors.surface,
          borderColor: colors.line,
          borderWidth: 1,
          borderRadius: 8,
          padding: 18,
          alignItems: "baseline"
        }}
      >
        <Text style={{ color: colors.ink, fontSize: 28, fontWeight: "900" }}>{completion}</Text>
        <Text style={{ color: colors.inkMuted, fontWeight: "800" }}>echanges tagues</Text>
        <Button
          disabled={!currentMatch.video}
          href={{ pathname: "/rallies/[id]", params: { id: currentMatch.id } } as unknown as Href}
          icon="videocam-outline"
          variant="secondary"
          style={{ marginLeft: "auto" }}
        >
          Verifier decoupage
        </Button>
      </XStack>

      {currentMatch.rallies.map((rally) => (
        <RallyDecisionCard
          key={rally.id}
          rally={rally}
          players={currentMatch.players}
          decision={rally.decision}
          onDecision={handleDecision}
        />
      ))}
    </Screen>
  );
}
