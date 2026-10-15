import { useState } from "react";
import ModalWrapper from "./ModalWrapper";
import { clearDatabasesApi } from "../../api/maintenance";
import {
  Database,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  ShieldCheck,
  Layers,
  Scissors,
  Package,
  Calendar,
  Users,
  UserCheck,
  Tag,
  Bell,
  Sparkles,
  MapPin,
  RefreshCw,
} from "lucide-react";

export default function DatabaseResetModal({ open, onClose, onRefresh }) {
  const [options, setOptions] = useState({
    categories: false,
    services: false,
    products: false,
    brands: false,
    bookings: false,
    customers: false,
    staff: false,
    coupons: false,
    notifications: false,
    rewardPoints: false,
    stores: false,
  });

  const [confirmText, setConfirmText] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const sections = [
    {
      key: "categories",
      label: "Categories",
      desc: "Catalog collections & groupings",
      icon: Layers,
    },
    {
      key: "services",
      label: "Services",
      desc: "Treatments, pricing & durations",
      icon: Scissors,
    },
    {
      key: "products",
      label: "Products",
      desc: "Store inventory & retail items",
      icon: Package,
    },
    {
      key: "brands",
      label: "Brands",
      desc: "Product brand labels & tags",
      icon: Tag,
    },
    {
      key: "bookings",
      label: "Bookings",
      desc: "All client appointments & timeline logs",
      icon: Calendar,
    },
    {
      key: "customers",
      label: "Customers",
      desc: "Customer profiles, carts & referrals",
      icon: Users,
    },
    {
      key: "staff",
      label: "Staff Members",
      desc: "Stylists & store staff assignments",
      icon: UserCheck,
    },
    {
      key: "coupons",
      label: "Coupons",
      desc: "Discount codes & redeemed vouchers",
      icon: Tag,
    },
    {
      key: "notifications",
      label: "Notifications",
      desc: "System alerts & activity notices",
      icon: Bell,
    },
    {
      key: "rewardPoints",
      label: "Groom Coins & Rewards",
      desc: "Coin ledgers, tier history & rewards",
      icon: Sparkles,
    },
    {
      key: "stores",
      label: "Stores / Branches",
      desc: "Salon branches & location catalog",
      icon: MapPin,
    },
  ];

  const toggleOption = (key) => {
    setOptions((prev) => ({ ...prev, [key]: !prev[key] }));
    setResult(null);
  };

  const handleSelectAll = () => {
    const allSelected = {};
    sections.forEach((s) => (allSelected[s.key] = true));
    setOptions(allSelected);
    setResult(null);
  };

  const handleDeselectAll = () => {
    const noneSelected = {};
    sections.forEach((s) => (noneSelected[s.key] = false));
    setOptions(noneSelected);
    setResult(null);
  };

  const selectedCount = Object.values(options).filter(Boolean).length;
  const isAllSelected = selectedCount === sections.length;

  const handleExecute = async () => {
    if (selectedCount === 0) {
      setError("Please select at least one database section to clear.");
      return;
    }
    if (confirmText.trim().toUpperCase() !== "CLEAR") {
      setError("Please type 'CLEAR' in uppercase to confirm database reset.");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const payload = {
        all: isAllSelected,
        ...options,
      };
      const res = await clearDatabasesApi(payload);
      setResult(res.data);
      setConfirmText("");
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error("Database reset failed:", err);
      setError(
        err.response?.data?.message ||
        err.message ||
        "Failed to clear database. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalWrapper open={open} onClose={onClose} maxWidth="max-w-2xl">
      <div className="space-y-4">
        {/* Header */}
        <div className="border-b border-groomish-slate/10 pb-3">
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-groomish-crimson mb-1">
            <AlertTriangle className="w-4 h-4" />
            <span>Admin Data Management</span>
          </div>
          <h2 className="text-xl font-heading font-extrabold text-groomish-slate flex items-center gap-2">
            <Database className="w-5 h-5 text-groomish-crimson" />
            <span>Database Maintenance & Purge Center</span>
          </h2>
          <p className="text-xs text-groomish-slate/60 mt-1">
            Purge database tables selectively or entirely.
          </p>
        </div>

        {/* Admin Safety Guarantee Banner */}
        <div className="p-3 bg-groomish-green/10 border border-groomish-green/20 rounded-2xl flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-groomish-green text-white flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-groomish-slate">
              Administrator Accounts Protected
            </h4>
            <p className="text-[11px] text-groomish-slate/70">
              Admin credentials and super-admin accounts are strictly preserved and will NEVER be deleted.
            </p>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-groomish-crimson/10 text-groomish-crimson text-xs rounded-xl flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {result && (
          <div className="p-4 bg-groomish-greenLight border border-groomish-green/30 rounded-2xl text-xs space-y-2">
            <div className="flex items-center gap-2 font-bold text-groomish-green">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{result.message}</span>
            </div>
            {result.clearedCounts && Object.keys(result.clearedCounts).length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1 font-mono text-[11px]">
                {Object.entries(result.clearedCounts).map(([k, v]) => (
                  <div key={k} className="p-1.5 bg-white rounded-lg border border-groomish-slate/10 flex justify-between">
                    <span className="capitalize">{k}:</span>
                    <span className="font-bold text-groomish-crimson">{v} cleared</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Selection Controls */}
        <div className="flex items-center justify-between pt-1">
          <span className="text-xs font-bold text-groomish-slate">
            Select Sections to Clear ({selectedCount} of {sections.length} selected):
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSelectAll}
              className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-groomish-slate/10 text-groomish-slate hover:bg-groomish-slate/20 transition"
            >
              Select All
            </button>
            <button
              type="button"
              onClick={handleDeselectAll}
              className="px-2.5 py-1 rounded-lg text-[11px] font-bold text-groomish-slate/60 hover:text-groomish-slate transition"
            >
              Deselect All
            </button>
          </div>
        </div>

        {/* Sections Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[300px] overflow-y-auto pr-1">
          {sections.map((s) => {
            const Icon = s.icon;
            const checked = options[s.key];
            return (
              <div
                key={s.key}
                onClick={() => toggleOption(s.key)}
                className={`p-3 rounded-2xl border transition cursor-pointer flex items-start gap-3 select-none ${
                  checked
                    ? "bg-groomish-crimson/5 border-groomish-crimson shadow-xs"
                    : "bg-white border-groomish-slate/15 hover:border-groomish-slate/30"
                }`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => {}} // handled by div onClick
                  className="mt-0.5 rounded border-groomish-slate/30 text-groomish-crimson focus:ring-groomish-crimson"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <Icon className={`w-3.5 h-3.5 ${checked ? "text-groomish-crimson" : "text-groomish-slate/60"}`} />
                    <span className={`text-xs font-bold ${checked ? "text-groomish-crimson" : "text-groomish-slate"}`}>
                      {s.label}
                    </span>
                  </div>
                  <p className="text-[10px] text-groomish-slate/50 truncate mt-0.5">
                    {s.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Confirmation Input & Actions */}
        <div className="border-t border-groomish-slate/10 pt-4 space-y-3">
          <div className="bg-groomish-cream/40 p-3 rounded-2xl border border-groomish-slate/10 space-y-2">
            <label className="block text-xs font-bold text-groomish-slate">
              Type <span className="font-mono text-groomish-crimson font-extrabold uppercase">CLEAR</span> to confirm deletion:
            </label>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="Type CLEAR to unlock button"
              className="w-full px-3.5 py-2 rounded-xl border border-groomish-slate/20 bg-white text-xs font-mono font-bold text-groomish-slate focus:outline-none focus:ring-2 focus:ring-groomish-crimson/40"
            />
          </div>

          <div className="flex items-center justify-between gap-3 flex-wrap">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 rounded-xl text-xs font-bold text-groomish-slate/70 hover:bg-groomish-cream transition"
            >
              Close
            </button>

            <button
              type="button"
              onClick={handleExecute}
              disabled={loading || selectedCount === 0 || confirmText.trim().toUpperCase() !== "CLEAR"}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-soft ${
                loading || selectedCount === 0 || confirmText.trim().toUpperCase() !== "CLEAR"
                  ? "bg-groomish-slate/20 text-groomish-slate/40 cursor-not-allowed"
                  : "bg-red-600 hover:bg-red-700 text-white shadow-red-200"
              }`}
            >
              {loading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Purging Database...</span>
                </>
              ) : (
                <>
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>
                    {isAllSelected
                      ? "Purge All Data (Keep Admins Only)"
                      : `Purge ${selectedCount} Selected Section${selectedCount > 1 ? "s" : ""}`}
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </ModalWrapper>
  );
}
