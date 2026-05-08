import { useLocalSearchParams } from "expo-router";
import { StyleSheet, TextInput } from "react-native";
import { Text, XStack, YStack } from "tamagui";
import { Button } from "@/components/Button";
import { PageHeader } from "@/components/PageHeader";
import { Screen } from "@/components/Screen";
import { colors } from "@/constants/theme";
import { getMatch } from "@/data/mockMatches";

export default function PlayersScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const match = getMatch(id ?? "match-demo");

  return (
    <Screen>
      <PageHeader
        eyebrow={match.title}
        title="Identification des joueurs"
        description="Associe chaque piste detectee a un joueur et a son equipe."
      />

      <YStack
        gap="$3"
        style={{
          backgroundColor: colors.surface,
          borderColor: colors.line,
          borderRadius: 8,
          borderWidth: 1,
          padding: 18
        }}
      >
        {match.players.map((player) => (
          <XStack key={player.id} gap="$3" style={{ alignItems: "center" }}>
            <YStack style={{ width: 16, height: 16, borderRadius: 8, backgroundColor: player.color }} />
            <YStack flex={1} gap="$1">
              <Text style={{ color: colors.inkMuted, fontSize: 12, fontWeight: "900", textTransform: "uppercase" }}>
                Track {player.id.toUpperCase()}
              </Text>
              <TextInput
                defaultValue={player.label}
                placeholder="Nom du joueur"
                placeholderTextColor={colors.inkMuted}
                style={styles.input}
              />
            </YStack>
            <YStack style={{ width: 70, alignItems: "center" }} gap="$1">
              <Text style={{ color: colors.inkMuted, fontSize: 12, fontWeight: "900" }}>Equipe</Text>
              <Text style={{ color: colors.ink, fontSize: 18, fontWeight: "900" }}>{player.team}</Text>
            </YStack>
          </XStack>
        ))}
      </YStack>

      <XStack flexWrap="wrap" gap="$3">
        <Button
          href={{ pathname: "/analysis/[id]", params: { id: match.id } }}
          icon="play-circle-outline"
        >
          Lancer analyse
        </Button>
        <Button
          href={{ pathname: "/calibration/[id]", params: { id: match.id } }}
          icon="arrow-back-outline"
          variant="secondary"
        >
          Retour
        </Button>
      </XStack>
    </Screen>
  );
}

const styles = StyleSheet.create({
  input: {
    minHeight: 46,
    borderColor: colors.line,
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 12,
    color: colors.ink,
    fontSize: 16,
    backgroundColor: colors.background
  }
});
