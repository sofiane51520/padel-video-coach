export type MatchStatus = "draft" | "calibration" | "analysis" | "review" | "completed";

export type Player = {
  id: string;
  label: string;
  team: "A" | "B";
  color: string;
};

export type RallyLabel = "fault" | "winner";

export type RallyDecision = {
  id: string;
  rallyId: string;
  playerId: string;
  label: RallyLabel;
};

export type Rally = {
  id: string;
  index: number;
  startTime: string;
  endTime: string;
  decision?: RallyDecision;
};

export type PlayerStats = {
  playerId: string;
  distanceMeters: number;
  faults: number;
  winners: number;
};

export type Match = {
  id: string;
  title: string;
  venue: string;
  recordedAt: string;
  duration: string;
  status: MatchStatus;
  players: Player[];
  rallies: Rally[];
  stats: PlayerStats[];
};
