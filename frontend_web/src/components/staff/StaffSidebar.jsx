import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/useAuth";
import {
  CalendarClock,
  Clock,
  CheckCircle2,
  Calendar,
  Scissors,
  Package,
  Users,
  LogOut,
  MapPin,
  ChevronRight,
  Sparkles,
  TrendingUp,
  UserCheck,
  X,
} from "lucide-react";

export default function StaffSidebar({
  activeBookingCode = null,
  activeBookingId = null,
  isOpen = false,
  onClose,
  collapsed = false,
  onToggleCollapse,
}) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isDashboard = location.pathname === "/staff/dashboard" || location.pathname === "/staff";
  const searchParams = new URLSearchParams(location.search);
  const activeTab = searchParams.get("tab");

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 lg:hidden animate-fade-in"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Main Staff Sidebar (Drawer on mobile, Collapsible on desktop) */}
      <aside
        className={`fixed top-0 left-0 bottom-0 z-50 w-64 bg-groomish-slate text-white flex flex-col justify-between h-screen border-r border-white/10 select-none transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
        } ${
          collapsed ? "lg:-translate-x-full" : "lg:translate-x-0"
        }`}
      >
        <div className="flex-1 overflow-y-auto">
          {/* Brand Header */}
          <div className="px-4 py-3 sm:py-3.5 border-b border-white/10 flex items-center justify-between gap-2">
            <div
              onClick={() => {
                navigate("/staff/dashboard");
                onClose?.();
              }}
              className="w-full flex items-center justify-center cursor-pointer group"
            >
              <img
                src="https://res.cloudinary.com/dfdnljcyt/image/upload/groomish-logo-black-bg_et3gzt.png"
                alt="Groomish"
                className="w-full h-11 sm:h-12 max-h-[52px] object-contain transition-transform group-hover:scale-102"
              />
            </div>

            {/* Mobile Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-white/60 hover:text-white hover:bg-white/10 transition lg:hidden cursor-pointer shrink-0"
              aria-label="Close staff menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

        {/* Stylist Profile Card */}
        <div
          onClick={() => navigate("/staff/dashboard?tab=profile")}
          className={`mx-4 mt-4 mb-2 p-3.5 rounded-2xl border flex items-center gap-3 cursor-pointer transition ${
            isDashboard && activeTab === "profile"
              ? "bg-white/15 border-groomish-orange/50 shadow-sm"
              : "bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20"
          }`}
          title="View & Edit Stylist & Branch Profile"
        >
          <div className="w-10 h-10 rounded-xl bg-groomish-orange text-white font-extrabold text-sm flex items-center justify-center shrink-0 shadow-sm">
            {user?.name?.charAt(0) || "S"}
          </div>
          <div className="min-w-0 flex-1">
            <span className="font-heading font-bold text-xs text-white truncate block">
              {user?.name || "Stylist Specialist"}
            </span>
            <span className="text-[10px] text-white/50 block font-mono truncate">
              {user?.email || "stylist@groomish.com"}
            </span>
          </div>
          <ChevronRight className={`w-3.5 h-3.5 shrink-0 transition-transform ${isDashboard && activeTab === "profile" ? "text-groomish-orange translate-x-0.5" : "text-white/30"}`} />
        </div>

        {/* Assigned Salon Branch Badge */}
        {(user?.storeName || user?.branchName) && (
          <div className="mx-4 mb-3 p-3 rounded-2xl bg-groomish-orange/10 border border-groomish-orange/20">
            <div className="flex items-center gap-2 text-groomish-orange text-xs font-bold">
              <MapPin className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{user?.storeName || user?.branchName}</span>
            </div>
            {user?.storeCode && (
              <span className="inline-block mt-1 text-[9px] font-mono bg-groomish-orange/20 text-groomish-orange font-bold px-1.5 py-0.5 rounded">
                {user.storeCode}
              </span>
            )}
          </div>
        )}

        {/* Navigation Menu */}
        <nav className="p-4 space-y-1.5">
          <div className="text-[10px] uppercase font-bold tracking-wider text-white/40 px-3 py-1">
            Staff Navigation
          </div>

          <button
            onClick={() => {
              navigate("/staff/dashboard");
              onClose?.();
            }}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
              isDashboard && !activeTab
                ? "bg-gradient-to-r from-groomish-orange to-groomish-coral text-white font-bold shadow-glowOrange"
                : "text-white/70 hover:text-white hover:bg-white/10"
            }`}
          >
            <span className="flex items-center gap-2.5">
              <CalendarClock className="w-4 h-4" />
              <span>Branch Bookings</span>
            </span>
            <ChevronRight className="w-3.5 h-3.5 opacity-60" />
          </button>

          <button
            onClick={() => {
              navigate("/staff/dashboard?tab=customers");
              onClose?.();
            }}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
              isDashboard && activeTab === "customers"
                ? "bg-gradient-to-r from-groomish-orange to-groomish-coral text-white font-bold shadow-glowOrange"
                : "text-white/70 hover:text-white hover:bg-white/10"
            }`}
          >
            <span className="flex items-center gap-2.5">
              <Users className="w-4 h-4" />
              <span>Customers</span>
            </span>
            <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-mono">
              Guests
            </span>
          </button>

          <button
            onClick={() => {
              navigate("/staff/dashboard?tab=analytics");
              onClose?.();
            }}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
              isDashboard && activeTab === "analytics"
                ? "bg-gradient-to-r from-groomish-orange to-groomish-coral text-white font-bold shadow-glowOrange"
                : "text-white/70 hover:text-white hover:bg-white/10"
            }`}
          >
            <span className="flex items-center gap-2.5">
              <TrendingUp className="w-4 h-4" />
              <span>Analysis Dashboard</span>
            </span>
            <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-mono">
              Live
            </span>
          </button>

          <button
            onClick={() => {
              navigate("/staff/dashboard?tab=profile");
              onClose?.();
            }}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
              isDashboard && activeTab === "profile"
                ? "bg-gradient-to-r from-groomish-orange to-groomish-coral text-white font-bold shadow-glowOrange"
                : "text-white/70 hover:text-white hover:bg-white/10"
            }`}
          >
            <span className="flex items-center gap-2.5">
              <UserCheck className="w-4 h-4" />
              <span>Stylist Profile</span>
            </span>
            <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-mono">
              Account
            </span>
          </button>

          <button
            onClick={() => {
              navigate("/staff/dashboard?tab=services");
              onClose?.();
            }}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
              isDashboard && activeTab === "services"
                ? "bg-gradient-to-r from-groomish-orange to-groomish-coral text-white font-bold shadow-glowOrange"
                : "text-white/70 hover:text-white hover:bg-white/10"
            }`}
          >
            <span className="flex items-center gap-2.5">
              <Scissors className="w-4 h-4" />
              <span>Branch Services</span>
            </span>
            <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-mono">
              Catalog
            </span>
          </button>

          <button
            onClick={() => {
              navigate("/staff/dashboard?tab=inventory");
              onClose?.();
            }}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
              isDashboard && activeTab === "inventory"
                ? "bg-gradient-to-r from-groomish-orange to-groomish-coral text-white font-bold shadow-glowOrange"
                : "text-white/70 hover:text-white hover:bg-white/10"
            }`}
          >
            <span className="flex items-center gap-2.5">
              <Package className="w-4 h-4" />
              <span>Branch Inventory</span>
            </span>
            <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-mono">
              Stock
            </span>
          </button>
        </nav>
      </div>

      {/* Footer Info & Sign Out */}
      <div className="p-4 border-t border-white/10 space-y-2 shrink-0 bg-groomish-slate">
        <button
          type="button"
          onClick={() => {
            logout();
            onClose?.();
          }}
          className="w-full flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold text-groomish-crimson hover:bg-groomish-crimson/10 transition cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  </>
);
}
