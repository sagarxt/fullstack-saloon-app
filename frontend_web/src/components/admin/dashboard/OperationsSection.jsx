import React, { useState } from "react";
import {
  Clock,
  Building2,
  AlertTriangle,
  RefreshCw,
  TrendingUp,
  CreditCard,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Sparkles,
} from "lucide-react";

export default function OperationsSection({ operations }) {
  const [hoveredCell, setHoveredCell] = useState(null);

  if (!operations) return null;

  const heatmap = operations.heatmap || [];
  const peakDay = operations.peakDay || "Saturday";
  const peakHour = operations.peakHourLabel || "5:00 PM";
  const peakBookings = operations.peakHourBookings || 0;

  const slotUtil = operations.slotUtilization || [];
  const cancelRate = operations.cancellationRate || 0;
  const reschedRate = operations.rescheduleRate || 0;
  const reschedCount = operations.rescheduleCount || 0;
  const reasons = operations.cancellationReasons || [];

  const funnel = operations.paymentFunnel || {
    checkoutsStarted: 0,
    paidOnline: 0,
    payAtSalon: 0,
    pendingOrAwaiting: 0,
    failedOrCancelled: 0,
    checkoutToPaidConversionRate: 0,
    dropOffRate: 0,
  };

  const daysOfWeek = [
    { num: 1, name: "Mon" },
    { num: 2, name: "Tue" },
    { num: 3, name: "Wed" },
    { num: 4, name: "Thu" },
    { num: 5, name: "Fri" },
    { num: 6, name: "Sat" },
    { num: 7, name: "Sun" },
  ];

  const hoursList = [9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];

  // Helper to find count and intensity for a day & hour
  const getCellData = (dayNum, hr) => {
    const found = heatmap.find((c) => c.dayOfWeek === dayNum && c.hour === hr);
    return found || { count: 0, intensity: 0 };
  };

  const getHeatmapColor = (intensity) => {
    if (intensity === 0) return "bg-groomish-slate/5 text-transparent hover:bg-groomish-slate/10";
    if (intensity <= 0.25) return "bg-groomish-orange/20 text-groomish-slate hover:bg-groomish-orange/30";
    if (intensity <= 0.5) return "bg-groomish-orange/45 text-white hover:bg-groomish-orange/55 font-bold";
    if (intensity <= 0.75) return "bg-groomish-orange/75 text-white hover:bg-groomish-orange/85 font-bold";
    return "bg-groomish-orange text-white hover:bg-groomish-orangeDark font-extrabold shadow-sm";
  };

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-heading font-extrabold text-groomish-slate uppercase tracking-wider flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-groomish-blue" />
            Operations & Capacity Control
          </h2>
          <p className="text-xs text-groomish-slate/60">
            Peak hours heatmap for staffing, branch slot utilization, booking churn, and checkout funnel.
          </p>
        </div>

        {/* Peak Callout Badge */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-groomish-orangeLight text-groomish-orange text-xs font-bold border border-groomish-orange/20">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Peak Demand: {peakDay}s around {peakHour}</span>
          </div>
        </div>
      </div>

      {/* 1. PEAK HOURS HEATMAP (DAY OF WEEK × HOUR) */}
      <div className="bg-white rounded-3xl p-6 border border-groomish-slate/10 shadow-soft space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
          <div>
            <h3 className="font-heading font-bold text-sm text-groomish-slate flex items-center gap-2">
              <Clock className="w-4 h-4 text-groomish-orange" />
              Peak Hours Staffing & Slot Capacity Heatmap
            </h3>
            <p className="text-xs text-groomish-slate/50">
              Booking density across days of week and operating salon hours (09:00 - 20:00).
            </p>
          </div>

          {/* Intensity Legend */}
          <div className="flex items-center gap-1.5 text-[11px] text-groomish-slate/60">
            <span>Low</span>
            <span className="w-4 h-3 rounded bg-groomish-slate/10" />
            <span className="w-4 h-3 rounded bg-groomish-orange/20" />
            <span className="w-4 h-3 rounded bg-groomish-orange/45" />
            <span className="w-4 h-3 rounded bg-groomish-orange/75" />
            <span className="w-4 h-3 rounded bg-groomish-orange" />
            <span className="font-bold text-groomish-slate">High Demand</span>
          </div>
        </div>

        {/* Heatmap Grid Container */}
        <div className="overflow-x-auto pb-2">
          <div className="min-w-[620px]">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="w-16 p-2 text-left text-[11px] font-bold text-groomish-slate/50 uppercase">
                    Day
                  </th>
                  {hoursList.map((hr) => (
                    <th
                      key={hr}
                      className="p-2 text-center text-[10px] font-mono font-bold text-groomish-slate/60"
                    >
                      {hr < 12 ? `${hr}A` : hr === 12 ? "12P" : `${hr - 12}P`}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {daysOfWeek.map((d) => (
                  <tr key={d.num}>
                    <td className="p-2 text-xs font-bold text-groomish-slate">{d.name}</td>
                    {hoursList.map((hr) => {
                      const data = getCellData(d.num, hr);
                      return (
                        <td key={hr} className="p-1">
                          <div
                            onMouseEnter={() =>
                              setHoveredCell({
                                day: d.name,
                                hour: `${hr < 12 ? hr + ":00 AM" : hr === 12 ? "12:00 PM" : hr - 12 + ":00 PM"}`,
                                count: data.count,
                              })
                            }
                            onMouseLeave={() => setHoveredCell(null)}
                            className={`w-full h-8 rounded-xl flex items-center justify-center font-mono text-xs transition cursor-pointer ${getHeatmapColor(
                              data.intensity
                            )}`}
                          >
                            {data.count > 0 ? data.count : ""}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Heatmap Insights Bar */}
        <div className="pt-2 border-t border-groomish-slate/5 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-groomish-slate/70 gap-2">
          <div className="flex items-center gap-2">
            <span className="font-bold text-groomish-slate">Recommendation:</span>
            <span>Assign senior stylists and additional chair capacity on <strong>{peakDay} afternoons</strong>.</span>
          </div>
          {hoveredCell && (
            <div className="font-mono text-xs font-bold text-groomish-orange bg-groomish-orangeLight px-2.5 py-1 rounded-xl">
              {hoveredCell.day} at {hoveredCell.hour}: {hoveredCell.count} appointment{hoveredCell.count !== 1 ? "s" : ""}
            </div>
          )}
        </div>
      </div>

      {/* 2. BRANCH SLOT UTILIZATION & CANCELLATIONS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* SLOT UTILIZATION % PER BRANCH */}
        <div className="bg-white rounded-3xl p-6 border border-groomish-slate/10 shadow-soft space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-heading font-bold text-sm text-groomish-slate flex items-center gap-2">
                <Building2 className="w-4 h-4 text-groomish-blue" />
                Slot Utilization % by Branch
              </h3>
              <p className="text-xs text-groomish-slate/50">
                Booked chair hours vs total slot capacity per location.
              </p>
            </div>
          </div>

          {slotUtil.length === 0 ? (
            <div className="py-8 text-center text-xs text-groomish-slate/40">
              No branch slot records found.
            </div>
          ) : (
            <div className="space-y-4">
              {slotUtil.map((s, idx) => {
                const util = s.utilizationPercent || 0;
                let colorClass = "bg-groomish-green";
                let textClass = "text-groomish-green";
                let bgBadge = "bg-groomish-greenLight";
                if (util > 85) {
                  colorClass = "bg-groomish-crimson";
                  textClass = "text-groomish-crimson";
                  bgBadge = "bg-groomish-crimsonLight";
                } else if (util > 65) {
                  colorClass = "bg-groomish-orange";
                  textClass = "text-groomish-orange";
                  bgBadge = "bg-groomish-orangeLight";
                }

                return (
                  <div key={s.storeId || idx} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-groomish-slate">{s.storeName}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-groomish-slate/50 font-mono">
                          {s.totalSlotsBooked} / {s.estimatedCapacity} slots
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${bgBadge} ${textClass}`}>
                          {util}% Utilized
                        </span>
                      </div>
                    </div>
                    <div className="h-2.5 w-full bg-groomish-cream rounded-full overflow-hidden">
                      <div
                        style={{ width: `${Math.min(100, util)}%` }}
                        className={`h-full ${colorClass} rounded-full transition-all duration-500`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* CANCELLATION & RESCHEDULE RATES */}
        <div className="bg-white rounded-3xl p-6 border border-groomish-slate/10 shadow-soft space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-heading font-bold text-sm text-groomish-slate flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-groomish-crimson" />
                Cancellation & Reschedule Metrics
              </h3>
              <p className="text-xs text-groomish-slate/50">
                Churn rate and top client cancellation/reschedule drivers.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-groomish-crimsonLight/40 rounded-2xl p-4 border border-groomish-crimson/10">
              <span className="text-xs text-groomish-slate/70 font-semibold block">Cancellation Rate</span>
              <div className="text-2xl font-mono font-extrabold text-groomish-crimson mt-1">
                {cancelRate}%
              </div>
              <span className="text-[10px] text-groomish-slate/50 mt-1 block">
                Of total scheduled appointments
              </span>
            </div>

            <div className="bg-groomish-blueLight/50 rounded-2xl p-4 border border-groomish-blue/10">
              <span className="text-xs text-groomish-slate/70 font-semibold block">Reschedule Rate</span>
              <div className="text-2xl font-mono font-extrabold text-groomish-blue mt-1">
                {reschedRate}%
              </div>
              <span className="text-[10px] text-groomish-slate/50 mt-1 block">
                {reschedCount} appointments modified
              </span>
            </div>
          </div>

          {/* Cancellation Reasons Breakdown */}
          <div className="pt-2">
            <h4 className="text-xs font-bold text-groomish-slate mb-2">Captured Churn Reasons</h4>
            {reasons.length === 0 ? (
              <p className="text-xs text-groomish-slate/40">No cancellation reasons captured.</p>
            ) : (
              <div className="space-y-2">
                {reasons.map((r, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs">
                    <span className="text-groomish-slate/80 truncate max-w-[220px]" title={r.reason}>
                      {r.reason}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-groomish-slate/60 text-[11px]">{r.count}x</span>
                      <span className="font-bold text-groomish-slate font-mono text-xs">{r.percentage}%</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 3. PAYMENT FUNNEL (CHECKOUT STARTED → PAID → DROP-OFF) */}
      <div className="bg-white rounded-3xl p-6 border border-groomish-slate/10 shadow-soft space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="font-heading font-bold text-sm text-groomish-slate flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-groomish-coral" />
              Checkout & Payment Conversion Funnel
            </h3>
            <p className="text-xs text-groomish-slate/50">
              Customer flow from booking checkout initiation to verified salon receipt.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-groomish-slate/60">Conversion:</span>
            <span className="font-mono font-extrabold text-groomish-green bg-groomish-greenLight px-2.5 py-0.5 rounded-full">
              {funnel.checkoutToPaidConversionRate}% Paid
            </span>
            <span className="text-groomish-slate/60 ml-2">Drop-off:</span>
            <span className="font-mono font-extrabold text-groomish-crimson bg-groomish-crimsonLight px-2.5 py-0.5 rounded-full">
              {funnel.dropOffRate}% Drop
            </span>
          </div>
        </div>

        {/* Funnel Pipeline Steps */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 pt-2">
          {/* Step 1: Checkout Started */}
          <div className="bg-groomish-cream/60 rounded-2xl p-4 border border-groomish-slate/10 relative">
            <div className="text-[10px] uppercase font-bold text-groomish-slate/50 tracking-wider mb-1">
              Step 1: Initiation
            </div>
            <div className="text-xs font-bold text-groomish-slate">Checkouts Started</div>
            <div className="text-2xl font-mono font-extrabold text-groomish-slate mt-2">
              {funnel.checkoutsStarted}
            </div>
            <div className="text-[10px] text-groomish-slate/60 mt-1">100% of checkout intents</div>
          </div>

          {/* Step 2: Paid (Online + Salon) */}
          <div className="bg-groomish-greenLight/40 rounded-2xl p-4 border border-groomish-green/20 relative">
            <div className="text-[10px] uppercase font-bold text-groomish-green tracking-wider mb-1">
              Step 2: Realized
            </div>
            <div className="text-xs font-bold text-groomish-slate">Paid Bookings</div>
            <div className="text-2xl font-mono font-extrabold text-groomish-green mt-2">
              {(funnel.paidOnline + funnel.payAtSalon)}
            </div>
            <div className="text-[10px] text-groomish-slate/70 mt-1 flex items-center justify-between">
              <span>{funnel.paidOnline} Online</span>
              <span>{funnel.payAtSalon} Salon</span>
            </div>
          </div>

          {/* Step 3: Pending / Awaiting */}
          <div className="bg-groomish-goldLight/50 rounded-2xl p-4 border border-groomish-gold/30 relative">
            <div className="text-[10px] uppercase font-bold text-groomish-orangeDark tracking-wider mb-1">
              Step 3: Awaiting
            </div>
            <div className="text-xs font-bold text-groomish-slate">Pending Confirmation</div>
            <div className="text-2xl font-mono font-extrabold text-groomish-orangeDark mt-2">
              {funnel.pendingOrAwaiting}
            </div>
            <div className="text-[10px] text-groomish-slate/60 mt-1">Pay-online initiated</div>
          </div>

          {/* Step 4: Drop-off / Failed */}
          <div className="bg-groomish-crimsonLight/40 rounded-2xl p-4 border border-groomish-crimson/20 relative">
            <div className="text-[10px] uppercase font-bold text-groomish-crimson tracking-wider mb-1">
              Step 4: Churn
            </div>
            <div className="text-xs font-bold text-groomish-slate">Razorpay Drop / Failed</div>
            <div className="text-2xl font-mono font-extrabold text-groomish-crimson mt-2">
              {funnel.failedOrCancelled}
            </div>
            <div className="text-[10px] text-groomish-crimson font-semibold mt-1">
              {funnel.dropOffRate}% payment exit rate
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
