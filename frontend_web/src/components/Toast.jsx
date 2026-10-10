import { CheckCircle2, AlertCircle, AlertTriangle, Sparkles, X } from "lucide-react";
import { useToast } from "../context/useToast";

export { useToast };

export default function Toast({ id, message, type = "success", title, onClose }) {
  const configs = {
    success: {
      bg: "bg-white",
      border: "border-emerald-200",
      accent: "bg-emerald-500",
      text: "text-emerald-900",
      subText: "text-emerald-700/80",
      icon: CheckCircle2,
      iconColor: "text-emerald-500",
      defaultTitle: "Success",
    },
    error: {
      bg: "bg-white",
      border: "border-rose-200",
      accent: "bg-rose-500",
      text: "text-rose-900",
      subText: "text-rose-700/80",
      icon: AlertCircle,
      iconColor: "text-rose-500",
      defaultTitle: "Action Failed",
    },
    warning: {
      bg: "bg-white",
      border: "border-amber-200",
      accent: "bg-amber-500",
      text: "text-amber-900",
      subText: "text-amber-700/80",
      icon: AlertTriangle,
      iconColor: "text-amber-500",
      defaultTitle: "Attention Required",
    },
    info: {
      bg: "bg-white",
      border: "border-groomish-slate/15",
      accent: "bg-groomish-orange",
      text: "text-groomish-slate",
      subText: "text-groomish-slate/70",
      icon: Sparkles,
      iconColor: "text-groomish-orange",
      defaultTitle: "Notice",
    },
  };

  const cfg = configs[type] || configs.info;
  const Icon = cfg.icon;

  return (
    <div
      className={`pointer-events-auto relative overflow-hidden flex items-start gap-3 p-3.5 pr-4 rounded-2xl shadow-xl border ${cfg.bg} ${cfg.border} animate-slide-in backdrop-blur-md transition-all max-w-sm w-full select-none`}
      role="alert"
    >
      <div className={`p-1.5 rounded-xl ${cfg.accent}/10 shrink-0 mt-0.5`}>
        <Icon className={`w-4 h-4 ${cfg.iconColor}`} />
      </div>

      <div className="flex-1 min-w-0 pr-2">
        <h4 className={`text-xs font-bold leading-tight ${cfg.text}`}>
          {title || cfg.defaultTitle}
        </h4>
        <p className={`text-[11px] font-medium leading-relaxed mt-0.5 ${cfg.subText}`}>
          {message}
        </p>
      </div>

      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded-lg text-groomish-slate/40 hover:text-groomish-slate hover:bg-groomish-cream transition shrink-0"
          aria-label="Close notification"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}

      {/* Subtle indicator bar */}
      <div className={`absolute bottom-0 left-0 right-0 h-0.5 ${cfg.accent}`} />
    </div>
  );
}
