import { useState, useEffect, useMemo } from "react";
import { getStaffBranchAnalytics } from "../../api/staff";
import CustomDatePicker from "../common/CustomDatePicker";
import {
  TrendingUp,
  Calendar,
  DollarSign,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RefreshCw,
  Scissors,
  Package,
  CreditCard,
  Wallet,
  Smartphone,
  Gift,
  Building2,
  CalendarDays,
  Filter,
  ArrowUpRight,
  Sparkles,
  BarChart3,
  LineChart,
} from "lucide-react";

export default function StaffBranchAnalyticsTab({ storeName = "Assigned Branch" }) {
  const [period, setPeriod] = useState("WEEK"); // DAY, WEEK, MONTH, CUSTOM
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [chartType, setChartType] = useState("bar"); // "bar" | "line"
  const [hoveredDayIndex, setHoveredDayIndex] = useState(null);

  const fetchAnalytics = async (selectedPeriod = period, start = startDate, end = endDate) => {
    setLoading(true);
    setError(null);
    try {
      const res = await getStaffBranchAnalytics(
        selectedPeriod,
        selectedPeriod === "CUSTOM" || selectedPeriod === "DAY" ? (start || null) : null,
        selectedPeriod === "CUSTOM" ? (end || null) : null
      );
      setData(res.data);
    } catch (err) {
      console.error("Failed to load branch analytics", err);
      setError(err.response?.data?.message || "Failed to load branch analytics. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics(period, startDate, endDate);
  }, [period]);

  const handleCustomFilterSubmit = (e) => {
    e.preventDefault();
    if (!startDate || !endDate) {
      setError("Please select both start and end dates for custom filtering.");
      return;
    }
    fetchAnalytics("CUSTOM", startDate, endDate);
  };

  const handlePeriodChange = (newPeriod) => {
    setPeriod(newPeriod);
    if (newPeriod === "DAY") {
      const todayStr = new Date().toISOString().slice(0, 10);
      setStartDate(todayStr);
      setEndDate(todayStr);
    } else if (newPeriod === "WEEK" || newPeriod === "MONTH") {
      setStartDate("");
      setEndDate("");
    }
  };

  // Helper for Payment Method Icons & Names
  const getPaymentDetails = (method) => {
    const key = (method || "").toUpperCase();
    switch (key) {
      case "UPI":
        return {
          label: "UPI / QR Payment",
          icon: Smartphone,
          bg: "bg-blue-50 text-blue-600 border-blue-200",
          barColor: "bg-blue-500",
        };
      case "CARD":
        return {
          label: "Credit / Debit Card",
          icon: CreditCard,
          bg: "bg-purple-50 text-purple-600 border-purple-200",
          barColor: "bg-purple-500",
        };
      case "CASH":
        return {
          label: "Cash at Desk",
          icon: Wallet,
          bg: "bg-emerald-50 text-emerald-600 border-emerald-200",
          barColor: "bg-emerald-500",
        };
      case "VOUCHER":
        return {
          label: "Loyalty Voucher / Gift",
          icon: Gift,
          bg: "bg-amber-50 text-amber-600 border-amber-200",
          barColor: "bg-amber-500",
        };
      default:
        return {
          label: method || "Other Mode",
          icon: DollarSign,
          bg: "bg-gray-50 text-gray-600 border-gray-200",
          barColor: "bg-groomish-orange",
        };
    }
  };

  // Compute trend metrics, scales, and line chart paths
  const trendList = useMemo(() => {
    return data?.dailyTrends || [];
  }, [data]);

  const { maxDailyRevenue, maxDailyBookings } = useMemo(() => {
    if (!trendList || trendList.length === 0) {
      return { maxDailyRevenue: 1000, maxDailyBookings: 5 };
    }
    const maxRev = Math.max(...trendList.map((d) => d.revenue || 0), 0);
    const maxBook = Math.max(...trendList.map((d) => d.bookingsCount || 0), 0);
    return {
      maxDailyRevenue: maxRev > 0 ? maxRev : 1000,
      maxDailyBookings: maxBook > 0 ? maxBook : 5,
    };
  }, [trendList]);

  const activeDay = useMemo(() => {
    if (hoveredDayIndex !== null && trendList[hoveredDayIndex]) {
      return trendList[hoveredDayIndex];
    }
    return trendList.length > 0 ? trendList[trendList.length - 1] : null;
  }, [hoveredDayIndex, trendList]);

  // SVG dimensions for Line Chart
  const svgWidth = 800;
  const svgHeight = 220;
  const padLeft = 65;
  const padRight = 45;
  const padTop = 25;
  const padBottom = 35;
  const plotWidth = svgWidth - padLeft - padRight;
  const plotHeight = svgHeight - padTop - padBottom;

  const points = useMemo(() => {
    if (!trendList || trendList.length === 0) return [];
    const len = trendList.length;
    return trendList.map((d, i) => {
      const x = len === 1 ? padLeft + plotWidth / 2 : padLeft + (i / (len - 1)) * plotWidth;
      const revRatio = Math.min(1, Math.max(0, (d.revenue || 0) / maxDailyRevenue));
      const apptRatio = Math.min(1, Math.max(0, (d.bookingsCount || 0) / maxDailyBookings));
      const yRev = padTop + (1 - revRatio) * plotHeight;
      const yAppt = padTop + (1 - apptRatio) * plotHeight;
      return { ...d, x, yRev, yAppt, index: i };
    });
  }, [trendList, maxDailyRevenue, maxDailyBookings, plotWidth, plotHeight, padLeft, padTop]);

  const revenueLinePath = useMemo(() => {
    if (points.length === 0) return "";
    return points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.yRev.toFixed(1)}`).join(" ");
  }, [points]);

  const revenueAreaPath = useMemo(() => {
    if (points.length === 0) return "";
    const bottomY = padTop + plotHeight;
    const line = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.yRev.toFixed(1)}`).join(" ");
    const lastX = points[points.length - 1].x;
    const firstX = points[0].x;
    return `${line} L ${lastX.toFixed(1)} ${bottomY} L ${firstX.toFixed(1)} ${bottomY} Z`;
  }, [points, padTop, plotHeight]);

  const apptLinePath = useMemo(() => {
    if (points.length === 0) return "";
    return points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.yAppt.toFixed(1)}`).join(" ");
  }, [points]);

  return (
    <div className="space-y-6">
      {/* Header & Filter Bar */}
      <div className="bg-white rounded-3xl p-6 border border-groomish-slate/10 shadow-soft">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-groomish-orange bg-groomish-orange/15 px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
                <Building2 className="w-3 h-3" />
                {data?.storeName || storeName}
              </span>
              {data?.storeCode && (
                <span className="text-[10px] font-mono font-bold text-groomish-slate/60 bg-groomish-cream px-2 py-0.5 rounded-full">
                  Branch #{data.storeCode}
                </span>
              )}
            </div>
            <h1 className="text-2xl font-heading font-extrabold text-groomish-slate">
              Branch Analysis Dashboard
            </h1>
            <p className="text-xs text-groomish-slate/60 mt-0.5">
              Track appointments, completed treatments, and revenue collection for your assigned salon branch.
            </p>
          </div>

          {/* Quick Refresh */}
          <div className="flex items-center gap-2 self-start lg:self-center">
            <button
              onClick={() => fetchAnalytics(period, startDate, endDate)}
              disabled={loading}
              className="px-3.5 py-2 rounded-xl text-xs font-bold text-groomish-slate/70 hover:text-groomish-slate bg-groomish-cream hover:bg-groomish-cream/80 border border-groomish-slate/10 flex items-center gap-2 transition disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-groomish-orange" : ""}`} />
              <span>Refresh Data</span>
            </button>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="mt-6 pt-5 border-t border-groomish-slate/10 flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          {/* Period Selector Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => handlePeriodChange("DAY")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                period === "DAY"
                  ? "bg-gradient-to-r from-groomish-orange to-groomish-coral text-white shadow-glowOrange"
                  : "bg-groomish-cream text-groomish-slate/70 hover:text-groomish-slate hover:bg-groomish-cream/80"
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5" />
              <span>Day-Wise (Today)</span>
            </button>

            <button
              type="button"
              onClick={() => handlePeriodChange("WEEK")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                period === "WEEK"
                  ? "bg-gradient-to-r from-groomish-orange to-groomish-coral text-white shadow-glowOrange"
                  : "bg-groomish-cream text-groomish-slate/70 hover:text-groomish-slate hover:bg-groomish-cream/80"
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Weekly (7 Days)</span>
            </button>

            <button
              type="button"
              onClick={() => handlePeriodChange("MONTH")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                period === "MONTH"
                  ? "bg-gradient-to-r from-groomish-orange to-groomish-coral text-white shadow-glowOrange"
                  : "bg-groomish-cream text-groomish-slate/70 hover:text-groomish-slate hover:bg-groomish-cream/80"
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Monthly (30 Days)</span>
            </button>

            <button
              type="button"
              onClick={() => handlePeriodChange("CUSTOM")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                period === "CUSTOM"
                  ? "bg-gradient-to-r from-groomish-orange to-groomish-coral text-white shadow-glowOrange"
                  : "bg-groomish-cream text-groomish-slate/70 hover:text-groomish-slate hover:bg-groomish-cream/80"
              }`}
            >
              <Filter className="w-3.5 h-3.5" />
              <span>Custom Date Range</span>
            </button>
          </div>

          {/* Date Picker Form (for Day or Custom) */}
          {(period === "CUSTOM" || period === "DAY") && (
            <form onSubmit={handleCustomFilterSubmit} className="flex items-center gap-2 flex-wrap">
              <CustomDatePicker
                label={period === "DAY" ? "Select Day:" : "From:"}
                value={startDate}
                onChange={(e, val) => {
                  const v = typeof e === "string" ? e : (val || e?.target?.value || "");
                  setStartDate(v);
                  if (period === "DAY" && v) {
                    fetchAnalytics("DAY", v, v);
                  }
                }}
                placeholder="dd-mm-yyyy"
              />

              {period === "CUSTOM" && (
                <>
                  <CustomDatePicker
                    label="To:"
                    value={endDate}
                    onChange={(e, val) => {
                      const v = typeof e === "string" ? e : (val || e?.target?.value || "");
                      setEndDate(v);
                    }}
                    minDate={startDate}
                    placeholder="dd-mm-yyyy"
                  />

                  <button
                    type="submit"
                    disabled={loading || !startDate || !endDate}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-groomish-slate text-white hover:bg-groomish-slate/90 transition shadow-sm disabled:opacity-50"
                  >
                    Apply Range
                  </button>
                </>
              )}
            </form>
          )}
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Revenue */}
        <div className="bg-white rounded-3xl p-5 border border-groomish-slate/10 shadow-soft relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-groomish-orange/10 to-transparent rounded-bl-full pointer-events-none transition-transform group-hover:scale-110" />
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold text-groomish-slate/50 uppercase tracking-wider">
              Payments Collected
            </span>
            <div className="w-9 h-9 rounded-xl bg-groomish-goldLight text-groomish-orange flex items-center justify-center font-bold shadow-sm">
              ₹
            </div>
          </div>
          <div className="text-3xl font-heading font-extrabold text-groomish-slate">
            ₹{Number(data?.totalRevenue || 0).toLocaleString("en-IN")}
          </div>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-[11px] font-semibold text-groomish-green bg-groomish-greenLight px-2 py-0.5 rounded-md">
              Completed Revenue
            </span>
            {data?.averageOrderValue > 0 && (
              <span className="text-[10px] text-groomish-slate/50 font-mono">
                AOV: ₹{data.averageOrderValue}
              </span>
            )}
          </div>
        </div>

        {/* Total Bookings */}
        <div className="bg-white rounded-3xl p-5 border border-groomish-slate/10 shadow-soft relative overflow-hidden group">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold text-groomish-slate/50 uppercase tracking-wider">
              Total Appointments
            </span>
            <div className="w-9 h-9 rounded-xl bg-groomish-orangeLight text-groomish-orange flex items-center justify-center shadow-sm">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-heading font-extrabold text-groomish-slate">
            {data?.totalBookings || 0}
          </div>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-[11px] text-groomish-slate/60">
              {data?.pendingBookings || 0} scheduled / pending
            </span>
          </div>
        </div>

        {/* Completed Bookings */}
        <div className="bg-white rounded-3xl p-5 border border-groomish-slate/10 shadow-soft relative overflow-hidden group">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold text-groomish-slate/50 uppercase tracking-wider">
              Completed Visits
            </span>
            <div className="w-9 h-9 rounded-xl bg-groomish-greenLight text-groomish-green flex items-center justify-center shadow-sm">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-heading font-extrabold text-groomish-green">
            {data?.completedBookings || 0}
          </div>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-[11px] text-groomish-slate/60">
              {data?.totalBookings > 0
                ? `${Math.round(((data.completedBookings || 0) / data.totalBookings) * 100)}% completion rate`
                : "No visits yet"}
            </span>
          </div>
        </div>

        {/* Cancelled & Average Duration */}
        <div className="bg-white rounded-3xl p-5 border border-groomish-slate/10 shadow-soft relative overflow-hidden group">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold text-groomish-slate/50 uppercase tracking-wider">
              Avg Duration & Cancellations
            </span>
            <div className="w-9 h-9 rounded-xl bg-groomish-blueLight text-groomish-blue flex items-center justify-center shadow-sm">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-heading font-extrabold text-groomish-slate">
            {data?.averageDurationMinutes ? `${Math.round(data.averageDurationMinutes)}m` : "--"}
          </div>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-[11px] font-bold text-groomish-crimson bg-groomish-crimsonLight px-2 py-0.5 rounded-md">
              {data?.cancelledBookings || 0} cancelled
            </span>
          </div>
        </div>
      </div>

      {/* Day-Wise Revenue & Bookings Trend */}
      <div className="bg-white rounded-3xl p-6 border border-groomish-slate/10 shadow-soft">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-lg font-heading font-extrabold text-groomish-slate flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-groomish-orange" />
              <span>Day-Wise Revenue & Appointments Trend</span>
            </h2>
            <p className="text-xs text-groomish-slate/50 mt-0.5">
              Daily revenue intake and appointment volume for {data?.storeName || storeName}.
            </p>
          </div>

          <div className="flex items-center gap-4 flex-wrap self-start md:self-center">
            {/* Legend */}
            <div className="flex items-center gap-3 text-xs font-bold text-groomish-slate/70">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-md bg-gradient-to-r from-groomish-orange to-groomish-coral shadow-sm" />
                <span>Revenue (₹)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-md bg-groomish-slate shadow-sm" />
                <span>Appointments</span>
              </div>
            </div>

            {/* Toggle Graph Type: Bar Chart vs Line Chart */}
            <div className="flex items-center bg-groomish-cream p-1 rounded-xl border border-groomish-slate/10 shadow-inner">
              <button
                type="button"
                onClick={() => setChartType("bar")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition ${
                  chartType === "bar"
                    ? "bg-white text-groomish-slate shadow-sm font-extrabold"
                    : "text-groomish-slate/60 hover:text-groomish-slate"
                }`}
                title="Bar Chart View"
              >
                <BarChart3 className="w-3.5 h-3.5 text-groomish-orange" />
                <span>Bar Chart</span>
              </button>
              <button
                type="button"
                onClick={() => setChartType("line")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition ${
                  chartType === "line"
                    ? "bg-white text-groomish-slate shadow-sm font-extrabold"
                    : "text-groomish-slate/60 hover:text-groomish-slate"
                }`}
                title="Line Chart View"
              >
                <LineChart className="w-3.5 h-3.5 text-groomish-orange" />
                <span>Line Chart</span>
              </button>
            </div>
          </div>
        </div>

        {trendList && trendList.length > 0 ? (
          <div className="space-y-4">
            {/* Active Day Inspector Card */}
            {activeDay && (
              <div className="bg-gradient-to-r from-groomish-cream/80 via-white to-groomish-cream/50 border border-groomish-slate/10 rounded-2xl px-4 py-3 flex flex-wrap items-center justify-between gap-3 shadow-xs">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-groomish-slate/50">
                    Inspecting Date:
                  </span>
                  <span className="font-heading font-extrabold text-xs text-groomish-slate bg-white px-2.5 py-1 rounded-lg border border-groomish-slate/10 shadow-2xs">
                    📅 {activeDay.label} ({activeDay.date})
                  </span>
                </div>
                <div className="flex items-center gap-3 sm:gap-6 text-xs flex-wrap">
                  <div>
                    <span className="text-groomish-slate/50 mr-1 text-[11px]">Revenue:</span>
                    <span className="font-extrabold text-groomish-orange">
                      ₹{Number(activeDay.revenue || 0).toLocaleString("en-IN")}
                    </span>
                  </div>
                  <div>
                    <span className="text-groomish-slate/50 mr-1 text-[11px]">Appointments:</span>
                    <span className="font-extrabold text-groomish-slate">
                      {activeDay.bookingsCount} visits
                    </span>
                  </div>
                  <div>
                    <span className="text-groomish-slate/50 mr-1 text-[11px]">Completed:</span>
                    <span className="font-bold text-groomish-green">
                      {activeDay.completedCount} fulfilled
                    </span>
                  </div>
                  {activeDay.cancelledCount > 0 && (
                    <div>
                      <span className="text-groomish-slate/50 mr-1 text-[11px]">Cancelled:</span>
                      <span className="font-bold text-groomish-crimson">
                        {activeDay.cancelledCount}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* CHART DISPLAY AREA */}
            {chartType === "bar" ? (
              /* OPTIMIZED BAR CHART */
              <div className="relative pt-6 pb-2 border-b border-groomish-slate/10">
                {/* Horizontal Reference Grid Lines with Y-Axis */}
                <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-9 pt-6">
                  <div className="border-b border-dashed border-groomish-slate/10 flex items-center justify-between text-[10px] font-mono text-groomish-slate/40">
                    <span>₹{Number(maxDailyRevenue).toLocaleString("en-IN")}</span>
                    <span>{maxDailyBookings} visits</span>
                  </div>
                  <div className="border-b border-dashed border-groomish-slate/10 flex items-center justify-between text-[10px] font-mono text-groomish-slate/30">
                    <span>₹{Number(Math.round(maxDailyRevenue / 2)).toLocaleString("en-IN")}</span>
                    <span>{Math.round(maxDailyBookings / 2)} visits</span>
                  </div>
                  <div className="border-b border-groomish-slate/15 flex items-center justify-between text-[10px] font-mono text-groomish-slate/40">
                    <span>₹0</span>
                    <span>0</span>
                  </div>
                </div>

                {/* Bars Container */}
                <div className="relative z-10 flex items-end justify-around gap-2 sm:gap-4 h-60 px-4 sm:px-10 overflow-x-auto">
                  {trendList.map((d, idx) => {
                    const revPct = Math.round(((d.revenue || 0) / maxDailyRevenue) * 100);
                    const apptPct = Math.round(((d.bookingsCount || 0) / maxDailyBookings) * 100);
                    const isHovered = hoveredDayIndex === idx;

                    return (
                      <div
                        key={idx}
                        onMouseEnter={() => setHoveredDayIndex(idx)}
                        onMouseLeave={() => setHoveredDayIndex(null)}
                        className={`flex flex-col items-center justify-end h-full min-w-[54px] max-w-[80px] flex-1 p-2 rounded-2xl cursor-pointer transition-all duration-200 ${
                          isHovered ? "bg-groomish-cream/70 shadow-xs" : "hover:bg-groomish-cream/40"
                        }`}
                      >
                        {/* Compact Top Value indicator */}
                        <div className="h-6 flex items-center justify-center mb-1">
                          {d.revenue > 0 ? (
                            <span className="text-[10px] font-mono font-bold text-groomish-orange whitespace-nowrap">
                              ₹{d.revenue > 9999 ? `${(d.revenue / 1000).toFixed(0)}k` : d.revenue}
                            </span>
                          ) : d.bookingsCount > 0 ? (
                            <span className="text-[10px] font-mono font-bold text-groomish-slate/60">
                              {d.bookingsCount}v
                            </span>
                          ) : (
                            <span className="text-[9px] text-groomish-slate/30 font-mono">0</span>
                          )}
                        </div>

                        {/* Dual Grouped Bars */}
                        <div className="flex items-end gap-1.5 h-40 w-full justify-center">
                          {/* Revenue Bar */}
                          <div className="h-full flex flex-col justify-end items-center">
                            <div
                              style={{ height: `${Math.max(d.revenue > 0 ? 8 : 2, revPct)}%` }}
                              className={`w-3.5 sm:w-4.5 rounded-t-lg transition-all duration-300 shadow-xs ${
                                d.revenue > 0
                                  ? "bg-gradient-to-t from-groomish-orange to-groomish-coral group-hover:brightness-110"
                                  : "bg-groomish-slate/15 rounded-sm"
                              }`}
                              title={`Revenue: ₹${d.revenue || 0}`}
                            />
                          </div>

                          {/* Appointments Bar */}
                          <div className="h-full flex flex-col justify-end items-center">
                            <div
                              style={{ height: `${Math.max(d.bookingsCount > 0 ? 8 : 2, apptPct)}%` }}
                              className={`w-2.5 sm:w-3.5 rounded-t-md transition-all duration-300 shadow-xs ${
                                d.bookingsCount > 0
                                  ? "bg-gradient-to-t from-groomish-slate/80 to-groomish-slate group-hover:brightness-125"
                                  : "bg-groomish-slate/10 rounded-sm"
                              }`}
                              title={`Appointments: ${d.bookingsCount}`}
                            />
                          </div>
                        </div>

                        {/* Date Label */}
                        <span
                          className={`text-[10px] font-bold mt-2 truncate w-full text-center transition ${
                            isHovered ? "text-groomish-slate font-extrabold" : "text-groomish-slate/60"
                          }`}
                        >
                          {d.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              /* OPTIMIZED SVG LINE CHART */
              <div className="relative pt-2 pb-2 border-b border-groomish-slate/10">
                <div className="w-full overflow-x-auto">
                  <svg
                    viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                    className="w-full h-64 select-none"
                    style={{ minWidth: trendList.length > 10 ? "700px" : "100%" }}
                  >
                    <defs>
                      <linearGradient id="lineRevGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#EA580C" stopOpacity="0.25" />
                        <stop offset="100%" stopColor="#EA580C" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>

                    {/* Horizontal Reference Grid Lines & Y-Axis */}
                    <line
                      x1={padLeft}
                      y1={padTop}
                      x2={svgWidth - padRight}
                      y2={padTop}
                      stroke="#E2E8F0"
                      strokeDasharray="4 4"
                    />
                    <text x={padLeft - 8} y={padTop + 4} textAnchor="end" fill="#94A3B8" fontSize="10" fontFamily="monospace">
                      ₹{Number(maxDailyRevenue).toLocaleString("en-IN")}
                    </text>
                    <text x={svgWidth - padRight + 8} y={padTop + 4} textAnchor="start" fill="#94A3B8" fontSize="10" fontFamily="monospace">
                      {maxDailyBookings} v
                    </text>

                    <line
                      x1={padLeft}
                      y1={padTop + plotHeight / 2}
                      x2={svgWidth - padRight}
                      y2={padTop + plotHeight / 2}
                      stroke="#E2E8F0"
                      strokeDasharray="4 4"
                    />
                    <text x={padLeft - 8} y={padTop + plotHeight / 2 + 4} textAnchor="end" fill="#94A3B8" fontSize="10" fontFamily="monospace">
                      ₹{Number(Math.round(maxDailyRevenue / 2)).toLocaleString("en-IN")}
                    </text>
                    <text x={svgWidth - padRight + 8} y={padTop + plotHeight / 2 + 4} textAnchor="start" fill="#94A3B8" fontSize="10" fontFamily="monospace">
                      {Math.round(maxDailyBookings / 2)} v
                    </text>

                    <line
                      x1={padLeft}
                      y1={padTop + plotHeight}
                      x2={svgWidth - padRight}
                      y2={padTop + plotHeight}
                      stroke="#CBD5E1"
                    />
                    <text x={padLeft - 8} y={padTop + plotHeight + 4} textAnchor="end" fill="#94A3B8" fontSize="10" fontFamily="monospace">
                      ₹0
                    </text>
                    <text x={svgWidth - padRight + 8} y={padTop + plotHeight + 4} textAnchor="start" fill="#94A3B8" fontSize="10" fontFamily="monospace">
                      0
                    </text>

                    {/* Revenue Area & Line */}
                    {revenueAreaPath && (
                      <path d={revenueAreaPath} fill="url(#lineRevGrad)" />
                    )}
                    {revenueLinePath && (
                      <path
                        d={revenueLinePath}
                        fill="none"
                        stroke="#EA580C"
                        strokeWidth="3.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    )}

                    {/* Appointments Line */}
                    {apptLinePath && (
                      <path
                        d={apptLinePath}
                        fill="none"
                        stroke="#1E293B"
                        strokeWidth="2.5"
                        strokeDasharray="5 4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    )}

                    {/* Active Hover Cursor Line */}
                    {hoveredDayIndex !== null && points[hoveredDayIndex] && (
                      <line
                        x1={points[hoveredDayIndex].x}
                        y1={padTop}
                        x2={points[hoveredDayIndex].x}
                        y2={padTop + plotHeight}
                        stroke="#EA580C"
                        strokeWidth="1.5"
                        strokeDasharray="3 3"
                      />
                    )}

                    {/* Points & X-Axis Labels */}
                    {points.map((p, i) => {
                      const isHovered = hoveredDayIndex === i;
                      const colWidth = points.length > 1 ? plotWidth / (points.length - 1) : plotWidth;
                      return (
                        <g key={i}>
                          {/* Revenue Node */}
                          <circle
                            cx={p.x}
                            cy={p.yRev}
                            r={isHovered ? 6 : 4}
                            fill="#FFFFFF"
                            stroke="#EA580C"
                            strokeWidth="2.5"
                          />
                          {/* Appointments Node */}
                          <circle
                            cx={p.x}
                            cy={p.yAppt}
                            r={isHovered ? 5 : 3.5}
                            fill="#FFFFFF"
                            stroke="#1E293B"
                            strokeWidth="2"
                          />

                          {/* X-axis Label */}
                          <text
                            x={p.x}
                            y={svgHeight - 12}
                            textAnchor="middle"
                            fill={isHovered ? "#0F172A" : "#64748B"}
                            fontSize="10"
                            fontWeight={isHovered ? "700" : "600"}
                          >
                            {p.label}
                          </text>

                          {/* Transparent Hover Column */}
                          <rect
                            x={p.x - colWidth / 2}
                            y={padTop}
                            width={colWidth}
                            height={plotHeight + 20}
                            fill="transparent"
                            cursor="pointer"
                            onMouseEnter={() => setHoveredDayIndex(i)}
                            onMouseLeave={() => setHoveredDayIndex(null)}
                          />
                        </g>
                      );
                    })}
                  </svg>
                </div>
              </div>
            )}

            {/* Daily Summary Table */}
            <div className="overflow-x-auto mt-4">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-groomish-slate/10 text-groomish-slate/50 font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Total Appointments</th>
                    <th className="py-2.5 px-3">Completed</th>
                    <th className="py-2.5 px-3">Cancelled</th>
                    <th className="py-2.5 px-3 text-right">Revenue Collected</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-groomish-slate/5">
                  {trendList.map((d, idx) => (
                    <tr
                      key={idx}
                      onMouseEnter={() => setHoveredDayIndex(idx)}
                      onMouseLeave={() => setHoveredDayIndex(null)}
                      className={`transition cursor-pointer ${
                        hoveredDayIndex === idx ? "bg-groomish-cream/70 font-semibold" : "hover:bg-groomish-cream/40"
                      }`}
                    >
                      <td className="py-2 px-3 font-semibold text-groomish-slate">
                        {d.label} <span className="text-[10px] text-groomish-slate/40 font-mono">({d.date})</span>
                      </td>
                      <td className="py-2 px-3 font-bold text-groomish-slate">
                        {d.bookingsCount}
                      </td>
                      <td className="py-2 px-3">
                        <span className="text-groomish-green font-bold bg-groomish-greenLight px-2 py-0.5 rounded-full text-[10px]">
                          {d.completedCount} done
                        </span>
                      </td>
                      <td className="py-2 px-3">
                        {d.cancelledCount > 0 ? (
                          <span className="text-groomish-crimson font-bold bg-groomish-crimsonLight px-2 py-0.5 rounded-full text-[10px]">
                            {d.cancelledCount} cancelled
                          </span>
                        ) : (
                          <span className="text-groomish-slate/40 text-[10px]">0</span>
                        )}
                      </td>
                      <td className="py-2 px-3 text-right font-extrabold text-groomish-slate">
                        ₹{Number(d.revenue || 0).toLocaleString("en-IN")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="py-12 text-center text-groomish-slate/50 text-xs">
            No booking trend data recorded for this date range.
          </div>
        )}
      </div>

      {/* Two Column Layout: Payment Breakdown & Top Treatments */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Payment Methods Breakdown */}
        <div className="bg-white rounded-3xl p-6 border border-groomish-slate/10 shadow-soft flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-heading font-extrabold text-groomish-slate flex items-center gap-2">
                  <Wallet className="w-4 h-4 text-groomish-orange" />
                  <span>Payment Channels</span>
                </h3>
                <p className="text-xs text-groomish-slate/50 mt-0.5">
                  Collection breakdown across UPI, Cash, Cards & Vouchers.
                </p>
              </div>
              <span className="text-xs font-mono font-bold text-groomish-slate/60 bg-groomish-cream px-2 py-1 rounded-lg">
                Total: ₹{Number(data?.totalRevenue || 0).toLocaleString("en-IN")}
              </span>
            </div>

            {data?.paymentMethodRevenue && Object.keys(data.paymentMethodRevenue).length > 0 ? (
              <div className="space-y-3.5 mt-4">
                {Object.entries(data.paymentMethodRevenue).map(([method, amount]) => {
                  const details = getPaymentDetails(method);
                  const Icon = details.icon;
                  const count = data.paymentMethodCount?.[method] || 0;
                  const percentage = data.totalRevenue > 0
                    ? Math.round((amount / data.totalRevenue) * 100)
                    : 0;

                  return (
                    <div key={method} className="p-3.5 rounded-2xl bg-groomish-cream/40 border border-groomish-slate/10">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center border ${details.bg}`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="font-bold text-xs text-groomish-slate block">
                              {details.label}
                            </span>
                            <span className="text-[10px] text-groomish-slate/50 font-mono">
                              {count} transaction{count === 1 ? "" : "s"}
                            </span>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="font-extrabold text-sm text-groomish-slate block">
                            ₹{Number(amount || 0).toLocaleString("en-IN")}
                          </span>
                          <span className="text-[10px] font-bold text-groomish-orange bg-groomish-orangeLight px-1.5 py-0.2 rounded font-mono">
                            {percentage}% share
                          </span>
                        </div>
                      </div>

                      {/* Percentage Bar */}
                      <div className="w-full bg-groomish-slate/10 rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${details.barColor}`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-8 text-center text-groomish-slate/50 text-xs">
                No payment transactions completed in this period.
              </div>
            )}
          </div>
        </div>

        {/* Top Services Performed */}
        <div className="bg-white rounded-3xl p-6 border border-groomish-slate/10 shadow-soft">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-heading font-extrabold text-groomish-slate flex items-center gap-2">
                <Scissors className="w-4 h-4 text-groomish-orange" />
                <span>Top Salon Treatments</span>
              </h3>
              <p className="text-xs text-groomish-slate/50 mt-0.5">
                Most requested treatments at {data?.storeName || storeName}.
              </p>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-groomish-orange bg-groomish-orangeLight px-2 py-0.5 rounded-full">
              Branch Ranking
            </span>
          </div>

          {data?.topServices && data.topServices.length > 0 ? (
            <div className="divide-y divide-groomish-slate/5">
              {data.topServices.map((service, idx) => (
                <div key={idx} className="py-3 flex items-center justify-between gap-3 hover:bg-groomish-cream/40 px-2 rounded-xl transition">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-6 h-6 rounded-lg bg-groomish-slate text-white font-mono font-bold text-xs flex items-center justify-center shrink-0">
                      #{idx + 1}
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-bold text-xs text-groomish-slate truncate">
                        {service.serviceName}
                      </h4>
                      <p className="text-[10px] text-groomish-slate/50">
                        {service.bookingCount} appointment{service.bookingCount === 1 ? "" : "s"} performed
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="font-extrabold text-xs text-groomish-slate block">
                      ₹{Number(service.totalRevenue || 0).toLocaleString("en-IN")}
                    </span>
                    <span className="text-[9px] text-groomish-green font-bold">
                      Revenue
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-groomish-slate/50 text-xs">
              No service treatments completed in this period.
            </div>
          )}
        </div>
      </div>

      {/* Top Products Sold (if any) */}
      {data?.topProducts && data.topProducts.length > 0 && (
        <div className="bg-white rounded-3xl p-6 border border-groomish-slate/10 shadow-soft">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-heading font-extrabold text-groomish-slate flex items-center gap-2">
                <Package className="w-4 h-4 text-groomish-orange" />
                <span>Salon Retail Products Sold</span>
              </h3>
              <p className="text-xs text-groomish-slate/50 mt-0.5">
                Inventory items attached to completed appointments.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {data.topProducts.map((p, idx) => (
              <div key={idx} className="p-3.5 rounded-2xl bg-groomish-cream/40 border border-groomish-slate/10 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <h4 className="font-bold text-xs text-groomish-slate truncate">
                    {p.productName}
                  </h4>
                  <span className="text-[10px] text-groomish-slate/50 font-mono">
                    {p.quantitySold} unit{p.quantitySold === 1 ? "" : "s"} sold
                  </span>
                </div>
                <div className="text-right shrink-0">
                  <span className="font-extrabold text-xs text-groomish-slate block">
                    ₹{Number(p.totalRevenue || 0).toLocaleString("en-IN")}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
