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
  Gift,
  CreditCard,
  Star,
  ExternalLink,
  LogOut,
  Shield,
  Package,
  MapPin,
  Database,
} from "lucide-react";

const menuItems = [
  { name: "Dashboard", path: "/admin/dashboard", icon: LayoutDashboard },
  { name: "Salon Stores", path: "/admin/stores", icon: MapPin },
  { name: "Bookings", path: "/admin/bookings", icon: Calendar },
  { name: "Categories", path: "/admin/categories", icon: Layers },
  { name: "Services", path: "/admin/services", icon: Scissors },
  { name: "Store Products", path: "/admin/products", icon: Package },
  { name: "Customers", path: "/admin/customers", icon: Users },
  { name: "Staff Members", path: "/admin/staffs", icon: UserCheck },
  { name: "Coupons", path: "/admin/coupons", icon: Tag },
  { name: "Reward Vouchers", path: "/admin/rewards", icon: Gift },
  { name: "Payments", path: "/admin/payments", icon: CreditCard },
  { name: "Customer Reviews", path: "/admin/reviews", icon: Star },
];

import { useState } from "react";
import DatabaseResetModal from "../modals/DatabaseResetModal";

export default function AdminSidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [resetModalOpen, setResetModalOpen] = useState(false);

  return (
    <>
      <aside className="fixed top-0 left-0 bottom-0 z-30 w-64 bg-groomish-slate text-white flex flex-col justify-between h-screen border-r border-white/10 select-none overflow-hidden">
        <div className="flex-1 overflow-y-auto">
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

        {/* Footer Info & Maintenance Trigger */}
        <div className="p-4 border-t border-white/10 space-y-2 shrink-0 bg-groomish-slate">
          {/* Database Reset Action Button */}
          <button
            onClick={() => setResetModalOpen(true)}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold text-red-400 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 hover:text-red-300 transition"
            title="Open Database Maintenance & Purge Center"
          >
            <span className="flex items-center gap-2">
              <Database className="w-3.5 h-3.5 text-red-400" />
              <span>Clear Database</span>
            </span>
            <span className="text-[9px] uppercase px-1.5 py-0.2 rounded bg-red-500/20 text-red-300 font-extrabold">
              RESET
            </span>
          </button>

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

      <DatabaseResetModal
        open={resetModalOpen}
        onClose={() => setResetModalOpen(false)}
        onRefresh={() => window.location.reload()}
      />
    </>
  );
}
