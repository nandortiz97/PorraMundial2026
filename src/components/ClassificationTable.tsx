"use client";

import React, { useState, useEffect } from "react";
import { Loader2, Trophy, Target, Zap, AlertCircle } from "lucide-react";
import { loadAllPredictions, loadOfficialResults } from "@/lib/supabase";
import { PHASE_MULTIPLIERS } from "@/lib/scoring";

interface Props {
  currentUserId: string | null;
  currentUserEmail: string | null;
}

interface PlayerRow {
  userId: string;
  displayName: string;
  initials: string;
  points: number;
  plenos: number;
  signos: number;
  predicted: number;
  isCurrentUser: boolean;
}

// Maps sequential DB id (m1…m104) to phase name
function getPhaseFromDbId(dbId: string): string {
  const n = parseInt(dbId.replace(/\D/g, ""), 10);
  if (n <= 72)  return "grupos";
  if (n <= 88)  return "dieciseisavos";
  if (n <= 96)  return "octavos";
  if (n <= 100) return "cuartos";
  if (n <= 102) return "semifinales";
  return "final";
}

function getSign(a: number, b: number): "A" | "X" | "B" {
  return a > b ? "A" : a < b ? "B" : "X";
}

function scoreMatch(
  predA: number, predB: number,
  realA: number, realB: number,
  phase: string
): { pts: number; pleno: boolean; signo: boolean } {
  const mult = PHASE_MULTIPLIERS[phase] ?? 1;
  const exact   = predA === realA && predB === realB;
  const signOk  = getSign(predA, predB) === getSign(realA, realB);
  if (exact)   return { pts: 3 * mult, pleno: true,  signo: false };
  if (signOk)  return { pts: 1 * mult, pleno: false, signo: true  };
  return         { pts: 0,             pleno: false, signo: false };
}

function initials(name: string): string {
  const parts = name.trim().split(/[\s@.]+/);
  return (parts[0]?.[0] ?? "?").toUpperCase() + (parts[1]?.[0] ?? parts[0]?.[1] ?? "?").toUpperCase();
}

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) return <span className="text-xl leading-none">🥇</span>;
  if (rank === 2) return <span className="text-xl leading-none">🥈</span>;
  if (rank === 3) return <span className="text-xl leading-none">🥉</span>;
  return <span className="text-sm font-black text-slate-500">{rank}</span>;
}

export function ClassificationTable({ currentUserId, currentUserEmail }: Props) {
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [ranking, setRanking] = useState<PlayerRow[]>([]);
  const [matchesPlayed, setMatchesPlayed] = useState(0);

  useEffect(() => {
    async function compute() {
      try {
        const [allPreds, officialResults] = await Promise.all([
          loadAllPredictions(),
          loadOfficialResults(),
        ]);

        // Build lookup: dbId → { goalsA, goalsB }
        const resultsMap = new Map(
          officialResults.map(r => [r.id, { goalsA: r.goals_a, goalsB: r.goals_b }])
        );
        setMatchesPlayed(resultsMap.size);

        // Group predictions by user
        const byUser = new Map<string, typeof allPreds>();
        for (const p of allPreds) {
          if (!byUser.has(p.user_id)) byUser.set(p.user_id, []);
          byUser.get(p.user_id)!.push(p);
        }

        // Calculate points per user
        const rows: PlayerRow[] = [];
        for (const [userId, preds] of byUser) {
          let points = 0, plenos = 0, signos = 0, predicted = 0;

          for (const p of preds) {
            const result = resultsMap.get(p.match_id);
            if (!result || p.goals_a === null || p.goals_b === null) continue;
            predicted++;
            const phase = getPhaseFromDbId(p.match_id);
            const { pts, pleno, signo } = scoreMatch(
              p.goals_a, p.goals_b,
              result.goalsA, result.goalsB,
              phase
            );
            points += pts;
            if (pleno) plenos++;
            if (signo) signos++;
          }

          const isCurrentUser = userId === currentUserId;
          const displayName = isCurrentUser
            ? (currentUserEmail ?? "Tú")
            : `Jugador·${userId.slice(-4)}`;

          rows.push({ userId, displayName, initials: initials(displayName), points, plenos, signos, predicted, isCurrentUser });
        }

        rows.sort((a, b) => b.points - a.points || b.plenos - a.plenos);
        setRanking(rows);
      } catch (err) {
        setFetchError(err instanceof Error ? err.message : "Error al cargar la clasificación.");
      } finally {
        setLoading(false);
      }
    }

    compute();
  }, [currentUserId, currentUserEmail]);

  const currentUser = ranking.find(r => r.isCurrentUser);
  const currentUserRank = currentUser ? ranking.indexOf(currentUser) + 1 : null;
  const maxPts = ranking[0]?.points || 1;

  // ── States ──────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-3 py-16 text-slate-500">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span className="text-sm font-black uppercase tracking-wider">Calculando clasificación...</span>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="flex items-center gap-3 p-5 gaming-card rounded-2xl border border-red-700/40 bg-red-950/20">
        <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0" />
        <p className="text-sm text-red-400">{fetchError}</p>
      </div>
    );
  }

  if (ranking.length === 0) {
    return (
      <div className="gaming-card rounded-2xl border border-slate-800 p-10 text-center space-y-3">
        <p className="text-4xl">⚽</p>
        <p className="text-slate-400 text-sm">Aún no hay pronósticos registrados. La clasificación aparecerá cuando los participantes guarden sus predicciones.</p>
      </div>
    );
  }

  // ── Main render ──────────────────────────────────────────────────────────────

  return (
    <div className="space-y-5">

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="gaming-card p-4 rounded-2xl border border-slate-800 text-center">
          <div className="text-2xl font-black text-white">{matchesPlayed}</div>
          <div className="text-[10px] text-slate-400 uppercase tracking-wider mt-1 flex items-center justify-center gap-1">
            <Target className="h-3 w-3" /> Partidos disputados
          </div>
        </div>
        <div className="gaming-card p-4 rounded-2xl border border-emerald-900/40 text-center">
          <div className="text-2xl font-black text-emerald-400">{currentUser?.points ?? 0}</div>
          <div className="text-[10px] text-slate-400 uppercase tracking-wider mt-1 flex items-center justify-center gap-1">
            <Trophy className="h-3 w-3" /> Tus puntos
          </div>
        </div>
        <div className="gaming-card p-4 rounded-2xl border border-slate-800 text-center">
          <div className="text-2xl font-black text-amber-400">{currentUserRank ? `#${currentUserRank}` : "–"}</div>
          <div className="text-[10px] text-slate-400 uppercase tracking-wider mt-1 flex items-center justify-center gap-1">
            <Zap className="h-3 w-3" /> Tu posición
          </div>
        </div>
      </div>

      {/* Ranking table */}
      <div className="gaming-card rounded-2xl border border-slate-800 overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-800 bg-[#0c101d]/60 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-black uppercase italic tracking-wider text-white">Clasificación en Vivo</h3>
            <p className="text-[10px] text-slate-500 mt-0.5">
              {ranking.length} participante{ranking.length !== 1 ? "s" : ""} · {matchesPlayed} partido{matchesPlayed !== 1 ? "s" : ""} disputado{matchesPlayed !== 1 ? "s" : ""}
            </p>
          </div>
          <div className="text-[10px] text-slate-500 hidden sm:block">
            <span className="text-emerald-400">●</span> Pleno &nbsp;
            <span className="text-amber-400">●</span> Signo
          </div>
        </div>

        {/* Column headers */}
        <div className="grid grid-cols-[auto_1fr_auto_auto_auto_auto] gap-x-4 px-5 py-2 border-b border-slate-800/50 text-[9px] font-black uppercase text-slate-600 tracking-widest">
          <span>#</span>
          <span>Jugador</span>
          <span className="text-right">Plenos</span>
          <span className="text-right">Signos</span>
          <span className="text-right hidden sm:block">Pronost.</span>
          <span className="text-right">Pts</span>
        </div>

        {/* Rows */}
        <div className="divide-y divide-slate-800/40">
          {ranking.map((player, idx) => {
            const rank = idx + 1;
            const pct = (player.points / maxPts) * 100;

            return (
              <div key={player.userId}
                className={`grid grid-cols-[auto_1fr_auto_auto_auto_auto] gap-x-4 items-center px-5 py-3.5 transition-colors ${player.isCurrentUser
                  ? "bg-emerald-950/25 border-l-2 border-l-emerald-500"
                  : "hover:bg-[#0c101d]/30"
                  }`}>

                <div className="flex items-center justify-center w-6 flex-shrink-0">
                  <RankBadge rank={rank} />
                </div>

                <div className="flex items-center gap-2.5 min-w-0">
                  <div className={`h-8 w-8 rounded-xl flex items-center justify-center text-[10px] font-black text-white flex-shrink-0 ${player.isCurrentUser
                    ? "bg-gradient-to-br from-emerald-500 to-teal-600"
                    : rank === 1
                    ? "bg-gradient-to-br from-amber-400 to-yellow-600"
                    : "bg-gradient-to-br from-slate-600 to-slate-700"
                    }`}>
                    {player.initials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className={`text-sm font-black truncate ${player.isCurrentUser ? "text-emerald-400" : "text-slate-200"}`}>
                      {player.displayName}
                      {player.isCurrentUser && (
                        <span className="ml-1.5 text-[8px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded uppercase tracking-wider align-middle">Tú</span>
                      )}
                    </div>
                    <div className="w-full mt-1 bg-slate-800 rounded-full h-1">
                      <div
                        className={`h-1 rounded-full bg-gradient-to-r ${player.isCurrentUser
                          ? "from-emerald-500 to-teal-400"
                          : rank === 1
                          ? "from-amber-400 to-yellow-500"
                          : "from-slate-600 to-slate-500"
                          }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs font-black text-emerald-400">{player.plenos}</span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-black text-amber-400">{player.signos}</span>
                </div>
                <div className="text-right hidden sm:block">
                  <span className="text-xs text-slate-500">{player.predicted}</span>
                </div>
                <div className="text-right">
                  <div className={`text-base font-black ${rank === 1 ? "text-amber-400" : player.isCurrentUser ? "text-emerald-400" : "text-slate-200"}`}>
                    {player.points}
                  </div>
                  <div className="text-[9px] text-slate-600 uppercase">pts</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Scoring legend */}
      <div className="gaming-card p-4 rounded-2xl border border-slate-800/60">
        <p className="text-[10px] font-black uppercase text-slate-500 tracking-wider mb-2">Puntuación por fase</p>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-center">
          {Object.entries(PHASE_MULTIPLIERS).map(([phase, mult]) => (
            <div key={phase} className="bg-slate-900/60 rounded-lg p-2">
              <div className="text-[9px] text-slate-500 uppercase truncate">{phase}</div>
              <div className="text-xs font-black text-amber-400 mt-0.5">×{mult}</div>
              <div className="text-[9px] text-emerald-400">{3 * mult}<span className="text-slate-600">/</span><span className="text-amber-300">{mult}</span></div>
            </div>
          ))}
        </div>
        <p className="text-[9px] text-slate-600 mt-2 text-center">Pleno (goles exactos) / Signo (ganador o empate)</p>
      </div>

    </div>
  );
}
