import React, { useState, useEffect } from "react";
import { Server, Zap, RefreshCw, Terminal, Sparkles, Activity, Clock, ShieldCheck } from "lucide-react";

export default function BranchWakeUpShowcase({ onRetry }) {
  const [elapsed, setElapsed] = useState(0);
  const [logs, setLogs] = useState([
    { time: "00:01", text: "📡 Dispatching wake-up request to Render cloud server...", type: "info" },
  ]);

  useEffect(() => {
    const timer = setInterval(() => {
      setElapsed((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (elapsed === 4) {
      setLogs((prev) => [
        ...prev,
        { time: "00:04", text: "💤 Server sleep detected (Render Free Tier 15-min idle rule).", type: "warn" },
        { time: "00:06", text: "⚡ Render orchestrator spinning up cloud container...", type: "info" },
      ]);
    } else if (elapsed === 14) {
      setLogs((prev) => [
        ...prev,
        { time: "00:14", text: "☕ Initializing Spring Boot 3.5 & PostgreSQL connection pool...", type: "info" },
      ]);
    } else if (elapsed === 26) {
      setLogs((prev) => [
        ...prev,
        { time: "00:26", text: "🔐 Loading security context, Gmail API & Cloudinary storage...", type: "info" },
      ]);
    } else if (elapsed === 36) {
      setLogs((prev) => [
        ...prev,
        { time: "00:36", text: "🏪 Querying salon branches, tariff cards & service catalogues...", type: "info" },
      ]);
    } else if (elapsed === 46) {
      setLogs((prev) => [
        ...prev,
        { time: "00:46", text: "✨ Finalizing HTTP response handshake. Almost ready...", type: "info" },
      ]);
    }
  }, [elapsed]);

  // Compute smooth progress percentage
  const progressPercent = Math.min(
    95,
    Math.round(
      elapsed <= 10
        ? (elapsed / 10) * 35
        : elapsed <= 30
        ? 35 + ((elapsed - 10) / 20) * 35
        : 70 + ((elapsed - 30) / 30) * 25
    )
  );

  return (
    <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-card border border-groomish-slate/10 space-y-4 relative w-full max-w-full min-w-0 overflow-hidden">
      {/* Top Status Header */}
      <div className="flex items-center justify-between gap-2 border-b border-groomish-slate/10 pb-3">
        <div className="flex items-center gap-2">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
          </span>
          <span className="text-xs font-bold uppercase tracking-wider text-groomish-slate">
            Connecting to Cloud Backend
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-xs font-mono text-groomish-slateLight bg-groomish-cream px-2.5 py-1 rounded-full border border-groomish-slate/10">
          <Clock className="w-3 h-3 text-groomish-orange animate-spin" />
          <span>{elapsed}s elapsed</span>
        </div>
      </div>

      {/* Luxury Radar / Buffer Animation */}
      <div className="relative py-4 flex flex-col items-center justify-center text-center">
        {/* Pulsing Backlight Rings */}
        <div className="relative w-24 h-24 sm:w-28 sm:h-28 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-groomish-orange/20 via-groomish-gold/30 to-groomish-coral/20 animate-ping opacity-60" />
          <div className="absolute -inset-2 rounded-full border-2 border-dashed border-groomish-orange/40 animate-[spin_8s_linear_infinite]" />
          <div className="absolute -inset-4 rounded-full border border-groomish-gold/30 animate-[spin_12s_linear_infinite_reverse]" />

          {/* Central Hex / Badge */}
          <div className="relative z-10 w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-groomish-slate to-[#1f242e] shadow-xl flex items-center justify-center border border-groomish-orange/40 text-white">
            <Server className="w-8 h-8 sm:w-9 sm:h-9 text-groomish-gold animate-pulse" />
          </div>
        </div>

        {/* Title & Microcopy */}
        <h4 className="mt-4 font-heading font-extrabold text-base sm:text-lg text-groomish-slate">
          Waking Up Salon Backend
        </h4>
        <p className="text-xs sm:text-sm text-groomish-slateLight max-w-sm mx-auto mt-1 leading-relaxed">
          Render's free tier sleeps during inactivity. Waking up instance and fetching salon branch details...
        </p>

        {/* Dynamic Progress Bar */}
        <div className="w-full max-w-xs sm:max-w-sm mt-3.5 space-y-1.5">
          <div className="flex justify-between text-[11px] font-mono text-groomish-slateLight">
            <span className="flex items-center gap-1">
              <Activity className="w-3 h-3 text-groomish-orange animate-pulse" />
              Instance Booting...
            </span>
            <span className="font-bold text-groomish-slate">{progressPercent}%</span>
          </div>
          <div className="h-2 w-full bg-groomish-cream rounded-full overflow-hidden border border-groomish-slate/10 p-0.5">
            <div
              className="h-full bg-gradient-to-r from-groomish-orange via-groomish-gold to-groomish-coral rounded-full transition-all duration-700 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Live Server Boot Log Terminal */}
      <div className="rounded-xl bg-[#0f1117] border border-white/10 p-3 sm:p-3.5 font-mono text-[11px] shadow-inner space-y-2">
        {/* Terminal Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-2 text-[10px] text-white/50">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500/80 inline-block" />
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/80 inline-block" />
            <span className="w-2.5 h-2.5 rounded-full bg-green-500/80 inline-block" />
            <span className="ml-1 text-white/70 font-semibold flex items-center gap-1">
              <Terminal className="w-3 h-3 text-groomish-gold" />
              render-boot-telemetry.log
            </span>
          </div>
          <span className="text-[9px] uppercase tracking-wider text-emerald-400 font-bold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping inline-block" />
            Live Polling
          </span>
        </div>

        {/* Terminal Log Lines */}
        <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1 text-left scrollbar-thin">
          {logs.map((log, idx) => (
            <div key={idx} className="flex items-start gap-2 leading-relaxed">
              <span className="text-white/40 shrink-0">[{log.time}]</span>
              <span
                className={`${
                  log.type === "warn"
                    ? "text-amber-300"
                    : log.type === "success"
                    ? "text-emerald-400 font-bold"
                    : "text-white/80"
                }`}
              >
                {log.text}
              </span>
            </div>
          ))}
          <div className="flex items-center gap-1 text-groomish-gold/80 text-[10px]">
            <span>&gt; Standby for HTTP 200 response</span>
            <span className="animate-pulse">_</span>
          </div>
        </div>
      </div>

      {/* Helpful Hint & Manual Retry */}
      <div className="flex items-center justify-between text-[11px] text-groomish-slateLight pt-1">
        <span className="flex items-center gap-1 text-[10px] sm:text-[11px]">
          <Sparkles className="w-3 h-3 text-groomish-gold shrink-0" />
          Typical wake up: 30–50s on free tier
        </span>
        {onRetry && (
          <button
            onClick={onRetry}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-groomish-cream hover:bg-groomish-orange/10 text-groomish-slate hover:text-groomish-orange font-semibold text-[10px] transition border border-groomish-slate/10 cursor-pointer"
          >
            <RefreshCw className="w-3 h-3" />
            Retry Ping
          </button>
        )}
      </div>
    </div>
  );
}
