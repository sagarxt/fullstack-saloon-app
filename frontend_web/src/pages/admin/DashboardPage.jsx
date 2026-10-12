import { useEffect, useState } from "react";
import { getDashboardMetrics } from "../../api/admin";
import { useNavigate, Link } from "react-router-dom";
import {
  DollarSign,
  Calendar,
  Users,
  UserCheck,
  TrendingUp,
  Scissors,
  Tag,
  Clock,
  ChevronRight,
  Sparkles,
} from "lucide-react";

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    getDashboardMetrics()
      .then((res) => setData(res.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="py-20 text-center">
        <div className="w-10 h-10 border-4 border-groomish-orange border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs text-groomish-slate/60">Loading salon analytics...</p>
      </div>
    );
  }

  const metrics = data || {
    totalRevenue: 0,
    totalBookings: 0,
    todaysBookings: 0,
    totalCustomers: 0,
    totalStaff: 0,
    recentBookings: [],
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-extrabold text-groomish-slate">
            Executive Salon Dashboard
          </h1>
          <p className="text-xs text-groomish-slate/60 mt-0.5">
            Real-time salon operational metrics, booking revenue, and customer activity.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate("/admin/services")}
            className="btn-secondary text-xs px-4 py-2"
          >
            <Scissors className="w-3.5 h-3.5 text-groomish-orange" />
            <span>Manage Services</span>
          </button>
          <button
            onClick={() => navigate("/admin/coupons")}
            className="btn-primary text-xs px-4 py-2"
          >
            <Tag className="w-3.5 h-3.5" />
            <span>Add Coupon</span>
          </button>
        </div>
      </div>

      {/* METRIC CARDS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Revenue */}
        <div className="bg-white rounded-3xl p-6 border border-groomish-slate/10 shadow-soft relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-groomish-slate/50 uppercase tracking-wider">
              Total Revenue
            </span>
            <div className="w-10 h-10 rounded-2xl bg-groomish-orangeLight text-groomish-orange flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-heading font-extrabold text-groomish-slate">
            ₹{metrics.totalRevenue?.toLocaleString() || 0}
          </div>
          <p className="text-[11px] text-groomish-green font-semibold mt-1 flex items-center gap-1">
            <span>Verified checkout transactions</span>
          </p>
        </div>

        {/* Total Bookings */}
        <div className="bg-white rounded-3xl p-6 border border-groomish-slate/10 shadow-soft">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-groomish-slate/50 uppercase tracking-wider">
              Total Bookings
            </span>
            <div className="w-10 h-10 rounded-2xl bg-groomish-blueLight text-groomish-blue flex items-center justify-center">
              <Calendar className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-heading font-extrabold text-groomish-slate">
            {metrics.totalBookings || 0}
          </div>
          <p className="text-[11px] text-groomish-slate/50 font-medium mt-1">
            All customer appointments
          </p>
        </div>

        {/* Today's Bookings */}
        <div className="bg-white rounded-3xl p-6 border border-groomish-slate/10 shadow-soft">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-groomish-slate/50 uppercase tracking-wider">
              Today's Schedule
            </span>
            <div className="w-10 h-10 rounded-2xl bg-groomish-goldLight text-groomish-orange flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-heading font-extrabold text-groomish-orange">
            {metrics.todaysBookings || 0}
          </div>
          <p className="text-[11px] text-groomish-slate/50 font-medium mt-1">
            Appointments scheduled today
          </p>
        </div>

        {/* Registered Customers */}
        <div className="bg-white rounded-3xl p-6 border border-groomish-slate/10 shadow-soft">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-groomish-slate/50 uppercase tracking-wider">
              Total Clients
            </span>
            <div className="w-10 h-10 rounded-2xl bg-groomish-greenLight text-groomish-green flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-heading font-extrabold text-groomish-slate">
            {metrics.totalCustomers || 0}
          </div>
          <p className="text-[11px] text-groomish-slate/50 font-medium mt-1">
            Enrolled loyalty members ({metrics.totalStaff || 0} staff)
          </p>
        </div>
      </div>

      {/* RECENT BOOKINGS TABLE */}
      <div className="bg-white rounded-3xl border border-groomish-slate/10 shadow-soft overflow-hidden">
        <div className="p-6 border-b border-groomish-slate/10 flex items-center justify-between">
          <div>
            <h2 className="font-heading font-bold text-base text-groomish-slate">
              Recent Appointments
            </h2>
            <p className="text-xs text-groomish-slate/50">
              Latest salon appointments requested by clients.
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

        {metrics.recentBookings && metrics.recentBookings.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-groomish-cream/60 border-b border-groomish-slate/10 text-groomish-slate/60 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-6">Booking ID</th>
                  <th className="py-3 px-6">Scheduled At</th>
                  <th className="py-3 px-6">Status</th>
                  <th className="py-3 px-6">Amount</th>
                  <th className="py-3 px-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-groomish-slate/10">
                {metrics.recentBookings.map((b) => (
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
                            : "bg-groomish-goldLight text-groomish-slate"
                        }`}
                      >
                        {b.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 font-bold text-groomish-slate">
                      ₹{b.pricePaid}
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
      </div>
    </div>
  );
}
