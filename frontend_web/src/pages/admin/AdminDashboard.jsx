import { useEffect, useState } from "react";
import {
  Users,
  CalendarCheck2,
  IndianRupee,
  UserCog,
} from "lucide-react";
import { getAdminDashboard } from "../../api/admin";

const AdminDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    totalUsers: 0,
    totalStaff: 0,
    totalBookings: 0,
    totalRevenue: 0,
    todayRevenue: 0,
  });

  useEffect(() => {
    getAdminDashboard()
      .then((res) => setData(res.data))
      .catch(() =>
        setData({
          totalUsers: 1240,
          totalStaff: 18,
          totalBookings: 4520,
          totalRevenue: 987654,
          todayRevenue: 24500,
        })
      )
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="text-luxe-gray-medium text-sm">
        Loading dashboard...
      </div>
    );
  }

  return (
    <div className="space-y-8">

      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-serif font-semibold">
          Dashboard
        </h1>
        <p className="text-xs text-luxe-gray-medium mt-1">
          Overview of today’s performance
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard title="Total Users" value={data.totalUsers} icon={Users} />
        <StatCard title="Total Staff" value={data.totalStaff} icon={UserCog} />
        <StatCard title="Total Bookings" value={data.totalBookings} icon={CalendarCheck2} />
        <StatCard
          title="Total Revenue"
          // value={`₹${data.totalRevenue.toLocaleString()}`}
          icon={IndianRupee}
        />
      </div>

      {/* Today Snapshot */}
      <div className="bg-luxe-gray-dark/70 border border-luxe-gold/20 rounded-2xl p-6 flex items-center justify-between">
        <div>
          <div className="text-xs text-luxe-gray-medium uppercase tracking-widest">
            Today Revenue
          </div>
          <div className="text-xl font-semibold text-luxe-gold mt-1">
            {/* ₹{data.todayRevenue.toLocaleString()} */}
          </div>
        </div>
      </div>

    </div>
  );
};

const StatCard = ({ title, value, icon: Icon }) => (
  <div className="bg-luxe-gray-dark/70 border border-luxe-gold/20 rounded-2xl p-4 shadow-goldSoft">
    <div className="flex items-center justify-between">
      <div>
        <div className="text-[11px] text-luxe-gray-medium uppercase tracking-widest">
          {title}
        </div>
        <div className="mt-2 text-xl font-semibold">{value}</div>
      </div>
      <div className="w-10 h-10 rounded-full bg-luxe-gold/20 flex items-center justify-center text-luxe-gold">
        <Icon className="w-5 h-5" />
      </div>
    </div>
  </div>
);

export default AdminDashboard;
