// src/pages/admin/AdminDashboard.jsx
import AdminLayout from "./AdminLayout";

export default function AdminDashboard() {
  const stats = [
    { label: "Total Customers", value: "0", color: "bg-indigo-500" },
    { label: "Total Bookings", value: "0", color: "bg-green-500" },
    { label: "Points Issued", value: "0", color: "bg-purple-500" },
    { label: "Pending Rewards", value: "0", color: "bg-orange-500" },
  ];

  return (
    <AdminLayout>
      <h2 className="text-2xl font-bold mb-6">Dashboard Overview</h2>

      <div className="grid md:grid-cols-4 gap-6 mb-10">
        {stats.map((s) => (
          <div
            key={s.label}
            className={`p-6 rounded-xl text-white shadow-lg ${s.color}`}
          >
            <div className="text-3xl font-bold">{s.value}</div>
            <div className="mt-2 text-white/90">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Booking & Points Analytics</h3>

        <div className="h-64 flex items-center justify-center text-gray-500">
          (Chart will be added here)
        </div>
      </div>
    </AdminLayout>
  );
}
