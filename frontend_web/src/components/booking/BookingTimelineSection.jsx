import React from "react";
import {
  Clock,
  Calendar,
  User,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Scissors,
  ShoppingBag,
  CreditCard,
  Sparkles,
  RefreshCw,
  FileText,
  XCircle,
  PlusCircle,
  MinusCircle,
  HelpCircle,
} from "lucide-react";

/**
 * Renders a comprehensive, luxury audit timeline for a booking,
 * displaying who modified the booking, when, and what modification was done.
 *
 * @param {Array} timeline - Array of timeline events from backend
 */
export default function BookingTimelineSection({ timeline = [] }) {
  if (!timeline || timeline.length === 0) {
    return (
      <div className="bg-white rounded-3xl border border-groomish-slate/10 p-6 shadow-soft space-y-3">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-groomish-orange" />
          <h3 className="font-heading font-bold text-base text-groomish-slate">
            Booking Activity & Audit Timeline
          </h3>
        </div>
        <p className="text-xs text-groomish-slate/50 italic">
          No audit logs recorded for this appointment yet. Future actions will appear here automatically.
        </p>
      </div>
    );
  }

  // Format date & time
  const formatDateTime = (isoString) => {
    if (!isoString) return { date: "—", time: "—" };
    try {
      const d = new Date(isoString);
      return {
        date: d.toLocaleDateString("en-IN", {
          day: "numeric",
          month: "short",
          year: "numeric",
        }),
        time: d.toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        }),
      };
    } catch {
      return { date: String(isoString), time: "" };
    }
  };

  // Determine styling & icon based on action type
  const getActionConfig = (action, role) => {
    switch (action?.toUpperCase()) {
      case "CREATED":
        return {
          icon: <Sparkles className="w-4 h-4 text-emerald-600" />,
          nodeBg: "bg-emerald-50 border-emerald-300 text-emerald-700",
          badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-200",
          label: "CREATED",
        };
      case "RESCHEDULED":
        return {
          icon: <Calendar className="w-4 h-4 text-amber-600" />,
          nodeBg: "bg-amber-50 border-amber-300 text-amber-700",
          badgeColor: "bg-amber-100 text-amber-800 border-amber-200",
          label: "RESCHEDULED",
        };
      case "SERVICE_ADDED":
        return {
          icon: <Scissors className="w-4 h-4 text-groomish-orange" />,
          nodeBg: "bg-orange-50 border-orange-300 text-groomish-orange",
          badgeColor: "bg-orange-100 text-groomish-orangeDark border-orange-200",
          label: "SERVICE ADDED",
        };
      case "SERVICE_REMOVED":
        return {
          icon: <MinusCircle className="w-4 h-4 text-rose-600" />,
          nodeBg: "bg-rose-50 border-rose-300 text-rose-700",
          badgeColor: "bg-rose-100 text-rose-800 border-rose-200",
          label: "SERVICE REMOVED",
        };
      case "PRODUCT_ADDED":
        return {
          icon: <ShoppingBag className="w-4 h-4 text-blue-600" />,
          nodeBg: "bg-blue-50 border-blue-300 text-blue-700",
          badgeColor: "bg-blue-100 text-blue-800 border-blue-200",
          label: "PRODUCT ADDED",
        };
      case "PRODUCT_REMOVED":
        return {
          icon: <MinusCircle className="w-4 h-4 text-rose-600" />,
          nodeBg: "bg-rose-50 border-rose-300 text-rose-700",
          badgeColor: "bg-rose-100 text-rose-800 border-rose-200",
          label: "PRODUCT REMOVED",
        };
      case "PAYMENT_RECORDED":
        return {
          icon: <CreditCard className="w-4 h-4 text-emerald-600" />,
          nodeBg: "bg-emerald-50 border-emerald-300 text-emerald-700",
          badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-200",
          label: "PAYMENT VERIFIED",
        };
      case "COMPLETED":
        return {
          icon: <CheckCircle2 className="w-4 h-4 text-emerald-600" />,
          nodeBg: "bg-emerald-50 border-emerald-300 text-emerald-700",
          badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-200",
          label: "COMPLETED",
        };
      case "CANCELLED":
        return {
          icon: <XCircle className="w-4 h-4 text-rose-600" />,
          nodeBg: "bg-rose-50 border-rose-300 text-rose-700",
          badgeColor: "bg-rose-100 text-rose-800 border-rose-200",
          label: "CANCELLED",
        };
      case "STATUS_UPDATED":
      case "MODIFIED":
      default:
        return {
          icon: <RefreshCw className="w-4 h-4 text-purple-600" />,
          nodeBg: "bg-purple-50 border-purple-300 text-purple-700",
          badgeColor: "bg-purple-100 text-purple-800 border-purple-200",
          label: action?.replace("_", " ") || "MODIFIED",
        };
    }
  };

  const getRoleBadge = (role) => {
    switch (role?.toUpperCase()) {
      case "ADMIN":
        return {
          label: "Admin",
          className: "bg-purple-100 text-purple-800 border-purple-200",
          icon: <ShieldCheck className="w-3 h-3 inline mr-1" />,
        };
      case "STAFF":
        return {
          label: "Salon Staff",
          className: "bg-groomish-orangeLight text-groomish-orange border-groomish-orange/20",
          icon: <Scissors className="w-3 h-3 inline mr-1" />,
        };
      case "CUSTOMER":
        return {
          label: "Customer",
          className: "bg-blue-50 text-blue-700 border-blue-200",
          icon: <User className="w-3 h-3 inline mr-1" />,
        };
      case "SYSTEM":
      default:
        return {
          label: "System",
          className: "bg-slate-100 text-slate-700 border-slate-200",
          icon: <Clock className="w-3 h-3 inline mr-1" />,
        };
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-groomish-slate/10 p-6 shadow-soft space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-groomish-slate/10">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-groomish-orangeLight text-groomish-orange flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-heading font-bold text-base text-groomish-slate">
              Booking Activity & Audit Timeline
            </h3>
            <p className="text-xs text-groomish-slate/50">
              Track who modified the order, exact date & time, and modification details.
            </p>
          </div>
        </div>
        <span className="text-xs font-bold text-groomish-slate/70 bg-groomish-cream px-3 py-1 rounded-full border border-groomish-slate/10 self-start sm:self-auto">
          {timeline.length} Event{timeline.length > 1 ? "s" : ""} Recorded
        </span>
      </div>

      {/* Timeline Stream */}
      <div className="relative pl-6 sm:pl-8 space-y-6 before:absolute before:left-3 sm:before:left-4 before:top-3 before:bottom-3 before:w-0.5 before:bg-groomish-slate/15">
        {timeline.map((event, idx) => {
          const cfg = getActionConfig(event.action, event.performedByRole);
          const roleBadge = getRoleBadge(event.performedByRole);
          const { date, time } = formatDateTime(event.createdAt);

          return (
            <div key={event.id || idx} className="relative group">
              {/* Timeline Node Dot */}
              <div
                className={`absolute -left-6 sm:-left-8 top-1 w-6 h-6 sm:w-7 sm:h-7 rounded-full border-2 flex items-center justify-center shadow-xs bg-white ${cfg.nodeBg} transition-transform group-hover:scale-110`}
              >
                {cfg.icon}
              </div>

              {/* Event Card Content */}
              <div className="bg-groomish-cream/40 hover:bg-groomish-cream/70 transition rounded-2xl border border-groomish-slate/10 p-4 space-y-2.5 shadow-xs">
                {/* Top Row: Title, Action Badge, Role Badge & Timestamp */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-bold text-sm text-groomish-slate">
                      {event.title || "Booking Action"}
                    </h4>

                    <span
                      className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold tracking-wider border uppercase ${cfg.badgeColor}`}
                    >
                      {cfg.label}
                    </span>

                    <span
                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold border flex items-center ${roleBadge.className}`}
                    >
                      {roleBadge.icon}
                      <span>{roleBadge.label}</span>
                    </span>
                  </div>

                  {/* Date & Time display */}
                  <div className="text-[11px] text-groomish-slate/60 flex items-center gap-2 shrink-0 font-mono">
                    <span className="font-bold text-groomish-slate">{date}</span>
                    <span>•</span>
                    <span>{time}</span>
                  </div>
                </div>

                {/* Performed By Info */}
                <div className="text-xs text-groomish-slate/70 flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-groomish-slate flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-groomish-slate/40" />
                    <span>Actor:</span>
                    <strong className="text-groomish-slate font-bold">
                      {event.performedBy || "System"}
                    </strong>
                  </span>
                  {event.performedByEmail && (
                    <span className="text-groomish-slate/50 text-[11px]">
                      ({event.performedByEmail})
                    </span>
                  )}
                </div>

                {/* Modification Description / What modification was done */}
                {event.description && (
                  <div className="p-2.5 rounded-xl bg-white border border-groomish-slate/10 text-xs text-groomish-slate/80 leading-relaxed font-sans">
                    {event.description}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
