import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/useAuth";
import {
  LayoutDashboard,
  Calendar,
  Layers,
  Scissors,
  Users,
  UserCheck,
  Tag,
  CreditCard,
  Star,
  ExternalLink,
  LogOut,
  Shield,
  Package,
} from "lucide-react";

const menuItems = [
  { name: "Dashboard", path: "/admin/dashboard", icon: LayoutDashboard },
  { name: "Bookings", path: "/admin/bookings", icon: Calendar },
  { name: "Categories", path: "/admin/categories", icon: Layers },
  { name: "Services", path: "/admin/services", icon: Scissors },
  { name: "Store Products", path: "/admin/products", icon: Package },
  { name: "Customers", path: "/admin/customers", icon: Users },
  { name: "Staff Members", path: "/admin/staffs", icon: UserCheck },
  { name: "Coupons", path: "/admin/coupons", icon: Tag },
  { name: "Payments", path: "/admin/payments", icon: CreditCard },
  { name: "Customer Reviews", path: "/admin/reviews", icon: Star },
];

export default function AdminSidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <aside className="w-64 bg-groomish-slate text-white flex flex-col justify-between shrink-0 min-h-screen border-r border-white/10 select-none">
      <div>
        {/* Brand Header */}
        <div
          onClick={() => navigate("/")}
          className="p-6 border-b border-white/10 flex items-center gap-3 cursor-pointer group"
        >
          <img
            src="/groomish_logo_2.png"
            alt="Groomish"
            className="h-9 w-auto object-contain transition-transform group-hover:scale-105"
          />
          <div>
            <span className="font-heading font-extrabold text-sm tracking-wide block text-white">
              Groomish Now
            </span>
            <span className="text-[10px] uppercase tracking-wider font-bold text-groomish-orange bg-groomish-orange/20 px-2 py-0.5 rounded-full inline-block">
              Admin Portal
            </span>
          </div>
        </div>

        {/* Super Admin Profile Badge */}
        <div className="mx-4 mt-3 mb-1 p-3 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-groomish-orange/20 text-groomish-orange flex items-center justify-center shrink-0 border border-groomish-orange/30">
            <Shield className="w-4 h-4 text-groomish-orange" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="font-heading font-bold text-xs text-white truncate">
                {user?.name || "Super Admin"}
              </span>
              <span className="text-[9px] bg-groomish-orange text-white font-extrabold px-1.5 py-0.5 rounded-full shrink-0">
                ADMIN
              </span>
            </div>
            <p className="text-[10px] text-white/50 truncate font-mono mt-0.5">
              {user?.email || "admin@groomishnow.com"}
            </p>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="p-4 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
                    isActive
                      ? "bg-gradient-to-r from-groomish-orange to-groomish-coral text-white shadow-glowOrange font-bold"
                      : "text-white/70 hover:text-white hover:bg-white/10"
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.name}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Footer Info & Switch to Web */}
      <div className="p-4 border-t border-white/10 space-y-2">
        <button
          onClick={() => navigate("/")}
          className="w-full flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-semibold text-white/70 hover:text-white hover:bg-white/10 transition"
        >
          <span className="flex items-center gap-2">
            <ExternalLink className="w-4 h-4" />
            <span>Customer Website</span>
          </span>
          <span className="text-[10px] text-white/40">↗</span>
        </button>

        <button
          onClick={logout}
          className="w-full flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold text-groomish-crimson hover:bg-groomish-crimson/10 transition"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
