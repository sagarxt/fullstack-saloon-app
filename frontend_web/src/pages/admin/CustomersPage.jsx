import { useEffect, useState } from "react";
import { getUsersApi } from "../../api/admin";
import Pagination from "../../components/common/Pagination";
import CustomerProfileModal from "../../components/modals/CustomerProfileModal";
import { extractList } from "../../utils/dataHelper";
import { Search, Crown, Sparkles, RefreshCw } from "lucide-react";

const PAGE_SIZE = 20;

export default function CustomersPage() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);
  const [selectedCustomerData, setSelectedCustomerData] = useState(null);
  const [modalInitialTab, setModalInitialTab] = useState("ORDERS");

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await getUsersApi("CUSTOMER", 0, 100);
      setUsers(extractList(res.data));
    } catch (err) {
      console.error(err);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    setPage(1);
  }, [search]);

  const userList = extractList(users);
  const filtered = userList.filter((u) => {
    const q = search.toLowerCase();
    return (
      u.name?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.phone?.includes(q) ||
      u.referralCode?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-extrabold text-groomish-slate">
            Customer Directory & VIP Tiers
          </h1>
          <p className="text-xs text-groomish-slate/60 mt-0.5">
            Registered salon patrons, loyalty reward balances, and membership statuses.
          </p>
        </div>

        <button
          onClick={loadUsers}
          className="p-2.5 rounded-2xl bg-white border border-groomish-slate/15 text-groomish-slate hover:bg-groomish-cream transition self-start sm:self-auto"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-groomish-orange" : ""}`} />
        </button>
      </div>

      {/* Search Input */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-groomish-slate/40 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search customer by name, email, phone, or code..."
          className="input-groomish pl-11"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-3xl border border-groomish-slate/10 shadow-soft overflow-hidden">
        {loading ? (
          <div className="py-16 text-center">
            <div className="w-8 h-8 border-4 border-groomish-orange border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-xs text-groomish-slate/60">Loading customers...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center text-xs text-groomish-slate/50">
            No customers found matching "{search}".
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-groomish-cream/60 border-b border-groomish-slate/10 text-groomish-slate/60 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-6">Customer Name</th>
                  <th className="py-3 px-6">Contact</th>
                  <th className="py-3 px-6">VIP Tier</th>
                  <th className="py-3 px-6">Loyalty Points</th>
                  <th className="py-3 px-6">Referral Code</th>
                  <th className="py-3 px-6">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-groomish-slate/10">
                {filtered
                  .slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
                  .map((u) => (
                  <tr
                    key={u.id}
                    onClick={() => {
                      setModalInitialTab("ORDERS");
                      setSelectedCustomerId(u.id);
                      setSelectedCustomerData(u);
                    }}
                    className="hover:bg-groomish-cream/40 transition cursor-pointer group"
                    title="Click to view customer profile, bookings, points & live cart"
                  >
                    <td className="py-4 px-6 font-bold text-groomish-slate">
                      <div className="flex items-center gap-2.5 text-left">
                        <div className="w-8 h-8 rounded-full bg-groomish-orangeLight text-groomish-orange flex items-center justify-center font-extrabold text-xs group-hover:scale-105 transition shadow-sm">
                          {u.name?.charAt(0) || "U"}
                        </div>
                        <span className="group-hover:text-groomish-orange group-hover:underline underline-offset-2 font-bold transition">
                          {u.name}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-groomish-slate/70">
                      <div>{u.email}</div>
                      <div className="text-[11px] text-groomish-slate/40">{u.phone || "No phone"}</div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-groomish-goldLight text-groomish-slate border border-groomish-gold/30 uppercase">
                        <Crown className="w-3 h-3 text-groomish-gold" />
                        {u.tier || "SILVER"}
                      </span>
                    </td>
                    <td className="py-4 px-6 font-extrabold text-groomish-orange">
                      <span className="flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5" />
                        {u.points ?? 0} pts
                      </span>
                    </td>
                    <td className="py-4 px-6 font-mono font-bold text-groomish-slate">
                      {u.referralCode || "—"}
                    </td>
                    <td className="py-4 px-6">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          u.active !== false
                            ? "bg-groomish-greenLight text-groomish-green"
                            : "bg-groomish-crimsonLight text-groomish-crimson"
                        }`}
                      >
                        {u.active !== false ? "Active" : "Deactive"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {filtered.length > 0 && (
          <div className="p-4 border-t border-groomish-slate/10 bg-white">
            <Pagination
              currentPage={page}
              totalItems={filtered.length}
              pageSize={PAGE_SIZE}
              onPageChange={setPage}
              itemName="customers"
            />
          </div>
        )}
      </div>

      {/* Customer Profile & Rewards Modal */}
      <CustomerProfileModal
        customerId={selectedCustomerId}
        initialData={selectedCustomerData}
        initialTab={modalInitialTab}
        open={Boolean(selectedCustomerId)}
        onStatusChange={loadUsers}
        onClose={() => {
          setSelectedCustomerId(null);
          setSelectedCustomerData(null);
        }}
      />
    </div>
  );
}
