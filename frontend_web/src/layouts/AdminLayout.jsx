import { useState, useEffect } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import AdminSidebar from "../components/admin/AdminSidebar";
import { Menu, PanelLeftClose, PanelLeftOpen, ExternalLink } from "lucide-react";

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  // Mobile drawer state
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Desktop collapsed state persisted in localStorage
  const [collapsed, setCollapsed] = useState(() => {
    return localStorage.getItem("groomish_admin_sidebar_collapsed") === "true";
  });

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem("groomish_admin_sidebar_collapsed", String(next));
      return next;
    });
  };

  // Close mobile drawer on navigation
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  // Ctrl+B shortcut to toggle sidebar
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "b") {
        e.preventDefault();
        toggleCollapsed();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="min-h-screen bg-groomish-cream font-sans w-full max-w-full overflow-x-hidden">
      {/* Admin Sidebar Component */}
      <AdminSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        collapsed={collapsed}
        onToggleCollapse={toggleCollapsed}
      />

      {/* Main Layout Area */}
      <div
        className={`flex flex-col min-w-0 min-h-screen transition-all duration-300 ${
          collapsed ? "lg:pl-0" : "lg:pl-64"
        } pl-0`}
      >
        {/* Desktop Top Header Bar with Sidebar Toggle & Quick Links */}
        <header className="hidden lg:flex h-14 bg-white/85 backdrop-blur-md border-b border-groomish-slate/10 px-6 items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={toggleCollapsed}
              className="px-2.5 py-1.5 rounded-xl text-groomish-slate/75 hover:text-groomish-orange hover:bg-groomish-orange/10 border border-groomish-slate/15 transition flex items-center gap-1.5 text-xs font-bold cursor-pointer"
              title={collapsed ? "Show sidebar (Ctrl+B)" : "Hide sidebar (Ctrl+B)"}
            >
              {collapsed ? (
                <>
                  <PanelLeftOpen className="w-4 h-4 text-groomish-orange" />
                  <span>Show Sidebar</span>
                </>
              ) : (
                <>
                  <PanelLeftClose className="w-4 h-4" />
                  <span>Hide Sidebar</span>
                </>
              )}
            </button>
            <span className="text-xs text-groomish-slate/30">|</span>
            <span className="text-xs font-extrabold text-groomish-slate uppercase tracking-wider">
              Admin Workspace
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate("/")}
              className="text-xs font-bold text-groomish-slate/75 hover:text-groomish-orange px-3 py-1.5 rounded-xl border border-groomish-slate/15 transition flex items-center gap-1.5 bg-white shadow-2xs cursor-pointer"
            >
              <span>Customer Store</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
            <div className="flex items-center gap-2 pl-2 border-l border-groomish-slate/15">
              <div className="w-7 h-7 rounded-full bg-groomish-orange/15 text-groomish-orange flex items-center justify-center font-extrabold text-xs">
                A
              </div>
              <span className="text-xs font-bold text-groomish-slate">Super Admin</span>
            </div>
          </div>
        </header>

        {/* Mobile Top Header Bar with Hamburger Button */}
        <header className="lg:hidden h-14 bg-white border-b border-groomish-slate/10 px-3 sm:px-4 flex items-center justify-between sticky top-0 z-30 shadow-2xs">
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="p-1.5 rounded-xl hover:bg-groomish-cream text-groomish-slate border border-groomish-slate/15 transition cursor-pointer"
              aria-label="Open admin navigation menu"
              title="Open Menu"
            >
              <Menu className="w-5 h-5 text-groomish-slate" />
            </button>

            <div
              className="flex items-center gap-2 cursor-pointer"
              onClick={() => navigate("/admin/dashboard")}
            >
              <img
                src="/groomish_logo_2.png"
                alt="Groomish"
                className="h-7 w-auto object-contain"
              />
              <span className="text-[10px] uppercase tracking-wider font-extrabold text-groomish-orange bg-groomish-orange/15 px-2 py-0.5 rounded-full">
                Admin
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => navigate("/")}
              className="text-[11px] font-bold text-groomish-slate/70 hover:text-groomish-orange px-2.5 py-1 rounded-lg border border-groomish-slate/15 transition flex items-center gap-1 bg-groomish-cream/40 cursor-pointer"
              title="View Customer Site"
            >
              <span>Store</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-3 sm:p-5 max-w-7xl w-full mx-auto min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
