import Ionicons from "@expo/vector-icons/Ionicons";
import { Text, XStack, YStack } from "tamagui";
import { colors } from "@/constants/theme";

type Step = {
  title: string;
  description: string;
  done?: boolean;
};

type StepListProps = {
  steps: Step[];
};

export function StepList({ steps }: StepListProps) {
  return (
    <YStack
      gap="$4"
      style={{
        backgroundColor: colors.surface,
        borderColor: colors.line,
        borderRadius: 8,
        borderWidth: 1,
        padding: 18
      }}
    >
      {steps.map((step, index) => (
        <XStack key={step.title} gap="$3" style={{ alignItems: "flex-start" }}>
          <XStack
            style={{
              width: 32,
              height: 32,
              borderRadius: 16,
              backgroundColor: step.done ? colors.court : colors.surfaceMuted,
              alignItems: "center",
              justifyContent: "center"
            }}
          >
            {step.done ? (
              <Ionicons name="checkmark" size={16} color={colors.surface} />
            ) : (
              <Text style={{ color: colors.ink, fontWeight: "900" }}>
                {index + 1}
              </Text>
            )}
          </XStack>
          <YStack flex={1} gap="$1">
            <Text style={{ color: colors.ink, fontSize: 15, fontWeight: "900" }}>
              {step.title}
            </Text>
            <Text style={{ color: colors.inkMuted, fontSize: 14, lineHeight: 20 }}>
              {step.description}
            </Text>
          </YStack>
        </XStack>
      ))}
    </YStack>
  );
}
