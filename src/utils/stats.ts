import { Match, Player, PlayerStats } from "@/types/match";

export function getPlayer(match: Match, playerId: string): Player {
  return match.players.find((player) => player.id === playerId) ?? match.players[0];
}

export function computePlayerStats(match: Match): PlayerStats[] {
  const distances = new Map(match.stats.map((stat) => [stat.playerId, stat.distanceMeters]));

  return match.players.map((player) => {
    const playerRallies = match.rallies.filter((rally) => rally.decision?.playerId === player.id);

    return {
      playerId: player.id,
      distanceMeters: distances.get(player.id) ?? 0,
      faults: playerRallies.filter((rally) => rally.decision?.label === "fault").length,
      winners: playerRallies.filter((rally) => rally.decision?.label === "winner").length
    };
  });
}

export function getTaggedRallyCount(match: Match): number {
  return match.rallies.filter((rally) => rally.decision).length;
}
