import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { useState } from "react";
import { Text, YStack } from "tamagui";
import { Button } from "@/components/Button";
import { PageHeader } from "@/components/PageHeader";
import { Screen } from "@/components/Screen";
import { colors } from "@/constants/theme";
import { useMatchStore } from "@/store/matchStore";

type PickedVideo = {
  uri: string;
  fileName?: string | null;
  duration?: number | null;
};

export default function UploadScreen() {
  const { createMatchFromVideo } = useMatchStore();
  const [video, setVideo] = useState<PickedVideo | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function pickVideo() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      setError("Autorise l'acces a la galerie pour importer une video.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["videos"],
      quality: 1
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      const pickedVideo = {
        uri: asset.uri,
        fileName: asset.fileName,
        duration: asset.duration,
        mimeType: asset.mimeType
      };
      const matchId = createMatchFromVideo({
        uri: pickedVideo.uri,
        fileName: pickedVideo.fileName,
        durationMs: pickedVideo.duration,
        mimeType: pickedVideo.mimeType
      });

      setError(null);
      setVideo(pickedVideo);
      router.push({ pathname: "/calibration/[id]", params: { id: matchId } });
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

      {error ? (
        <Text style={{ color: colors.danger, fontWeight: "800" }}>
          {error}
        </Text>
      ) : null}

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
          <Text style={{ color: colors.inkMuted, fontSize: 13 }}>
            Match cree. Ouverture de la calibration...
          </Text>
        </YStack>
      ) : null}
    </Screen>
  );
}
