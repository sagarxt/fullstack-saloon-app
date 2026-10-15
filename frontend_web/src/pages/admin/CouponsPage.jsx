import { useEffect, useState } from "react";
import {
  getCouponsApi,
  createCouponApi,
  updateCouponApi,
  getUserGroupsCatalogApi,
  sendEmailToUserGroupApi,
} from "../../api/admin";
import { forceDeleteCouponApi } from "../../api/maintenance";
import { getCategoriesApi } from "../../api/category";
import ModalWrapper from "../../components/modals/ModalWrapper";
import CustomMultiSelect from "../../components/common/CustomMultiSelect";
import CustomDatePicker from "../../components/common/CustomDatePicker";
import { extractList } from "../../utils/dataHelper";
import { showConfirm } from "../../context/ConfirmContext";
import {
  Tag,
  Plus,
  Trash2,
  RefreshCw,
  AlertCircle,
  Sparkles,
  Calendar,
  Users,
  Mail,
  Send,
  Clock,
  CheckCircle2,
  Check,
  Copy,
  Layers,
  ChevronRight,
  ShieldAlert,
  Edit2,
  Power,
} from "lucide-react";

const DEFAULT_GROUPS = [
  { id: "ALL", name: "All Customers", description: "Universal - every registered patron" },
  { id: "NEW_USER", name: "New Customers (< 30 days)", description: "Recent signups" },
  { id: "SILVER", name: "Silver Tier", description: "Standard tier members" },
  { id: "GOLD", name: "Gold Tier", description: "1.25x Points tier" },
  { id: "PLATINUM", name: "Platinum Tier", description: "1.5x Points VIP tier" },
  { id: "1_YEAR_PLUS", name: "1+ Year Loyalists", description: "Accounts active > 1 year" },
  { id: "2_YEAR_PLUS", name: "2+ Years Veterans", description: "Accounts active > 2 years" },
  { id: "VIP", name: "VIP Patrons", description: "High-value spenders" },
  { id: "FREQUENT_VISITOR", name: "Frequent Visitors", description: "Regular monthly visitors" },
  { id: "BIRTHDAY_SPECIAL", name: "Birthday Special", description: "Birthday month celebrants" },
  { id: "STUDENT", name: "Students Cohort", description: "Campus discounts" },
  { id: "CHURN_RISK", name: "Re-engagement (Winback)", description: "Inactive 60+ days" },
];

export default function CouponsPage() {
  const [coupons, setCoupons] = useState([]);
  const [categories, setCategories] = useState([]);
  const [userGroupsCatalog, setUserGroupsCatalog] = useState(DEFAULT_GROUPS);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState("");
  const [copiedCode, setCopiedCode] = useState(null);

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

  // Coupon Form State
  const todayStr = new Date().toISOString().slice(0, 10);
  const futureStr = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  const [form, setForm] = useState({
    code: "",
    description: "",
    discount: "",
    minAmount: "",
    maxDiscount: "",
    startDate: todayStr,
    expiryDate: futureStr,
    applicableUserGroups: [],
    eligibleCategories: [],
    active: true,
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [couponsRes, catRes, groupsRes] = await Promise.all([
        getCouponsApi(),
        getCategoriesApi().catch(() => ({ data: [] })),
        getUserGroupsCatalogApi().catch(() => ({ data: DEFAULT_GROUPS })),
      ]);
      setCoupons(extractList(couponsRes.data));
      setCategories(extractList(catRes.data));
      if (groupsRes?.data && Array.isArray(groupsRes.data)) {
        setUserGroupsCatalog(groupsRes.data);
      }
    } catch (err) {
      console.error("Error loading coupons:", err);
      setCoupons([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleApplyPresetDays = (days) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    setForm((prev) => ({ ...prev, expiryDate: d.toISOString().slice(0, 10) }));
  };

  const handleOpenCreate = () => {
    setEditingCoupon(null);
    setForm({
      code: "",
      description: "",
      discount: "",
      minAmount: "",
      maxDiscount: "",
      startDate: todayStr,
      expiryDate: futureStr,
      applicableUserGroups: [],
      eligibleCategories: [],
      active: true,
    });
    setError("");
    setOpen(true);
  };

  const handleOpenEdit = (coupon) => {
    setEditingCoupon(coupon);
    setForm({
      code: coupon.code || "",
      description: coupon.description || "",
      discount: coupon.discount != null ? String(coupon.discount) : "",
      minAmount: coupon.minAmount != null ? String(coupon.minAmount) : "",
      maxDiscount: coupon.maxDiscount != null ? String(coupon.maxDiscount) : "",
      startDate: coupon.startDate ? coupon.startDate.slice(0, 10) : "",
      expiryDate: coupon.expiryDate ? coupon.expiryDate.slice(0, 10) : "",
      applicableUserGroups: coupon.applicableUserGroups || [],
      eligibleCategories: coupon.eligibleCategories || [],
      active: coupon.active !== false,
    });
    setError("");
    setOpen(true);
  };

  const handleToggleActive = async (coupon) => {
    const nextActive = coupon.active === false ? true : false;
    try {
      await updateCouponApi(coupon.id, { active: nextActive });
      loadData();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update coupon status");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.code || !form.discount) {
      setError("Coupon code and discount are required.");
      return;
    }

    if (form.code.trim().length > 25) {
      setError("Coupon code cannot exceed 25 characters.");
      return;
    }

    if (form.startDate && form.expiryDate && form.startDate > form.expiryDate) {
      setError("Start date cannot be after the expiration date.");
      return;
    }

    setSubmitLoading(true);
    setError("");
    try {
      const payload = {
        code: form.code.trim().toUpperCase(),
        description: form.description.trim(),
        discount: Number(form.discount),
        minAmount: form.minAmount ? Number(form.minAmount) : 0,
        maxDiscount: form.maxDiscount ? Number(form.maxDiscount) : null,
        startDate: form.startDate ? `${form.startDate}T00:00:00` : null,
        expiryDate: form.expiryDate ? `${form.expiryDate}T23:59:59` : null,
        applicableUserGroups: form.applicableUserGroups || [],
        eligibleCategories: form.eligibleCategories || [],
        active: form.active !== false,
      };

      if (editingCoupon) {
        await updateCouponApi(editingCoupon.id, payload);
      } else {
        await createCouponApi(payload);
      }

      setOpen(false);
      setEditingCoupon(null);
      loadData();
    } catch (err) {
      const msg = err.response?.data?.message || (editingCoupon ? "Failed to update coupon." : "Failed to create coupon.");
      setError(msg);
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDelete = async (id) => {
    const ok = await showConfirm({
      title: "Force Delete Promo Coupon",
      message: "Are you sure you want to FORCE DELETE this promo coupon permanently from database?",
      confirmText: "Force Delete Coupon",
      variant: "danger",
    });
    if (!ok) return;
    try {
      await forceDeleteCouponApi(id);
      loadData();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to force delete coupon");
    }
  };

  const handleOpenEmailModal = (coupon = null) => {
    let targetGroup = "ALL";
    let defaultCode = "";
    if (coupon) {
      defaultCode = coupon.code;
      if (coupon.applicableUserGroups && coupon.applicableUserGroups.length > 0) {
        targetGroup = coupon.applicableUserGroups[0];
      }
    }
    setEmailForm({
      userGroup: targetGroup,
      subject: coupon ? `Special Offer: Enjoy ₹${coupon.discount} Off with code ${coupon.code}!` : "Exclusive Update from Groomish Salon",
      message: coupon
        ? `We're delighted to offer our valued members an exclusive ₹${coupon.discount} discount on your next salon appointment.\n\nUse your personalized coupon code: ${coupon.code} at checkout.\n\nBook your experience now!`
        : "Hello from Groomish! We have exciting new services and seasonal privileges crafted exclusively for you.",
      couponCode: defaultCode,
    });
    setEmailSuccess("");
    setEmailError("");
    setEmailModalOpen(true);
  };

  const handleSendEmail = async (e) => {
    e.preventDefault();
    if (!emailForm.subject.trim() || !emailForm.message.trim()) {
      setEmailError("Subject and Message body are required.");
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

  const couponList = extractList(coupons);

  const getValidityStatus = (coupon) => {
    if (coupon.active === false) {
      return { label: "Deactivated", color: "bg-gray-100 text-gray-600 border-gray-300" };
    }
    const now = new Date();
    if (coupon.expiryDate) {
      const exp = new Date(coupon.expiryDate);
      if (exp < now) {
        return { label: "Expired", color: "bg-red-50 text-red-600 border-red-200" };
      }
    }
    if (coupon.startDate) {
      const start = new Date(coupon.startDate);
      if (start > now) {
        return { label: "Upcoming", color: "bg-amber-50 text-amber-600 border-amber-200" };
      }
    }
    return { label: "Active", color: "bg-emerald-50 text-emerald-600 border-emerald-200" };
  };

  const formatDateDisplay = (dateStr) => {
    if (!dateStr) return null;
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in text-groomish-slate">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-extrabold text-groomish-slate flex items-center gap-2">
            <span>Promotional Coupons & Target Cohorts</span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-groomish-orangeLight text-groomish-orange">
              {couponList.length}
            </span>
          </h1>
          <p className="text-xs text-groomish-slate/60 mt-0.5">
            Configure coupons with Start & Expiry dates, target specific Customer Groups, edit details, and toggle activation status.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={loadData}
            className="p-2.5 rounded-2xl bg-white border border-groomish-slate/15 text-groomish-slate hover:bg-groomish-cream transition"
            title="Refresh coupons"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-groomish-orange" : ""}`} />
          </button>

          <button
            onClick={() => handleOpenEmailModal(null)}
            className="px-4 py-2.5 rounded-2xl font-bold text-xs bg-white border border-groomish-slate/20 text-groomish-slate hover:border-groomish-orange hover:text-groomish-orange transition flex items-center gap-1.5 shadow-xs"
          >
            <Mail className="w-4 h-4 text-groomish-orange" />
            <span>Email User Group</span>
          </button>

          <button
            onClick={handleOpenCreate}
            className="btn-primary text-xs px-4 py-2.5 flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Create Coupon</span>
          </button>
        </div>
      </div>

      {/* Coupons Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {loading ? (
          <div className="col-span-full py-16 text-center">
            <div className="w-8 h-8 border-4 border-groomish-orange border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-xs text-groomish-slate/60">Loading coupons and user cohorts...</p>
          </div>
        ) : couponList.length === 0 ? (
          <div className="col-span-full bg-white rounded-3xl border border-groomish-slate/10 p-12 text-center max-w-md mx-auto shadow-soft">
            <Tag className="w-10 h-10 text-groomish-slate/30 mx-auto mb-3" />
            <h3 className="font-heading font-bold text-base text-groomish-slate">
              No Promotional Coupons Active
            </h3>
            <p className="text-xs text-groomish-slate/50 mt-1 mb-4">
              Create coupons with custom validity windows and user groups to boost salon appointments.
            </p>
            <button
              onClick={handleOpenCreate}
              className="btn-primary text-xs px-4 py-2 inline-flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Create First Coupon</span>
            </button>
          </div>
        ) : (
          couponList.map((c) => {
            const status = getValidityStatus(c);
            const startDisplay = formatDateDisplay(c.startDate);
            const expiryDisplay = formatDateDisplay(c.expiryDate);

            return (
              <div
                key={c.id}
                className={`bg-white rounded-3xl border ${
                  c.active === false ? "border-groomish-slate/20 opacity-85" : "border-groomish-slate/10"
                } p-5 shadow-soft hover:shadow-card transition flex flex-col justify-between relative group`}
              >
                <div>
                  {/* Coupon Header: Code on left, Active/Deactivated Status on top right */}
                  <div className="flex items-center justify-between gap-2 mb-2.5">
                    <button
                      type="button"
                      onClick={() => handleCopyCode(c.code)}
                      className="font-mono text-sm sm:text-base font-black tracking-wider text-groomish-orange bg-groomish-orangeLight px-3 py-1 rounded-xl border border-groomish-orange/20 hover:bg-groomish-orange/20 transition flex items-center gap-1.5 group/btn truncate max-w-[210px]"
                      title="Click to copy coupon code"
                    >
                      <span className="truncate">{c.code}</span>
                      {copiedCode === c.code ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      ) : (
                        <Copy className="w-3.5 h-3.5 opacity-60 group-hover/btn:opacity-100 shrink-0" />
                      )}
                    </button>

                    {/* Active / Deactivated Status on top right */}
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold border shrink-0 ${status.color}`}
                    >
                      {status.label}
                    </span>
                  </div>

                  <p className="text-xs text-groomish-slate/75 font-medium line-clamp-2 min-h-[32px]">
                    {c.description || "Flat discount promotional coupon"}
                  </p>

                  {/* Customer Group Restriction Badges */}
                  <div className="mt-3">
                    <span className="text-[10px] uppercase font-bold text-groomish-slate/50 block mb-1">
                      Eligible Customer Groups
                    </span>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {c.applicableUserGroups && c.applicableUserGroups.length > 0 ? (
                        c.applicableUserGroups.map((grp) => (
                          <span
                            key={grp}
                            className="px-2 py-0.5 rounded-lg bg-indigo-50 text-indigo-700 font-bold text-[10px] border border-indigo-200/60 inline-flex items-center gap-1"
                          >
                            <Users className="w-2.5 h-2.5" />
                            {grp.replace(/_/g, " ")}
                          </span>
                        ))
                      ) : (
                        <span className="px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-700 font-bold text-[10px] border border-emerald-200 inline-flex items-center gap-1">
                          👥 All Customer Groups
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Eligible Categories Badges */}
                  <div className="mt-2.5">
                    <span className="text-[10px] uppercase font-bold text-groomish-slate/50 block mb-1">
                      Salon Categories
                    </span>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {c.eligibleCategories && c.eligibleCategories.length > 0 ? (
                        c.eligibleCategories.map((cat) => (
                          <span
                            key={cat}
                            className="px-2 py-0.5 rounded-lg bg-groomish-orangeLight text-groomish-orange font-bold text-[10px] border border-groomish-orange/20"
                          >
                            {cat}
                          </span>
                        ))
                      ) : (
                        <span className="px-2 py-0.5 rounded-lg bg-groomish-cream text-groomish-slate/70 font-semibold text-[10px] border border-groomish-slate/10">
                          🌐 All Categories
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Value / Threshold Details */}
                  <div className="mt-4 pt-3 border-t border-groomish-slate/10 space-y-1.5 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-groomish-slate/60">Discount Value:</span>
                      <span className="font-extrabold text-groomish-slate text-sm">
                        ₹{c.discount} Flat Off
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-groomish-slate/60">Min Spend Req:</span>
                      <span className="font-medium text-groomish-slate">
                        ₹{c.minAmount || 0}
                      </span>
                    </div>
                    {c.maxDiscount && (
                      <div className="flex justify-between items-center">
                        <span className="text-groomish-slate/60">Max Discount:</span>
                        <span className="font-medium text-groomish-slate">
                          ₹{c.maxDiscount}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Date Schedule Display */}
                  <div className="mt-3 pt-2.5 border-t border-groomish-slate/10 text-[11px] text-groomish-slate/65 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1 text-groomish-slate/50">
                        <Calendar className="w-3 h-3" />
                        Valid Window:
                      </span>
                      <span className="font-semibold text-groomish-slate">
                        {startDisplay ? startDisplay : "Instant"} → {expiryDisplay ? expiryDisplay : "Never Expires"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Actions Footer: Email Group button + Action Icons (Edit, Power, Delete) */}
                <div className="mt-4 pt-3 border-t border-groomish-slate/10 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => handleOpenEmailModal(c)}
                    className="flex-1 py-1.5 px-3 rounded-xl bg-groomish-cream/80 hover:bg-groomish-orange hover:text-white text-groomish-slate font-bold text-xs transition flex items-center justify-center gap-1.5 border border-groomish-slate/10 active:scale-98"
                    title="Send targeted email campaign to eligible group"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>Email Group</span>
                  </button>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {/* Edit Button */}
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(c)}
                      className="p-1.5 rounded-xl text-groomish-slate bg-white hover:bg-groomish-orangeLight hover:text-groomish-orange border border-groomish-slate/15 hover:border-groomish-orange/40 transition shadow-2xs cursor-pointer active:scale-95"
                      title="Edit Coupon"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    {/* Toggle Deactivate / Activate Button */}
                    <button
                      type="button"
                      onClick={() => handleToggleActive(c)}
                      className={`p-1.5 rounded-xl border transition shadow-2xs cursor-pointer active:scale-95 ${
                        c.active !== false
                          ? "bg-white text-groomish-crimson border-groomish-crimson/20 hover:bg-groomish-crimson/10"
                          : "bg-white text-groomish-green border-groomish-green/20 hover:bg-groomish-green/10"
                      }`}
                      title={c.active !== false ? "Click to Deactivate Coupon" : "Click to Activate Coupon"}
                    >
                      <Power className="w-3.5 h-3.5" />
                    </button>

                    {/* Delete Button */}
                    <button
                      type="button"
                      onClick={() => handleDelete(c.id)}
                      className="p-1.5 rounded-xl border border-red-200 text-red-600 bg-white hover:bg-red-50 hover:border-red-300 transition shadow-2xs cursor-pointer active:scale-95"
                      title="Force Delete Coupon"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* CREATE / EDIT COUPON MODAL */}
      <ModalWrapper open={open} onClose={() => setOpen(false)} maxWidth="max-w-xl">
        <div className="space-y-4">
          <div className="border-b border-groomish-slate/10 pb-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-groomish-orange bg-groomish-orangeLight px-2.5 py-0.5 rounded-full inline-block mb-1">
              {editingCoupon ? "Edit Offer" : "New Offer"}
            </span>
            <h2 className="text-xl font-heading font-bold text-groomish-slate">
              {editingCoupon ? "Edit Promotional Coupon" : "Create Promotional Coupon"}
            </h2>
            <p className="text-xs text-groomish-slate/60 mt-0.5">
              {editingCoupon
                ? "Update discount amounts, scheduled dates, active status, or target customer cohorts."
                : "Set discount amounts, minimum spend limits, scheduled dates, and target customer groups."}
            </p>
          </div>

          {error && (
            <div className="p-3 bg-groomish-crimson/10 text-groomish-crimson text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-groomish-slate/80">
                    Coupon Code *
                  </label>
                  <span className={`text-[10px] font-mono ${form.code.length >= 25 ? "text-amber-600 font-bold" : "text-groomish-slate/40"}`}>
                    {form.code.length}/25
                  </span>
                </div>
                <input
                  value={form.code}
                  maxLength={25}
                  onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase().slice(0, 25) })}
                  required
                  className="input-groomish uppercase font-mono font-bold"
                  placeholder="e.g. GOLD20 (Max 25 chars)"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-groomish-slate/80 mb-1">
                  Flat Discount (₹) *
                </label>
                <input
                  type="number"
                  value={form.discount}
                  onChange={(e) => setForm({ ...form, discount: e.target.value })}
                  required
                  min={1}
                  className="input-groomish font-bold"
                  placeholder="e.g. 100"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-groomish-slate/70 mb-1">
                  Min Cart Spend (₹)
                </label>
                <input
                  type="number"
                  value={form.minAmount}
                  onChange={(e) => setForm({ ...form, minAmount: e.target.value })}
                  className="input-groomish"
                  placeholder="0 (No minimum)"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-groomish-slate/70 mb-1">
                  Max Cap Limit (₹)
                </label>
                <input
                  type="number"
                  value={form.maxDiscount}
                  onChange={(e) => setForm({ ...form, maxDiscount: e.target.value })}
                  className="input-groomish"
                  placeholder="500 (Optional)"
                />
              </div>
            </div>

            {/* Start Date & Expiration Date */}
            <div className="p-3.5 rounded-2xl bg-groomish-cream/40 border border-groomish-slate/10 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-groomish-slate flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-groomish-orange" />
                  Validity Schedule (Start & Expiry)
                </span>
                <div className="flex items-center gap-1">
                  <span className="text-[10px] text-groomish-slate/50">Presets:</span>
                  {[
                    { label: "7d", days: 7 },
                    { label: "30d", days: 30 },
                    { label: "60d", days: 60 },
                    { label: "1y", days: 365 },
                  ].map((p) => (
                    <button
                      key={p.days}
                      type="button"
                      onClick={() => handleApplyPresetDays(p.days)}
                      className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-white border border-groomish-slate/15 hover:border-groomish-orange hover:text-groomish-orange transition"
                    >
                      +{p.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <CustomDatePicker
                  label="Start Date"
                  value={form.startDate}
                  onChange={(d) => setForm({ ...form, startDate: d })}
                  placeholder="Immediate"
                />

                <CustomDatePicker
                  label="Expiration Date *"
                  value={form.expiryDate}
                  onChange={(d) => setForm({ ...form, expiryDate: d })}
                  minDate={form.startDate || todayStr}
                  placeholder="Select Expiry"
                />
              </div>
            </div>

            {/* Target Customer Groups */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-groomish-slate/80">
                  Target Customer Group(s)
                </label>
                <span className="text-[10px] text-groomish-slate/50">
                  Leave empty or select all to include all patrons
                </span>
              </div>
              <CustomMultiSelect
                value={form.applicableUserGroups}
                onChange={(selected) => setForm({ ...form, applicableUserGroups: selected })}
                options={userGroupsCatalog.map((g) => ({
                  value: g.id,
                  label: `${g.name} (${g.id})`,
                }))}
                placeholder="👥 All Customers (Universal Coupon)"
                searchPlaceholder="Search customer groups (e.g. GOLD, NEW_USER)..."
              />
              <p className="text-[11px] text-groomish-slate/50 mt-1">
                Only users matching these cohorts (e.g. Gold Tier, 1+ Year Loyalists, New Users) will be able to apply this code at checkout.
              </p>
            </div>

            {/* Eligible Categories */}
            <div>
              <label className="block text-xs font-bold text-groomish-slate/80 mb-1">
                Eligible Salon Categories
              </label>
              <CustomMultiSelect
                value={form.eligibleCategories}
                onChange={(selected) => setForm({ ...form, eligibleCategories: selected })}
                options={categories.map((c) => ({
                  value: c.name,
                  label: c.name,
                }))}
                placeholder="🌐 All Categories (Salon-wide)"
                searchPlaceholder="Filter salon categories..."
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-semibold text-groomish-slate/70 mb-1">
                Coupon Description / Terms
              </label>
              <input
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="input-groomish"
                placeholder="e.g. Exclusive ₹150 off on salon hair spa & styling for Gold patrons"
              />
            </div>

            {/* Active Status Switch */}
            <div className="p-3 bg-groomish-cream/70 rounded-2xl border border-groomish-slate/10 flex items-center justify-between">
              <div>
                <span className="font-bold text-groomish-slate block text-xs">
                  Active Status
                </span>
                <span className="text-[11px] text-groomish-slate/60">
                  {form.active
                    ? "Coupon is active and eligible for redemption at checkout."
                    : "Coupon is deactivated and cannot be redeemed."}
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.active}
                  onChange={(e) => setForm({ ...form, active: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-groomish-green"></div>
              </label>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="px-4 py-2.5 rounded-xl text-xs font-bold bg-groomish-cream text-groomish-slate hover:bg-groomish-slate/10 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitLoading}
                className="btn-primary text-xs px-5 py-2.5 flex items-center gap-1.5"
              >
                {submitLoading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{editingCoupon ? "Save Changes" : "Publish Coupon"}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </ModalWrapper>

      {/* BROADCAST EMAIL TO USER GROUP MODAL */}
      <ModalWrapper open={emailModalOpen} onClose={() => setEmailModalOpen(false)} maxWidth="max-w-lg">
        <div className="space-y-4">
          <div className="border-b border-groomish-slate/10 pb-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full inline-block mb-1 border border-indigo-200">
              Email Marketing Campaign
            </span>
            <h2 className="text-xl font-heading font-bold text-groomish-slate flex items-center gap-2">
              <Mail className="w-5 h-5 text-groomish-orange" />
              <span>Broadcast Email to User Group</span>
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
                {userGroupsCatalog.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name} ({g.id})
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-groomish-slate/50 mt-1">
                Emails will be dispatched to all customers currently in this group.
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
                placeholder="e.g. Special Weekend Privilege for Groomish Gold Members"
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
