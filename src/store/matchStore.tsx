import { createContext, ReactNode, useContext, useMemo, useState } from "react";
import { matches as seedMatches, players as seedPlayers } from "@/data/mockMatches";
import {
  CalibrationPoint,
  Match,
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
  createMatchFromVideo: (video: CreateMatchInput) => string;
  getMatch: (id?: string | null) => Match | undefined;
  matches: Match[];
  selectMatch: (id: string) => void;
  setCalibrationPoints: (matchId: string, points: CalibrationPoint[]) => void;
  setMatchStatus: (matchId: string, status: MatchStatus) => void;
  setRallyDecision: (matchId: string, rallyId: string, playerId: string, label: RallyLabel) => void;
  updatePlayerLabel: (matchId: string, playerId: string, label: string) => void;
};

const MatchStoreContext = createContext<MatchStore | null>(null);

export function MatchStoreProvider({ children }: { children: ReactNode }) {
  const [matches, setMatches] = useState<Match[]>(seedMatches);
  const [activeMatchId, setActiveMatchId] = useState<string | null>(seedMatches[0]?.id ?? null);

  const activeMatch = useMemo(
    () => matches.find((match) => match.id === activeMatchId) ?? matches[0],
    [activeMatchId, matches]
  );

  function updateMatch(matchId: string, updater: (match: Match) => Match) {
    setMatches((current) => current.map((match) => (match.id === matchId ? updater(match) : match)));
  }

  const value = useMemo<MatchStore>(
    () => ({
      activeMatch,
      activeMatchId,
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
      matches,
      selectMatch(id) {
        setActiveMatchId(id);
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
    [activeMatch, activeMatchId, matches]
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
