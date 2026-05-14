import { ReactNode } from "react";
import { SafeAreaView, ScrollView, StyleSheet } from "react-native";
import { YStack } from "tamagui";
import { colors } from "@/constants/theme";

type ScreenProps = {
  children: ReactNode;
  scroll?: boolean;
};

export function Screen({ children, scroll = true }: ScreenProps) {
  if (!scroll) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <YStack gap="$4" style={styles.fixedContent}>
          {children}
        </YStack>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <YStack gap="$4">{children}</YStack>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background
  },
  content: {
    width: "100%",
    maxWidth: 1120,
    alignSelf: "center",
    padding: 18
  },
  fixedContent: {
    width: "100%",
    maxWidth: 1120,
    alignSelf: "center",
    padding: 18
  }
});
