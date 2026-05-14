import { Match, Player, PlayerStats, Rally } from "@/types/match";

export const players: Player[] = [
  { id: "p1", label: "Joueur 1", team: "A", color: "#1f7a63" },
  { id: "p2", label: "Joueur 2", team: "A", color: "#3e78b2" },
  { id: "p3", label: "Joueur 3", team: "B", color: "#d97152" },
  { id: "p4", label: "Joueur 4", team: "B", color: "#c99a2e" }
];

export const rallies: Rally[] = [
  {
    id: "r1",
    index: 1,
    startTime: "00:18",
    endTime: "00:43",
    decision: { id: "d1", rallyId: "r1", playerId: "p3", label: "fault" }
  },
  {
    id: "r2",
    index: 2,
    startTime: "00:56",
    endTime: "01:22",
    decision: { id: "d2", rallyId: "r2", playerId: "p1", label: "winner" }
  },
  {
    id: "r3",
    index: 3,
    startTime: "01:41",
    endTime: "02:04"
  },
  {
    id: "r4",
    index: 4,
    startTime: "02:19",
    endTime: "02:58"
  }
];

export const stats: PlayerStats[] = [
  { playerId: "p1", distanceMeters: 410, faults: 1, winners: 2 },
  { playerId: "p2", distanceMeters: 387, faults: 2, winners: 1 },
  { playerId: "p3", distanceMeters: 431, faults: 3, winners: 1 },
  { playerId: "p4", distanceMeters: 402, faults: 1, winners: 3 }
];

export const matches: Match[] = [
  {
    id: "match-demo",
    title: "Match du vendredi",
    venue: "Club Padel Indoor",
    recordedAt: "2026-05-08",
    duration: "42:16",
    status: "review",
    players,
    rallies,
    stats
  }
];

export function getMatch(id: string): Match {
  return matches.find((match) => match.id === id) ?? matches[0];
}

export function getPlayer(match: Match, playerId: string): Player {
  return match.players.find((player) => player.id === playerId) ?? match.players[0];
}
