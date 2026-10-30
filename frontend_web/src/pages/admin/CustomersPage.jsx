import { useEffect, useState, useRef } from "react";
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
import { showConfirm, showAlert } from "../../context/ConfirmContext";
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
  ChevronDown,
  Check,
  User,
  UserCheck,
  X,
  Clock,
  Award,
  Gift,
  Phone,
  Tag,
  Plus,
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

const getGroupBadgeInfo = (groupId) => {
  switch (groupId) {
    case "NEW_USER":
      return { icon: Sparkles, color: "text-[#FC6957]", bg: "bg-[#FC6957]/10", border: "border-[#FC6957]/20" };
    case "GOLD":
      return { icon: Crown, color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200" };
    case "PLATINUM":
      return { icon: Crown, color: "text-purple-600", bg: "bg-purple-50", border: "border-purple-200" };
    case "SILVER":
      return { icon: Award, color: "text-slate-600", bg: "bg-slate-100", border: "border-slate-200" };
    case "VIP":
      return { icon: Crown, color: "text-rose-600", bg: "bg-rose-50", border: "border-rose-200" };
    case "1_YEAR_PLUS":
    case "2_YEAR_PLUS":
      return { icon: Clock, color: "text-indigo-600", bg: "bg-indigo-50", border: "border-indigo-200" };
    case "FREQUENT_VISITOR":
      return { icon: RefreshCw, color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200" };
    case "CHURN_RISK":
      return { icon: AlertCircle, color: "text-orange-600", bg: "bg-orange-50", border: "border-orange-200" };
    case "STUDENT":
      return { icon: Users, color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-200" };
    case "BIRTHDAY_SPECIAL":
      return { icon: Gift, color: "text-pink-600", bg: "bg-pink-50", border: "border-pink-200" };
    default:
      return { icon: Users, color: "text-groomish-orange", bg: "bg-groomish-orange/10", border: "border-groomish-orange/20" };
  }
};

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

  // Email Campaign Modal State
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [emailForm, setEmailForm] = useState({
    recipientType: "GROUP", // "GROUP" or "INDIVIDUAL"
    userGroup: "ALL",
    selectedCustomer: null,
    userId: "",
    customerEmail: "",
    subject: "",
    message: "",
    couponCode: "",
  });
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailSuccess, setEmailSuccess] = useState("");
  const [emailError, setEmailError] = useState("");

  // Groomish-themed dropdown states & refs
  const groupDropdownRef = useRef(null);
  const customerDropdownRef = useRef(null);
  const [groupDropdownOpen, setGroupDropdownOpen] = useState(false);
  const [customerDropdownOpen, setCustomerDropdownOpen] = useState(false);
  const [groupSearchQuery, setGroupSearchQuery] = useState("");
  const [customerSearchQuery, setCustomerSearchQuery] = useState("");
  const [manualEmailInput, setManualEmailInput] = useState("");
  const [manualEmailError, setManualEmailError] = useState("");

  const handleAddManualEmail = () => {
    const trimmed = manualEmailInput.trim();
    if (!trimmed) {
      setManualEmailError("Please enter an email address.");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmed)) {
      setManualEmailError("Please enter a valid email address (e.g. name@domain.com).");
      return;
    }
    setManualEmailError("");
    setEmailForm((prev) => ({
      ...prev,
      selectedCustomer: null,
      userId: "",
      customerEmail: trimmed,
      subject: prev.subject || "Exclusive Privilege from Groomish Salon",
      message:
        prev.message ||
        `Dear Valued Customer,\n\nWe would love to welcome you to Groomish Now. Here is a curated salon privilege crafted specially for your grooming routine.\n\nBook your experience now!`,
    }));
  };

  // Close custom dropdowns on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (groupDropdownRef.current && !groupDropdownRef.current.contains(e.target)) {
        setGroupDropdownOpen(false);
      }
      if (customerDropdownRef.current && !customerDropdownRef.current.contains(e.target)) {
        setCustomerDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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

  const handleOpenEmailModal = (target = "ALL", isIndividual = false) => {
    if (isIndividual && typeof target === "object" && target !== null) {
      setEmailForm({
        recipientType: "INDIVIDUAL",
        userGroup: "ALL",
        selectedCustomer: target,
        userId: target.id,
        customerEmail: target.email || "",
        subject: `Exclusive Groomish Privilege for ${target.name || "Valued Member"}`,
        message: `Dear ${target.name || "Valued Customer"},\n\nWe would love to welcome you back to Groomish Now. Here is a curated salon offer crafted specially for your grooming routine.\n\nVisit us soon to enjoy your personalized grooming experience!`,
        couponCode: "",
      });
    } else {
      const grp = typeof target === "string" ? target : "ALL";
      setEmailForm({
        recipientType: "GROUP",
        userGroup: grp,
        selectedCustomer: null,
        userId: "",
        customerEmail: "",
        subject: grp !== "ALL" ? `Exclusive Privilege for Groomish ${grp.replace(/_/g, " ")} Members` : "Exclusive Update from Groomish Salon",
        message: `Dear Valued Customer,\n\nWe have tailored exclusive salon services and promotions just for your membership tier.\n\nVisit us soon to enjoy your personalized grooming experience!`,
        couponCode: "",
      });
    }
    setGroupDropdownOpen(false);
    setCustomerDropdownOpen(false);
    setGroupSearchQuery("");
    setCustomerSearchQuery("");
    setManualEmailInput("");
    setManualEmailError("");
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

    let targetCustomerEmail = emailForm.customerEmail?.trim();
    if (emailForm.recipientType === "INDIVIDUAL" && !emailForm.selectedCustomer && !targetCustomerEmail && manualEmailInput.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (emailRegex.test(manualEmailInput.trim())) {
        targetCustomerEmail = manualEmailInput.trim();
        setEmailForm((prev) => ({ ...prev, customerEmail: targetCustomerEmail }));
      } else {
        setEmailError("Please enter a valid email address and click Add to confirm.");
        return;
      }
    }

    if (emailForm.recipientType === "INDIVIDUAL" && !emailForm.selectedCustomer?.id && !targetCustomerEmail) {
      setEmailError("Please select a target customer or enter and add a confirmed email address.");
      return;
    }

    setSendingEmail(true);
    setEmailError("");
    setEmailSuccess("");
    try {
      const payload = {
        recipientType: emailForm.recipientType,
        subject: emailForm.subject.trim(),
        message: emailForm.message.trim(),
        couponCode: emailForm.couponCode?.trim() || null,
      };

      if (emailForm.recipientType === "INDIVIDUAL") {
        payload.userId = emailForm.selectedCustomer?.id || null;
        payload.email = emailForm.selectedCustomer?.email || targetCustomerEmail || null;
      } else {
        payload.userGroup = emailForm.userGroup;
      }

      const res = await sendEmailToUserGroupApi(payload);
      setEmailSuccess(
        res?.data?.message ||
          (emailForm.recipientType === "INDIVIDUAL"
            ? `Email successfully dispatched to ${emailForm.selectedCustomer?.name || emailForm.customerEmail}!`
            : `Campaign sent successfully to group "${emailForm.userGroup}"!`)
      );
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
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenEmailModal(u, true);
                              }}
                              className="p-2 rounded-xl text-groomish-orange bg-white hover:bg-groomish-orangeLight/40 border border-groomish-orange/25 hover:border-groomish-orange transition shadow-2xs cursor-pointer active:scale-95"
                              title={`Send Direct Email to ${u.name || "Customer"}`}
                            >
                              <Mail className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={async (e) => {
                                e.stopPropagation();
                                try {
                                  await deactivateUserApi(u.id);
                                  loadData();
                                } catch (err) {
                                  await showAlert({
                                    title: "Action Failed",
                                    message: err.response?.data?.message || "Failed to toggle customer status.",
                                    variant: "danger",
                                  });
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
                                const ok = await showConfirm({
                                  title: "Force Delete Customer",
                                  message: `Are you sure you want to FORCE DELETE customer "${u.name}"?\nThis permanently removes their customer account, orders, and points.`,
                                  confirmText: "Force Delete Customer",
                                  variant: "danger",
                                });
                                if (!ok) return;

                                try {
                                  await forceDeleteCustomerApi(u.id);
                                  loadData();
                                } catch (err) {
                                  await showAlert({
                                    title: "Deletion Failed",
                                    message: err.response?.data?.message || "Failed to force delete customer.",
                                    variant: "danger",
                                  });
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

      {/* EMAIL MARKETING CAMPAIGN MODAL (GROUP OR INDIVIDUAL) */}
      <ModalWrapper open={emailModalOpen} onClose={() => setEmailModalOpen(false)} maxWidth="max-w-xl">
        {(() => {
          const catalogList = userGroupsCatalog.length > 0 ? userGroupsCatalog : FILTER_GROUPS;
          const selectedGroupObj = catalogList.find((g) => g.id === emailForm.userGroup);
          const currentBadge = getGroupBadgeInfo(emailForm.userGroup);
          const CurrentGroupIcon = currentBadge.icon;

          const filteredGroupOptions = catalogList.filter((g) => {
            const q = groupSearchQuery.toLowerCase();
            return (
              !q ||
              g.name?.toLowerCase().includes(q) ||
              g.label?.toLowerCase().includes(q) ||
              g.id?.toLowerCase().includes(q) ||
              g.description?.toLowerCase().includes(q)
            );
          });

          const filteredCustomersList = userList.filter((c) => {
            const q = customerSearchQuery.toLowerCase();
            return (
              !q ||
              c.name?.toLowerCase().includes(q) ||
              c.email?.toLowerCase().includes(q) ||
              c.phone?.includes(q) ||
              c.tier?.toLowerCase().includes(q)
            );
          });

          return (
            <div className="space-y-4">
              {/* Modal Header */}
              <div className="border-b border-groomish-slate/10 pb-3">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-groomish-orange bg-groomish-orange/10 px-2.5 py-0.5 rounded-full inline-block border border-groomish-orange/20">
                    Email Marketing Campaign
                  </span>
                  <span className="text-[11px] font-mono text-groomish-slate/50">
                    Groomish Now Mailer
                  </span>
                </div>
                <h2 className="text-xl font-heading font-bold text-groomish-slate flex items-center gap-2">
                  <Mail className="w-5 h-5 text-groomish-orange" />
                  <span>
                    {emailForm.recipientType === "INDIVIDUAL"
                      ? "Send Direct Email to Customer"
                      : "Broadcast Email to Customer Group"}
                  </span>
                </h2>
                <p className="text-xs text-groomish-slate/60 mt-0.5">
                  {emailForm.recipientType === "INDIVIDUAL"
                    ? "Dispatch personalized salon updates, exclusive perks, and custom promotional coupon codes to a specific customer."
                    : "Send targeted promotional announcements and coupon codes directly to customer cohorts."}
                </p>
              </div>

              {emailError && (
                <div className="p-3 bg-groomish-crimson/10 text-groomish-crimson text-xs rounded-xl flex items-center gap-2 border border-groomish-crimson/20">
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

              {/* Target Audience Segmented Switch */}
              <div className="p-1 bg-groomish-cream/70 rounded-2xl border border-groomish-slate/10 grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setEmailForm((prev) => ({
                      ...prev,
                      recipientType: "GROUP",
                      subject:
                        prev.userGroup !== "ALL"
                          ? `Exclusive Privilege for Groomish ${prev.userGroup.replace(/_/g, " ")} Members`
                          : "Exclusive Update from Groomish Salon",
                    }));
                  }}
                  className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    emailForm.recipientType === "GROUP"
                      ? "bg-white text-groomish-orange shadow-xs border border-groomish-orange/20"
                      : "text-groomish-slate/60 hover:text-groomish-slate"
                  }`}
                >
                  <Users className="w-4 h-4" />
                  <span>Target Group / Cohort</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEmailForm((prev) => ({
                      ...prev,
                      recipientType: "INDIVIDUAL",
                      subject: prev.selectedCustomer?.name
                        ? `Exclusive Groomish Privilege for ${prev.selectedCustomer.name}`
                        : "Exclusive Privilege from Groomish Salon",
                    }));
                  }}
                  className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    emailForm.recipientType === "INDIVIDUAL"
                      ? "bg-white text-groomish-orange shadow-xs border border-groomish-orange/20"
                      : "text-groomish-slate/60 hover:text-groomish-slate"
                  }`}
                >
                  <User className="w-4 h-4" />
                  <span>Individual Customer</span>
                </button>
              </div>

              <form onSubmit={handleSendEmail} className="space-y-3.5">
                {/* 1. RECIPIENT SELECTION */}
                {emailForm.recipientType === "GROUP" ? (
                  /* GROOMISH-THEMED CUSTOMER GROUP DROPDOWN */
                  <div className="relative" ref={groupDropdownRef}>
                    <label className="block text-xs font-bold text-groomish-slate/80 mb-1 flex items-center justify-between">
                      <span>Target Customer Group *</span>
                      <span className="text-[10px] text-groomish-orange font-bold uppercase tracking-wide">
                        {catalogList.length} Cohorts
                      </span>
                    </label>

                    {/* Trigger Button */}
                    <button
                      type="button"
                      onClick={() => setGroupDropdownOpen((prev) => !prev)}
                      className={`w-full text-left p-3 rounded-2xl border transition-all duration-200 flex items-center justify-between gap-3 bg-white cursor-pointer ${
                        groupDropdownOpen
                          ? "border-groomish-orange ring-2 ring-groomish-orange/15 shadow-sm"
                          : "border-groomish-slate/20 hover:border-groomish-orange/60 hover:bg-groomish-cream/20 shadow-2xs"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border ${currentBadge.bg} ${currentBadge.color} ${currentBadge.border}`}
                        >
                          <CurrentGroupIcon className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-bold text-groomish-slate text-sm">
                              {selectedGroupObj?.name || selectedGroupObj?.label || emailForm.userGroup}
                            </span>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-groomish-slate/5 text-groomish-slate/70 font-bold border border-groomish-slate/10">
                              {emailForm.userGroup}
                            </span>
                          </div>
                          {selectedGroupObj?.description && (
                            <p className="text-[11px] text-groomish-slate/50 truncate">
                              {selectedGroupObj.description}
                            </p>
                          )}
                        </div>
                      </div>
                      <ChevronDown
                        className={`w-4 h-4 text-groomish-slate/50 shrink-0 transition-transform duration-200 ${
                          groupDropdownOpen ? "rotate-180 text-groomish-orange" : ""
                        }`}
                      />
                    </button>

                    {/* Groomish Dropdown Menu */}
                    {groupDropdownOpen && (
                      <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-white rounded-2xl border border-groomish-slate/15 shadow-xl shadow-groomish-slate/10 overflow-hidden animate-fade-in">
                        {/* Search in Dropdown */}
                        <div className="p-2 border-b border-groomish-slate/10 bg-groomish-cream/30">
                          <div className="relative">
                            <Search className="w-3.5 h-3.5 text-groomish-slate/40 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                            <input
                              type="text"
                              value={groupSearchQuery}
                              onChange={(e) => setGroupSearchQuery(e.target.value)}
                              placeholder="Search cohort by name or code..."
                              className="w-full bg-white pl-8 pr-3 py-1.5 text-xs rounded-xl border border-groomish-slate/15 focus:border-groomish-orange focus:outline-hidden text-groomish-slate placeholder:text-groomish-slate/40"
                              autoFocus
                            />
                            {groupSearchQuery && (
                              <button
                                type="button"
                                onClick={() => setGroupSearchQuery("")}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-groomish-slate/40 hover:text-groomish-slate text-xs"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* List */}
                        <div className="max-h-60 overflow-y-auto p-1.5 space-y-1 scrollbar-thin">
                          {filteredGroupOptions.map((g) => {
                            const isSelected = emailForm.userGroup === g.id;
                            const badge = getGroupBadgeInfo(g.id);
                            const IconComp = badge.icon;
                            return (
                              <button
                                key={g.id}
                                type="button"
                                onClick={() => {
                                  setEmailForm((prev) => ({
                                    ...prev,
                                    userGroup: g.id,
                                    subject:
                                      g.id !== "ALL"
                                        ? `Exclusive Privilege for Groomish ${g.name || g.label || g.id} Members`
                                        : "Exclusive Update from Groomish Salon",
                                  }));
                                  setGroupDropdownOpen(false);
                                  setGroupSearchQuery("");
                                }}
                                className={`w-full text-left p-2 rounded-xl transition flex items-center justify-between gap-2.5 cursor-pointer group ${
                                  isSelected
                                    ? "bg-groomish-orange/10 border border-groomish-orange/20 text-groomish-orange"
                                    : "hover:bg-groomish-cream/70 text-groomish-slate border border-transparent"
                                }`}
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <div
                                    className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border ${badge.bg} ${badge.color} ${badge.border}`}
                                  >
                                    <IconComp className="w-3.5 h-3.5" />
                                  </div>
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-1.5">
                                      <span
                                        className={`text-xs font-bold ${
                                          isSelected
                                            ? "text-groomish-orange"
                                            : "text-groomish-slate group-hover:text-groomish-orange"
                                        }`}
                                      >
                                        {g.name || g.label}
                                      </span>
                                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-groomish-slate/5 text-groomish-slate/60">
                                        {g.id}
                                      </span>
                                    </div>
                                    {g.description && (
                                      <p className="text-[10px] text-groomish-slate/50 truncate">
                                        {g.description}
                                      </p>
                                    )}
                                  </div>
                                </div>
                                {isSelected && <Check className="w-4 h-4 text-groomish-orange shrink-0" />}
                              </button>
                            );
                          })}
                          {filteredGroupOptions.length === 0 && (
                            <div className="py-6 text-center text-xs text-groomish-slate/50">
                              No cohorts match "{groupSearchQuery}".
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    <p className="text-[11px] text-groomish-slate/50 mt-1.5">
                      Emails will be dispatched to all customers currently enrolled in this cohort.
                    </p>
                  </div>
                ) : (
                  /* GROOMISH-THEMED INDIVIDUAL CUSTOMER PICKER */
                  <div className="relative" ref={customerDropdownRef}>
                    <label className="block text-xs font-bold text-groomish-slate/80 mb-1 flex items-center justify-between">
                      <span>Target Individual Customer *</span>
                      <span className="text-[10px] text-groomish-orange font-bold uppercase tracking-wide">
                        {userList.length} Active Customers
                      </span>
                    </label>

                    {/* Trigger Button */}
                    <button
                      type="button"
                      onClick={() => setCustomerDropdownOpen((prev) => !prev)}
                      className={`w-full text-left p-3 rounded-2xl border transition-all duration-200 flex items-center justify-between gap-3 bg-white cursor-pointer ${
                        customerDropdownOpen
                          ? "border-groomish-orange ring-2 ring-groomish-orange/15 shadow-sm"
                          : "border-groomish-slate/20 hover:border-groomish-orange/60 hover:bg-groomish-cream/20 shadow-2xs"
                      }`}
                    >
                      {emailForm.selectedCustomer ? (
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-full bg-groomish-orangeLight text-groomish-orange font-extrabold text-xs flex items-center justify-center shrink-0 shadow-2xs border border-groomish-orange/20">
                            {emailForm.selectedCustomer.name?.charAt(0) || "U"}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-groomish-slate text-sm">
                                {emailForm.selectedCustomer.name}
                              </span>
                              <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.2 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                                {emailForm.selectedCustomer.tier || "MEMBER"}
                              </span>
                            </div>
                            <p className="text-[11px] text-groomish-slate/60 truncate font-mono">
                              {emailForm.selectedCustomer.email}{" "}
                              {emailForm.selectedCustomer.phone ? `• ${emailForm.selectedCustomer.phone}` : ""}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2.5 text-groomish-slate/50">
                          <div className="w-8 h-8 rounded-xl bg-groomish-cream flex items-center justify-center text-groomish-slate/40 border border-groomish-slate/10">
                            <User className="w-4 h-4 text-groomish-orange" />
                          </div>
                          <div>
                            <span className="text-xs font-bold text-groomish-slate/80">
                              Select Customer from Directory...
                            </span>
                            <p className="text-[10px] text-groomish-slate/40">
                              Search by customer name, email, or phone number
                            </p>
                          </div>
                        </div>
                      )}
                      <ChevronDown
                        className={`w-4 h-4 text-groomish-slate/50 shrink-0 transition-transform duration-200 ${
                          customerDropdownOpen ? "rotate-180 text-groomish-orange" : ""
                        }`}
                      />
                    </button>

                    {/* Customer Dropdown Menu */}
                    {customerDropdownOpen && (
                      <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-white rounded-2xl border border-groomish-slate/15 shadow-xl shadow-groomish-slate/10 overflow-hidden animate-fade-in">
                        <div className="p-2 border-b border-groomish-slate/10 bg-groomish-cream/30">
                          <div className="relative">
                            <Search className="w-3.5 h-3.5 text-groomish-slate/40 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                            <input
                              type="text"
                              value={customerSearchQuery}
                              onChange={(e) => setCustomerSearchQuery(e.target.value)}
                              placeholder="Search customer by name, email, phone..."
                              className="w-full bg-white pl-8 pr-3 py-1.5 text-xs rounded-xl border border-groomish-slate/15 focus:border-groomish-orange focus:outline-hidden text-groomish-slate placeholder:text-groomish-slate/40"
                              autoFocus
                            />
                            {customerSearchQuery && (
                              <button
                                type="button"
                                onClick={() => setCustomerSearchQuery("")}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-groomish-slate/40 hover:text-groomish-slate text-xs"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="max-h-60 overflow-y-auto p-1.5 space-y-1 scrollbar-thin">
                          {filteredCustomersList.map((cust) => {
                            const isSelected = emailForm.selectedCustomer?.id === cust.id;
                            return (
                              <button
                                key={cust.id}
                                type="button"
                                onClick={() => {
                                  setEmailForm((prev) => ({
                                    ...prev,
                                    selectedCustomer: cust,
                                    userId: cust.id,
                                    customerEmail: cust.email || "",
                                    subject: `Exclusive Groomish Privilege for ${cust.name || "Valued Member"}`,
                                    message: `Dear ${cust.name || "Valued Customer"},\n\nWe would love to welcome you back to Groomish Now. Here is a curated salon offer crafted specially for your grooming routine.\n\nVisit us soon to enjoy your personalized grooming experience!`,
                                  }));
                                  setManualEmailInput("");
                                  setManualEmailError("");
                                  setCustomerDropdownOpen(false);
                                  setCustomerSearchQuery("");
                                }}
                                className={`w-full text-left p-2 rounded-xl transition flex items-center justify-between gap-2.5 cursor-pointer group ${
                                  isSelected
                                    ? "bg-groomish-orange/10 border border-groomish-orange/20 text-groomish-orange"
                                    : "hover:bg-groomish-cream/70 text-groomish-slate border border-transparent"
                                }`}
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <div className="w-7 h-7 rounded-full bg-groomish-orangeLight text-groomish-orange font-extrabold text-[11px] flex items-center justify-center shrink-0">
                                    {cust.name?.charAt(0) || "U"}
                                  </div>
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-1.5">
                                      <span
                                        className={`text-xs font-bold ${
                                          isSelected
                                            ? "text-groomish-orange"
                                            : "text-groomish-slate group-hover:text-groomish-orange"
                                        }`}
                                      >
                                        {cust.name}
                                      </span>
                                      <span className="text-[9px] font-bold uppercase px-1.5 py-0.2 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                                        {cust.tier || "MEMBER"}
                                      </span>
                                    </div>
                                    <div className="text-[10px] text-groomish-slate/50 font-mono truncate">
                                      {cust.email} {cust.phone ? `• ${cust.phone}` : ""}
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-1.5 shrink-0">
                                  <span className="text-[10px] font-extrabold text-amber-600 flex items-center gap-0.5">
                                    <GroomCoinIcon className="w-3 h-3" />
                                    {cust.points ?? 0}
                                  </span>
                                  {isSelected && <Check className="w-4 h-4 text-groomish-orange shrink-0 ml-1" />}
                                </div>
                              </button>
                            );
                          })}
                          {filteredCustomersList.length === 0 && (
                            <div className="py-6 text-center text-xs text-groomish-slate/50">
                              No customers match "{customerSearchQuery}".
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Selected Customer Highlight Card */}
                    {emailForm.selectedCustomer ? (
                      <div className="mt-2 p-2.5 bg-groomish-cream/60 rounded-xl border border-groomish-slate/10 flex items-center justify-between gap-3 text-xs">
                        <div className="flex items-center gap-2">
                          <UserCheck className="w-4 h-4 text-groomish-green shrink-0" />
                          <span className="text-groomish-slate/70">
                            Targeting: <strong className="text-groomish-slate">{emailForm.selectedCustomer.name}</strong> ({emailForm.selectedCustomer.email})
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setEmailForm((prev) => ({
                              ...prev,
                              selectedCustomer: null,
                              userId: "",
                              customerEmail: "",
                            }));
                            setManualEmailInput("");
                            setManualEmailError("");
                          }}
                          className="text-[11px] font-bold text-groomish-crimson hover:underline cursor-pointer"
                        >
                          Clear
                        </button>
                      </div>
                    ) : emailForm.customerEmail ? (
                      /* Confirmed Manual Recipient Badge */
                      <div className="mt-2 p-2.5 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-between gap-3 text-xs animate-fade-in">
                        <div className="flex items-center gap-2 min-w-0">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span className="text-groomish-slate/80 truncate">
                            Confirmed Email: <strong className="text-groomish-slate font-mono">{emailForm.customerEmail}</strong>
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setManualEmailInput(emailForm.customerEmail);
                            setEmailForm((prev) => ({
                              ...prev,
                              customerEmail: "",
                            }));
                            setManualEmailError("");
                          }}
                          className="text-[11px] font-bold text-groomish-orange hover:text-groomish-crimson hover:underline cursor-pointer shrink-0"
                          title="Edit email address"
                        >
                          Change
                        </button>
                      </div>
                    ) : (
                      /* Manual Email Entry with Add Button */
                      <div className="mt-2 space-y-1.5">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-semibold text-groomish-slate/60 shrink-0">
                            Or enter manual email:
                          </span>
                          <input
                            type="email"
                            value={manualEmailInput}
                            onChange={(e) => {
                              setManualEmailInput(e.target.value);
                              setManualEmailError("");
                            }}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                handleAddManualEmail();
                              }
                            }}
                            placeholder="client@example.com"
                            className="bg-white border border-groomish-slate/20 rounded-xl px-3 py-1.5 text-xs text-groomish-slate flex-1 focus:border-groomish-orange focus:outline-hidden font-mono"
                          />
                          <button
                            type="button"
                            onClick={handleAddManualEmail}
                            className="btn-primary text-xs px-3.5 py-1.5 rounded-xl flex items-center gap-1 shrink-0 font-bold shadow-xs cursor-pointer"
                            title="Confirm and attach email recipient"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Add</span>
                          </button>
                        </div>
                        {manualEmailError && (
                          <p className="text-[11px] text-groomish-crimson font-medium pl-1">
                            {manualEmailError}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* 2. EMAIL SUBJECT */}
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

                {/* 3. COUPON CODE */}
                <div>
                  <label className="block text-xs font-bold text-groomish-slate/80 mb-1 flex items-center justify-between">
                    <span>Featured Coupon Code (Optional)</span>
                    <span className="text-[10px] text-groomish-slate/50 font-normal">Highlighted prominently in email</span>
                  </label>
                  <div className="relative">
                    <Tag className="w-3.5 h-3.5 text-groomish-slate/40 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      value={emailForm.couponCode}
                      onChange={(e) => setEmailForm({ ...emailForm, couponCode: e.target.value.toUpperCase() })}
                      className="input-groomish uppercase font-mono font-bold pl-9"
                      placeholder="e.g. GOLD20"
                    />
                  </div>
                </div>

                {/* 4. CAMPAIGN BODY */}
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

                {/* Form Actions */}
                <div className="pt-2 flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setEmailModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl text-xs font-bold bg-groomish-cream text-groomish-slate hover:bg-groomish-slate/10 transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={sendingEmail}
                    className="btn-primary text-xs px-5 py-2.5 flex items-center gap-1.5 cursor-pointer"
                  >
                    {sendingEmail ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Dispatching Email...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span>
                          {emailForm.recipientType === "INDIVIDUAL" ? "Send to Customer" : "Send Campaign"}
                        </span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          );
        })()}
      </ModalWrapper>
    </div>
  );
}
