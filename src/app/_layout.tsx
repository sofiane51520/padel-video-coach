import { Stack } from "expo-router";
import { useFonts } from "expo-font";
import { StatusBar } from "expo-status-bar";
import { TamaguiProvider } from "tamagui";
import { colors } from "@/constants/theme";
import { MatchStoreProvider } from "@/store/matchStore";
import { config } from "../../tamagui.config";

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Inter: require("@tamagui/font-inter/otf/Inter-Medium.otf"),
    InterBold: require("@tamagui/font-inter/otf/Inter-Bold.otf")
  });

  if (!fontsLoaded) {
    return null;
  }

  return (
    <TamaguiProvider config={config} defaultTheme="light">
      <MatchStoreProvider>
        <Stack
          screenOptions={{
            contentStyle: { backgroundColor: colors.background },
            headerStyle: { backgroundColor: colors.background },
            headerShadowVisible: false,
            headerTintColor: colors.ink,
            headerTitleStyle: { fontWeight: "800" }
          }}
        >
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="matches/[id]" options={{ title: "Match" }} />
          <Stack.Screen name="calibration/[id]" options={{ title: "Calibration" }} />
          <Stack.Screen name="players/[id]" options={{ title: "Joueurs" }} />
          <Stack.Screen name="analysis/[id]" options={{ title: "Analyse" }} />
        </Stack>
        <StatusBar style="dark" />
      </MatchStoreProvider>
    </TamaguiProvider>
  );
}
