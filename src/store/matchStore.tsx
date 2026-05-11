import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, ReactNode, useContext, useEffect, useMemo, useRef, useState } from "react";
import { matches as seedMatches, players as seedPlayers } from "@/data/mockMatches";
import {
  CalibrationPoint,
  Match,
  MatchAnalysisJob,
  MatchStatus,
  MatchVideo,
  Player,
  Rally,
  RallyLabel
} from "@/types/match";

type CreateMatchInput = MatchVideo;

type MatchStore = {
  activeMatch?: Match;
  activeMatchId: string | null;
  applyAnalysisResult: (
    matchId: string,
    result: {
      player_tracking: { distance_meters: number; player_id: string }[];
      rallies: { id: string; index: number; start_time: string; end_time: string }[];
      video_probe: {
        width: number;
        height: number;
        fps: number;
        frame_count: number;
        duration_seconds: number;
        extracted_frames: {
          frame_index: number;
          timestamp_seconds: number;
          file_path: string;
        }[];
      };
    }
  ) => void;
  createMatchFromVideo: (video: CreateMatchInput) => string;
  getMatch: (id?: string | null) => Match | undefined;
  isHydrated: boolean;
  lastSavedAt: string | null;
  matches: Match[];
  resetLocalData: () => void;
  selectMatch: (id: string) => void;
  setAnalysisJob: (matchId: string, analysisJob: MatchAnalysisJob) => void;
  setCalibrationPoints: (matchId: string, points: CalibrationPoint[]) => void;
  setMatchStatus: (matchId: string, status: MatchStatus) => void;
  setRallyDecision: (matchId: string, rallyId: string, playerId: string, label: RallyLabel) => void;
  updatePlayerLabel: (matchId: string, playerId: string, label: string) => void;
};

const MatchStoreContext = createContext<MatchStore | null>(null);
const STORAGE_KEY = "padel-video-coach:match-store:v1";

type PersistedMatchStore = {
  activeMatchId: string | null;
  matches: Match[];
};

export function MatchStoreProvider({ children }: { children: ReactNode }) {
  const [matches, setMatches] = useState<Match[]>(seedMatches);
  const [activeMatchId, setActiveMatchId] = useState<string | null>(seedMatches[0]?.id ?? null);
  const [isHydrated, setIsHydrated] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const hasLoadedStorage = useRef(false);

  const activeMatch = useMemo(
    () => matches.find((match) => match.id === activeMatchId) ?? matches[0],
    [activeMatchId, matches]
  );

  useEffect(() => {
    let isMounted = true;

    async function hydrateStore() {
      try {
        const storedValue = await AsyncStorage.getItem(STORAGE_KEY);

        if (!isMounted) {
          return;
        }

        if (storedValue) {
          const parsedValue = JSON.parse(storedValue) as PersistedMatchStore;

          if (Array.isArray(parsedValue.matches) && parsedValue.matches.length > 0) {
            setMatches(parsedValue.matches);
            setActiveMatchId(parsedValue.activeMatchId ?? parsedValue.matches[0].id);
          }
        }
      } catch (error) {
        console.warn("Unable to hydrate match store", error);
      } finally {
        if (isMounted) {
          hasLoadedStorage.current = true;
          setIsHydrated(true);
        }
      }
    }

    hydrateStore();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!hasLoadedStorage.current) {
      return;
    }

    async function persistStore() {
      try {
        const payload: PersistedMatchStore = {
          activeMatchId,
          matches
        };

        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
        setLastSavedAt(new Date().toISOString());
      } catch (error) {
        console.warn("Unable to persist match store", error);
      }
    }

    persistStore();
  }, [activeMatchId, matches]);

  function updateMatch(matchId: string, updater: (match: Match) => Match) {
    setMatches((current) => current.map((match) => (match.id === matchId ? updater(match) : match)));
  }

  const value = useMemo<MatchStore>(
    () => ({
      activeMatch,
      activeMatchId,
      applyAnalysisResult(matchId, result) {
        const distanceByPlayerId = new Map(
          result.player_tracking.map((tracking) => [tracking.player_id, tracking.distance_meters])
        );

        updateMatch(matchId, (match) => ({
          ...match,
          status: "review",
          videoProbe: {
            width: result.video_probe.width,
            height: result.video_probe.height,
            fps: result.video_probe.fps,
            frameCount: result.video_probe.frame_count,
            durationSeconds: result.video_probe.duration_seconds,
            extractedFrames: result.video_probe.extracted_frames.map((frame) => ({
              frameIndex: frame.frame_index,
              timestampSeconds: frame.timestamp_seconds,
              filePath: frame.file_path
            }))
          },
          rallies: result.rallies.map((rally) => ({
            id: `${match.id}-${rally.id}`,
            index: rally.index,
            startTime: rally.start_time,
            endTime: rally.end_time
          })),
          stats: match.players.map((player, index) => ({
            playerId: player.id,
            distanceMeters: Math.round(
              distanceByPlayerId.get(player.id) ?? result.player_tracking[index]?.distance_meters ?? 0
            ),
            faults: 0,
            winners: 0
          }))
        }));
      },
      createMatchFromVideo(video) {
        const id = createId("match");
        const defaultPlayers = createDefaultPlayers(id);
        const durationMs = video.durationMs ?? null;
        const match: Match = {
          id,
          title: createMatchTitle(video.fileName),
          venue: "Terrain a renseigner",
          recordedAt: new Date().toISOString(),
          duration: formatDuration(durationMs),
          status: "calibration",
          video,
          calibrationPoints: [],
          players: defaultPlayers,
          rallies: createStarterRallies(id, durationMs),
          stats: defaultPlayers.map((player) => ({
            playerId: player.id,
            distanceMeters: 0,
            faults: 0,
            winners: 0
          }))
        };

        setMatches((current) => [match, ...current]);
        setActiveMatchId(id);

        return id;
      },
      getMatch(id) {
        return matches.find((match) => match.id === id) ?? activeMatch;
      },
      isHydrated,
      lastSavedAt,
      matches,
      resetLocalData() {
        setMatches(seedMatches);
        setActiveMatchId(seedMatches[0]?.id ?? null);
        AsyncStorage.removeItem(STORAGE_KEY).catch((error) => {
          console.warn("Unable to clear match store", error);
        });
      },
      selectMatch(id) {
        setActiveMatchId(id);
      },
      setAnalysisJob(matchId, analysisJob) {
        updateMatch(matchId, (match) => ({
          ...match,
          analysisJob,
          status: analysisJob.status === "completed" ? match.status : "analysis"
        }));
      },
      setCalibrationPoints(matchId, points) {
        updateMatch(matchId, (match) => ({
          ...match,
          calibrationPoints: points,
          status: points.length >= 4 ? "draft" : "calibration"
        }));
      },
      setMatchStatus(matchId, status) {
        updateMatch(matchId, (match) => ({ ...match, status }));
      },
      setRallyDecision(matchId, rallyId, playerId, label) {
        updateMatch(matchId, (match) => ({
          ...match,
          status: "review",
          rallies: match.rallies.map((rally) =>
            rally.id === rallyId
              ? {
                  ...rally,
                  decision: {
                    id: `${rallyId}-${playerId}-${label}`,
                    rallyId,
                    playerId,
                    label
                  }
                }
              : rally
          )
        }));
      },
      updatePlayerLabel(matchId, playerId, label) {
        updateMatch(matchId, (match) => ({
          ...match,
          players: match.players.map((player) =>
            player.id === playerId ? { ...player, label } : player
          )
        }));
      }
    }),
    [activeMatch, activeMatchId, isHydrated, lastSavedAt, matches]
  );

  return <MatchStoreContext.Provider value={value}>{children}</MatchStoreContext.Provider>;
}

export function useMatchStore() {
  const store = useContext(MatchStoreContext);

  if (!store) {
    throw new Error("useMatchStore must be used inside MatchStoreProvider");
  }

  return store;
}

function createId(prefix: string): string {
  const randomId =
    globalThis.crypto && "randomUUID" in globalThis.crypto
      ? globalThis.crypto.randomUUID()
      : `${Date.now()}-${Math.round(Math.random() * 1_000_000)}`;

  return `${prefix}-${randomId}`;
}

function createDefaultPlayers(matchId: string): Player[] {
  return seedPlayers.map((player, index) => ({
    ...player,
    id: `${matchId}-p${index + 1}`
  }));
}

function createMatchTitle(fileName?: string | null): string {
  const cleanedName = fileName?.replace(/\.[^/.]+$/, "").replace(/[-_]+/g, " ").trim();

  if (cleanedName) {
    return cleanedName;
  }

  return `Match ${new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date())}`;
}

function createStarterRallies(matchId: string, durationMs?: number | null): Rally[] {
  const durationSeconds = durationMs ? Math.max(90, Math.floor(durationMs / 1000)) : 180;
  const rallyCount = Math.min(8, Math.max(4, Math.round(durationSeconds / 45)));
  const slot = durationSeconds / (rallyCount + 1);

  return Array.from({ length: rallyCount }, (_, index) => {
    const start = Math.round(12 + index * slot);
    const end = Math.min(durationSeconds, start + Math.max(18, Math.round(slot * 0.55)));

    return {
      id: `${matchId}-r${index + 1}`,
      index: index + 1,
      startTime: formatClock(start),
      endTime: formatClock(end)
    };
  });
}

function formatDuration(durationMs?: number | null): string {
  if (!durationMs) {
    return "00:00";
  }

  return formatClock(Math.floor(durationMs / 1000));
}

function formatClock(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}
