"use client";

import React from "react";
import type { Match, Team } from "@/types";

interface MatchCardProps {
  match: Match;
  isKnockout: boolean;
  isLocked: boolean;
  hasError: boolean;
  usedTeams: string[];
  availableTeams: Team[];
  onTeamChange: (matchId: string, side: "teamA" | "teamB", name: string) => void;
  onGoalChange: (matchId: string, team: "teamA" | "teamB", value: string) => void;
  onQualifierSelect: (matchId: string, teamKey: "teamA" | "teamB") => void;
}

export function MatchCard({
  match, isKnockout, isLocked, hasError, usedTeams, availableTeams,
  onTeamChange, onGoalChange, onQualifierSelect,
}: MatchCardProps) {
  const isDraw = !isKnockout &&
    match.goalsA !== "" && match.goalsB !== "" && match.goalsA === match.goalsB;

  return (
    <div className={`gaming-card p-5 rounded-2xl border flex flex-col gap-3 ${hasError ? "border-red-500/50 bg-red-950/5" : "border-slate-800/80"}`}>

      {/* Match header */}
      <div className="flex justify-between items-center text-[10px] font-black text-slate-500 border-b border-slate-800 pb-2">
        <span>Partido #{match.id.toUpperCase()}</span>
        <span className="truncate ml-2 text-right">{match.stadium} — {match.city}</span>
      </div>

      {/* Schedule info */}
      <div className="flex items-center flex-wrap gap-x-3 gap-y-1 text-[10px] text-slate-500">
        {match.localTime && (
          <span>🕐 <b className="text-slate-400">{match.localTime}</b> local</span>
        )}
        <span>🇪🇸 <b className="text-slate-400">{match.timeSpain}h</b> España</span>
        <span>📺 <b className="text-slate-400">{match.tvChannel}</b></span>
      </div>

      {isKnockout ? (
        /* ── Eliminatorias: selecciona equipos y haz clic para elegir ganador ── */
        <div className="space-y-3">

          {/* Team selectors */}
          <div className="flex gap-2">
            <select
              value={match.teamA === "Por Seleccionar" ? "" : match.teamA}
              onChange={e => onTeamChange(match.id, "teamA", e.target.value)}
              disabled={isLocked}
              className="flex-1 bg-[#111625] border border-slate-800 rounded-lg p-2 text-xs font-bold text-slate-200 focus:outline-none focus:border-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="">🏳️ Local...</option>
              {availableTeams.map(t => {
                const isUsed = usedTeams.includes(t.name) && match.teamA !== t.name;
                return (
                  <option key={t.name} value={t.name} disabled={isUsed}>
                    {t.flag} {t.name}{isUsed ? " (Ya elegido)" : ""}
                  </option>
                );
              })}
            </select>
            <select
              value={match.teamB === "Por Seleccionar" ? "" : match.teamB}
              onChange={e => onTeamChange(match.id, "teamB", e.target.value)}
              disabled={isLocked}
              className="flex-1 bg-[#111625] border border-slate-800 rounded-lg p-2 text-xs font-bold text-slate-200 focus:outline-none focus:border-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="">🏳️ Visitante...</option>
              {availableTeams.map(t => {
                const isUsed = usedTeams.includes(t.name) && match.teamB !== t.name;
                return (
                  <option key={t.name} value={t.name} disabled={isUsed}>
                    {t.flag} {t.name}{isUsed ? " (Ya elegido)" : ""}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Winner picker */}
          <p className="text-[10px] font-black uppercase text-slate-500 text-center tracking-wider">
            ¿Quién pasa de ronda?
          </p>
          <div className="flex items-stretch gap-3">
            <button
              disabled={isLocked || match.teamA === "Por Seleccionar"}
              onClick={() => onQualifierSelect(match.id, "teamA")}
              className={`flex-1 flex flex-col items-center justify-center gap-2 py-4 px-2 rounded-xl border-2 transition-all disabled:opacity-30 disabled:cursor-not-allowed ${
                match.qualifier === "teamA"
                  ? "border-emerald-500 bg-emerald-950/30"
                  : "border-slate-700 bg-[#080c14]/50 hover:border-slate-500"
              }`}
            >
              <span className="text-3xl leading-none">{match.flagA}</span>
              <span className={`text-[11px] font-black text-center leading-tight ${match.qualifier === "teamA" ? "text-emerald-300" : "text-slate-300"}`}>
                {match.teamA === "Por Seleccionar" ? "—" : match.teamA}
              </span>
              {match.qualifier === "teamA" && (
                <span className="text-[9px] font-black text-emerald-400 uppercase tracking-wide">✓ Pasa</span>
              )}
            </button>

            <div className="flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-black text-slate-600 italic">VS</span>
            </div>

            <button
              disabled={isLocked || match.teamB === "Por Seleccionar"}
              onClick={() => onQualifierSelect(match.id, "teamB")}
              className={`flex-1 flex flex-col items-center justify-center gap-2 py-4 px-2 rounded-xl border-2 transition-all disabled:opacity-30 disabled:cursor-not-allowed ${
                match.qualifier === "teamB"
                  ? "border-emerald-500 bg-emerald-950/30"
                  : "border-slate-700 bg-[#080c14]/50 hover:border-slate-500"
              }`}
            >
              <span className="text-3xl leading-none">{match.flagB}</span>
              <span className={`text-[11px] font-black text-center leading-tight ${match.qualifier === "teamB" ? "text-emerald-300" : "text-slate-300"}`}>
                {match.teamB === "Por Seleccionar" ? "—" : match.teamB}
              </span>
              {match.qualifier === "teamB" && (
                <span className="text-[9px] font-black text-emerald-400 uppercase tracking-wide">✓ Pasa</span>
              )}
            </button>
          </div>

        </div>

      ) : (
        /* ── Fase de grupos: equipos fijos + casillas de goles ── */
        <>
          <div className="flex items-center justify-between gap-3">

            {/* Team A */}
            <div className="flex-1 space-y-2 bg-[#080c14]/50 p-3 rounded-xl border border-slate-800">
              <div className="flex items-center gap-2 text-sm font-black p-1">
                <span>{match.flagA}</span>
                <span className="truncate">{match.teamA}</span>
              </div>
              <input
                type="number"
                placeholder="Goles"
                value={match.goalsA}
                min="0"
                disabled={isLocked}
                onChange={e => onGoalChange(match.id, "teamA", e.target.value)}
                className="w-full h-9 rounded-lg bg-[#111625] border border-slate-800 text-center font-black text-sm text-white focus:outline-none focus:border-emerald-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>

            <span className="text-xs font-black text-slate-600 italic flex-shrink-0">VS</span>

            {/* Team B */}
            <div className="flex-1 space-y-2 bg-[#080c14]/50 p-3 rounded-xl border border-slate-800">
              <div className="flex items-center gap-2 text-sm font-black p-1 flex-row-reverse text-right">
                <span>{match.flagB}</span>
                <span className="truncate">{match.teamB}</span>
              </div>
              <input
                type="number"
                placeholder="Goles"
                value={match.goalsB}
                min="0"
                disabled={isLocked}
                onChange={e => onGoalChange(match.id, "teamB", e.target.value)}
                className="w-full h-9 rounded-lg bg-[#111625] border border-slate-800 text-center font-black text-sm text-white focus:outline-none focus:border-emerald-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>

          </div>

          {/* Draw indicator for group stage */}
          {isDraw && (
            <div className="bg-slate-900/40 border border-slate-700/40 rounded-xl p-2 text-center">
              <p className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Empate pronosticado</p>
            </div>
          )}
        </>
      )}

    </div>
  );
}
