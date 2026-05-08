import { Text, YStack } from "tamagui";
import { colors } from "@/constants/theme";

type StatTileProps = {
  label: string;
  value: string;
  accent?: string;
};

export function StatTile({ label, value, accent = colors.court }: StatTileProps) {
  return (
    <YStack
      flex={1}
      gap="$2"
      style={{
        minWidth: 150,
        backgroundColor: colors.surface,
        borderColor: colors.line,
        borderWidth: 1,
        borderRadius: 8,
        padding: 18
      }}
    >
      <YStack style={{ width: 30, height: 4, borderRadius: 2, backgroundColor: accent }} />
      <Text style={{ color: colors.ink, fontSize: 26, fontWeight: "900" }}>
        {value}
      </Text>
      <Text style={{ color: colors.inkMuted, fontSize: 13, fontWeight: "800" }}>
        {label}
      </Text>
    </YStack>
  );
}
