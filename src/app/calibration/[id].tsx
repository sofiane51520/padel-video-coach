import { useLocalSearchParams } from "expo-router";
import { Text, XStack, YStack } from "tamagui";
import { Button } from "@/components/Button";
import { CourtPreview } from "@/components/CourtPreview";
import { PageHeader } from "@/components/PageHeader";
import { Screen } from "@/components/Screen";
import { colors } from "@/constants/theme";
import { getMatch } from "@/data/mockMatches";

export default function CalibrationScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const match = getMatch(id ?? "match-demo");

  return (
    <Screen>
      <PageHeader
        eyebrow={match.title}
        title="Calibration du terrain"
        description="Place les quatre coins pour convertir les mouvements en metres."
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
        <CourtPreview />
        <YStack gap="$2">
          <Text style={{ color: colors.ink, fontSize: 18, fontWeight: "900" }}>Points terrain</Text>
          <Text style={{ color: colors.inkMuted, fontSize: 15 }}>1. Coin arriere gauche</Text>
          <Text style={{ color: colors.inkMuted, fontSize: 15 }}>2. Coin arriere droit</Text>
          <Text style={{ color: colors.inkMuted, fontSize: 15 }}>3. Coin avant droit</Text>
          <Text style={{ color: colors.inkMuted, fontSize: 15 }}>4. Coin avant gauche</Text>
        </YStack>
      </YStack>

      <XStack flexWrap="wrap" gap="$3">
        <Button
          href={{ pathname: "/players/[id]", params: { id: match.id } }}
          icon="checkmark-circle-outline"
        >
          Valider la calibration
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
