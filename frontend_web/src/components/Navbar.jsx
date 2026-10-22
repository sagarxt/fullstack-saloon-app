import { useState, useEffect } from "react";
import { useAuth } from "../context/useAuth";
import { useNavigate, useLocation } from "react-router-dom";
import AuthModal from "./modals/AuthModal";
import NotificationDrawer from "./modals/NotificationDrawer";
import { getRewardBalance, getNotifications, getUnreadNotificationCount } from "../api/customer";
import { extractList } from "../utils/dataHelper";
import StoreSelectorDropdown from "./StoreSelectorDropdown";
import { useStore } from "../context/StoreContext";
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
  MapPin,
  Ticket,
  ShoppingCart,
} from "lucide-react";
import GroomCoinIcon from "./common/GroomCoinIcon";
import { useCart } from "../context/CartContext";

export default function Navbar() {
  const { user, logout } = useAuth();
  const { selectedStore } = useStore();
  const { cartCount } = useCart();
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

      getUnreadNotificationCount()
        .then((res) => {
          setUnreadCount(Number(res.data?.unreadCount) || 0);
        })
        .catch(() => {
          getNotifications()
            .then((res) => {
              const list = extractList(res.data);
              const unread = list.filter((n) => !n.seen).length;
              setUnreadCount(unread);
            })
            .catch(() => {});
        });
    }
  }, [user, isCustomer]);

  // Navbar is not required for Admin (AdminSidebar is always present) or Staff (StaffDashboard has own header)
  if (isAdmin || isStaff) {
    return null;
  }

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-groomish-slate/10 transition-all duration-300 w-full max-w-full">
        <div className="max-w-7xl mx-auto px-2.5 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* BRAND LOGO & STORE SELECTOR */}
          <div className="flex items-center gap-1.5 xs:gap-3 sm:gap-4 min-w-0">
            <div
              className="flex items-center cursor-pointer group shrink-0"
              onClick={() => navigate("/")}
            >
              <img
                src="/groomish_logo_2.png"
                alt="Groomish Now"
                className="h-7 xs:h-8 sm:h-10 w-auto object-contain transition-transform duration-300 group-hover:scale-105"
              />
            </div>

            {/* STORE SELECTOR PILL */}
            <StoreSelectorDropdown />
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
          <div className="flex items-center gap-1 xs:gap-2 sm:gap-3 shrink-0">
            {/* Cart Icon */}
            <button
              onClick={() => navigate("/cart")}
              className="relative p-1.5 sm:p-2 rounded-full hover:bg-groomish-cream text-groomish-slate transition group"
              aria-label="Shopping Cart"
              title="Cart & Checkout"
            >
              <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5 text-groomish-slate/80 group-hover:text-groomish-orange transition-colors" />
              {cartCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 sm:top-0.5 sm:right-0.5 min-w-[15px] h-3.5 sm:min-w-[18px] sm:h-4.5 px-0.5 rounded-full bg-groomish-orange text-white text-[8px] sm:text-[10px] font-extrabold flex items-center justify-center shadow-sm animate-pulse">
                  {cartCount > 99 ? "99+" : cartCount}
                </span>
              )}
            </button>

            {/* Notification Bell */}
            {user && (
              <button
                onClick={() => setNotifOpen(true)}
                className="relative p-1.5 sm:p-2 rounded-full hover:bg-groomish-cream text-groomish-slate transition"
                aria-label="Notifications"
              >
                <Bell className="w-4 h-4 sm:w-5 sm:h-5 text-groomish-slate/80" />
                {unreadCount > 0 && (
                  <span className="absolute top-0.5 right-0.5 sm:top-1 sm:right-1 w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-groomish-crimson text-white text-[9px] sm:text-[10px] font-bold flex items-center justify-center animate-pulse">
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
                  className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-full bg-groomish-cream hover:bg-groomish-creamDark border border-groomish-slate/15 transition"
                >
                  <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-gradient-to-tr from-groomish-orange to-groomish-coral text-white font-bold text-xs flex items-center justify-center shadow-sm">
                    {user.name ? user.name.charAt(0).toUpperCase() : "U"}
                  </div>
                  <span className="text-xs font-semibold text-groomish-slate max-w-[85px] truncate hidden md:inline">
                    {user.name || "My Account"}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-groomish-slateLight" />
                </button>

                {/* Dropdown Menu */}
                {userDropdown && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-groomish-slate/10 py-2 z-50 animate-fade-in">
                    <div className="px-4 py-2 border-b border-groomish-slate/10">
                      <p className="text-[10px] text-groomish-slate/50 uppercase tracking-wider font-semibold">Signed in</p>
                      <p className="text-xs font-bold text-groomish-slate truncate">{user.email}</p>
                    </div>

                    {/* My Cart */}
                    <button
                      onClick={() => {
                        setUserDropdown(false);
                        navigate("/cart");
                      }}
                      className="w-full px-4 py-2 text-left text-xs font-semibold text-groomish-slate hover:bg-groomish-cream flex items-center justify-between transition"
                    >
                      <div className="flex items-center gap-2.5">
                        <ShoppingCart className="w-4 h-4 text-groomish-orange" />
                        <span>My Cart</span>
                      </div>
                      {cartCount > 0 && (
                        <span className="px-2 py-0.5 rounded-full bg-groomish-orange/15 text-groomish-orange font-bold text-[10px]">
                          {cartCount}
                        </span>
                      )}
                    </button>

                    {/* My Profile */}
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

                    {/* Groom Coins & Rewards below My Profile */}
                    {isCustomer && (
                      <>
                        <button
                          onClick={() => {
                            setUserDropdown(false);
                            navigate("/customer/rewards");
                          }}
                          className="w-full px-4 py-2 text-left text-xs font-semibold text-groomish-slate hover:bg-groomish-cream flex items-center justify-between transition"
                        >
                          <div className="flex items-center gap-2.5">
                            <GroomCoinIcon className="w-4 h-4" />
                            <span>Groom Coins</span>
                          </div>
                          {points !== null && (
                            <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold text-[10px]">
                              {points} GC
                            </span>
                          )}
                        </button>

                        <button
                          onClick={() => {
                            setUserDropdown(false);
                            navigate("/customer/vouchers");
                          }}
                          className="w-full px-4 py-2 text-left text-xs font-semibold text-groomish-slate hover:bg-groomish-cream flex items-center gap-2.5 transition"
                        >
                          <Ticket className="w-4 h-4 text-groomish-goldDark" />
                          <span>My Redeemed Vouchers</span>
                        </button>
                      </>
                    )}

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
                className="btn-primary text-[11px] xs:text-xs px-2 xs:px-3 sm:px-4 py-1.5 sm:py-2 shadow-glowOrange whitespace-nowrap"
              >
                <span className="hidden xs:inline">Sign In / Register</span>
                <span className="xs:hidden">Sign In</span>
              </button>
            )}

            {/* Mobile Hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1 xs:p-1.5 sm:p-2 md:hidden text-groomish-slate rounded-lg hover:bg-black/5"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* MOBILE MENU ACCORDION */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-groomish-slate/10 px-4 py-4 space-y-2 shadow-lg animate-fade-in">
            {/* Active Salon Branch in Mobile Drawer */}
            <div className="p-3 bg-groomish-cream/70 rounded-2xl border border-groomish-slate/10 flex items-center justify-between mb-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-7 h-7 rounded-full bg-groomish-orange/15 flex items-center justify-center text-groomish-orange shrink-0">
                  <MapPin className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] uppercase font-bold text-groomish-orange tracking-wider">Current Salon Branch</p>
                  <p className="text-xs font-bold text-groomish-slate truncate">
                    {selectedStore ? selectedStore.name : "Select a Salon Branch"}
                  </p>
                </div>
              </div>
              {selectedStore?.distanceKm !== null && selectedStore?.distanceKm !== undefined && (
                <span className="text-[10px] font-bold text-groomish-orange bg-groomish-orange/10 px-2 py-0.5 rounded-full shrink-0">
                  {selectedStore.distanceKm} km
                </span>
              )}
            </div>

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
                    navigate("/cart");
                  }}
                  className="w-full text-left font-semibold text-xs uppercase tracking-wider text-groomish-slate py-2 flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <ShoppingCart className="w-4 h-4 text-groomish-orange" />
                    <span>My Cart</span>
                  </div>
                  {cartCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-groomish-orange text-white font-bold text-[10px]">
                      {cartCount}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    navigate("/customer/bookings");
                  }}
                  className="w-full text-left font-semibold text-xs uppercase tracking-wider text-groomish-slate py-2 flex items-center gap-2"
                >
                  <Calendar className="w-4 h-4 text-groomish-orange" />
                  <span>My Bookings</span>
                </button>

                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    navigate("/customer/rewards");
                  }}
                  className="w-full text-left font-semibold text-xs uppercase tracking-wider text-groomish-slate py-2 flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <GroomCoinIcon className="w-4 h-4" />
                    <span>Groom Coins</span>
                  </div>
                  {points !== null && (
                    <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold text-[10px]">
                      {points} GC
                    </span>
                  )}
                </button>

                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    navigate("/customer/profile");
                  }}
                  className="w-full text-left font-semibold text-xs uppercase tracking-wider text-groomish-slate py-2 flex items-center gap-2"
                >
                  <User className="w-4 h-4 text-groomish-orange" />
                  <span>Profile</span>
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

            {user && (
              <div className="border-t border-groomish-slate/10 pt-2 mt-1">
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    logout();
                    navigate("/");
                  }}
                  className="w-full text-left font-semibold text-xs uppercase tracking-wider text-groomish-crimson py-2 flex items-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Log Out</span>
                </button>
              </div>
            )}
          </div>
        )}
      </header>

      {/* MODALS */}
      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
      <NotificationDrawer
        open={notifOpen}
        onClose={() => setNotifOpen(false)}
        onCountChange={setUnreadCount}
      />
    </>
  );
}
