import { H1, Paragraph, Text, YStack } from "tamagui";
import { colors } from "@/constants/theme";

type PageHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: string;
};

export function PageHeader({ eyebrow, title, description }: PageHeaderProps) {
  return (
    <YStack gap="$3" style={{ maxWidth: 820 }}>
      {eyebrow ? (
        <Text style={{ color: colors.courtDark, fontSize: 12, fontWeight: "900", textTransform: "uppercase" }}>
          {eyebrow}
        </Text>
      ) : null}
      <H1
        style={{
          color: colors.ink,
          fontSize: 34,
          lineHeight: 40,
          fontWeight: "900"
        }}
      >
        {title}
      </H1>
      {description ? (
        <Paragraph
          style={{ color: colors.inkMuted, fontSize: 16, lineHeight: 24, maxWidth: 700 }}
        >
          {description}
        </Paragraph>
      ) : null}
    </YStack>
  );
}
