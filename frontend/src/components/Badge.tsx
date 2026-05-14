import { Text, XStack } from "tamagui";
import { colors } from "@/constants/theme";

type BadgeProps = {
  children: string;
  tone?: "neutral" | "success" | "warning" | "danger";
};

export function Badge({ children, tone = "neutral" }: BadgeProps) {
  const backgroundColor = {
    neutral: colors.surfaceMuted,
    success: "#dff2e6",
    warning: "#f6ead0",
    danger: "#f7dcdc"
  }[tone];

  return (
    <XStack
      style={{
        alignSelf: "flex-start",
        backgroundColor,
        borderRadius: 6,
        paddingHorizontal: 8,
        paddingVertical: 4
      }}
    >
      <Text style={{ color: colors.ink, fontSize: 12, fontWeight: "800" }}>
        {children}
      </Text>
    </XStack>
  );
}
