import { useEffect, useState } from "react";
import {
  getUsersApi,
  deactivateUserApi,
  getUserGroupsCatalogApi,
  sendEmailToUserGroupApi,
} from "../../api/admin";
import { forceDeleteCustomerApi } from "../../api/maintenance";
import Pagination from "../../components/common/Pagination";
import CustomerProfileModal from "../../components/modals/CustomerProfileModal";
import ModalWrapper from "../../components/modals/ModalWrapper";
import GroomCoinIcon from "../../components/common/GroomCoinIcon";
import { extractList } from "../../utils/dataHelper";
import {
  Search,
  Crown,
  Sparkles,
  RefreshCw,
  Trash2,
  Users,
  Mail,
  Send,
  AlertCircle,
  CheckCircle2,
  Filter,
  Power,
  Eye,
} from "lucide-react";

const PAGE_SIZE = 20;

const FILTER_GROUPS = [
  { id: "ALL", label: "All Customers" },
  { id: "NEW_USER", label: "New Users (< 30d)" },
  { id: "GOLD", label: "Gold Tier" },
  { id: "PLATINUM", label: "Platinum Tier" },
  { id: "SILVER", label: "Silver Tier" },
  { id: "1_YEAR_PLUS", label: "1+ Year Members" },
  { id: "2_YEAR_PLUS", label: "2+ Years Veterans" },
  { id: "VIP", label: "VIP Spenders" },
  { id: "FREQUENT_VISITOR", label: "Frequent Visitors" },
];

export default function CustomersPage() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedGroup, setSelectedGroup] = useState("ALL");
  const [userGroupsCatalog, setUserGroupsCatalog] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);
  const [selectedCustomerData, setSelectedCustomerData] = useState(null);
  const [modalInitialTab, setModalInitialTab] = useState("ORDERS");

  // Email Broadcast Modal State
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [emailForm, setEmailForm] = useState({
    userGroup: "ALL",
    subject: "",
    message: "",
    couponCode: "",
  });
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailSuccess, setEmailSuccess] = useState("");
  const [emailError, setEmailError] = useState("");

  const loadData = async () => {
    setLoading(true);
    try {
      const [res, groupsRes] = await Promise.all([
        getUsersApi({
          role: "CUSTOMER",
          page: 0,
          size: 150,
          userGroup: selectedGroup !== "ALL" ? selectedGroup : null,
          search: search.trim() || null,
        }),
        getUserGroupsCatalogApi().catch(() => ({ data: [] })),
      ]);
      setUsers(extractList(res.data));
      if (groupsRes?.data && Array.isArray(groupsRes.data)) {
        setUserGroupsCatalog(groupsRes.data);
      }
    } catch (err) {
      console.error(err);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedGroup]);

  useEffect(() => {
    setPage(1);
  }, [search, selectedGroup]);

  const handleOpenEmailModal = (group = "ALL") => {
    setEmailForm({
      userGroup: group,
      subject: group !== "ALL" ? `Exclusive Privilege for Groomish ${group.replace(/_/g, " ")} Members` : "Exclusive Update from Groomish Salon",
      message: `Dear Valued Customer,\n\nWe have tailored exclusive salon services and promotions just for your membership tier.\n\nVisit us soon to enjoy your personalized grooming experience!`,
      couponCode: "",
    });
    setEmailSuccess("");
    setEmailError("");
    setEmailModalOpen(true);
  };

  const handleSendEmail = async (e) => {
    e.preventDefault();
    if (!emailForm.subject.trim() || !emailForm.message.trim()) {
      setEmailError("Subject and Message are required.");
      return;
    }
    setSendingEmail(true);
    setEmailError("");
    setEmailSuccess("");
    try {
      const res = await sendEmailToUserGroupApi({
        userGroup: emailForm.userGroup,
        subject: emailForm.subject.trim(),
        message: emailForm.message.trim(),
        couponCode: emailForm.couponCode?.trim() || null,
      });
      setEmailSuccess(res?.data?.message || `Campaign sent successfully to group "${emailForm.userGroup}"!`);
      setTimeout(() => {
        setEmailModalOpen(false);
        setEmailSuccess("");
      }, 2500);
    } catch (err) {
      setEmailError(err.response?.data?.message || "Failed to broadcast email.");
    } finally {
      setSendingEmail(false);
    }
  };

  const userList = extractList(users);
  const filtered = userList.filter((u) => {
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      u.name?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.phone?.includes(q) ||
      u.referralCode?.toLowerCase().includes(q);

    return matchesSearch;
  });

  return (
    <div className="space-y-6 animate-fade-in text-groomish-slate">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-extrabold text-groomish-slate flex items-center gap-2">
            <span>Customer Directory & User Groups</span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-groomish-orangeLight text-groomish-orange">
              {filtered.length}
            </span>
          </h1>
          <p className="text-xs text-groomish-slate/60 mt-0.5">
            Registered salon patrons, dynamic customer cohorts, Groom Coin balances, and targeted email campaigns.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={loadData}
            className="p-2.5 rounded-2xl bg-white border border-groomish-slate/15 text-groomish-slate hover:bg-groomish-cream transition"
            title="Refresh customer list"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-groomish-orange" : ""}`} />
          </button>

          <button
            onClick={() => handleOpenEmailModal(selectedGroup)}
            className="px-4 py-2.5 rounded-2xl font-bold text-xs bg-white border border-groomish-slate/20 text-groomish-slate hover:border-groomish-orange hover:text-groomish-orange transition flex items-center gap-1.5 shadow-xs"
          >
            <Mail className="w-4 h-4 text-groomish-orange" />
            <span>
              {selectedGroup !== "ALL" ? `Email ${selectedGroup.replace(/_/g, " ")} Group` : "Email Customer Group"}
            </span>
          </button>
        </div>
      </div>

      {/* Customer Groups Filter Bar */}
      <div className="bg-white rounded-2xl border border-groomish-slate/10 p-3 shadow-soft space-y-2">
        <div className="flex items-center gap-2 text-xs font-bold text-groomish-slate/70">
          <Users className="w-3.5 h-3.5 text-groomish-orange" />
          <span>Filter by Customer Cohort:</span>
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
          {FILTER_GROUPS.map((grp) => {
            const isSelected = selectedGroup === grp.id;
            return (
              <button
                key={grp.id}
                type="button"
                onClick={() => setSelectedGroup(grp.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center gap-1 ${isSelected
                  ? "bg-groomish-orange text-white shadow-soft"
                  : "bg-groomish-cream/70 text-groomish-slate hover:bg-groomish-cream hover:text-groomish-orange"
                  }`}
              >
                <span>{grp.label}</span>
              </button>
            );
          })}
        </div>
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
            <p className="text-xs text-groomish-slate/60">Loading customers and groups...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center text-xs text-groomish-slate/50">
            {search
              ? `No customers found matching "${search}".`
              : selectedGroup !== "ALL"
                ? `No customers found in cohort "${selectedGroup.replace(/_/g, " ")}".`
                : "No registered customers found in the system."}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-groomish-cream/60 border-b border-groomish-slate/10 text-groomish-slate/60 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-6">Customer Name</th>
                  <th className="py-3 px-6">Contact</th>
                  <th className="py-3 px-6">Active Groups / Cohorts</th>
                  <th className="py-3 px-6">Groom Coins</th>
                  {/* <th className="py-3 px-6">Referral Code</th> */}
                  <th className="py-3 px-6">Status</th>
                  <th className="py-3 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-groomish-slate/10">
                {filtered
                  .slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
                  .map((u) => {
                    const groups = u.effectiveGroups || u.userGroups || [];

                    return (
                      <tr
                        key={u.id}
                        onClick={() => {
                          setModalInitialTab("INFO");
                          setSelectedCustomerId(u.id);
                          setSelectedCustomerData(u);
                        }}
                        className="hover:bg-groomish-cream/40 transition cursor-pointer group"
                        title="Click to view customer profile, assign groups & view orders"
                      >
                        <td className="py-4 px-6 font-bold text-groomish-slate">
                          <div className="flex items-center gap-2.5 text-left">
                            <div className="w-8 h-8 rounded-full bg-groomish-orangeLight text-groomish-orange flex items-center justify-center font-extrabold text-xs group-hover:scale-105 transition shadow-sm">
                              {u.name?.charAt(0) || "U"}
                            </div>
                            <div>
                              <span className="group-hover:text-groomish-orange group-hover:underline underline-offset-2 font-bold transition block">
                                {u.name}
                              </span>
                              <span className="inline-flex items-center gap-1 text-[10px] text-amber-700 font-extrabold uppercase">
                                <Crown className="w-2.5 h-2.5" />
                                {(() => {
                                  const lifetime = u.lifetimePoints ?? u.points ?? 0;
                                  if (u.tier) return u.tier;
                                  if (lifetime >= 300) return "DIAMOND";
                                  if (lifetime >= 150) return "PLATINUM";
                                  if (lifetime >= 50) return "GOLD";
                                  return "SILVER";
                                })()}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td className="py-4 px-6 text-groomish-slate/70">
                          <div>{u.email}</div>
                          <div className="text-[11px] text-groomish-slate/40 font-mono">{u.phone || "No phone"}</div>
                        </td>

                        <td className="py-4 px-6">
                          <div className="flex items-center gap-1 flex-wrap max-w-xs">
                            {groups.length > 0 ? (
                              groups.slice(0, 3).map((grp) => (
                                <span
                                  key={grp}
                                  className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-bold text-[10px] border border-indigo-200/60"
                                >
                                  {grp.replace(/_/g, " ")}
                                </span>
                              ))
                            ) : (
                              <span className="text-[10px] text-groomish-slate/40 italic">
                                Standard Member
                              </span>
                            )}
                            {groups.length > 3 && (
                              <span className="text-[10px] font-bold text-groomish-slate/50">
                                +{groups.length - 3} more
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="py-4 px-6 font-extrabold text-amber-600">
                          <span className="flex items-center gap-1.5">
                            <GroomCoinIcon className="w-4 h-4" />
                            {u.points ?? 0}
                          </span>
                        </td>

                        {/* <td className="py-4 px-6 font-mono font-bold text-groomish-slate">
                          {u.referralCode || "—"}
                        </td> */}

                        <td className="py-4 px-6">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${u.active !== false
                              ? "bg-groomish-greenLight text-groomish-green"
                              : "bg-groomish-crimsonLight text-groomish-crimson"
                              }`}
                          >
                            {u.active !== false ? "Active" : "Deactive"}
                          </span>
                        </td>

                        <td className="py-4 px-6 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1.5">
                            {/* <button
                              onClick={() => {
                                setModalInitialTab("INFO");
                                setSelectedCustomerId(u.id);
                                setSelectedCustomerData(u);
                              }}
                              className="p-2 rounded-xl text-groomish-slate bg-white hover:bg-groomish-orangeLight hover:text-groomish-orange border border-groomish-slate/15 hover:border-groomish-orange/40 transition shadow-2xs cursor-pointer active:scale-95"
                              title="View Customer Profile & Rewards"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button> */}

                            <button
                              onClick={async (e) => {
                                e.stopPropagation();
                                try {
                                  await deactivateUserApi(u.id);
                                  loadData();
                                } catch (err) {
                                  alert(err.response?.data?.message || "Failed to toggle status");
                                }
                              }}
                              className={`p-2 rounded-xl border transition shadow-2xs cursor-pointer active:scale-95 ${u.active !== false
                                ? "bg-white text-groomish-crimson border-groomish-crimson/20 hover:bg-groomish-crimson/10"
                                : "bg-white text-groomish-green border-groomish-green/20 hover:bg-groomish-green/10"
                                }`}
                              title={u.active !== false ? "Deactivate Customer" : "Activate Customer"}
                            >
                              <Power className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={async (e) => {
                                e.stopPropagation();
                                if (window.confirm(`FORCE DELETE customer "${u.name}"?\nThis permanently removes their customer account, orders, and points.`)) {
                                  try {
                                    await forceDeleteCustomerApi(u.id);
                                    loadData();
                                  } catch (err) {
                                    alert(err.response?.data?.message || "Failed to force delete customer.");
                                  }
                                }
                              }}
                              className="p-2 rounded-xl border border-red-200 text-red-600 bg-white hover:bg-red-50 hover:border-red-300 transition shadow-2xs cursor-pointer active:scale-95"
                              title="Force Delete Customer Permanently"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
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
        onStatusChange={loadData}
        onClose={() => {
          setSelectedCustomerId(null);
          setSelectedCustomerData(null);
        }}
      />

      {/* BROADCAST EMAIL TO USER GROUP MODAL */}
      <ModalWrapper open={emailModalOpen} onClose={() => setEmailModalOpen(false)} maxWidth="max-w-lg">
        <div className="space-y-4">
          <div className="border-b border-groomish-slate/10 pb-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full inline-block mb-1 border border-indigo-200">
              Email Marketing Campaign
            </span>
            <h2 className="text-xl font-heading font-bold text-groomish-slate flex items-center gap-2">
              <Mail className="w-5 h-5 text-groomish-orange" />
              <span>Broadcast Email to Customer Group</span>
            </h2>
            <p className="text-xs text-groomish-slate/60 mt-0.5">
              Send personalized promotional announcements and coupon codes directly to targeted customer cohorts.
            </p>
          </div>

          {emailError && (
            <div className="p-3 bg-groomish-crimson/10 text-groomish-crimson text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{emailError}</span>
            </div>
          )}

          {emailSuccess && (
            <div className="p-3 bg-emerald-50 text-emerald-700 text-xs rounded-xl flex items-center gap-2 border border-emerald-200">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{emailSuccess}</span>
            </div>
          )}

          <form onSubmit={handleSendEmail} className="space-y-3.5">
            <div>
              <label className="block text-xs font-bold text-groomish-slate/80 mb-1">
                Target Customer Group *
              </label>
              <select
                value={emailForm.userGroup}
                onChange={(e) => setEmailForm({ ...emailForm, userGroup: e.target.value })}
                className="input-groomish font-semibold"
              >
                {userGroupsCatalog.length > 0 ? (
                  userGroupsCatalog.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name} ({g.id})
                    </option>
                  ))
                ) : (
                  FILTER_GROUPS.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.label} ({g.id})
                    </option>
                  ))
                )}
              </select>
              <p className="text-[11px] text-groomish-slate/50 mt-1">
                Emails will be dispatched to all customers currently enrolled in this cohort.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-groomish-slate/80 mb-1">
                Email Subject *
              </label>
              <input
                value={emailForm.subject}
                onChange={(e) => setEmailForm({ ...emailForm, subject: e.target.value })}
                required
                className="input-groomish font-semibold"
                placeholder="e.g. Special Weekend Privilege for Groomish Members"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-groomish-slate/80 mb-1">
                Featured Coupon Code (Optional)
              </label>
              <input
                value={emailForm.couponCode}
                onChange={(e) => setEmailForm({ ...emailForm, couponCode: e.target.value.toUpperCase() })}
                className="input-groomish uppercase font-mono font-bold"
                placeholder="e.g. GOLD20 (Will be prominently highlighted in email)"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-groomish-slate/80 mb-1">
                Campaign Message Body *
              </label>
              <textarea
                rows={5}
                value={emailForm.message}
                onChange={(e) => setEmailForm({ ...emailForm, message: e.target.value })}
                required
                className="input-groomish text-xs leading-relaxed"
                placeholder="Enter email announcement text..."
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setEmailModalOpen(false)}
                className="px-4 py-2.5 rounded-xl text-xs font-bold bg-groomish-cream text-groomish-slate hover:bg-groomish-slate/10 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={sendingEmail}
                className="btn-primary text-xs px-5 py-2.5 flex items-center gap-1.5"
              >
                {sendingEmail ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Broadcasting Emails...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Send Campaign</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </ModalWrapper>
    </div>
  );
}
