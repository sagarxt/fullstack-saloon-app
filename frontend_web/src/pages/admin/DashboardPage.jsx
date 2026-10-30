import { useEffect, useState } from "react";
import { getDashboardMetrics } from "../../api/admin";
import { useNavigate, Link } from "react-router-dom";
import { sortBookingsWithTodayOnTop } from "../../utils/dataHelper";
import {
  Calendar,
  RefreshCw,
  ChevronRight,
  Sparkles,
  TrendingUp,
  Clock,
  Users,
  Activity,
  Layers,
  Filter,
} from "lucide-react";
import KpiRowSection from "../../components/admin/dashboard/KpiRowSection";
import RevenueGrowthSection from "../../components/admin/dashboard/RevenueGrowthSection";
import OperationsSection from "../../components/admin/dashboard/OperationsSection";
import CustomerLoyaltySection from "../../components/admin/dashboard/CustomerLoyaltySection";

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("30D");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [activeTab, setActiveTab] = useState("all"); // "all" | "kpi" | "revenue" | "operations" | "customers"
  const navigate = useNavigate();

  const loadData = async (selectedPeriod = period, start = customStart, end = customEnd) => {
    setLoading(true);
    try {
      const res = await getDashboardMetrics(selectedPeriod, start || null, end || null);
      setData(res.data);
    } catch (err) {
      console.error("Failed to load admin dashboard metrics:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (period !== "CUSTOM") {
      loadData(period);
    }
  }, [period]);

  const handleCustomFilterSubmit = (e) => {
    e.preventDefault();
    if (customStart && customEnd) {
      loadData("CUSTOM", customStart, customEnd);
    }
  };

  const periodOptions = [
    { id: "7D", label: "Last 7 Days" },
    { id: "30D", label: "Last 30 Days" },
    { id: "90D", label: "Last 90 Days" },
    { id: "ALL", label: "All Time" },
    { id: "CUSTOM", label: "Custom Range" },
  ];

  const sectionTabs = [
    { id: "all", label: "Complete Overview", icon: Activity },
    { id: "kpi", label: "1. Core KPIs", icon: TrendingUp },
    { id: "revenue", label: "2. Revenue & Growth", icon: Layers },
    { id: "operations", label: "3. Operations & Heatmap", icon: Clock },
    { id: "customers", label: "4. Loyalty & Retention", icon: Users },
  ];

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Page Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-groomish-orange animate-pulse" />
            <h1 className="text-2xl font-heading font-extrabold text-groomish-slate">
              Executive Salon Dashboard
            </h1>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-groomish-orangeLight text-groomish-orange border border-groomish-orange/20">
              Live BI Suite
            </span>
          </div>
          <p className="text-xs text-groomish-slate/60">
            Real-time multi-branch salon intelligence, revenue dynamics, operations heatmap, and loyalty analytics.
          </p>
        </div>

        {/* Action Controls: Period Selector & Refresh */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Period Toggle Group */}
          <div className="flex items-center bg-white p-1 rounded-2xl border border-groomish-slate/10 shadow-sm">
            {periodOptions.map((opt) => (
              <button
                key={opt.id}
                onClick={() => setPeriod(opt.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                  period === opt.id
                    ? "bg-groomish-slate text-white shadow-sm"
                    : "text-groomish-slate/70 hover:text-groomish-slate hover:bg-groomish-cream/60"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <button
            onClick={() => loadData(period, customStart, customEnd)}
            disabled={loading}
            className="p-2.5 sm:px-3 sm:py-2 rounded-2xl border border-groomish-slate/10 bg-white text-groomish-slate hover:bg-groomish-cream transition text-xs font-bold flex items-center gap-1.5 shadow-sm active:scale-95"
            title="Refresh analytics data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-groomish-orange" : ""}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* Custom Date Range Picker (shown when CUSTOM selected) */}
      {period === "CUSTOM" && (
        <form
          onSubmit={handleCustomFilterSubmit}
          className="bg-white p-4 rounded-3xl border border-groomish-slate/10 shadow-soft flex flex-wrap items-center gap-3 text-xs"
        >
          <div className="flex items-center gap-2 font-bold text-groomish-slate">
            <Filter className="w-4 h-4 text-groomish-orange" />
            <span>Select Date Range:</span>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-groomish-slate/60 text-[11px]">From:</label>
            <input
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              required
              className="px-3 py-1.5 rounded-xl border border-groomish-slate/20 text-groomish-slate text-xs font-medium focus:outline-none focus:border-groomish-orange"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-groomish-slate/60 text-[11px]">To:</label>
            <input
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              required
              className="px-3 py-1.5 rounded-xl border border-groomish-slate/20 text-groomish-slate text-xs font-medium focus:outline-none focus:border-groomish-orange"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-1.5 rounded-xl bg-groomish-orange text-white text-xs font-bold hover:bg-groomish-orangeDark transition shadow-sm"
          >
            Apply Filter
          </button>
        </form>
      )}

      {/* Section Quick Jump Filter Navigation */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {sectionTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs font-bold transition whitespace-nowrap ${
                isActive
                  ? "bg-groomish-orange text-white shadow-soft shadow-groomish-orange/20"
                  : "bg-white text-groomish-slate/70 hover:text-groomish-slate border border-groomish-slate/10 hover:bg-groomish-cream/50"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {loading && !data ? (
        <div className="py-24 text-center">
          <div className="w-12 h-12 border-4 border-groomish-orange border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm font-bold text-groomish-slate">Compiling Salon Intelligence...</p>
          <p className="text-xs text-groomish-slate/50 mt-1">Analyzing cross-branch bookings, revenue ledger, and customer retention</p>
        </div>
      ) : (
        <>
          {/* SECTION 1: CORE KPI ROW */}
          {(activeTab === "all" || activeTab === "kpi") && (
            <section id="section-kpi">
              <KpiRowSection kpi={data?.kpi} />
            </section>
          )}

          {/* SECTION 2: REVENUE AND GROWTH */}
          {(activeTab === "all" || activeTab === "revenue") && (
            <section id="section-revenue" className="pt-2">
              <RevenueGrowthSection revenueGrowth={data?.revenueGrowth} />
            </section>
          )}

          {/* SECTION 3: OPERATIONS & CAPACITY CONTROL */}
          {(activeTab === "all" || activeTab === "operations") && (
            <section id="section-operations" className="pt-2">
              <OperationsSection operations={data?.operations} />
            </section>
          )}

          {/* SECTION 4: CUSTOMERS AND LOYALTY */}
          {(activeTab === "all" || activeTab === "customers") && (
            <section id="section-customers" className="pt-2">
              <CustomerLoyaltySection customerLoyalty={data?.customersLoyalty} />
            </section>
          )}

          {/* RECENT BOOKINGS TABLE */}
          {(activeTab === "all" || activeTab === "operations") && (
            <section className="bg-white rounded-3xl border border-groomish-slate/10 shadow-soft overflow-hidden">
              <div className="p-6 border-b border-groomish-slate/10 flex items-center justify-between">
                <div>
                  <h2 className="font-heading font-bold text-base text-groomish-slate">
                    Recent Salon Appointments
                  </h2>
                  <p className="text-xs text-groomish-slate/50">
                    Latest customer bookings across all branches.
                  </p>
                </div>

                <button
                  onClick={() => navigate("/admin/bookings")}
                  className="text-xs font-bold text-groomish-orange hover:text-groomish-orangeDark flex items-center gap-1"
                >
                  <span>View All Bookings</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {data?.recentBookings && data.recentBookings.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-groomish-cream/60 border-b border-groomish-slate/10 text-groomish-slate/60 font-semibold uppercase tracking-wider text-[11px]">
                      <tr>
                        <th className="py-3 px-6">Booking Code</th>
                        <th className="py-3 px-6">Branch</th>
                        <th className="py-3 px-6">Scheduled At</th>
                        <th className="py-3 px-6">Status</th>
                        <th className="py-3 px-6">Amount</th>
                        <th className="py-3 px-6 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-groomish-slate/10">
                      {sortBookingsWithTodayOnTop(data.recentBookings).map((b) => (
                        <tr key={b.id} className="hover:bg-groomish-cream/30 transition">
                          <td className="py-4 px-6 font-mono font-bold text-groomish-slate">
                            <Link
                              to={`/admin/bookings/${b.id}`}
                              className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-mono font-extrabold text-groomish-orange bg-groomish-orangeLight border border-groomish-orange/20 tracking-wider hover:bg-groomish-orange/25 transition"
                              title="Click to view appointment details"
                            >
                              {b.bookingCode || (b.id ? `GN-${b.id.slice(0, 8).toUpperCase()}` : "GN-NEW")}
                            </Link>
                          </td>
                          <td className="py-4 px-6 text-groomish-slate/80 font-medium">
                            {b.storeName || "Main Salon"}
                          </td>
                          <td className="py-4 px-6 text-groomish-slate/80">
                            {b.scheduledAt
                              ? new Date(b.scheduledAt).toLocaleString(undefined, {
                                  dateStyle: "medium",
                                  timeStyle: "short",
                                })
                              : "N/A"}
                          </td>
                          <td className="py-4 px-6">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                b.status === "CONFIRMED"
                                  ? "bg-groomish-greenLight text-groomish-green"
                                  : b.status === "COMPLETED"
                                  ? "bg-groomish-blueLight text-groomish-blue"
                                  : b.status === "CANCELLED"
                                  ? "bg-groomish-crimsonLight text-groomish-crimson"
                                  : b.status === "NO_SHOW"
                                  ? "bg-amber-100 text-amber-800"
                                  : "bg-groomish-goldLight text-groomish-slate"
                              }`}
                            >
                              {b.status}
                            </span>
                          </td>
                          <td className="py-4 px-6 font-bold text-groomish-slate font-mono">
                            ₹{b.pricePaid ?? 0}
                          </td>
                          <td className="py-4 px-6 text-right">
                            <Link
                              to={`/admin/bookings/${b.id}`}
                              className="text-xs font-bold text-groomish-orange hover:text-groomish-orangeDark hover:underline inline-flex items-center gap-0.5"
                              title="Manage appointment"
                            >
                              <span>Manage</span>
                              <ChevronRight className="w-3.5 h-3.5" />
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="py-12 text-center text-xs text-groomish-slate/50">
                  No bookings recorded yet.
                </div>
              )}
            </section>
          )}
        </>
      )}
    </div>
  );
}
