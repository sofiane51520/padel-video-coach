import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Text, XStack, YStack } from "tamagui";
import { Button } from "@/components/Button";
import { PageHeader } from "@/components/PageHeader";
import { Screen } from "@/components/Screen";
import { StepList } from "@/components/StepList";
import { colors } from "@/constants/theme";
import { getAnalysisJob, getAnalysisResult, startVideoAnalysis } from "@/services/backendApi";
import { useMatchStore } from "@/store/matchStore";
import { Match } from "@/types/match";

export default function AnalysisScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const store = useMatchStore();
  const { getMatch } = store;
  const match = getMatch(id);

  if (!match) {
    return (
      <Screen>
        <PageHeader title="Match introuvable" description="Retourne a la liste des matchs." />
      </Screen>
    );
  }

  return <AnalysisContent currentMatch={match} store={store} />;
}

function AnalysisContent({
  currentMatch,
  store
}: {
  currentMatch: Match;
  store: ReturnType<typeof useMatchStore>;
}) {
  const { applyAnalysisResult, selectMatch, setAnalysisJob, setMatchStatus } = store;
  const [error, setError] = useState<string | null>(null);
  const analysisJob = currentMatch.analysisJob;
  const analysisId = analysisJob?.id;
  const analysisStatus = analysisJob?.status;
  const isCompleted = analysisJob?.status === "completed";
  const isFailed = analysisJob?.status === "failed";
  const progress = analysisJob?.progress ?? 0;
  const message = analysisJob?.message ?? "Pret a envoyer la video au backend";
  const steps = useMemo(
    () => [
      {
        title: "Upload video",
        description: "La video est envoyee au backend FastAPI.",
        done: progress >= 1
      },
      {
        title: "Extraction video",
        description: "Frames et metadonnees preparees pour l'analyse.",
        done: progress >= 20
      },
      {
        title: "Detection joueurs",
        description: "Les pistes joueurs sont preparees pour le suivi.",
        done: progress >= 55
      },
      {
        title: "Stats et echanges",
        description: "Distances et echanges suggeres sont synchronises dans l'app.",
        done: isCompleted
      }
    ],
    [isCompleted, progress]
  );

  useEffect(() => {
    const video = currentMatch.video;

    if (!video || analysisId) {
      return;
    }

    let isCancelled = false;
    const analysisVideo = video;

    async function startAnalysis() {
      try {
        setError(null);
        const job = await startVideoAnalysis({
          calibrationPoints: currentMatch.calibrationPoints ?? [],
          matchId: currentMatch.id,
          players: currentMatch.players,
          video: analysisVideo
        });

        if (!isCancelled) {
          setAnalysisJob(currentMatch.id, {
            id: job.id,
            status: job.status,
            progress: job.progress,
            message: job.message,
            updatedAt: job.updated_at
          });
        }
      } catch (startError) {
        if (!isCancelled) {
          setError(getErrorMessage(startError));
        }
      }
    }

    startAnalysis();

    return () => {
      isCancelled = true;
    };
  }, [
    analysisId,
    currentMatch.calibrationPoints,
    currentMatch.id,
    currentMatch.players,
    currentMatch.video,
    setAnalysisJob
  ]);

  useEffect(() => {
    if (!analysisId || isCompleted || isFailed) {
      return;
    }

    let isCancelled = false;
    const activeAnalysisId = analysisId;

    async function refreshAnalysis() {
      try {
        const job = await getAnalysisJob(activeAnalysisId);

        if (isCancelled) {
          return;
        }

        setAnalysisJob(currentMatch.id, {
          id: job.id,
          status: job.status,
          progress: job.progress,
          message: job.message,
          updatedAt: job.updated_at
        });

        if (job.status === "completed") {
          const result = await getAnalysisResult(job.id);

          if (!isCancelled) {
            applyAnalysisResult(currentMatch.id, result);
          }
        }
      } catch (refreshError) {
        if (!isCancelled) {
          setError(getErrorMessage(refreshError));
        }
      }
    }

    refreshAnalysis();
    const intervalId = setInterval(refreshAnalysis, 1500);

    return () => {
      isCancelled = true;
      clearInterval(intervalId);
    };
  }, [
    analysisId,
    analysisStatus,
    applyAnalysisResult,
    currentMatch.id,
    isCompleted,
    isFailed,
    setAnalysisJob
  ]);

  function handleOpenReview() {
    selectMatch(currentMatch.id);
    setMatchStatus(currentMatch.id, "review");
    router.push("/review");
  }

  return (
    <Screen>
      <PageHeader
        eyebrow={currentMatch.title}
        title="Analyse video"
        description="Suivi du traitement, du tracking joueurs et du calcul de distance."
      />

      <YStack
        gap="$2"
        style={{
          backgroundColor: colors.courtDark,
          borderRadius: 8,
          padding: 28
        }}
      >
        <Text style={{ color: colors.surface, fontSize: 46, fontWeight: "900" }}>{progress}%</Text>
        <Text style={{ color: "#dceee7", fontSize: 16, fontWeight: "800" }}>
          {message}
        </Text>
      </YStack>

      <StepList steps={steps} />

      {currentMatch.videoProbe ? (
        <YStack
          gap="$3"
          style={{
            backgroundColor: colors.surface,
            borderColor: colors.line,
            borderRadius: 8,
            borderWidth: 1,
            padding: 18
          }}
        >
          <Text style={{ color: colors.ink, fontSize: 18, fontWeight: "900" }}>
            Metadonnees video
          </Text>
          <XStack flexWrap="wrap" gap="$3">
            <ProbeMetric label="Resolution" value={`${currentMatch.videoProbe.width} x ${currentMatch.videoProbe.height}`} />
            <ProbeMetric label="FPS" value={`${currentMatch.videoProbe.fps}`} />
            <ProbeMetric label="Duree" value={`${Math.round(currentMatch.videoProbe.durationSeconds)} s`} />
            <ProbeMetric label="Frames extraites" value={`${currentMatch.videoProbe.extractedFrames.length}`} />
          </XStack>
        </YStack>
      ) : null}

      {error ? <Text style={{ color: colors.danger, fontWeight: "800" }}>{error}</Text> : null}

      <XStack flexWrap="wrap" gap="$3">
        <Button disabled={!isCompleted} icon="list-outline" onPress={handleOpenReview}>
          Aller a la revue
        </Button>
        <Button
          href={{ pathname: "/matches/[id]", params: { id: currentMatch.id } }}
          icon="arrow-back-outline"
          variant="secondary"
        >
          Retour au match
        </Button>
      </XStack>
    </Screen>
  );
}

function ProbeMetric({ label, value }: { label: string; value: string }) {
  return (
    <YStack
      gap="$1"
      style={{
        minWidth: 140,
        borderColor: colors.line,
        borderRadius: 8,
        borderWidth: 1,
        padding: 12
      }}
    >
      <Text style={{ color: colors.inkMuted, fontSize: 12, fontWeight: "900", textTransform: "uppercase" }}>
        {label}
      </Text>
      <Text style={{ color: colors.ink, fontSize: 18, fontWeight: "900" }}>{value}</Text>
    </YStack>
  );
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "Impossible de contacter le backend d'analyse.";
}
