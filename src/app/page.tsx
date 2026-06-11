"use client";

import React, { useState, useEffect } from "react";
import { Trophy, Mail, ArrowRight, ShieldCheck, Sparkles, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";

/** Plazo inscripción: 13 jun 2026 21:00h Madrid = 19:00h UTC */
const KICKOFF_DEADLINE = new Date("2026-06-13T19:00:00Z");

interface TimeLeft {
  days: number; hours: number; minutes: number; seconds: number; expired: boolean;
}

function getTimeLeft(): TimeLeft {
  const diff = KICKOFF_DEADLINE.getTime() - Date.now();
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true };
  return {
    days:    Math.floor(diff / 86_400_000),
    hours:   Math.floor((diff % 86_400_000) / 3_600_000),
    minutes: Math.floor((diff % 3_600_000) / 60_000),
    seconds: Math.floor((diff % 60_000) / 1_000),
    expired: false,
  };
}

export default function WelcomePage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(getTimeLeft);

  useEffect(() => {
    if (timeLeft.expired) return;
    const id = setInterval(() => {
      const next = getTimeLeft();
      setTimeLeft(next);
      if (next.expired) clearInterval(id);
    }, 1000);
    return () => clearInterval(id);
  }, [timeLeft.expired]);

  // Redirigir al dashboard si ya hay una sesión activa
  useEffect(() => {
    const checkActiveSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        window.location.href = "/dashboard";
      }
    };
    checkActiveSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        window.location.href = "/dashboard";
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsLoading(true);
    setErrorMsg(null);
    setIsSuccess(false);

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: window.location.origin + "/dashboard",
        },
      });

      if (error) {
        setErrorMsg(error.message);
      } else {
        setIsSuccess(true);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Error al enviar el enlace de acceso.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="relative min-h-screen w-full flex flex-col items-center justify-center bg-[#080c14] overflow-hidden px-4 py-12 sm:px-6 lg:px-8 pitch-stripes">
      {/* Stadium lights bloom overlay */}
      <div className="absolute inset-0 w-full h-full pointer-events-none z-0">
        <div className="absolute top-0 left-0 w-full h-full stadium-light-left" />
        <div className="absolute top-0 left-0 w-full h-full stadium-light-right" />
        {/* Pitch center circle line simulation */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border border-slate-900/30 rounded-full pointer-events-none" />
      </div>

      <div className="relative w-full max-w-md space-y-8 z-10">
        {/* Header */}
        <div className="flex flex-col items-center text-center">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-950/80 px-4 py-1.5 text-xs font-bold text-emerald-400 border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.15)] mb-6 animate-pulse">
            <Trophy className="h-4 w-4 text-emerald-400" />
            Mundial 2026
          </div>
          <h1 className="text-4xl font-black tracking-tight text-white sm:text-5xl uppercase italic drop-shadow-md">
            PORRA <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">MUNDIAL 2026</span>
          </h1>
          <p className="mt-3 text-sm text-slate-400 max-w-xs sm:max-w-sm">
            Entra en el terreno de juego, predice los resultados y lidera la clasificación.
          </p>
        </div>

        {/* ── COUNTDOWN ─────────────────────────────────────────────────────── */}
        {timeLeft.expired ? (
          <div className="flex items-center justify-center gap-4 rounded-2xl px-6 py-5 border border-red-700/50 bg-red-950/30 shadow-[0_0_30px_rgba(239,68,68,0.15)]">
            <span className="text-3xl">🔒</span>
            <div>
              <p className="text-base font-black text-red-400 uppercase tracking-wider">¡Plazo cerrado!</p>
              <p className="text-xs text-slate-400 mt-0.5">El torneo está en juego. Los pronósticos están bloqueados.</p>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-emerald-700/40 bg-emerald-950/20 shadow-[0_0_35px_rgba(16,185,129,0.12)] overflow-hidden">
            <div className="px-4 pt-4 pb-2 text-center">
              <p className="text-[10px] font-black uppercase tracking-widest text-emerald-500">
                ⏱ ¡Date prisa! Tiempo restante para guardar pronósticos
              </p>
            </div>
            <div className="grid grid-cols-4 gap-2 px-4 pb-4 text-center">
              {([
                { value: timeLeft.days,    label: "Días"  },
                { value: timeLeft.hours,   label: "Horas" },
                { value: timeLeft.minutes, label: "Min"   },
                { value: timeLeft.seconds, label: "Seg"   },
              ] as const).map(({ value, label }) => (
                <div key={label} className="bg-[#060e12] border border-emerald-800/40 rounded-xl py-3 px-1 shadow-inner">
                  <div className="text-4xl font-black text-emerald-400 tabular-nums leading-none drop-shadow-[0_0_8px_rgba(16,185,129,0.6)]">
                    {String(value).padStart(2, "0")}
                  </div>
                  <div className="text-[9px] font-black uppercase tracking-widest text-emerald-700 mt-1.5">
                    {label}
                  </div>
                </div>
              ))}
            </div>
            <div className="bg-emerald-950/40 border-t border-emerald-800/30 px-4 py-2 text-center">
              <p className="text-[10px] text-emerald-600 font-black uppercase tracking-wider">
                Cierre automático: 13 jun 2026 · 21:00h España
              </p>
            </div>
          </div>
        )}

        {/* Gaming style card containing login form or success message */}
        <div className="gaming-card rounded-2xl p-8 space-y-6 shadow-[0_0_50px_rgba(0,0,0,0.6)] border border-slate-800/80">
          {isSuccess ? (
            <div className="text-center space-y-5 py-4">
              <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-emerald-950/60 border border-emerald-500/40 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.2)] animate-bounce">
                <Mail className="h-8 w-8" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-black text-white uppercase tracking-wide italic">¡Enlace Enviado!</h2>
                <p className="text-xs text-emerald-400 font-bold tracking-wider uppercase">
                  Acceso al vestuario preparado
                </p>
                <p className="text-xs text-slate-400 leading-relaxed max-w-sm mx-auto">
                  Hemos enviado un correo a <span className="text-white font-bold">{email}</span> con tu enlace mágico de inicio de sesión.
                </p>
              </div>

              <div className="p-3 bg-[#0a111a] rounded-xl border border-slate-800/60 text-[10px] text-slate-500 leading-normal">
                Si no lo recibes en unos minutos, revisa tu carpeta de correo no deseado (spam) o pulsa abajo para volver a intentarlo.
              </div>

              <button
                type="button"
                onClick={() => {
                  setIsSuccess(false);
                  setErrorMsg(null);
                }}
                className="text-xs font-black uppercase tracking-wider text-emerald-400 hover:text-emerald-300 transition-colors"
              >
                ← Volver a intentar
              </button>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <h2 className="text-xl font-black text-white uppercase tracking-wide">Acceso al Vestuario</h2>
                <p className="text-xs text-slate-400">
                  Introduce tu correo para recibir un enlace de inicio de sesión directo (Magic Link).
                </p>
              </div>

              <form className="space-y-4" onSubmit={handleSubmit}>
                <div>
                  <label htmlFor="email" className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                    Correo Electrónico de la Empresa
                  </label>
                  <div className="relative rounded-xl shadow-sm">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <Mail className="h-4.5 w-4.5 text-slate-500" aria-hidden="true" />
                    </div>
                    <input
                      type="email"
                      name="email"
                      id="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="block w-full rounded-xl bg-[#080c14] border border-slate-800/80 py-4 pl-11 pr-4 text-sm text-white placeholder-slate-650 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 focus:outline-none transition-colors shadow-inner"
                      placeholder="tu.nombre@empresa.com"
                      required
                      disabled={isLoading}
                    />
                  </div>
                </div>

                {errorMsg && (
                  <div className="flex items-center gap-2 p-3 bg-red-950/40 border border-red-500/30 rounded-xl text-xs text-red-400 animate-pulse">
                    <AlertCircle className="h-4.5 w-4.5 shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="group relative flex w-full justify-center items-center gap-2 rounded-xl bg-emerald-600 px-4 py-4 text-sm font-black text-white hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 transition-all duration-200 uppercase tracking-wider hover:scale-[1.02] active:scale-[0.98] disabled:opacity-75 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)]"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4.5 w-4.5 animate-spin" />
                      <span>Preparando dorsal...</span>
                    </>
                  ) : (
                    <>
                      <span>Recibir enlace mágico</span>
                      <ArrowRight className="h-4.5 w-4.5 transition-transform duration-200 group-hover:translate-x-1" />
                    </>
                  )}
                </button>
              </form>
            </>
          )}
        </div>

        {/* Quick guide */}
        <div className="gaming-card rounded-2xl p-5 border border-slate-800/80 space-y-3">
          <p className="text-xs font-black uppercase tracking-widest text-emerald-400">📝 ¿Cómo participar?</p>
          <ol className="space-y-2.5">
            {[
              "Regístrate o inicia sesión con tu correo electrónico.",
              "Completa y guarda tus pronósticos en el Dashboard antes de que expire la cuenta atrás.",
              "En el panel, dentro de la sección Reglamento, encontrarás las instrucciones exactas para abonar la inscripción y confirmar tu plaza oficial.",
            ].map((step, i) => (
              <li key={i} className="flex gap-2.5 text-xs text-slate-400">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-black text-[9px]">
                  {i + 1}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </div>

        {/* Info widgets styled like Gamer Stats */}
        <div className="grid grid-cols-2 gap-4 text-center">
          <div className="gaming-card p-4 rounded-xl">
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Predicciones</div>
            <div className="mt-1.5 text-sm font-black text-emerald-400 uppercase italic">Fases Libres</div>
          </div>
          <div className="gaming-card p-4 rounded-xl">
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Formato 2026</div>
            <div className="mt-1.5 text-sm font-black text-white uppercase italic">48 Selecciones</div>
          </div>
        </div>

        {/* Trust/Security glowing badges */}
        <div className="flex flex-col items-center gap-2 text-center text-[11px] text-slate-500">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
            <span>Inscripción validada vía Bizum</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Sparkles className="h-4 w-4 text-amber-500" />
            <span>Encriptación e historial protegido</span>
          </div>
        </div>
      </div>
    </main>
  );
}

