import { Platform } from "react-native";

import { AnalysisJobStatus, CalibrationPoint, MatchVideo, Player } from "@/types/match";

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:8000";

export type BackendAnalysisJob = {
  id: string;
  match_id?: string | null;
  status: AnalysisJobStatus;
  progress: number;
  message: string;
  updated_at?: string;
};

export type BackendAnalysisResult = {
  analysis_id: string;
  match_id?: string | null;
  player_tracking: {
    player_id: string;
    distance_meters: number;
  }[];
  rallies: {
    id: string;
    index: number;
    start_time: string;
    end_time: string;
  }[];
};

type StartAnalysisInput = {
  calibrationPoints: CalibrationPoint[];
  matchId: string;
  players: Player[];
  video: MatchVideo;
};

export async function startVideoAnalysis(input: StartAnalysisInput): Promise<BackendAnalysisJob> {
  const formData = new FormData();
  const fileName = input.video.fileName ?? "padel-video.mp4";
  const mimeType = input.video.mimeType ?? "video/mp4";
  const videoPayload = await createVideoPayload(input.video.uri, fileName, mimeType);

  formData.append("match_id", input.matchId);
  formData.append("calibration_points", JSON.stringify(input.calibrationPoints));
  formData.append("players", JSON.stringify(input.players));

  if (Platform.OS === "web") {
    formData.append("video", videoPayload, fileName);
  } else {
    formData.append("video", videoPayload);
  }

  return request<BackendAnalysisJob>("/api/analyses", {
    method: "POST",
    body: formData
  });
}

export async function getAnalysisJob(analysisId: string): Promise<BackendAnalysisJob> {
  return request<BackendAnalysisJob>(`/api/analyses/${analysisId}`);
}

export async function getAnalysisResult(analysisId: string): Promise<BackendAnalysisResult> {
  return request<BackendAnalysisResult>(`/api/analyses/${analysisId}/result`);
}

async function createVideoPayload(uri: string, name: string, type: string): Promise<Blob> {
  if (Platform.OS === "web") {
    const response = await fetch(uri);
    return response.blob();
  }

  return {
    uri,
    name,
    type
  } as unknown as Blob;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, init);

  if (!response.ok) {
    const message = await readErrorMessage(response);
    throw new Error(message || `API error ${response.status}`);
  }

  return response.json() as Promise<T>;
}

async function readErrorMessage(response: Response): Promise<string | null> {
  try {
    const payload = await response.json();

    if (typeof payload.detail === "string") {
      return payload.detail;
    }
  } catch {
    return null;
  }

  return null;
}
