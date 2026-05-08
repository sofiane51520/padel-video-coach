import Ionicons from "@expo/vector-icons/Ionicons";
import { router, type Href } from "expo-router";
import { ComponentProps, ReactNode } from "react";
import { ViewStyle } from "react-native";
import { Button as TButton, Text } from "tamagui";
import { colors } from "@/constants/theme";

type IconName = ComponentProps<typeof Ionicons>["name"];

type ButtonProps = {
  children: ReactNode;
  icon?: IconName;
  href?: Href;
  variant?: "primary" | "secondary" | "ghost";
  onPress?: () => void;
  style?: ViewStyle;
};

export function Button({ children, icon, href, onPress, style, variant = "primary" }: ButtonProps) {
  const isPrimary = variant === "primary";
  const isGhost = variant === "ghost";

  function handlePress() {
    if (href) {
      router.push(href);
      return;
    }

    onPress?.();
  }

  return (
    <TButton
      unstyled
      onPress={handlePress}
      gap="$2"
      pressStyle={{ opacity: 0.74, scale: 0.98 }}
      hoverStyle={{ opacity: 0.92 }}
      style={[
        {
          height: 46,
          minWidth: 120,
          borderRadius: 8,
          paddingHorizontal: 16,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: isPrimary ? colors.court : isGhost ? "transparent" : colors.surface,
          borderWidth: isPrimary || isGhost ? 0 : 1,
          borderColor: colors.line
        },
        style
      ]}
    >
      {icon ? (
        <Ionicons
          name={icon}
          size={18}
          color={isPrimary ? colors.surface : colors.ink}
        />
      ) : null}
      <Text
        style={{ color: isPrimary ? colors.surface : colors.ink, fontSize: 15, fontWeight: "800" }}
        numberOfLines={1}
      >
        {children}
      </Text>
    </TButton>
  );
}
