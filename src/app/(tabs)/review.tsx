import { useMemo, useState } from "react";
import { Text, XStack } from "tamagui";
import { PageHeader } from "@/components/PageHeader";
import { RallyDecisionCard } from "@/components/RallyDecisionCard";
import { Screen } from "@/components/Screen";
import { colors } from "@/constants/theme";
import { matches } from "@/data/mockMatches";
import { RallyDecision, RallyLabel } from "@/types/match";

export default function ReviewScreen() {
  const match = matches[0];
  const [decisions, setDecisions] = useState<Record<string, RallyDecision>>(() => {
    return match.rallies.reduce<Record<string, RallyDecision>>((acc, rally) => {
      if (rally.decision) {
        acc[rally.id] = rally.decision;
      }

      return acc;
    }, {});
  });

  const completion = useMemo(() => {
    const tagged = Object.keys(decisions).length;
    return `${tagged}/${match.rallies.length}`;
  }, [decisions, match.rallies.length]);

  function handleDecision(rallyId: string, playerId: string, label: RallyLabel) {
    setDecisions((current) => ({
      ...current,
      [rallyId]: {
        id: `${rallyId}-${playerId}-${label}`,
        rallyId,
        playerId,
        label
      }
    }));
  }

  return (
    <Screen>
      <PageHeader
        eyebrow="Revue"
        title="Fins d'echange"
        description="Valide chaque echange avec une faute directe ou un point gagnant."
      />

      <XStack
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
      </XStack>

      {match.rallies.map((rally) => (
        <RallyDecisionCard
          key={rally.id}
          rally={rally}
          players={match.players}
          decision={decisions[rally.id]}
          onDecision={handleDecision}
        />
      ))}
    </Screen>
  );
}
