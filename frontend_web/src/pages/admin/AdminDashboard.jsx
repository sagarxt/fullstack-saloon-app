import React, { useEffect, useState } from "react";
import { getAdminDashboard } from "../../api/admin";
import {
  Users,
  CalendarCheck2,
  IndianRupee,
  UserCog,
  Clock3,
  ChevronRight,
} from "lucide-react";

import { useNavigate, useLocation } from "react-router-dom";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [data, setData] = useState({
    totalUsers: 0,
    totalStaff: 0,
    totalBookings: 0,
    totalRevenue: 0,
    todayBookings: 0,
    todayRevenue: 0,
    recentBookings: [],
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAdminDashboard()
      .then((res) => setData(res.data))
      .catch(() => {
        // fallback demo
        setData({
          totalUsers: 1240,
          totalStaff: 18,
          totalBookings: 4520,
          totalRevenue: 987654,
          todayBookings: 22,
          todayRevenue: 24500,
          recentBookings: [
            {
              id: "BK-1001",
              customerName: "Rahul Sharma",
              serviceName: "Classic Haircut",
              status: "COMPLETED",
              amount: 499,
              time: "Today, 11:30 AM",
            },
          ],
        });
      })
      .finally(() => setLoading(false));
  }, []);

  // Helper: Highlight active menu
  const isActive = (path) =>
    location.pathname.startsWith(path) ? "bg-luxe-gold/15 text-luxe-gold" : "hover:bg-luxe-gray-dark/60";

  // Helper: navigate
  const go = (path) => navigate(path);

  return (
    <div className="min-h-screen bg-luxe-black text-white flex">

      {/* Sidebar */}
      <aside className="w-64 bg-black/90 border-r border-luxe-gold/20 hidden md:flex flex-col">
        <div className="px-6 py-6 border-b border-luxe-gold/20">
          <div className="text-2xl font-bold font-serif tracking-[0.25em] text-luxe-gold">
            LUXE<span className="text-white tracking-normal ml-1">SALON</span>
          </div>
          <div className="text-xs text-luxe-gray-medium mt-2 uppercase tracking-[0.18em]">
            Admin Panel
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-1 text-sm">

          <button
            onClick={() => go("/admin/dashboard")}
            className={`w-full text-left px-3 py-2 rounded-lg transition ${isActive("/admin/dashboard")}`}
          >
            Dashboard
          </button>

          <button
            onClick={() => go("/admin/bookings")}
            className={`w-full text-left px-3 py-2 rounded-lg transition ${isActive("/admin/bookings")}`}
          >
            Bookings
          </button>

          <button
            onClick={() => go("/admin/categories")}
            className={`w-full text-left px-3 py-2 rounded-lg transition ${isActive("/admin/categories")}`}
          >
            Categories
          </button>

          <button
            onClick={() => go("/admin/services")}
            className={`w-full text-left px-3 py-2 rounded-lg transition ${isActive("/admin/services")}`}
          >
            Services
          </button>

          <button
            onClick={() => go("/admin/customers")}
            className={`w-full text-left px-3 py-2 rounded-lg transition ${isActive("/admin/customers")}`}
          >
            Customers
          </button>

          <button
            onClick={() => go("/admin/staff")}
            className={`w-full text-left px-3 py-2 rounded-lg transition ${isActive("/admin/staff")}`}
          >
            Staff
          </button>

          <button
            onClick={() => go("/admin/coupons")}
            className={`w-full text-left px-3 py-2 rounded-lg transition ${isActive("/admin/coupons")}`}
          >
            Coupons & Rewards
          </button>
        </nav>

        <div className="px-4 py-4 border-t border-luxe-gold/20 text-xs text-luxe-gray-medium">
          Logged in as <span className="text-luxe-gold font-semibold">Admin</span>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col">
        {/* Top Bar */}
        <header className="h-16 border-b border-luxe-gold/20 bg-black/80 backdrop-blur flex items-center justify-between px-4 md:px-8">
          <div>
            <h1 className="text-lg md:text-xl font-semibold font-serif">
              Admin Dashboard
            </h1>
            <p className="text-xs text-luxe-gray-medium">
              Overview of today&apos;s performance
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-xs text-luxe-gray-medium">Today&apos;s Revenue</div>
              <div className="text-sm font-semibold text-luxe-gold">
                ₹{data.todayRevenue?.toLocaleString()}
              </div>
            </div>
            <div className="w-9 h-9 rounded-full bg-luxe-gold/20 border border-luxe-gold/40 flex items-center justify-center text-xs font-semibold">
              AD
            </div>
          </div>
        </header>

        {/* MAIN CONTENT */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8">

          {/* Stat Cards */}
          <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <StatCard title="Total Users" value={data.totalUsers} icon={Users} trend="+8%" trendLabel="vs last month" />
            <StatCard title="Total Staff" value={data.totalStaff} icon={UserCog} trend="+2" trendLabel="active staff" />
            <StatCard title="Total Bookings" value={data.totalBookings} icon={CalendarCheck2} trend="+12%" trendLabel="growth" />
            <StatCard title="Total Revenue" value={`₹${data.totalRevenue?.toLocaleString()}`} icon={IndianRupee} trend="+18%" trendLabel="this quarter" />
          </section>

          {/* Today Snapshot */}
          {/* ... (rest of your code remains unchanged) ... */}

        </div>
      </main>
    </div>
  );
};

const StatCard = ({ title, value, icon: Icon, trend, trendLabel }) => (
  <div className="bg-luxe-gray-dark/70 border border-luxe-gold/20 rounded-2xl p-4 flex flex-col justify-between shadow-goldSoft">
    <div className="flex items-center justify-between">
      <div>
        <div className="text-[11px] text-luxe-gray-medium uppercase tracking-[0.2em]">
          {title}
        </div>
        <div className="mt-2 text-xl font-semibold">{value}</div>
      </div>
      <div className="w-10 h-10 rounded-full bg-luxe-gold/20 flex items-center justify-center text-luxe-gold">
        <Icon className="w-5 h-5" />
      </div>
    </div>

    <div className="flex items-center gap-1 mt-3 text-[11px] text-luxe-gray-medium">
      <span className="text-emerald-400 font-semibold">{trend}</span>
      <span>{trendLabel}</span>
    </div>
  </div>
);

export default AdminDashboard;
