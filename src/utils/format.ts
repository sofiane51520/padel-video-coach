export function formatDistance(meters: number): string {
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(2)} km`;
  }

  return `${Math.round(meters)} m`;
}

export function statusLabel(status: string): string {
  switch (status) {
    case "draft":
      return "Brouillon";
    case "calibration":
      return "Calibration";
    case "analysis":
      return "Analyse";
    case "review":
      return "A revoir";
    case "completed":
      return "Termine";
    default:
      return status;
  }
}
