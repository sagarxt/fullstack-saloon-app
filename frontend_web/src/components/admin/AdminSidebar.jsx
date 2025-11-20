// src/components/admin/AdminSidebar.jsx
import { NavLink } from "react-router-dom";

export default function AdminSidebar() {
  const linkClasses = ({ isActive }) =>
    `block px-4 py-2 rounded-lg font-medium mb-1 ${
      isActive
        ? "bg-indigo-600 text-white"
        : "text-gray-700 hover:bg-gray-200"
    }`;

  return (
    <aside className="w-64 bg-white shadow-lg p-4 hidden md:block">

      <h2 className="text-xl font-bold mb-6">Admin Panel</h2>

      <NavLink to="/admin" className={linkClasses}>
        Dashboard
      </NavLink>
      <NavLink to="/admin/services" className={linkClasses}>
        Services
      </NavLink>
      <NavLink to="/admin/rewards" className={linkClasses}>
        Rewards
      </NavLink>
      <NavLink to="/admin/bookings" className={linkClasses}>
        Bookings
      </NavLink>
      <NavLink to="/admin/customers" className={linkClasses}>
        Customers
      </NavLink>

    </aside>
  );
}
