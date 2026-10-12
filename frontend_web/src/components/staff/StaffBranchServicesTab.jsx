import { useState, useEffect, useMemo } from "react";
import {
  getStaffStoreServices,
  toggleStaffStoreService,
} from "../../api/staff";
import {
  getAdminStoreServices,
  toggleAdminStoreService,
} from "../../api/admin";
import {
  Scissors,
  Search,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  Sparkles,
  Filter,
  Check,
  AlertCircle,
  Store,
  Layers,
} from "lucide-react";

export default function StaffBranchServicesTab({
  storeId = null,
  storeName = null,
  isAdmin = false,
}) {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL"); // ALL | AVAILABLE | DISABLED
  const [togglingId, setTogglingId] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const loadServices = async () => {
    setLoading(true);
    try {
      const res = isAdmin && storeId
        ? await getAdminStoreServices(storeId)
        : await getStaffStoreServices();
      setServices(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Failed to load branch services:", err);
      showToast("Unable to load branch services", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadServices();
  }, [storeId]);

  const categories = useMemo(() => {
    const set = new Set();
    services.forEach((s) => {
      if (s.categoryName) set.add(s.categoryName);
    });
    return Array.from(set).sort();
  }, [services]);

  const handleToggle = async (service) => {
    if (!service.globalActive) {
      showToast("This service is disabled globally by salon administrators.", "error");
      return;
    }

    setTogglingId(service.serviceId);
    try {
      const res = isAdmin && storeId
        ? await toggleAdminStoreService(storeId, service.serviceId)
        : await toggleStaffStoreService(service.serviceId);

      const updated = res.data;
      setServices((prev) =>
        prev.map((s) => (s.serviceId === service.serviceId ? updated : s))
      );

      const isNowActive = updated.storeActive;
      showToast(
        `Service "${service.name}" is now ${isNowActive ? "ENABLED" : "DISABLED"} for ${storeName || "this branch"}.`,
        isNowActive ? "success" : "warning"
      );
    } catch (err) {
      console.error("Failed to toggle service:", err);
      const msg = err.response?.data?.message || "Failed to update service availability";
      showToast(msg, "error");
    } finally {
      setTogglingId(null);
    }
  };

  const filtered = useMemo(() => {
    return services.filter((s) => {
      // Category filter
      if (selectedCategory !== "ALL" && s.categoryName !== selectedCategory) {
        return false;
      }
      // Status filter
      if (statusFilter === "AVAILABLE" && !s.effectiveActive) {
        return false;
      }
      if (statusFilter === "DISABLED" && s.effectiveActive) {
        return false;
      }
      // Search
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchName = s.name?.toLowerCase().includes(q);
        const matchCat = s.categoryName?.toLowerCase().includes(q);
        const matchDesc = s.description?.toLowerCase().includes(q);
        if (!matchName && !matchCat && !matchDesc) return false;
      }
      return true;
    });
  }, [services, selectedCategory, statusFilter, search]);

  const stats = useMemo(() => {
    const total = services.length;
    const available = services.filter((s) => s.effectiveActive).length;
    const disabled = total - available;
    return { total, available, disabled };
  }, [services]);

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toast && (
        <div
          className={`p-4 rounded-2xl flex items-center justify-between gap-3 text-xs font-semibold shadow-soft animate-fade-in ${
            toast.type === "success"
              ? "bg-groomish-greenLight text-groomish-green border border-groomish-green/20"
              : toast.type === "warning"
              ? "bg-amber-50 text-amber-800 border border-amber-200"
              : "bg-groomish-crimsonLight text-groomish-crimson border border-groomish-crimson/20"
          }`}
        >
          <div className="flex items-center gap-2">
            {toast.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : toast.type === "warning" ? (
              <AlertTriangle className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            <span>{toast.message}</span>
          </div>
          <button
            onClick={() => setToast(null)}
            className="text-xs opacity-60 hover:opacity-100"
          >
            ✕
          </button>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-white rounded-3xl p-6 border border-groomish-slate/10 shadow-soft">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-groomish-orange font-bold text-xs uppercase tracking-wider mb-1">
              <Store className="w-4 h-4" />
              <span>{storeName ? `${storeName} Catalog` : "Branch Service Availability"}</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-heading font-extrabold text-groomish-slate">
              Salon Services Management
            </h2>
            <p className="text-xs text-groomish-slate/60 mt-1 max-w-2xl">
              Enable or disable specific salon treatments for this location. Disabled services will not appear in walk-in booking or customer appointment options for this branch.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadServices}
              disabled={loading}
              className="p-2.5 rounded-2xl bg-groomish-cream border border-groomish-slate/10 text-groomish-slate hover:bg-groomish-slate/10 transition"
              title="Refresh services"
            >
              <RefreshCw
                className={`w-4 h-4 ${loading ? "animate-spin text-groomish-orange" : ""}`}
              />
            </button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-3 mt-6 pt-6 border-t border-groomish-slate/10">
          <div className="bg-groomish-cream/70 rounded-2xl p-3.5 border border-groomish-slate/10">
            <span className="text-[10px] uppercase font-bold text-groomish-slate/50 block">
              Total Services
            </span>
            <span className="text-xl font-heading font-extrabold text-groomish-slate mt-0.5 block">
              {stats.total}
            </span>
          </div>
          <div className="bg-groomish-greenLight/60 rounded-2xl p-3.5 border border-groomish-green/20">
            <span className="text-[10px] uppercase font-bold text-groomish-green block">
              Enabled at Branch
            </span>
            <span className="text-xl font-heading font-extrabold text-groomish-green mt-0.5 block">
              {stats.available}
            </span>
          </div>
          <div className="bg-amber-50 rounded-2xl p-3.5 border border-amber-200">
            <span className="text-[10px] uppercase font-bold text-amber-700 block">
              Disabled at Branch
            </span>
            <span className="text-xl font-heading font-extrabold text-amber-800 mt-0.5 block">
              {stats.disabled}
            </span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-groomish-slate/10 shadow-soft flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-groomish-slate/40 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search treatments by name, category, or description..."
            className="w-full pl-9 pr-8 py-2.5 rounded-xl bg-groomish-cream/60 border border-groomish-slate/15 text-xs text-groomish-slate placeholder:text-groomish-slate/40 focus:outline-none focus:ring-2 focus:ring-groomish-orange/40 focus:bg-white transition"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-groomish-slate/40 hover:text-groomish-slate text-xs"
            >
              ✕
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex rounded-xl bg-groomish-cream/70 p-1 border border-groomish-slate/10 text-xs">
            {["ALL", "AVAILABLE", "DISABLED"].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1.5 rounded-lg font-bold text-[11px] transition ${
                  statusFilter === status
                    ? "bg-groomish-slate text-white shadow-xs"
                    : "text-groomish-slate/60 hover:text-groomish-slate"
                }`}
              >
                {status === "ALL"
                  ? "All"
                  : status === "AVAILABLE"
                  ? "Available"
                  : "Disabled"}
              </button>
            ))}
          </div>

          {/* Category Dropdown */}
          {categories.length > 0 && (
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="py-2 px-3 rounded-xl bg-groomish-cream/70 border border-groomish-slate/15 text-xs font-semibold text-groomish-slate focus:outline-none focus:ring-2 focus:ring-groomish-orange/40"
            >
              <option value="ALL">All Categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Services Grid */}
      {loading ? (
        <div className="bg-white rounded-3xl p-16 text-center border border-groomish-slate/10 shadow-soft">
          <div className="w-10 h-10 border-4 border-groomish-orange border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-groomish-slate/60">Loading branch services catalog...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-groomish-slate/10 shadow-soft space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-groomish-cream flex items-center justify-center mx-auto text-groomish-slate/40">
            <Scissors className="w-6 h-6" />
          </div>
          <h3 className="font-heading font-bold text-sm text-groomish-slate">
            No services match the selected criteria
          </h3>
          <p className="text-xs text-groomish-slate/50 max-w-sm mx-auto">
            Try adjusting your search query, status filter, or category selection.
          </p>
          {(search || selectedCategory !== "ALL" || statusFilter !== "ALL") && (
            <button
              onClick={() => {
                setSearch("");
                setSelectedCategory("ALL");
                setStatusFilter("ALL");
              }}
              className="btn-outline text-xs px-4 py-2 mt-2"
            >
              Reset Filters
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((s) => {
            const isToggling = togglingId === s.serviceId;
            const isEffectiveActive = s.effectiveActive;

            return (
              <div
                key={s.serviceId}
                className={`bg-white rounded-3xl p-5 border transition-all duration-200 flex flex-col justify-between shadow-soft hover:shadow-card ${
                  !isEffectiveActive
                    ? "border-amber-200/80 bg-amber-50/15"
                    : "border-groomish-slate/10"
                }`}
              >
                <div>
                  {/* Top Bar: Category badge & Active Toggle */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-groomish-cream text-groomish-slate/70 px-2.5 py-1 rounded-full border border-groomish-slate/10">
                        {s.categoryName || "General Service"}
                      </span>
                      {s.gender && (
                        <span className="text-[10px] font-bold uppercase tracking-wider bg-groomish-orange/10 text-groomish-orange px-2 py-0.5 rounded-full">
                          {s.gender}
                        </span>
                      )}
                    </div>

                    {/* Quick status pill */}
                    <span
                      className={`text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full flex items-center gap-1 shrink-0 ${
                        !s.globalActive
                          ? "bg-gray-100 text-gray-500 border border-gray-200"
                          : isEffectiveActive
                          ? "bg-groomish-greenLight text-groomish-green border border-groomish-green/20"
                          : "bg-amber-100 text-amber-800 border border-amber-300"
                      }`}
                    >
                      {!s.globalActive ? (
                        <>
                          <XCircle className="w-3 h-3" />
                          <span>Globally Inactive</span>
                        </>
                      ) : isEffectiveActive ? (
                        <>
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Enabled</span>
                        </>
                      ) : (
                        <>
                          <AlertTriangle className="w-3 h-3" />
                          <span>Branch Disabled</span>
                        </>
                      )}
                    </span>
                  </div>

                  {/* Service info with image */}
                  <div className="flex items-start gap-3.5 mb-3">
                    <div className="w-16 h-16 rounded-2xl bg-groomish-cream overflow-hidden shrink-0 border border-groomish-slate/10 flex items-center justify-center">
                      {s.image ? (
                        <img
                          src={s.image}
                          alt={s.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.style.display = "none";
                          }}
                        />
                      ) : (
                        <Scissors className="w-7 h-7 text-groomish-slate/30" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <h4 className="font-heading font-extrabold text-sm text-groomish-slate leading-tight truncate">
                        {s.name}
                      </h4>
                      {s.description && (
                        <p className="text-[11px] text-groomish-slate/60 line-clamp-2 mt-1 leading-snug">
                          {s.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Pricing & Duration row */}
                  <div className="flex items-center justify-between text-xs py-2.5 px-3 rounded-2xl bg-groomish-cream/60 border border-groomish-slate/10 mb-4">
                    <div className="flex items-center gap-1.5 text-groomish-slate/70">
                      <Clock className="w-3.5 h-3.5 text-groomish-orange" />
                      <span className="font-bold">{s.durationMinutes || 30} mins</span>
                    </div>
                    <div className="flex items-baseline gap-1.5">
                      {s.mrp && s.mrp > s.price && (
                        <span className="text-[11px] text-groomish-slate/40 line-through">
                          ₹{s.mrp}
                        </span>
                      )}
                      <span className="font-heading font-extrabold text-sm text-groomish-slate">
                        ₹{s.price}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Footer Switch Action */}
                <div className="pt-3 border-t border-groomish-slate/10 flex items-center justify-between gap-3">
                  <div className="text-[11px]">
                    <span className="font-bold block text-groomish-slate">
                      Branch Availability
                    </span>
                    <span className="text-[10px] text-groomish-slate/50">
                      {!s.globalActive
                        ? "Disabled globally by salon admin"
                        : isEffectiveActive
                        ? "Offered at this location"
                        : "Turned off for this branch"}
                    </span>
                  </div>

                  {/* Modern Toggle Switch */}
                  <button
                    type="button"
                    onClick={() => handleToggle(s)}
                    disabled={isToggling || !s.globalActive}
                    title={
                      !s.globalActive
                        ? "Disabled globally"
                        : isEffectiveActive
                        ? "Click to disable for this branch"
                        : "Click to enable for this branch"
                    }
                    className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full p-0.5 transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-groomish-orange/40 ${
                      !s.globalActive
                        ? "bg-gray-200 cursor-not-allowed opacity-50"
                        : isEffectiveActive
                        ? "bg-groomish-green"
                        : "bg-gray-300"
                    }`}
                  >
                    <span className="sr-only">Toggle branch availability</span>
                    <span
                      className={`inline-flex h-6 w-6 items-center justify-center rounded-full bg-white shadow-sm transition-transform duration-200 ease-in-out text-[11px] font-bold ${
                        isEffectiveActive
                          ? "translate-x-5 text-groomish-green"
                          : "translate-x-0 text-gray-400"
                      }`}
                    >
                      {isToggling ? (
                        <RefreshCw className="w-3 h-3 animate-spin text-groomish-slate" />
                      ) : isEffectiveActive ? (
                        <Check className="w-3.5 h-3.5" />
                      ) : (
                        <span className="leading-none text-[10px]">✕</span>
                      )}
                    </span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
