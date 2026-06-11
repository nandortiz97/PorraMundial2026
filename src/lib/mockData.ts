import type { MockPlayer, MatchResult } from "@/types";

/**
 * Simulated official results for the first 12 matches of the tournament.
 * Used to compute real-time points in the classification.
 */
export const MOCK_RESULTS: Record<string, MatchResult> = {
  gA1: { goalsA: 2, goalsB: 1 }, // México 2-1 Sudáfrica
  gA2: { goalsA: 1, goalsB: 1 }, // Rep. de Corea 1-1 Rep. Checa
  gB1: { goalsA: 3, goalsB: 1 }, // Canadá 3-1 Bosnia
  gB2: { goalsA: 0, goalsB: 2 }, // Catar 0-2 Suiza
  gC1: { goalsA: 2, goalsB: 1 }, // Brasil 2-1 Marruecos
  gC2: { goalsA: 0, goalsB: 0 }, // Haití 0-0 Escocia
  gD1: { goalsA: 3, goalsB: 0 }, // Francia 3-0 Polonia
  gE1: { goalsA: 2, goalsB: 2 }, // Alemania 2-2 Turquía
  gF1: { goalsA: 3, goalsB: 0 }, // Argentina 3-0 Japón
  gG1: { goalsA: 1, goalsB: 1 }, // Estados Unidos 1-1 Serbia
  gH1: { goalsA: 2, goalsB: 0 }, // España 2-0 Cabo Verde
  gI1: { goalsA: 1, goalsB: 0 }, // Inglaterra 1-0 Países Bajos
};

// 5 mock players with pre-set predictions of varying accuracy
export const MOCK_PLAYERS: MockPlayer[] = [
  {
    id: "p1",
    name: "Ana Beltrán",
    initials: "AB",
    colorClass: "from-violet-500 to-purple-600",
    predictions: {
      // Exact (pleno ✓): gA1, gC1, gC2, gF1, gG1 → 3pts each
      // Sign ok (✓): gA2, gB1, gB2, gD1, gE1, gH1, gI1 → 1pt each
      gA1: { goalsA: 2, goalsB: 0 }, // pleno  3pts
      gA2: { goalsA: 0, goalsB: 0 }, // signo  1pt
      gB1: { goalsA: 2, goalsB: 0 }, // signo  1pt
      gB2: { goalsA: 0, goalsB: 1 }, // signo  1pt
      gC1: { goalsA: 2, goalsB: 1 }, // pleno  3pts
      gC2: { goalsA: 0, goalsB: 0 }, // pleno  3pts
      gD1: { goalsA: 2, goalsB: 0 }, // signo  1pt
      gE1: { goalsA: 1, goalsB: 1 }, // signo  1pt
      gF1: { goalsA: 3, goalsB: 0 }, // pleno  3pts
      gG1: { goalsA: 1, goalsB: 1 }, // pleno  3pts
      gH1: { goalsA: 3, goalsB: 1 }, // signo  1pt
      gI1: { goalsA: 2, goalsB: 0 }, // signo  1pt
    }, // Total: 22 pts
  },
  {
    id: "p2",
    name: "Carlos Ruiz",
    initials: "CR",
    colorClass: "from-blue-500 to-cyan-600",
    predictions: {
      gA1: { goalsA: 1, goalsB: 0 }, // signo  1pt
      gA2: { goalsA: 1, goalsB: 1 }, // pleno  3pts
      gB1: { goalsA: 2, goalsB: 1 }, // signo  1pt
      gB2: { goalsA: 1, goalsB: 2 }, // signo  1pt
      gC1: { goalsA: 1, goalsB: 0 }, // signo  1pt
      gC2: { goalsA: 1, goalsB: 1 }, // signo  1pt
      gD1: { goalsA: 3, goalsB: 0 }, // pleno  3pts
      gE1: { goalsA: 2, goalsB: 0 }, // fallo  0pt
      gF1: { goalsA: 2, goalsB: 0 }, // signo  1pt
      gG1: { goalsA: 0, goalsB: 0 }, // signo  1pt
      gH1: { goalsA: 2, goalsB: 0 }, // pleno  3pts
      gI1: { goalsA: 1, goalsB: 1 }, // fallo  0pt
    }, // Total: 16 pts
  },
  {
    id: "p3",
    name: "Patricia Lozano",
    initials: "PL",
    colorClass: "from-rose-500 to-pink-600",
    predictions: {
      gA1: { goalsA: 0, goalsB: 1 }, // fallo  0pt
      gA2: { goalsA: 2, goalsB: 1 }, // fallo  0pt
      gB1: { goalsA: 3, goalsB: 1 }, // pleno  3pts
      gB2: { goalsA: 1, goalsB: 0 }, // fallo  0pt
      gC1: { goalsA: 2, goalsB: 0 }, // signo  1pt
      gC2: { goalsA: 2, goalsB: 1 }, // fallo  0pt
      gD1: { goalsA: 2, goalsB: 1 }, // signo  1pt
      gE1: { goalsA: 2, goalsB: 2 }, // pleno  3pts
      gF1: { goalsA: 1, goalsB: 0 }, // signo  1pt
      gG1: { goalsA: 2, goalsB: 2 }, // signo  1pt
      gH1: { goalsA: 1, goalsB: 0 }, // signo  1pt
      gI1: { goalsA: 1, goalsB: 0 }, // pleno  3pts
    }, // Total: 14 pts
  },
  {
    id: "p4",
    name: "Roberto Sanz",
    initials: "RS",
    colorClass: "from-amber-500 to-orange-600",
    predictions: {
      gA1: { goalsA: 1, goalsB: 0 }, // signo  1pt
      gA2: { goalsA: 2, goalsB: 0 }, // fallo  0pt
      gB1: { goalsA: 2, goalsB: 0 }, // signo  1pt
      gB2: { goalsA: 0, goalsB: 2 }, // pleno  3pts
      gC1: { goalsA: 1, goalsB: 0 }, // signo  1pt
      gC2: { goalsA: 2, goalsB: 0 }, // fallo  0pt
      gD1: { goalsA: 0, goalsB: 0 }, // fallo  0pt
      gE1: { goalsA: 1, goalsB: 0 }, // fallo  0pt
      gF1: { goalsA: 1, goalsB: 0 }, // signo  1pt
      gG1: { goalsA: 3, goalsB: 0 }, // fallo  0pt
      gH1: { goalsA: 1, goalsB: 0 }, // signo  1pt
      gI1: { goalsA: 0, goalsB: 1 }, // fallo  0pt
    }, // Total: 8 pts
  },
  {
    id: "p5",
    name: "José Medina",
    initials: "JM",
    colorClass: "from-green-500 to-teal-600",
    predictions: {
      gA1: { goalsA: 1, goalsB: 2 }, // fallo  0pt
      gA2: { goalsA: 3, goalsB: 1 }, // fallo  0pt
      gB1: { goalsA: 0, goalsB: 2 }, // fallo  0pt
      gB2: { goalsA: 2, goalsB: 0 }, // fallo  0pt
      gC1: { goalsA: 0, goalsB: 2 }, // fallo  0pt
      gC2: { goalsA: 1, goalsB: 0 }, // fallo  0pt
      gD1: { goalsA: 2, goalsB: 0 }, // signo  1pt
      gE1: { goalsA: 3, goalsB: 1 }, // fallo  0pt
      gF1: { goalsA: 2, goalsB: 1 }, // signo  1pt
      gG1: { goalsA: 3, goalsB: 0 }, // fallo  0pt
      gH1: { goalsA: 2, goalsB: 1 }, // signo  1pt
      gI1: { goalsA: 2, goalsB: 1 }, // signo  1pt
    }, // Total: 4 pts
  },
];
