import * as ImagePicker from "expo-image-picker";
import { useState } from "react";
import { Text, YStack } from "tamagui";
import { Button } from "@/components/Button";
import { PageHeader } from "@/components/PageHeader";
import { Screen } from "@/components/Screen";
import { colors } from "@/constants/theme";

type PickedVideo = {
  uri: string;
  fileName?: string | null;
  duration?: number | null;
};

export default function UploadScreen() {
  const [video, setVideo] = useState<PickedVideo | null>(null);

  async function pickVideo() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["videos"],
      quality: 1
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setVideo({
        uri: asset.uri,
        fileName: asset.fileName,
        duration: asset.duration
      });
    }
  }

  return (
    <Screen>
      <PageHeader
        eyebrow="Nouvelle analyse"
        title="Importer une video"
        description="Selectionne une video en paysage avec le terrain entier visible."
      />

      <YStack
        gap="$4"
        style={{
          minHeight: 250,
          borderColor: colors.line,
          borderWidth: 1,
          borderRadius: 8,
          backgroundColor: colors.surface,
          alignItems: "center",
          justifyContent: "center",
          padding: 28
        }}
      >
        <Text style={{ color: colors.ink, fontSize: 24, fontWeight: "900" }}>Video telephone</Text>
        <Text
          style={{
            color: colors.inkMuted,
            fontSize: 15,
            lineHeight: 22,
            textAlign: "center",
            maxWidth: 430
          }}
        >
          Idealement en paysage, terrain entier visible, telephone fixe, 1080p ou plus.
        </Text>
        <Button icon="film-outline" onPress={pickVideo}>
          Choisir une video
        </Button>
      </YStack>

      {video ? (
        <YStack
          gap="$3"
          style={{
            backgroundColor: colors.surface,
            borderRadius: 8,
            borderColor: colors.line,
            borderWidth: 1,
            padding: 18
          }}
        >
          <Text style={{ color: colors.ink, fontSize: 18, fontWeight: "900" }}>Video selectionnee</Text>
          <Text style={{ color: colors.ink, fontWeight: "800" }}>{video.fileName ?? "Fichier local"}</Text>
          <Text style={{ color: colors.inkMuted, fontSize: 13 }} numberOfLines={2}>
            {video.uri}
          </Text>
          <Button
            href={{ pathname: "/calibration/[id]", params: { id: "match-demo" } }}
            icon="scan-outline"
          >
            Passer a la calibration
          </Button>
        </YStack>
      ) : null}
    </Screen>
  );
}
