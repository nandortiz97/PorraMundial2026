"use client";

import React, { useState, useEffect } from "react";
import {
  Trophy, ArrowLeft, ChevronRight, Calendar, Activity, ListOrdered,
  Sparkles, Shield, Loader2, Check,
} from "lucide-react";
import type { User } from "@supabase/supabase-js";
import type { GroupLetter, Match, Team } from "@/types";
import { MatchCard } from "@/components/MatchCard";
import { ClassificationTable } from "@/components/ClassificationTable";
import { getAuthUser, loadPredictions, savePredictions, saveOfficialResults, getLeaderboard, loadOfficialResults } from "@/lib/supabase";
import type { PredictionRow } from "@/lib/supabase";

const GROUP_LETTERS: GroupLetter[] = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"];

/** Partido inaugural: 11 jun 2026 a las 21:00h Madrid = 19:00h UTC */
const KICKOFF_DEADLINE = new Date("2026-06-11T19:00:00Z");

interface Phase {
  id: string; name: string; matchesCount: number; predictedCount: number;
  icon: React.ReactNode; weight: string;
}

// ─── Tournament data ──────────────────────────────────────────────────────────

const AVAILABLE_TEAMS: Team[] = [
  { name: "México", flag: "🇲🇽" }, { name: "Sudáfrica", flag: "🇿🇦" }, { name: "Rep. de Corea", flag: "🇰🇷" }, { name: "Rep. Checa", flag: "🇨🇿" },
  { name: "Canadá", flag: "🇨🇦" }, { name: "Bosnia", flag: "🇧🇦" }, { name: "Catar", flag: "🇶🇦" }, { name: "Suiza", flag: "🇨🇭" },
  { name: "Brasil", flag: "🇧🇷" }, { name: "Marruecos", flag: "🇲🇦" }, { name: "Haití", flag: "🇭🇹" }, { name: "Escocia", flag: "🏴󠁧󠁢󠁳󠁣󠁴󠁿" },
  { name: "Francia", flag: "🇫🇷" }, { name: "Polonia", flag: "🇵🇱" }, { name: "Venezuela", flag: "🇻🇪" }, { name: "Camerún", flag: "🇨🇲" },
  { name: "Alemania", flag: "🇩🇪" }, { name: "Turquía", flag: "🇹🇷" }, { name: "Ecuador", flag: "🇪🇨" }, { name: "Senegal", flag: "🇸🇳" },
  { name: "Argentina", flag: "🇦🇷" }, { name: "Japón", flag: "🇯🇵" }, { name: "Irán", flag: "🇮🇷" }, { name: "Nigeria", flag: "🇳🇬" },
  { name: "Estados Unidos", flag: "🇺🇸" }, { name: "Serbia", flag: "🇷🇸" }, { name: "Costa Rica", flag: "🇨🇷" }, { name: "Côte d'Ivoire", flag: "🇨🇮" },
  { name: "España", flag: "🇪🇸" }, { name: "Cabo Verde", flag: "🇨🇻" }, { name: "Arabia Saudí", flag: "🇸🇦" }, { name: "Uruguay", flag: "🇺🇾" },
  { name: "Inglaterra", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿" }, { name: "Países Bajos", flag: "🇳🇱" }, { name: "Australia", flag: "🇦🇺" }, { name: "Panamá", flag: "🇵🇦" },
  { name: "Bélgica", flag: "🇧🇪" }, { name: "Rumania", flag: "🇷🇴" }, { name: "Jamaica", flag: "🇯🇲" }, { name: "Indonesia", flag: "🇮🇩" },
  { name: "Portugal", flag: "🇵🇹" }, { name: "Colombia", flag: "🇨🇴" }, { name: "Eslovenia", flag: "🇸🇮" }, { name: "Egipto", flag: "🇪🇬" },
  { name: "Croacia", flag: "🇭🇷" }, { name: "Italia", flag: "🇮🇹" }, { name: "Honduras", flag: "🇭🇳" }, { name: "Perú", flag: "🇵🇪" },
];

const GROUPS_CONFIG: Record<GroupLetter, [Team, Team, Team, Team]> = {
  A: [{ name: "México", flag: "🇲🇽" }, { name: "Sudáfrica", flag: "🇿🇦" }, { name: "Rep. de Corea", flag: "🇰🇷" }, { name: "Rep. Checa", flag: "🇨🇿" }],
  B: [{ name: "Canadá", flag: "🇨🇦" }, { name: "Bosnia", flag: "🇧🇦" }, { name: "Catar", flag: "🇶🇦" }, { name: "Suiza", flag: "🇨🇭" }],
  C: [{ name: "Brasil", flag: "🇧🇷" }, { name: "Marruecos", flag: "🇲🇦" }, { name: "Haití", flag: "🇭🇹" }, { name: "Escocia", flag: "🏴󠁧󠁢󠁳󠁣󠁴󠁿" }],
  D: [{ name: "Francia", flag: "🇫🇷" }, { name: "Polonia", flag: "🇵🇱" }, { name: "Venezuela", flag: "🇻🇪" }, { name: "Camerún", flag: "🇨🇲" }],
  E: [{ name: "Alemania", flag: "🇩🇪" }, { name: "Turquía", flag: "🇹🇷" }, { name: "Ecuador", flag: "🇪🇨" }, { name: "Senegal", flag: "🇸🇳" }],
  F: [{ name: "Argentina", flag: "🇦🇷" }, { name: "Japón", flag: "🇯🇵" }, { name: "Irán", flag: "🇮🇷" }, { name: "Nigeria", flag: "🇳🇬" }],
  G: [{ name: "Estados Unidos", flag: "🇺🇸" }, { name: "Serbia", flag: "🇷🇸" }, { name: "Costa Rica", flag: "🇨🇷" }, { name: "Côte d'Ivoire", flag: "🇨🇮" }],
  H: [{ name: "España", flag: "🇪🇸" }, { name: "Cabo Verde", flag: "🇨🇻" }, { name: "Arabia Saudí", flag: "🇸🇦" }, { name: "Uruguay", flag: "🇺🇾" }],
  I: [{ name: "Inglaterra", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿" }, { name: "Países Bajos", flag: "🇳🇱" }, { name: "Australia", flag: "🇦🇺" }, { name: "Panamá", flag: "🇵🇦" }],
  J: [{ name: "Bélgica", flag: "🇧🇪" }, { name: "Rumania", flag: "🇷🇴" }, { name: "Jamaica", flag: "🇯🇲" }, { name: "Indonesia", flag: "🇮🇩" }],
  K: [{ name: "Portugal", flag: "🇵🇹" }, { name: "Colombia", flag: "🇨🇴" }, { name: "Eslovenia", flag: "🇸🇮" }, { name: "Egipto", flag: "🇪🇬" }],
  L: [{ name: "Croacia", flag: "🇭🇷" }, { name: "Italia", flag: "🇮🇹" }, { name: "Honduras", flag: "🇭🇳" }, { name: "Perú", flag: "🇵🇪" }],
};

const VENUES = [
  { stadium: "MetLife Stadium", city: "Nueva York", localTime: "Por determinar", timeSpain: "21:00", tvChannel: "La 1" },
  { stadium: "AT&T Stadium", city: "Dallas", localTime: "Por determinar", timeSpain: "22:00", tvChannel: "Cuatro" },
  { stadium: "SoFi Stadium", city: "Los Ángeles", localTime: "Por determinar", timeSpain: "03:00", tvChannel: "Teledeporte" },
  { stadium: "Estadio Azteca", city: "Ciudad de México", localTime: "Por determinar", timeSpain: "22:00", tvChannel: "La 1" },
  { stadium: "NRG Stadium", city: "Houston", localTime: "Por determinar", timeSpain: "22:00", tvChannel: "Cuatro" },
  { stadium: "Levi's Stadium", city: "San Francisco", localTime: "Por determinar", timeSpain: "03:00", tvChannel: "Teledeporte" },
  { stadium: "Hard Rock Stadium", city: "Miami", localTime: "Por determinar", timeSpain: "21:00", tvChannel: "La 1" },
  { stadium: "Lumen Field", city: "Seattle", localTime: "Por determinar", timeSpain: "01:00", tvChannel: "Teledeporte" },
  { stadium: "BC Place", city: "Vancouver", localTime: "Por determinar", timeSpain: "02:00", tvChannel: "Cuatro" },
  { stadium: "BMO Field", city: "Toronto", localTime: "Por determinar", timeSpain: "20:00", tvChannel: "La 1" },
  { stadium: "Estadio Akron", city: "Guadalajara", localTime: "Por determinar", timeSpain: "22:00", tvChannel: "La 1" },
  { stadium: "Estadio BBVA", city: "Monterrey", localTime: "Por determinar", timeSpain: "22:00", tvChannel: "Cuatro" },
  { stadium: "Rose Bowl", city: "Pasadena", localTime: "Por determinar", timeSpain: "03:00", tvChannel: "Teledeporte" },
  { stadium: "Gillette Stadium", city: "Boston", localTime: "Por determinar", timeSpain: "21:00", tvChannel: "La 1" },
  { stadium: "Lincoln Financial", city: "Filadelfia", localTime: "Por determinar", timeSpain: "21:00", tvChannel: "Cuatro" },
  { stadium: "Arrowhead Stadium", city: "Kansas City", localTime: "Por determinar", timeSpain: "22:00", tvChannel: "Teledeporte" },
];

const ROUND_ROBIN_PAIRS: [number, number][] = [[0, 1], [2, 3], [0, 2], [1, 3], [0, 3], [1, 2]];

function buildGroupMatches(group: GroupLetter): Match[] {
  const teams = GROUPS_CONFIG[group];
  const base = GROUP_LETTERS.indexOf(group) * 6;
  return ROUND_ROBIN_PAIRS.map(([a, b], i) => {
    const v = VENUES[(base + i) % VENUES.length];
    return {
      id: `g${group}${i + 1}`, group,
      teamA: teams[a].name, teamB: teams[b].name,
      flagA: teams[a].flag, flagB: teams[b].flag,
      goalsA: "", goalsB: "",
      stadium: v.stadium, city: v.city, localTime: v.localTime, timeSpain: v.timeSpain, tvChannel: v.tvChannel,
    };
  });
}

function buildElimMatch(id: string, vi: number): Match {
  const v = VENUES[vi % VENUES.length];
  return {
    id, teamA: "Por Seleccionar", teamB: "Por Seleccionar",
    flagA: "🏳️", flagB: "🏳️", goalsA: "", goalsB: "", qualifier: null,
    stadium: v.stadium, city: v.city, localTime: v.localTime, timeSpain: v.timeSpain, tvChannel: v.tvChannel,
  };
}

const INITIAL_MATCHES: Match[] = [
  ...GROUP_LETTERS.flatMap(buildGroupMatches),
  ...Array.from({ length: 16 }, (_, i) => buildElimMatch(`d${i + 1}`, i)),
  ...Array.from({ length: 8 }, (_, i) => buildElimMatch(`o${i + 1}`, i + 16)),
  ...Array.from({ length: 4 }, (_, i) => buildElimMatch(`c${i + 1}`, i + 8)),
  ...Array.from({ length: 2 }, (_, i) => buildElimMatch(`s${i + 1}`, i + 12)),
  ...Array.from({ length: 2 }, (_, i) => buildElimMatch(`f${i + 1}`, i + 14)),
].map((m, idx) => ({ ...m, dbId: `m${idx + 1}` })); // m1…m104, matching matches.id in Supabase

// ─── Merge Supabase rows back into match state ────────────────────────────────

function mergeWithPredictions(base: Match[], saved: PredictionRow[]): Match[] {
  const map = new Map(saved.map(p => [p.match_id, p]));
  return base.map(m => {
    const p = m.dbId ? map.get(m.dbId) : undefined; // look up by DB id, not UI id
    if (!p) return m;
    const teamA = p.team_a || m.teamA;
    const teamB = p.team_b || m.teamB;
    const isKnockout = !m.group;
    // For knockout matches, goals 1-0 / 0-1 encode the winner — restore qualifier from them
    const qualifier: "teamA" | "teamB" | null = isKnockout
      ? (p.goals_a > p.goals_b ? "teamA" : p.goals_b > p.goals_a ? "teamB" : null)
      : (m.qualifier ?? null);
    return {
      ...m,
      goalsA: isKnockout ? "" : p.goals_a,
      goalsB: isKnockout ? "" : p.goals_b,
      qualifier,
      teamA,
      teamB,
      flagA: AVAILABLE_TEAMS.find(t => t.name === teamA)?.flag ?? m.flagA,
      flagB: AVAILABLE_TEAMS.find(t => t.name === teamB)?.flag ?? m.flagB,
    };
  });
}

// ─── Bracket mini-card ────────────────────────────────────────────────────────

function BracketCard({ m, onClick }: { m: Match; onClick: () => void }) {
  const isKnockout = !m.group;
  return (
    <div onClick={onClick} className="gaming-card p-2 rounded-xl border border-slate-800 hover:border-emerald-500/50 cursor-pointer space-y-1">
      <div className={`flex justify-between items-center font-bold text-[10px] ${isKnockout && m.qualifier === "teamA" ? "text-emerald-400" : ""}`}>
        <span className="truncate w-16">{m.flagA} {m.teamA}</span>
        {isKnockout
          ? m.qualifier === "teamA" && <span className="text-emerald-400 text-[8px]">✓</span>
          : <span className="text-slate-400">{m.goalsA !== "" ? m.goalsA : "-"}</span>
        }
      </div>
      <div className={`flex justify-between items-center font-bold text-[10px] ${isKnockout && m.qualifier === "teamB" ? "text-emerald-400" : ""}`}>
        <span className="truncate w-16">{m.flagB} {m.teamB}</span>
        {isKnockout
          ? m.qualifier === "teamB" && <span className="text-emerald-400 text-[8px]">✓</span>
          : <span className="text-slate-400">{m.goalsB !== "" ? m.goalsB : "-"}</span>
        }
      </div>
    </div>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export default function PredictionsDashboard() {
  const [activeTab, setActiveTab] = useState<"pronosticos" | "clasificacion" | "reglamento" | "admin">("pronosticos");
  const [activePhase, setActivePhase] = useState<string | null>(null);
  const [activeGroupTab, setActiveGroupTab] = useState<GroupLetter>("A");

  // Admin state — separate from user predictions
  const [activeAdminPhase, setActiveAdminPhase] = useState<string>("grupos");
  const [activeAdminGroup, setActiveAdminGroup] = useState<GroupLetter>("A");
  const [adminResults, setAdminResults] = useState<Record<string, { goalsA: number | ""; goalsB: number | ""; qualifier?: "teamA" | "teamB" | null }>>({});
  const [isAdminSaving, setIsAdminSaving] = useState(false);
  const [matches, setMatches] = useState<Match[]>(INITIAL_MATCHES);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Tournament lock — recalculated on every render; no timer needed
  const isLocked = Date.now() >= KICKOFF_DEADLINE.getTime();

  // Auth + async state
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);

  // ── Toast helper ────────────────────────────────────────────────────────────

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  };

  // ── Init: authenticate + load saved predictions ─────────────────────────────

  useEffect(() => {
    async function init() {
      try {
        const user = await getAuthUser();
        if (user) {
          setAuthUser(user);
          const [savedResult, boardResult, officialResult] = await Promise.allSettled([
            loadPredictions(user.id),
            getLeaderboard(),
            loadOfficialResults(),
          ]);

          // Each call is independent — one failing doesn't block the others
          if (savedResult.status === "fulfilled" && savedResult.value.length > 0) {
            setMatches(prev => mergeWithPredictions(prev, savedResult.value));
          } else if (savedResult.status === "rejected") {
            console.warn("[init] loadPredictions failed:", savedResult.reason);
          }

          if (boardResult.status === "fulfilled") {
            setLeaderboard(boardResult.value);
          } else {
            console.warn("[init] getLeaderboard failed (¿RPC get_leaderboard existe en Supabase?):", boardResult.reason);
          }

          if (officialResult.status === "fulfilled" && officialResult.value.length > 0) {
            const adminState: Record<string, { goalsA: number | ""; goalsB: number | ""; qualifier?: "teamA" | "teamB" | null }> = {};
            for (const r of officialResult.value) {
              const match = INITIAL_MATCHES.find(m => m.dbId === r.id);
              const isKnockout = match && !match.group;
              if (isKnockout) {
                // Decode winner from 1-0 / 0-1 encoding
                const qualifier: "teamA" | "teamB" | null =
                  r.goals_a > r.goals_b ? "teamA" : r.goals_b > r.goals_a ? "teamB" : null;
                adminState[r.id] = { goalsA: "", goalsB: "", qualifier };
              } else {
                adminState[r.id] = { goalsA: r.goals_a, goalsB: r.goals_b };
              }
            }
            setAdminResults(adminState);
          } else if (officialResult.status === "rejected") {
            console.warn("[init] loadOfficialResults failed:", officialResult.reason);
          }
        }
      } catch {
        // Supabase not configured or offline — work with local state
      } finally {
        setInitialLoading(false);
      }
    }
    init();
  }, []);

  // ── Derived state ────────────────────────────────────────────────────────────

  const getPhaseFromId = (id: string): string => {
    if (id.startsWith("g")) return "grupos";
    if (id.startsWith("d")) return "dieciseisavos";
    if (id.startsWith("o")) return "octavos";
    if (id.startsWith("c")) return "cuartos";
    if (id.startsWith("s")) return "semifinales";
    if (id.startsWith("f")) return "final";
    return "grupos";
  };

  const matchesByPhase = matches.reduce<Record<string, Match[]>>((acc, m) => {
    const p = getPhaseFromId(m.id);
    (acc[p] ??= []).push(m);
    return acc;
  }, {});

  const getStats = (phaseId: string) => {
    const ms = matchesByPhase[phaseId] || [];
    const isKnockoutPhase = phaseId !== "grupos";
    return {
      matchesCount: ms.length,
      predictedCount: ms.filter(m => isKnockoutPhase
        ? (m.qualifier != null && m.teamA !== "Por Seleccionar" && m.teamB !== "Por Seleccionar")
        : (m.goalsA !== "" && m.goalsB !== "")
      ).length,
    };
  };

  const phasesList: Phase[] = [
    { id: "grupos", name: "Fase de Grupos", ...getStats("grupos"), icon: <Calendar className="h-4 w-4" />, weight: "x1 Pts" },
    { id: "dieciseisavos", name: "Dieciseisavos", ...getStats("dieciseisavos"), icon: <Shield className="h-4 w-4" />, weight: "x2 Pts" },
    { id: "octavos", name: "Octavos de Final", ...getStats("octavos"), icon: <Activity className="h-4 w-4" />, weight: "x3 Pts" },
    { id: "cuartos", name: "Cuartos de Final", ...getStats("cuartos"), icon: <ListOrdered className="h-4 w-4" />, weight: "x4 Pts" },
    { id: "semifinales", name: "Semifinales", ...getStats("semifinales"), icon: <Sparkles className="h-4 w-4" />, weight: "x5 Pts" },
    { id: "final", name: "Finales y 3º Puesto", ...getStats("final"), icon: <Trophy className="h-4 w-4" />, weight: "x6 Pts" },
  ];

  const getUsedTeams = (phaseId: string): string[] =>
    (matchesByPhase[phaseId] || []).flatMap(m => [
      m.teamA !== "Por Seleccionar" ? m.teamA : null,
      m.teamB !== "Por Seleccionar" ? m.teamB : null,
    ]).filter(Boolean) as string[];

  // ── Handlers ─────────────────────────────────────────────────────────────────

  const handleTeamChange = (matchId: string, side: "teamA" | "teamB", name: string) => {
    const target = AVAILABLE_TEAMS.find(t => t.name === name);
    setMatches(prev => prev.map(m => m.id !== matchId ? m : {
      ...m,
      [side]: name || "Por Seleccionar",
      [side === "teamA" ? "flagA" : "flagB"]: target?.flag ?? "🏳️",
      goalsA: "", goalsB: "", qualifier: null,
    }));
  };

  const handleGoalChange = (matchId: string, team: "teamA" | "teamB", value: string) => {
    setMatches(prev => prev.map(m => {
      if (m.id !== matchId) return m;
      const g = value === "" ? "" : Math.max(0, parseInt(value, 10));
      const updated = { ...m, [team === "teamA" ? "goalsA" : "goalsB"]: g };
      if (updated.goalsA !== updated.goalsB) updated.qualifier = null;
      return updated;
    }));
  };

  const handleQualifier = (matchId: string, teamKey: "teamA" | "teamB") => {
    setMatches(prev => prev.map(m => m.id === matchId ? { ...m, qualifier: teamKey } : m));
  };

  // ── Save: validate → upsert to Supabase ──────────────────────────────────────

  const handleSave = async () => {
    const activeMatches = matchesByPhase[activePhase || ""] || [];
    const errors: string[] = [];
    // Only validate group phase: partial goal input requires both teams selected
    if (activePhase === "grupos") {
      activeMatches.forEach(m => {
        if ((m.goalsA !== "" || m.goalsB !== "") && (m.teamA === "Por Seleccionar" || m.teamB === "Por Seleccionar"))
          errors.push(m.id);
      });
    }
    if (errors.length > 0) {
      setValidationErrors(errors);
      showToast("error", "Soluciona los partidos marcados en rojo.");
      return;
    }
    setValidationErrors([]);

    if (!authUser) {
      showToast("error", "Debes iniciar sesión para guardar tus pronósticos.");
      return;
    }

    setIsSaving(true);
    try {
      // Group matches: save when goals are complete.
      // Knockout matches: encode winner as 1-0 (teamA wins) or 0-1 (teamB wins).
      const rows: Omit<PredictionRow, "user_id">[] = matches
        .filter(m => {
          if (!m.dbId || m.teamA === "Por Seleccionar" || m.teamB === "Por Seleccionar") return false;
          return m.group
            ? m.goalsA !== "" && m.goalsB !== ""
            : m.qualifier != null;
        })
        .map(m => ({
          match_id: m.dbId!,
          goals_a: m.group ? m.goalsA as number : (m.qualifier === "teamA" ? 1 : 0),
          goals_b: m.group ? m.goalsB as number : (m.qualifier === "teamB" ? 1 : 0),
          team_a: m.teamA,
          team_b: m.teamB,
        }));

      await savePredictions(authUser.id, rows);
      showToast("success", "¡Pronósticos guardados correctamente!");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error desconocido";
      console.error("[Supabase] savePredictions:", msg);
      showToast("error", `Error al guardar: ${msg}`);
    } finally {
      setIsSaving(false);
    }
  };

  // Admin gate — only fortiz97@hotmail.com sees the admin tab
  const isAdmin = authUser?.email === "fortiz97@hotmail.com";

  const handleAdminGoalChange = (dbId: string, team: "goalsA" | "goalsB", value: string) => {
    const g = value === "" ? "" : Math.max(0, parseInt(value, 10));
    setAdminResults(prev => {
      const current = prev[dbId] ?? { goalsA: "" as number | "", goalsB: "" as number | "" };
      return { ...prev, [dbId]: { ...current, [team]: g } };
    });
  };

  const handleAdminWinner = (dbId: string, winner: "teamA" | "teamB") => {
    setAdminResults(prev => {
      const current = prev[dbId] ?? { goalsA: "", goalsB: "" };
      return { ...prev, [dbId]: { ...current, qualifier: current.qualifier === winner ? null : winner } };
    });
  };

  const handleAdminSave = async () => {
    setIsAdminSaving(true);
    try {
      const rows = matches
        .filter(m => {
          const r = m.dbId ? adminResults[m.dbId] : undefined;
          if (!r) return false;
          const isKnockout = !m.group;
          return isKnockout ? r.qualifier != null : (r.goalsA !== "" || r.goalsB !== "");
        })
        .map(m => {
          const r = adminResults[m.dbId!]!;
          const isKnockout = !m.group;
          return {
            id: m.dbId!,
            goals_a: isKnockout ? (r.qualifier === "teamA" ? 1 : 0) : (r.goalsA !== "" ? Number(r.goalsA) : null),
            goals_b: isKnockout ? (r.qualifier === "teamB" ? 1 : 0) : (r.goalsB !== "" ? Number(r.goalsB) : null),
          };
        });
      await saveOfficialResults(rows);
      showToast("success", `${rows.length} resultado(s) guardados en la tabla matches.`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error desconocido";
      console.error("[Supabase Admin] saveOfficialResults:", msg);
      showToast("error", `Error al guardar: ${msg}`);
    } finally {
      setIsAdminSaving(false);
    }
  };

  const navigateTo = (tab: "pronosticos" | "clasificacion" | "reglamento" | "admin", phaseId: string | null = null) => {
    setActiveTab(tab);
    setActivePhase(phaseId);
    setValidationErrors([]);
  };

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#060814] text-white font-sans antialiased flex flex-col">

      {/* HEADER */}
      <header className="relative z-10 border-b border-slate-900 bg-[#080c14]/80 backdrop-blur-md sticky top-0 px-4 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigateTo("pronosticos")}>
          <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center">
            <Trophy className="h-5 w-5 text-white" />
          </div>
          <h1 className="text-sm font-black uppercase tracking-wider bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent italic">
            PORRA MUNDIAL 2026
          </h1>
        </div>

        <nav className="hidden md:flex items-center gap-1 bg-[#101524] p-1 rounded-xl border border-slate-800/60">
          {(["pronosticos", "clasificacion", "reglamento"] as const).map(tab => (
            <button key={tab} onClick={() => navigateTo(tab)}
              className={`px-4 py-2 text-xs font-black uppercase tracking-wider rounded-lg transition-all ${activeTab === tab
                ? "bg-gradient-to-r from-emerald-600 to-emerald-500 text-white"
                : "text-slate-400 hover:text-white"}`}>
              {tab === "pronosticos" ? "Mis Pronósticos" : tab === "clasificacion" ? "Clasificación" : "Reglamento"}
            </button>
          ))}
          {isAdmin && (
            <button onClick={() => navigateTo("admin")}
              className={`px-4 py-2 text-xs font-black uppercase tracking-wider rounded-lg transition-all ${activeTab === "admin"
                ? "bg-gradient-to-r from-amber-600 to-orange-500 text-white"
                : "text-amber-400 hover:text-amber-300"}`}>
              ⚙ Admin
            </button>
          )}
        </nav>

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <span className="text-xs font-black text-slate-200 truncate max-w-[140px] block">
              {authUser?.email ?? "Sin sesión"}
            </span>
            <span className={`text-[9px] font-black block -mt-0.5 ${authUser ? "text-emerald-400" : "text-amber-400"}`}>
              {authUser ? "Sesión activa" : "No autenticado"}
            </span>
          </div>
          <div className="h-9 w-9 rounded-xl bg-slate-800 flex items-center justify-center">⚽</div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 lg:p-8 relative z-10">

        {/* Initial loading skeleton */}
        {initialLoading && (
          <div className="flex items-center justify-center gap-3 py-12 text-slate-500">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="text-sm font-black uppercase tracking-wider">Cargando pronósticos...</span>
          </div>
        )}

        {!initialLoading && (
          <>
            {/* ── PRONÓSTICOS ────────────────────────────────────────────────── */}
            {activeTab === "pronosticos" && (
              <>
                {activePhase === null ? (
                  <div className="space-y-8">

                    {/* Phase selector cards */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                      {phasesList.map(phase => {
                        const pct = phase.matchesCount > 0 ? (phase.predictedCount / phase.matchesCount) * 100 : 0;
                        return (
                          <div key={phase.id} onClick={() => setActivePhase(phase.id)}
                            className="gaming-card p-4 rounded-2xl border border-slate-800/80 hover:border-emerald-500/40 transition-all cursor-pointer relative overflow-hidden group flex flex-col justify-between h-32">
                            <div className="absolute top-0 left-0 h-[2px] bg-gradient-to-r from-emerald-500 to-teal-400" style={{ width: `${pct}%` }} />
                            <div className="flex justify-between items-start">
                              <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 group-hover:text-emerald-400">{phase.icon}</div>
                              <span className="text-[9px] font-black uppercase bg-slate-900 border border-slate-800 px-1.5 py-0.5 rounded text-amber-400 italic">{phase.weight}</span>
                            </div>
                            <div>
                              <h3 className="text-[11px] font-black uppercase tracking-wide leading-tight">{phase.name}</h3>
                              <div className="flex justify-between items-center text-[10px] text-slate-400 mt-1">
                                <span><b className="text-slate-200">{phase.predictedCount}/{phase.matchesCount}</b></span>
                                <ChevronRight className="h-3 w-3 opacity-0 group-hover:opacity-100 text-emerald-400 transition-opacity" />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Bracket */}
                    <div className="bg-[#0b0f19]/40 border border-slate-900 rounded-3xl p-6">
                      <h2 className="text-lg font-black text-white uppercase italic tracking-wider mb-1">📊 Cuadro de Eliminatorias Directas</h2>
                      <p className="text-xs text-slate-500 mb-4">Haz clic en cualquier partido para rellenar tus pronósticos.</p>
                      <div className="overflow-x-auto pb-4">
                        <div className="min-w-[1100px] flex gap-4 items-start">

                          <div className="w-56 flex-shrink-0">
                            <div className="text-[10px] font-black uppercase text-slate-500 text-center border-b border-slate-800 pb-1 mb-2">Dieciseisavos (x2)</div>
                            <div className="grid grid-cols-2 gap-1.5">
                              {(matchesByPhase["dieciseisavos"] || []).map(m => (
                                <BracketCard key={m.id} m={m} onClick={() => navigateTo("pronosticos", "dieciseisavos")} />
                              ))}
                            </div>
                          </div>

                          <div className="w-40 flex-shrink-0">
                            <div className="text-[10px] font-black uppercase text-slate-500 text-center border-b border-slate-800 pb-1 mb-2">Octavos (x3)</div>
                            <div className="flex flex-col gap-2">
                              {(matchesByPhase["octavos"] || []).map(m => (
                                <BracketCard key={m.id} m={m} onClick={() => navigateTo("pronosticos", "octavos")} />
                              ))}
                            </div>
                          </div>

                          <div className="w-40 flex-shrink-0">
                            <div className="text-[10px] font-black uppercase text-slate-500 text-center border-b border-slate-800 pb-1 mb-2">Cuartos (x4)</div>
                            <div className="flex flex-col gap-6">
                              {(matchesByPhase["cuartos"] || []).map(m => (
                                <BracketCard key={m.id} m={m} onClick={() => navigateTo("pronosticos", "cuartos")} />
                              ))}
                            </div>
                          </div>

                          <div className="w-40 flex-shrink-0">
                            <div className="text-[10px] font-black uppercase text-slate-500 text-center border-b border-slate-800 pb-1 mb-2">Semifinales (x5)</div>
                            <div className="flex flex-col gap-20">
                              {(matchesByPhase["semifinales"] || []).map(m => (
                                <BracketCard key={m.id} m={m} onClick={() => navigateTo("pronosticos", "semifinales")} />
                              ))}
                            </div>
                          </div>

                          <div className="w-40 flex-shrink-0">
                            <div className="text-[10px] font-black uppercase text-slate-500 text-center border-b border-slate-800 pb-1 mb-2">Finales (x6)</div>
                            <div className="flex flex-col gap-4">
                              {(matchesByPhase["final"] || []).map(m => (
                                <div key={m.id} onClick={() => navigateTo("pronosticos", "final")}
                                  className="gaming-card p-2 rounded-xl border border-amber-800/40 hover:border-amber-500/50 cursor-pointer space-y-1">
                                  <div className="text-[9px] text-amber-400 font-black uppercase">{m.id === "f2" ? "🏆 Gran Final" : "🥉 3º Puesto"}</div>
                                  <div className={`flex justify-between font-bold text-[10px] ${m.qualifier === "teamA" ? "text-emerald-400" : ""}`}>
                                    <span className="truncate w-16">{m.flagA} {m.teamA}</span>
                                    {m.qualifier === "teamA" ? <span className="text-[8px]">✓</span> : <span className="text-slate-400">-</span>}
                                  </div>
                                  <div className={`flex justify-between font-bold text-[10px] ${m.qualifier === "teamB" ? "text-emerald-400" : ""}`}>
                                    <span className="truncate w-16">{m.flagB} {m.teamB}</span>
                                    {m.qualifier === "teamB" ? <span className="text-[8px]">✓</span> : <span className="text-slate-400">-</span>}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                        </div>
                      </div>
                    </div>
                  </div>

                ) : (
                  /* Phase editor */
                  <div className="space-y-6">

                    {/* Lock banner */}
                    {isLocked && (
                      <div className="flex items-center gap-3 bg-red-950/30 border border-red-700/40 rounded-2xl px-5 py-3">
                        <span className="text-lg flex-shrink-0">🔒</span>
                        <div>
                          <p className="text-sm font-black text-red-400 uppercase tracking-wider">El tiempo de juego ha comenzado</p>
                          <p className="text-xs text-slate-400 mt-0.5">Los pronósticos están cerrados desde el {KICKOFF_DEADLINE.toLocaleString("es-ES")}.</p>
                        </div>
                      </div>
                    )}

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#111625]/40 border border-slate-800 p-4 rounded-2xl">
                      <div>
                        <button onClick={() => setActivePhase(null)} className="text-xs font-bold text-emerald-400 flex items-center gap-1 uppercase mb-1">
                          <ArrowLeft className="h-4 w-4" /> Volver
                        </button>
                        <h3 className="text-xl font-black uppercase text-white italic">
                          {activePhase === "grupos"
                            ? `Fase de Grupos — Grupo ${activeGroupTab}`
                            : phasesList.find(p => p.id === activePhase)?.name}
                        </h3>
                      </div>

                      {/* Save button — hidden when tournament is locked */}
                      {!isLocked && (
                        <button
                          onClick={handleSave}
                          disabled={isSaving}
                          className="rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 px-5 py-2.5 text-xs font-black text-white uppercase tracking-wider self-start sm:self-auto disabled:opacity-60 flex items-center gap-2 transition-opacity"
                        >
                          {isSaving
                            ? <><Loader2 className="h-3 w-3 animate-spin" /> Guardando...</>
                            : <><Check className="h-3 w-3" /> Guardar</>
                          }
                        </button>
                      )}
                    </div>

                    {/* Group sub-tabs A–L */}
                    {activePhase === "grupos" && (
                      <div className="flex flex-wrap gap-1.5 bg-[#0c101d] p-2 rounded-xl border border-slate-800">
                        {GROUP_LETTERS.map(g => (
                          <button key={g} onClick={() => setActiveGroupTab(g)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${activeGroupTab === g
                              ? "bg-slate-800 text-emerald-400 border border-slate-700"
                              : "text-slate-400 hover:text-white"}`}>
                            {g}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Match grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {(matchesByPhase[activePhase] || [])
                        .filter(m => activePhase !== "grupos" || m.group === activeGroupTab)
                        .map(match => (
                          <MatchCard
                            key={match.id}
                            match={match}
                            isKnockout={activePhase !== "grupos"}
                            isLocked={isLocked}
                            hasError={validationErrors.includes(match.id)}
                            usedTeams={getUsedTeams(activePhase)}
                            availableTeams={AVAILABLE_TEAMS}
                            onTeamChange={handleTeamChange}
                            onGoalChange={handleGoalChange}
                            onQualifierSelect={handleQualifier}
                          />
                        ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* ── CLASIFICACIÓN ──────────────────────────────────────────────── */}
            {activeTab === "clasificacion" && (
              <div className="gaming-card rounded-2xl border border-slate-800 overflow-hidden">
                <div className="px-5 py-3 border-b border-slate-800 bg-[#0c101d]/60">
                  <h3 className="text-sm font-black uppercase italic tracking-wider text-white">Clasificación Global</h3>
                  <p className="text-[10px] text-slate-500 mt-0.5">{leaderboard.length} participante{leaderboard.length !== 1 ? "s" : ""}</p>
                </div>

                {leaderboard.length === 0 ? (
                  <div className="p-10 text-center text-slate-500 text-sm">
                    Aún no hay datos. Guarda pronósticos para aparecer en la clasificación.
                  </div>
                ) : (
                  <>
                    {/* Header */}
                    <div className="grid grid-cols-[2rem_1fr_auto] gap-x-4 px-5 py-2 border-b border-slate-800/50 text-[9px] font-black uppercase text-slate-600 tracking-widest">
                      <span>#</span>
                      <span>Jugador</span>
                      <span className="text-right">Puntos</span>
                    </div>

                    {/* Rows */}
                    <div className="divide-y divide-slate-800/40">
                      {leaderboard.map((row, idx) => {
                        const isMe = row.user_id === authUser?.id || row.email === authUser?.email;
                        const email: string = row.email ?? row.user_email ?? `Usuario·${String(row.user_id ?? "").slice(-4)}`;
                        const pts: number = row.points ?? row.total_points ?? 0;
                        return (
                          <div key={row.user_id ?? idx}
                            className={`grid grid-cols-[2rem_1fr_auto] gap-x-4 items-center px-5 py-3.5 transition-colors ${isMe
                              ? "bg-emerald-950/25 border-l-2 border-l-emerald-500"
                              : "hover:bg-[#0c101d]/30"}`}>

                            {/* Rank */}
                            <span className={`text-sm font-black ${idx === 0 ? "text-amber-400" : idx === 1 ? "text-slate-300" : idx === 2 ? "text-amber-600" : "text-slate-600"}`}>
                              {idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : idx + 1}
                            </span>

                            {/* Email */}
                            <div className="min-w-0">
                              <span className={`text-sm font-black truncate block ${isMe ? "text-emerald-400" : "text-slate-200"}`}>
                                {email}
                                {isMe && <span className="ml-2 text-[8px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded uppercase tracking-wider align-middle">Tú</span>}
                              </span>
                            </div>

                            {/* Points */}
                            <div className="text-right">
                              <span className={`text-base font-black ${idx === 0 ? "text-amber-400" : isMe ? "text-emerald-400" : "text-slate-200"}`}>
                                {pts}
                              </span>
                              <span className="text-[9px] text-slate-600 uppercase ml-1">pts</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* ── ADMIN ──────────────────────────────────────────────────────── */}
            {activeTab === "admin" && isAdmin && (
              <div className="space-y-6">

                {/* Admin header + save button */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-amber-950/20 border border-amber-700/40 rounded-2xl p-5">
                  <div>
                    <h2 className="text-lg font-black text-amber-400 uppercase italic tracking-wider flex items-center gap-2">
                      ⚙ Panel de Administración
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Introduce los resultados oficiales. Este panel nunca se bloquea.
                    </p>
                  </div>
                  <button
                    onClick={handleAdminSave}
                    disabled={isAdminSaving}
                    className="rounded-xl bg-gradient-to-r from-amber-600 to-orange-500 px-5 py-2.5 text-xs font-black text-white uppercase tracking-wider disabled:opacity-60 flex items-center gap-2 self-start sm:self-auto"
                  >
                    {isAdminSaving
                      ? <><Loader2 className="h-3 w-3 animate-spin" /> Guardando...</>
                      : <><Check className="h-3 w-3" /> Guardar Resultados Oficiales</>
                    }
                  </button>
                </div>

                {/* Phase tabs */}
                <div className="flex flex-wrap gap-2">
                  {phasesList.map(p => (
                    <button key={p.id} onClick={() => setActiveAdminPhase(p.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all border ${activeAdminPhase === p.id
                        ? "bg-amber-600 border-amber-500 text-white"
                        : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white"}`}>
                      {p.name} <span className="opacity-60 ml-1">{p.weight}</span>
                    </button>
                  ))}
                </div>

                {/* Group sub-tabs (only for grupos phase) */}
                {activeAdminPhase === "grupos" && (
                  <div className="flex flex-wrap gap-1.5 bg-[#0c101d] p-2 rounded-xl border border-slate-800">
                    {GROUP_LETTERS.map(g => (
                      <button key={g} onClick={() => setActiveAdminGroup(g)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${activeAdminGroup === g
                          ? "bg-slate-800 text-amber-400 border border-slate-700"
                          : "text-slate-400 hover:text-white"}`}>
                        {g}
                      </button>
                    ))}
                  </div>
                )}

                {/* Match result cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(matchesByPhase[activeAdminPhase] || [])
                    .filter(m => activeAdminPhase !== "grupos" || m.group === activeAdminGroup)
                    .map(m => {
                      const res = m.dbId ? adminResults[m.dbId] : undefined;
                      const isKnockout = activeAdminPhase !== "grupos";
                      return (
                        <div key={m.id} className="gaming-card p-4 rounded-2xl border border-slate-700/60 flex flex-col gap-3">
                          {/* Card header */}
                          <div className="flex justify-between text-[10px] font-black text-slate-500 border-b border-slate-800 pb-2">
                            <span>{m.dbId ?? m.id}</span>
                            <span className="truncate ml-2">{m.stadium} — {m.city}</span>
                          </div>

                          {isKnockout ? (
                            /* ── Eliminatorias: selector visual de ganador ── */
                            <>
                              <p className="text-[10px] font-black uppercase text-slate-500 text-center tracking-wider">
                                ¿Quién ganó el partido oficial?
                              </p>
                              <div className="flex items-stretch gap-3">
                                <button
                                  onClick={() => m.dbId && handleAdminWinner(m.dbId, "teamA")}
                                  className={`flex-1 flex flex-col items-center justify-center gap-2 py-4 px-2 rounded-xl border-2 transition-all ${
                                    res?.qualifier === "teamA"
                                      ? "border-amber-500 bg-amber-950/30"
                                      : "border-slate-700 bg-[#080c14]/50 hover:border-amber-700/50"
                                  }`}
                                >
                                  <span className="text-3xl leading-none">{m.flagA}</span>
                                  <span className={`text-[11px] font-black text-center leading-tight ${res?.qualifier === "teamA" ? "text-amber-300" : "text-slate-300"}`}>
                                    {m.teamA}
                                  </span>
                                  {res?.qualifier === "teamA" && (
                                    <span className="text-[9px] font-black text-amber-400 uppercase tracking-wide">✓ Ganó</span>
                                  )}
                                </button>

                                <div className="flex items-center justify-center flex-shrink-0">
                                  <span className="text-xs font-black text-slate-600 italic">VS</span>
                                </div>

                                <button
                                  onClick={() => m.dbId && handleAdminWinner(m.dbId, "teamB")}
                                  className={`flex-1 flex flex-col items-center justify-center gap-2 py-4 px-2 rounded-xl border-2 transition-all ${
                                    res?.qualifier === "teamB"
                                      ? "border-amber-500 bg-amber-950/30"
                                      : "border-slate-700 bg-[#080c14]/50 hover:border-amber-700/50"
                                  }`}
                                >
                                  <span className="text-3xl leading-none">{m.flagB}</span>
                                  <span className={`text-[11px] font-black text-center leading-tight ${res?.qualifier === "teamB" ? "text-amber-300" : "text-slate-300"}`}>
                                    {m.teamB}
                                  </span>
                                  {res?.qualifier === "teamB" && (
                                    <span className="text-[9px] font-black text-amber-400 uppercase tracking-wide">✓ Ganó</span>
                                  )}
                                </button>
                              </div>
                            </>
                          ) : (
                            /* ── Fase de grupos: inputs de goles ── */
                            <div className="flex items-center gap-3">
                              <div className="flex-1 space-y-1.5">
                                <div className="text-sm font-black text-slate-200 truncate">
                                  {m.flagA} {m.teamA}
                                </div>
                                <input
                                  type="number"
                                  min="0"
                                  placeholder="—"
                                  value={res?.goalsA ?? ""}
                                  onChange={e => m.dbId && handleAdminGoalChange(m.dbId, "goalsA", e.target.value)}
                                  className="w-full h-9 rounded-lg bg-[#111625] border border-amber-800/40 text-center font-black text-base text-amber-300 focus:outline-none focus:border-amber-500"
                                />
                              </div>
                              <span className="text-sm font-black text-slate-600">-</span>
                              <div className="flex-1 space-y-1.5 text-right">
                                <div className="text-sm font-black text-slate-200 truncate text-right">
                                  {m.teamB} {m.flagB}
                                </div>
                                <input
                                  type="number"
                                  min="0"
                                  placeholder="—"
                                  value={res?.goalsB ?? ""}
                                  onChange={e => m.dbId && handleAdminGoalChange(m.dbId, "goalsB", e.target.value)}
                                  className="w-full h-9 rounded-lg bg-[#111625] border border-amber-800/40 text-center font-black text-base text-amber-300 focus:outline-none focus:border-amber-500"
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                </div>
              </div>
            )}

            {/* ── REGLAMENTO ─────────────────────────────────────────────────── */}
            {activeTab === "reglamento" && (
              <div className="gaming-card p-6 rounded-2xl border border-slate-800/80 space-y-4">
                <h3 className="text-lg font-black uppercase italic tracking-wider text-white border-b border-slate-800 pb-2">
                  Manual Oficial de Puntuaciones
                </h3>
                <div className="text-xs text-slate-300 space-y-3 leading-relaxed">
                  <p>Los coeficientes multiplicadores premian el riesgo conforme avanza el torneo.</p>
                  <p className="text-slate-400">Fórmula por partido: <b className="text-white">(Signo + Bonus Pleno) × Factor de Fase</b></p>
                  <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-3 text-[11px] space-y-1 text-slate-400">
                    <p>✅ <b className="text-white">Acierto de Signo</b> (ganador o empate correcto) → <b className="text-amber-400">1 pt base</b></p>
                    <p>🎯 <b className="text-white">Acierto de Pleno</b> (goles exactos) → <b className="text-emerald-400">+1 pt extra</b> acumulativo al signo</p>
                    <p>⚡ <b className="text-white">Máximo pre-factor</b> → <b className="text-white">2 pts</b> (1 signo + 1 pleno)</p>
                  </div>
                  <ul className="list-disc pl-5 space-y-1.5 text-slate-400">
                    <li><b className="text-slate-200">Fase de Grupos:</b> ×1 — Pleno: <b className="text-emerald-400">2 pts</b> | Signo: <b className="text-amber-400">1 pt</b></li>
                    <li><b className="text-slate-200">Dieciseisavos:</b> ×2 — Pleno: <b className="text-emerald-400">4 pts</b> | Signo: <b className="text-amber-400">2 pts</b></li>
                    <li><b className="text-slate-200">Octavos de Final:</b> ×3 — Pleno: <b className="text-emerald-400">6 pts</b> | Signo: <b className="text-amber-400">3 pts</b></li>
                    <li><b className="text-slate-200">Cuartos de Final:</b> ×4 — Pleno: <b className="text-emerald-400">8 pts</b> | Signo: <b className="text-amber-400">4 pts</b></li>
                    <li><b className="text-slate-200">Semifinales:</b> ×5 — Pleno: <b className="text-emerald-400">10 pts</b> | Signo: <b className="text-amber-400">5 pts</b></li>
                    <li><b className="text-slate-200">Final y 3er Puesto:</b> ×6 — Pleno: <b className="text-emerald-400">12 pts</b> | Signo: <b className="text-amber-400">6 pts</b></li>
                  </ul>
                  <p className="text-slate-500 text-[11px]">
                    En fases eliminatorias con empate técnico, debes indicar manualmente el equipo que avanza (penaltis).
                  </p>
                </div>
              </div>
            )}
          </>
        )}

      </main>

      <footer className="bg-[#080c14]/80 border-t border-slate-900 py-4 text-center text-[10px] text-slate-500">
        <p>© 2026 Porra Mundial — 104 Partidos · 12 Grupos · Un Campeón.</p>
      </footer>

      {/* Toast notification */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-black shadow-2xl border transition-all
          ${toast.type === "success"
            ? "bg-emerald-700 border-emerald-500 text-white"
            : "bg-red-800 border-red-600 text-white"
          }`}>
          {toast.type === "success"
            ? <Check className="h-4 w-4 flex-shrink-0" />
            : <span className="flex-shrink-0 text-base leading-none">✕</span>
          }
          {toast.message}
        </div>
      )}

    </div>
  );
}
