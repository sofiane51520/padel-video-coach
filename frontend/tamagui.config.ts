import { defaultConfig } from "@tamagui/config/v5";
import { createTamagui } from "tamagui";

export const config = createTamagui({
  ...defaultConfig,
  themes: {
    ...defaultConfig.themes,
    light: {
      ...defaultConfig.themes.light,
      background: "#f6f7f2",
      backgroundHover: "#eef3ee",
      backgroundPress: "#e4ece6",
      color: "#17211f",
      colorHover: "#23302d",
      borderColor: "#d8dfd8"
    },
    dark: {
      ...defaultConfig.themes.dark,
      background: "#0f1614",
      backgroundHover: "#17211f",
      backgroundPress: "#1f2f2b",
      color: "#f5f6f1",
      borderColor: "#31423c"
    }
  }
});

type AppConfig = typeof config;

declare module "tamagui" {
  // Tamagui reads this empty interface for app-specific config typing.
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface TamaguiCustomConfig extends AppConfig {}
}

export default config;
