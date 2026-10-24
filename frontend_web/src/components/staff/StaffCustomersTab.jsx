import { useState, useEffect } from "react";
import { getStaffCustomers } from "../../api/staff";
import CustomerProfileModal from "../modals/CustomerProfileModal";
import GroomCoinIcon from "../common/GroomCoinIcon";
import Pagination from "../common/Pagination";
import { extractList } from "../../utils/dataHelper";
import {
  Users,
  Search,
  User,
  Crown,
  Sparkles,
  Phone,
  Mail,
  RefreshCw,
  Plus,
  X,
  ChevronRight,
  ShieldCheck,
  Calendar,
} from "lucide-react";

const PAGE_SIZE = 20;

const TIERS = [
  { id: "ALL", label: "All Customers" },
  { id: "DIAMOND", label: "Diamond" },
  { id: "PLATINUM", label: "Platinum" },
  { id: "GOLD", label: "Gold" },
  { id: "SILVER", label: "Silver" },
];

export default function StaffCustomersTab({ onOpenRegisterModal }) {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedTier, setSelectedTier] = useState("ALL");
  const [page, setPage] = useState(1);
  const [totalElements, setTotalElements] = useState(0);

  // Selected customer for Profile Modal
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);
  const [selectedCustomerData, setSelectedCustomerData] = useState(null);
  const [profileModalOpen, setProfileModalOpen] = useState(false);

  const loadCustomers = async () => {
    setLoading(true);
    try {
      const res = await getStaffCustomers(search.trim(), null, page - 1, PAGE_SIZE);
      const data = res.data;
      if (data && data.content) {
        setCustomers(data.content);
        setTotalElements(data.totalElements || data.content.length);
      } else {
        const list = extractList(data);
        setCustomers(list);
        setTotalElements(list.length);
      }
    } catch (err) {
      console.error("Failed to load staff customers:", err);
      setCustomers([]);
      setTotalElements(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, [page, search]);

  useEffect(() => {
    setPage(1);
  }, [search, selectedTier]);

  const filteredCustomers = customers.filter((c) => {
    if (selectedTier === "ALL") return true;
    return (c.tier || "SILVER").toUpperCase() === selectedTier;
  });

  const getTierBadgeStyle = (tier) => {
    switch (String(tier || "").toUpperCase()) {
      case "DIAMOND":
        return "bg-cyan-100 text-cyan-800 border-cyan-300";
      case "PLATINUM":
        return "bg-purple-100 text-purple-800 border-purple-300";
      case "GOLD":
        return "bg-amber-100 text-amber-800 border-amber-300";
      default:
        return "bg-slate-100 text-slate-700 border-slate-300";
    }
  };

  const handleOpenCustomer = (customer) => {
    setSelectedCustomerId(customer.id);
    setSelectedCustomerData(customer);
    setProfileModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Title & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-extrabold text-groomish-slate flex items-center gap-2.5">
            <Users className="w-6 h-6 text-groomish-orange" />
            <span>Customer Directory</span>
          </h1>
          <p className="text-xs text-groomish-slate/60 mt-0.5">
            Browse all salon guests, review appointment history across branches, and view loyalty Groom Coins.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadCustomers}
            className="p-2.5 rounded-2xl bg-white border border-groomish-slate/15 text-groomish-slate hover:bg-groomish-cream transition cursor-pointer"
            title="Refresh customer list"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-groomish-orange" : ""}`} />
          </button>

          {onOpenRegisterModal && (
            <button
              onClick={onOpenRegisterModal}
              className="btn-primary text-xs px-4 py-2.5 inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Register Walk-In Guest</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Customers Card Container */}
      <div className="bg-white rounded-3xl border border-groomish-slate/10 shadow-soft overflow-hidden">
        {/* Search & Tier Filters Bar */}
        <div className="p-4 sm:p-6 border-b border-groomish-slate/10 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Tier Tabs */}
          <div className="flex gap-1.5 flex-wrap">
            {TIERS.map((t) => (
              <button
                key={t.id}
                onClick={() => setSelectedTier(t.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  selectedTier === t.id
                    ? "bg-groomish-slate text-white shadow-soft"
                    : "bg-groomish-cream text-groomish-slate/75 hover:bg-groomish-slate/10"
                }`}
              >
                <span>{t.label}</span>
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="flex items-center gap-3 w-full lg:w-auto">
            <div className="relative flex-1 lg:w-72">
              <Search className="w-4 h-4 text-groomish-slate/40 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, phone, email..."
                className="w-full pl-9 pr-8 py-2 rounded-xl bg-groomish-cream/70 border border-groomish-slate/15 text-xs text-groomish-slate placeholder:text-groomish-slate/40 focus:outline-none focus:ring-2 focus:ring-groomish-orange/40 focus:bg-white transition"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-groomish-slate/40 hover:text-groomish-slate p-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <span className="text-xs text-groomish-slate/50 font-medium whitespace-nowrap">
              {totalElements} guests
            </span>
          </div>
        </div>

        {/* Customer List / Table */}
        {loading ? (
          <div className="py-16 text-center">
            <div className="w-8 h-8 border-4 border-groomish-orange border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-xs text-groomish-slate/60">Loading customers...</p>
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="py-14 text-center text-xs text-groomish-slate/50 space-y-2">
            <Users className="w-8 h-8 text-groomish-slate/30 mx-auto" />
            <p className="font-semibold text-groomish-slate text-sm">No customers found</p>
            <p className="text-groomish-slate/60 text-xs">
              {search ? `No customer matching "${search}"` : "No customers registered yet."}
            </p>
            {search && (
              <button
                onClick={() => setSearch("")}
                className="mt-2 text-xs font-bold text-groomish-orange hover:underline inline-block cursor-pointer"
              >
                Clear search filter
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-groomish-slate/10">
            {filteredCustomers.map((c) => {
              const initials = (c.name || "G")
                .split(" ")
                .map((n) => n[0])
                .join("")
                .substring(0, 2)
                .toUpperCase();

              return (
                <div
                  key={c.id}
                  className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-groomish-cream/40 transition"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-11 h-11 rounded-2xl bg-groomish-orangeLight text-groomish-orange font-black text-sm flex items-center justify-center shrink-0 border border-groomish-orange/20 shadow-xs">
                      {initials}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          type="button"
                          onClick={() => handleOpenCustomer(c)}
                          className="font-heading font-bold text-sm text-groomish-slate hover:text-groomish-orange hover:underline text-left transition cursor-pointer truncate"
                          title="Click to view client full profile & appointments"
                        >
                          {c.name || "Salon Guest"}
                        </button>

                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${getTierBadgeStyle(
                            c.tier
                          )}`}
                        >
                          {c.tier || "SILVER"}
                        </span>

                        {c.active === false && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700 border border-rose-200">
                            Inactive
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 text-xs text-groomish-slate/60 flex-wrap mt-1">
                        {c.phone && (
                          <span className="flex items-center gap-1 font-mono">
                            <Phone className="w-3 h-3 text-groomish-slate/40" />
                            {c.phone}
                          </span>
                        )}
                        {c.email && (
                          <span className="flex items-center gap-1">
                            <Mail className="w-3 h-3 text-groomish-slate/40" />
                            <span className="truncate max-w-[200px]">{c.email}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right side stats + Button */}
                  <div className="flex items-center gap-3 shrink-0 justify-between sm:justify-end">
                    <div className="text-right">
                      <div className="flex items-center gap-1 text-amber-700 font-extrabold text-xs bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-xl">
                        <GroomCoinIcon className="w-3.5 h-3.5" />
                        <span>{c.totalRewardPoints ?? c.pointsBalance ?? 0} coins</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleOpenCustomer(c)}
                      className="btn-secondary text-xs px-3.5 py-2 inline-flex items-center gap-1 cursor-pointer active:scale-95"
                      title="View all customer bookings, points, and profile details"
                    >
                      <span>View Profile & Bookings</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {totalElements > PAGE_SIZE && (
          <div className="p-4 border-t border-groomish-slate/10 bg-white">
            <Pagination
              currentPage={page}
              totalItems={totalElements}
              pageSize={PAGE_SIZE}
              onPageChange={setPage}
              itemName="customers"
            />
          </div>
        )}
      </div>

      {/* Customer Profile Modal using Staff Endpoints */}
      {selectedCustomerId && (
        <CustomerProfileModal
          customerId={selectedCustomerId}
          initialData={selectedCustomerData}
          open={profileModalOpen}
          onClose={() => setProfileModalOpen(false)}
          onStatusChange={loadCustomers}
        />
      )}
    </div>
  );
}
