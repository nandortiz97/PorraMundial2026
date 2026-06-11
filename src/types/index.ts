export type GroupLetter = "A" | "B" | "C" | "D" | "E" | "F" | "G" | "H" | "I" | "J" | "K" | "L";

export interface Team {
  name: string;
  flag: string;
}

export interface Match {
  id: string;       // UI identifier: gA1, d1, o1, …
  dbId?: string;    // DB identifier matching matches.id FK: m1, m2, …
  group?: GroupLetter;
  teamA: string;
  teamB: string;
  flagA: string;
  flagB: string;
  goalsA: number | "";
  goalsB: number | "";
  qualifier?: "teamA" | "teamB" | null;
  stadium: string;
  city: string;
  localTime?: string;
  timeSpain: string;
  tvChannel: string;
}

export interface MatchResult {
  goalsA: number;
  goalsB: number;
}

export interface MockPlayer {
  id: string;
  name: string;
  initials: string;
  colorClass: string;
  predictions: Record<string, MatchResult>;
}
