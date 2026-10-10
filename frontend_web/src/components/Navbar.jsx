import { useState, useEffect } from "react";
import { useAuth } from "../context/useAuth";
import { useNavigate, useLocation } from "react-router-dom";
import AuthModal from "./modals/AuthModal";
import NotificationDrawer from "./modals/NotificationDrawer";
import { getRewardBalance, getNotifications } from "../api/customer";
import { extractList } from "../utils/dataHelper";
import {
  Bell,
  Calendar,
  Gift,
  User,
  LogOut,
  LayoutDashboard,
  Briefcase,
  ChevronDown,
  Menu,
  X,
  Sparkles,
} from "lucide-react";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [authOpen, setAuthOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [userDropdown, setUserDropdown] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [points, setPoints] = useState(null);
  const [tier, setTier] = useState("SILVER");
  const [unreadCount, setUnreadCount] = useState(0);

  const role = (user?.role || "").replace("ROLE_", "");
  const isCustomer = role === "CUSTOMER";
  const isAdmin = role === "ADMIN";
  const isStaff = role === "STAFF";

  useEffect(() => {
    if (user && isCustomer) {
      getRewardBalance()
        .then((res) => {
          setPoints(res.data?.points ?? 0);
          setTier(res.data?.tier ?? "SILVER");
        })
        .catch(() => {});

      getNotifications()
        .then((res) => {
          const list = extractList(res.data);
          const unread = list.filter((n) => !n.seen).length;
          setUnreadCount(unread);
        })
        .catch(() => {});
    }
  }, [user, isCustomer]);

  // Navbar is not required for Admin (AdminSidebar is always present) or Staff (StaffDashboard has own header)
  if (isAdmin || isStaff) {
    return null;
  }

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-groomish-slate/10 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* BRAND LOGO - Only groomish_logo_2 which contains both logo and name */}
          <div
            className="flex items-center cursor-pointer group"
            onClick={() => navigate("/")}
          >
            <img
              src="/groomish_logo_2.png"
              alt="Groomish Now"
              className="h-10 w-auto object-contain transition-transform duration-300 group-hover:scale-105"
            />
          </div>

          {/* DESKTOP NAV LINKS */}
          <nav className="hidden md:flex items-center gap-7">
            <button
              onClick={() => navigate("/")}
              className={`text-xs uppercase tracking-wider font-bold transition ${
                location.pathname === "/"
                  ? "text-groomish-orange border-b-2 border-groomish-orange pb-0.5"
                  : "text-groomish-slate/80 hover:text-groomish-orange"
              }`}
            >
              Home
            </button>
            <button
              onClick={() => navigate("/categories")}
              className={`text-xs uppercase tracking-wider font-bold transition ${
                location.pathname === "/categories"
                  ? "text-groomish-orange border-b-2 border-groomish-orange pb-0.5"
                  : "text-groomish-slate/80 hover:text-groomish-orange"
              }`}
            >
              Categories
            </button>
            <button
              onClick={() => navigate("/services")}
              className={`text-xs uppercase tracking-wider font-bold transition ${
                location.pathname === "/services"
                  ? "text-groomish-orange border-b-2 border-groomish-orange pb-0.5"
                  : "text-groomish-slate/80 hover:text-groomish-orange"
              }`}
            >
              Services
            </button>
            <button
              onClick={() => navigate("/products")}
              className={`text-xs uppercase tracking-wider font-bold transition ${
                location.pathname === "/products"
                  ? "text-groomish-orange border-b-2 border-groomish-orange pb-0.5"
                  : "text-groomish-slate/80 hover:text-groomish-orange"
              }`}
            >
              Shop
            </button>

            {isCustomer && (
              <>
                <button
                  onClick={() => navigate("/customer/bookings")}
                  className={`text-xs uppercase tracking-wider font-bold transition ${
                    location.pathname.startsWith("/customer/bookings")
                      ? "text-groomish-orange border-b-2 border-groomish-orange pb-0.5"
                      : "text-groomish-slate/80 hover:text-groomish-orange"
                  }`}
                >
                  My Bookings
                </button>
                <button
                  onClick={() => navigate("/customer/rewards")}
                  className={`text-xs uppercase tracking-wider font-bold transition ${
                    location.pathname.startsWith("/customer/rewards")
                      ? "text-groomish-orange border-b-2 border-groomish-orange pb-0.5"
                      : "text-groomish-slate/80 hover:text-groomish-orange"
                  }`}
                >
                  Loyalty Rewards
                </button>
              </>
            )}

            {isAdmin && (
              <button
                onClick={() => navigate("/admin/dashboard")}
                className="text-xs font-bold text-white bg-groomish-slate px-3 py-1 rounded-full hover:bg-groomish-slateDark transition"
              >
                Admin Panel
              </button>
            )}
          </nav>

          {/* RIGHT UTILITY ICONS & USER SECTION */}
          <div className="flex items-center gap-3">
            {/* Loyalty Points Pill (Customer Only) */}
            {user && isCustomer && points !== null && (
              <div
                onClick={() => navigate("/customer/rewards")}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-groomish-goldLight border border-groomish-gold/40 text-groomish-slate cursor-pointer hover:shadow-soft transition"
                title="View your Groomish loyalty reward points"
              >
                <Sparkles className="w-3.5 h-3.5 text-groomish-orange fill-groomish-orange" />
                <span className="text-xs font-extrabold">{points}</span>
                <span className="text-[10px] font-semibold text-groomish-slate/60 uppercase">
                  pts ({tier})
                </span>
              </div>
            )}

            {/* Notification Bell */}
            {user && (
              <button
                onClick={() => setNotifOpen(true)}
                className="relative p-2 rounded-full hover:bg-groomish-cream text-groomish-slate transition"
                aria-label="Notifications"
              >
                <Bell className="w-5 h-5 text-groomish-slate/80" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-groomish-crimson text-white text-[10px] font-bold flex items-center justify-center animate-pulse">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>
            )}

            {/* Authenticated User Menu */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setUserDropdown(!userDropdown)}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-full bg-groomish-cream hover:bg-groomish-creamDark border border-groomish-slate/15 transition"
                >
                  <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-groomish-orange to-groomish-coral text-white font-bold text-xs flex items-center justify-center shadow-sm">
                    {user.name ? user.name.charAt(0).toUpperCase() : "U"}
                  </div>
                  <span className="text-xs font-semibold text-groomish-slate max-w-[85px] truncate hidden sm:inline">
                    {user.name || "My Account"}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-groomish-slateLight" />
                </button>

                {/* Dropdown Menu - Simplified to strictly Profile & Logout */}
                {userDropdown && (
                  <div className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-xl border border-groomish-slate/10 py-2 z-50 animate-fade-in">
                    <div className="px-4 py-2 border-b border-groomish-slate/10">
                      <p className="text-[10px] text-groomish-slate/50 uppercase tracking-wider font-semibold">Signed in</p>
                      <p className="text-xs font-bold text-groomish-slate truncate">{user.email}</p>
                    </div>

                    {/* ONLY Profile */}
                    <button
                      onClick={() => {
                        setUserDropdown(false);
                        navigate("/customer/profile");
                      }}
                      className="w-full px-4 py-2 text-left text-xs font-semibold text-groomish-slate hover:bg-groomish-cream flex items-center gap-2.5 transition"
                    >
                      <User className="w-4 h-4 text-groomish-orange" />
                      <span>My Profile</span>
                    </button>

                    {isAdmin && (
                      <button
                        onClick={() => {
                          setUserDropdown(false);
                          navigate("/admin/dashboard");
                        }}
                        className="w-full px-4 py-2 text-left text-xs font-semibold text-groomish-slate hover:bg-groomish-cream flex items-center gap-2.5 transition"
                      >
                        <LayoutDashboard className="w-4 h-4 text-groomish-slate" />
                        <span>Admin Portal</span>
                      </button>
                    )}

                    {isStaff && (
                      <button
                        onClick={() => {
                          setUserDropdown(false);
                          navigate("/staff/dashboard");
                        }}
                        className="w-full px-4 py-2 text-left text-xs font-semibold text-groomish-slate hover:bg-groomish-cream flex items-center gap-2.5 transition"
                      >
                        <Briefcase className="w-4 h-4 text-groomish-green" />
                        <span>Staff Portal</span>
                      </button>
                    )}

                    {/* ONLY Logout */}
                    <div className="border-t border-groomish-slate/10 mt-1 pt-1">
                      <button
                        onClick={() => {
                          setUserDropdown(false);
                          logout();
                          navigate("/");
                        }}
                        className="w-full px-4 py-2 text-left text-xs font-semibold text-groomish-crimson hover:bg-groomish-crimsonLight flex items-center gap-2.5 transition"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Log Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => setAuthOpen(true)}
                className="btn-primary text-xs px-4 py-2 shadow-glowOrange"
              >
                Sign In / Register
              </button>
            )}

            {/* Mobile Hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 md:hidden text-groomish-slate rounded-lg hover:bg-black/5"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* MOBILE MENU ACCORDION */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-groomish-slate/10 px-4 py-4 space-y-2 shadow-lg">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                navigate("/");
              }}
              className="w-full text-left font-semibold text-xs uppercase tracking-wider text-groomish-slate py-2"
            >
              Home
            </button>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                navigate("/categories");
              }}
              className="w-full text-left font-semibold text-xs uppercase tracking-wider text-groomish-slate py-2"
            >
              Categories
            </button>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                navigate("/services");
              }}
              className="w-full text-left font-semibold text-xs uppercase tracking-wider text-groomish-slate py-2"
            >
              Services
            </button>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                navigate("/products");
              }}
              className="w-full text-left font-semibold text-xs uppercase tracking-wider text-groomish-slate py-2"
            >
              Shop
            </button>

            {isCustomer && (
              <>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    navigate("/customer/bookings");
                  }}
                  className="w-full text-left font-semibold text-xs uppercase tracking-wider text-groomish-slate py-2"
                >
                  My Bookings
                </button>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    navigate("/customer/rewards");
                  }}
                  className="w-full text-left font-semibold text-xs uppercase tracking-wider text-groomish-slate py-2"
                >
                  Loyalty Rewards
                </button>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    navigate("/customer/profile");
                  }}
                  className="w-full text-left font-semibold text-xs uppercase tracking-wider text-groomish-slate py-2"
                >
                  Profile
                </button>
              </>
            )}

            {isAdmin && (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  navigate("/admin/dashboard");
                }}
                className="w-full text-left font-semibold text-xs uppercase tracking-wider text-groomish-orange py-2"
              >
                Admin Panel
              </button>
            )}
          </div>
        )}
      </header>

      {/* MODALS */}
      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
      <NotificationDrawer open={notifOpen} onClose={() => setNotifOpen(false)} />
    </>
  );
}
