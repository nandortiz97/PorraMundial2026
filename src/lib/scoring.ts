import type { MatchResult } from "@/types";

export const PHASE_MULTIPLIERS: Record<string, number> = {
  grupos: 1,
  dieciseisavos: 2,
  octavos: 3,
  cuartos: 4,
  semifinales: 5,
  final: 6,
};

type Sign = "A" | "X" | "B";

function getSign(a: number, b: number): Sign {
  return a > b ? "A" : a < b ? "B" : "X";
}

/**
 * Reglamento oficial:
 *   Pleno (goles exactos)  → 3 × factor de fase
 *   Signo (ganador/empate) → 1 × factor de fase
 *   Fallo                  → 0
 *
 *   Grupos ×1: pleno=3pts, signo=1pt
 *   Octavos ×3: pleno=9pts, signo=3pts
 */
export function calcMatchPoints(
  predicted: MatchResult | null,
  result: MatchResult,
  phase: string
): number {
  if (!predicted) return 0;
  const mult = PHASE_MULTIPLIERS[phase] ?? 1;
  const exact = predicted.goalsA === result.goalsA && predicted.goalsB === result.goalsB;
  const signOk = getSign(predicted.goalsA, predicted.goalsB) === getSign(result.goalsA, result.goalsB);
  if (exact) return 3 * mult;
  if (signOk) return 1 * mult;
  return 0;
}

export function calcTotalPoints(
  predictions: Record<string, MatchResult>,
  results: Record<string, MatchResult>,
  phaseMap: Record<string, string>
): number {
  return Object.entries(results).reduce((total, [id, result]) => {
    return total + calcMatchPoints(predictions[id] ?? null, result, phaseMap[id] ?? "grupos");
  }, 0);
}

export function getPhaseFromId(id: string): string {
  if (id.startsWith("g")) return "grupos";
  if (id.startsWith("d")) return "dieciseisavos";
  if (id.startsWith("o")) return "octavos";
  if (id.startsWith("c")) return "cuartos";
  if (id.startsWith("s")) return "semifinales";
  if (id.startsWith("f")) return "final";
  return "grupos";
}

export function buildPhaseMap(ids: string[]): Record<string, string> {
  return Object.fromEntries(ids.map(id => [id, getPhaseFromId(id)]));
}
