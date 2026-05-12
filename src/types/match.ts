export type MatchStatus = "draft" | "calibration" | "analysis" | "review" | "completed";

export type Player = {
  id: string;
  label: string;
  team: "A" | "B";
  color: string;
};

export type MatchVideo = {
  uri: string;
  fileName?: string | null;
  durationMs?: number | null;
  mimeType?: string | null;
};

export type AnalysisJobStatus = "queued" | "processing" | "completed" | "failed";

export type MatchAnalysisJob = {
  id: string;
  status: AnalysisJobStatus;
  progress: number;
  message: string;
  updatedAt?: string;
};

export type ExtractedFrame = {
  frameIndex: number;
  timestampSeconds: number;
  filePath: string;
};

export type VideoProbe = {
  width: number;
  height: number;
  fps: number;
  frameCount: number;
  durationSeconds: number;
  extractedFrames: ExtractedFrame[];
};

export type CalibrationPoint = {
  id: string;
  label: string;
  courtX?: number;
  courtY?: number;
  x: number;
  y: number;
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
  analysisJob?: MatchAnalysisJob;
  video?: MatchVideo;
  videoProbe?: VideoProbe;
  calibrationPoints?: CalibrationPoint[];
  players: Player[];
  rallies: Rally[];
  stats: PlayerStats[];
};
