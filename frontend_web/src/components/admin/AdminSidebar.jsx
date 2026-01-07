import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  CalendarCheck2,
  Layers,
  Scissors,
  Users,
  UserCog,
  Gift,
} from "lucide-react";

const menu = [
  { label: "Dashboard", path: "/admin/dashboard", icon: LayoutDashboard },
  { label: "Bookings", path: "/admin/bookings", icon: CalendarCheck2 },
  { label: "Categories", path: "/admin/categories", icon: Layers },
  { label: "Services", path: "/admin/services", icon: Scissors },
  { label: "Customers", path: "/admin/customers", icon: Users },
  { label: "Staff", path: "/admin/staff", icon: UserCog },
  { label: "Rewards", path: "/admin/rewards", icon: Gift },
];

export default function AdminSidebar() {
  return (
    <aside className="w-64 bg-black/90 border-r border-luxe-gold/20 hidden md:flex flex-col">

      {/* Brand */}
      <div className="px-6 py-6 border-b border-luxe-gold/20">
        <h1 className="text-2xl font-serif text-luxe-gold tracking-widest">
          LUXE<span className="text-white ml-1">SALON</span>
        </h1>
        <p className="text-xs text-luxe-gray-medium mt-1 uppercase tracking-widest">
          Admin Panel
        </p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-1 text-sm">
        {menu.map(({ label, path, icon: Icon }) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg transition ${
                isActive
                  ? "bg-luxe-gold/20 text-luxe-gold"
                  : "text-luxe-gray-light hover:bg-white/5"
              }`
            }
          >
            <Icon className="w-4 h-4" />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-luxe-gold/20 text-xs text-luxe-gray-medium">
        Logged in as <span className="text-luxe-gold font-semibold">Admin</span>
      </div>

    </aside>
  );
}
