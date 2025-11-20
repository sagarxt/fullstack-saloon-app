import { useEffect, useState } from "react";
import { getDashboard } from "../../api/customer";
import { useToast } from "../../components/Toast";
import { Link } from "react-router-dom";

export default function CustomerDashboard() {
  const { showToast } = useToast();
  const [data, setData] = useState(null);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const res = await getDashboard();
      setData(res.data);
    } catch (err) {
      showToast("Failed to load dashboard", "error");
    }
  };

  if (!data) return <div className="p-6 text-center text-gray-500">Loading...</div>;

  const { points, totalBookings, completedBookings, upcomingBookings, nextBooking, recentBookings, recommendedServices } = data;

  return (
    <div className="p-6 space-y-8">

      {/* STAT BOXES */}
      <div className="grid md:grid-cols-4 gap-4">
        <DashboardCard title="Points" value={points} color="bg-purple-600" />
        <DashboardCard title="Upcoming" value={upcomingBookings} color="bg-blue-600" />
        <DashboardCard title="Completed" value={completedBookings} color="bg-green-600" />
        <DashboardCard title="Total Bookings" value={totalBookings} color="bg-orange-500" />
      </div>

      {/* QUICK ACTIONS */}
      <div className="grid md:grid-cols-5 gap-4">
        <QuickAction title="Book Service" link="/customer/services" />
        <QuickAction title="My Bookings" link="/customer/bookings" />
        <QuickAction title="My Rewards" link="/customer/rewards" />
        <QuickAction title="Profile" link="/customer/profile" />
        <QuickAction title="Referral" link="/customer/referral" />
      </div>

      {/* UPCOMING BOOKING */}
      {nextBooking && (
        <div className="bg-white p-5 rounded-xl shadow border">
          <h3 className="text-lg font-semibold mb-2">Next Booking</h3>
          <p><b>ID:</b> {String(nextBooking.id).slice(0, 8)}</p>
          <p><b>Service:</b> {String(nextBooking.serviceId).slice(0, 8)}</p>
          <p><b>When:</b> {nextBooking.scheduledAt?.replace("T", " ").slice(0, 16)}</p>
        </div>
      )}

      {/* RECENT BOOKINGS */}
      <div className="bg-white p-5 rounded-xl shadow border">
        <h3 className="text-lg font-semibold mb-4">Recent Bookings</h3>

        {recentBookings.length === 0 ? (
          <p className="text-gray-500">No recent bookings</p>
        ) : (
          <div className="space-y-3">
            {recentBookings.map((b) => (
              <div key={b.id} className="p-3 border-b">
                <p><b>ID:</b> {String(b.id).slice(0, 8)}</p>
                <p><b>Status:</b> {b.status}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* RECOMMENDED SERVICES */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Recommended for You</h3>
        <div className="grid md:grid-cols-3 gap-4">
          {recommendedServices.map((s) => (
            <Link key={s.id} to={`/customer/service/${s.id}`}>
              <div className="bg-white p-4 rounded-xl shadow border hover:shadow-lg transition">
                <h4 className="font-semibold">{s.name}</h4>
                <p className="text-gray-500 text-sm">{s.description.slice(0, 60)}...</p>
                <p className="mt-2 font-bold text-indigo-600">₹{s.price}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

    </div>
  );
}

function DashboardCard({ title, value, color }) {
  return (
    <div className={`${color} text-white p-5 rounded-xl shadow`}>
      <p className="text-lg">{title}</p>
      <h2 className="text-3xl font-bold mt-2">{value}</h2>
    </div>
  );
}

function QuickAction({ title, link }) {
  return (
    <Link
      to={link}
      className="bg-white p-4 rounded-xl shadow border text-center hover:bg-gray-50 transition"
    >
      <p className="font-semibold">{title}</p>
    </Link>
  );
}
