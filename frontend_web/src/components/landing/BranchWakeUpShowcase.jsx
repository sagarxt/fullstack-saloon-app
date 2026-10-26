import React, { useState, useEffect } from "react";
import { Server, RefreshCw, Terminal, Sparkles, Activity } from "lucide-react";
import { storeApi } from "../../api/store";

const SESSION_KEY = "groomish_wakeup_start_time";

const MILESTONE_LOGS = [
  { atSec: 1, text: "Dispatching initial health-probe handshake to cloud server...", type: "info" },
  { atSec: 6, text: "Server hibernation detected (Render Free Tier 15-minute idle rule).", type: "warn" },
  { atSec: 18, text: "Render orchestrator provisioning cloud container environment...", type: "info" },
  { atSec: 35, text: "Allocating memory pool and pulling container image layers...", type: "info" },
  { atSec: 55, text: "Initializing OpenJDK 21 64-Bit Server VM and environment variables...", type: "info" },
  { atSec: 80, text: "Booting Spring Boot 3.5.0 framework runtime and dependency graph...", type: "info" },
  { atSec: 110, text: "Establishing secure PostgreSQL cloud database connection pool (HikariCP)...", type: "info" },
  { atSec: 145, text: "Validating JPA entities, schema mappings, and Flyway database states...", type: "info" },
  { atSec: 180, text: "Initializing Spring Security context, JWT validator, and CORS filter chains...", type: "info" },
  { atSec: 215, text: "Connecting Cloudinary CDN storage and Gmail API notification dispatchers...", type: "info" },
  { atSec: 245, text: "Starting asynchronous task thread pool and booking scheduler cron jobs...", type: "info" },
  { atSec: 270, text: "Pre-compiling REST controllers, security interceptors, and Swagger docs...", type: "info" },
  { atSec: 290, text: "Querying salon branch locations, stylists, catalogs, and tariff matrices...", type: "info" },
  { atSec: 305, text: "Cloud container warm-up completed. Awaiting final HTTP 200 handshake...", type: "info" },
];

const formatLogTime = (totalSeconds) => {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
};

export default function BranchWakeUpShowcase({ onRetry }) {
  // Retrieve continuous elapsed timestamp across 30s page reloads
  const [elapsed, setElapsed] = useState(() => {
    try {
      const stored = parseInt(sessionStorage.getItem(SESSION_KEY) || "0", 10);
      if (stored > 0 && Date.now() - stored < 15 * 60 * 1000) {
        return Math.floor((Date.now() - stored) / 1000);
      }
      sessionStorage.setItem(SESSION_KEY, String(Date.now()));
      return 1;
    } catch {
      return 1;
    }
  });

  // Calculate logs based on elapsed time (no emojis)
  const [logs, setLogs] = useState(() => {
    return MILESTONE_LOGS.filter((m) => m.atSec <= elapsed).map((m) => ({
      time: formatLogTime(m.atSec),
      text: m.text,
      type: m.type,
    }));
  });

  // Update elapsed seconds each second
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsed((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Sync logs when milestone seconds are reached
  useEffect(() => {
    const activeMilestones = MILESTONE_LOGS.filter((m) => m.atSec <= elapsed);
    setLogs(
      activeMilestones.map((m) => ({
        time: formatLogTime(m.atSec),
        text: m.text,
        type: m.type,
      }))
    );
  }, [elapsed]);

  // Page auto-refresh every 30 seconds
  useEffect(() => {
    const refreshTimer = setTimeout(() => {
      window.location.reload();
    }, 30000);

    return () => clearTimeout(refreshTimer);
  }, []);

  // Background active probe every 5 seconds to detect live backend immediately
  useEffect(() => {
    let isMounted = true;
    let pollTimer = null;

    const probeBackend = async () => {
      try {
        const res = await storeApi.getPublicStores();
        const list = Array.isArray(res.data) ? res.data : [];
        if (list.length > 0 && isMounted) {
          // Backend is now online and returned salon branches!
          // Clear wakeup start time so fresh page load starts clean
          sessionStorage.removeItem(SESSION_KEY);
          window.location.reload();
        }
      } catch {
        // Backend still waking up
      }
    };

    const initialProbe = setTimeout(() => {
      probeBackend();
      pollTimer = setInterval(probeBackend, 5000);
    }, 1500);

    return () => {
      isMounted = false;
      clearTimeout(initialProbe);
      if (pollTimer) clearInterval(pollTimer);
    };
  }, []);

  // Compute smooth progress percentage across 5 minutes (300s)
  const progressPercent = Math.min(
    98,
    Math.max(
      6,
      Math.round(
        elapsed <= 30
          ? (elapsed / 30) * 18
          : elapsed <= 120
          ? 18 + ((elapsed - 30) / 90) * 32
          : elapsed <= 240
          ? 50 + ((elapsed - 120) / 120) * 32
          : 82 + ((elapsed - 240) / 60) * 14
      )
    )
  );

  return (
    <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-card border border-groomish-slate/10 space-y-4 relative w-full max-w-full min-w-0 overflow-hidden">
      {/* Top Status Header (top elapsed timing removed as requested) */}
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
        <div className="flex items-center gap-1.5 text-[11px] font-mono text-groomish-slateLight bg-groomish-cream px-2.5 py-1 rounded-full border border-groomish-slate/10">
          <RefreshCw className="w-3 h-3 text-groomish-orange animate-spin" />
          <span>Auto-refreshing (30s)</span>
        </div>
      </div>

      {/* Luxury Radar / Buffer Animation */}
      <div className="relative py-4 flex flex-col items-center justify-center text-center">
        {/* Pulsing Backlight Rings */}
        <div className="relative w-24 h-24 sm:w-28 sm:h-28 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-groomish-orange/20 via-groomish-gold/30 to-groomish-coral/20 animate-ping opacity-60" />
          <div className="absolute -inset-2 rounded-full border-2 border-dashed border-groomish-orange/40 animate-[spin_8s_linear_infinite]" />
          <div className="absolute -inset-4 rounded-full border border-groomish-gold/30 animate-[spin_12s_linear_infinite_reverse]" />

          {/* Central Badge */}
          <div className="relative z-10 w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-groomish-slate to-[#1f242e] shadow-xl flex items-center justify-center border border-groomish-orange/40 text-white">
            <Server className="w-8 h-8 sm:w-9 sm:h-9 text-groomish-gold animate-pulse" />
          </div>
        </div>

        {/* Title & Microcopy */}
        <h4 className="mt-4 font-heading font-extrabold text-base sm:text-lg text-groomish-slate">
          Waking Up Salon Backend
        </h4>
        <p className="text-xs sm:text-sm text-groomish-slateLight max-w-sm mx-auto mt-1 leading-relaxed">
          Render free tier hibernates during inactivity. Booting cloud container and initializing database...
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

      {/* Live Server Boot Log Terminal (No emojis) */}
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
        <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1 text-left scrollbar-thin">
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
          Cloud boot takes up to 5 mins • Auto-refreshing every 30s
        </span>
        <button
          onClick={() => {
            if (onRetry) onRetry();
            window.location.reload();
          }}
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-groomish-cream hover:bg-groomish-orange/10 text-groomish-slate hover:text-groomish-orange font-semibold text-[10px] transition border border-groomish-slate/10 cursor-pointer"
        >
          <RefreshCw className="w-3 h-3" />
          Refresh Now
        </button>
      </div>
    </div>
  );
}
