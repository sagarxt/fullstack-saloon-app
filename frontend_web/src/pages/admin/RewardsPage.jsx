import { useEffect, useState } from "react";
import {
  getAdminRewardsApi,
  createAdminRewardApi,
  updateAdminRewardApi,
  deactivateAdminRewardApi,
  getServicesApi,
} from "../../api/admin";
import { getCategoriesApi } from "../../api/category";
import { getPublicProducts } from "../../api/products";
import { getAdminBrands } from "../../api/brand";
import ModalWrapper from "../../components/modals/ModalWrapper";
import { extractList } from "../../utils/dataHelper";
import {
  Gift,
  Plus,
  Edit2,
  Power,
  Trash2,
  Search,
  RefreshCw,
  Sparkles,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Clock,
  Layers,
  Scissors,
  Percent,
  Save,
  Crown,
  ShoppingBag,
  Tag,
  Check,
} from "lucide-react";
import { showConfirm } from "../../context/ConfirmContext";
import { forceDeleteRewardApi } from "../../api/maintenance";
import { useGroomCoin } from "../../context/GroomCoinContext";
import GroomCoinIcon from "../../components/common/GroomCoinIcon";
import CloudinaryImageUploader from "../../components/common/CloudinaryImageUploader";
import CustomSelect from "../../components/common/CustomSelect";
import CustomMultiSelect from "../../components/common/CustomMultiSelect";
import CustomDatePicker from "../../components/common/CustomDatePicker";

export default function AdminRewardsPage() {
  const [rewards, setRewards] = useState([]);
  const [services, setServices] = useState([]);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterActive, setFilterActive] = useState("ALL"); // ALL, ACTIVE, INACTIVE

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingReward, setEditingReward] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });

  // Groom Coin Economy Configuration Modal State
  const { config: groomCoinConfig, updateConfig: updateGroomCoinConfig } = useGroomCoin();
  const [economyModalOpen, setEconomyModalOpen] = useState(false);
  const [economyForm, setEconomyForm] = useState({
    spendAmountPerCoin: 100,
    coinValueInInr: 1.0,
    coinIconUrl: "",
    coinName: "Groom Coin",
    silverMinPoints: 0,
    goldMinPoints: 50,
    platinumMinPoints: 150,
    diamondMinPoints: 300,
  });
  const [savingEconomy, setSavingEconomy] = useState(false);

  useEffect(() => {
    if (groomCoinConfig) {
      setEconomyForm({
        coinName: groomCoinConfig.coinName || "Groom Coin",
        spendAmountPerCoin: groomCoinConfig.spendAmountPerCoin || 100,
        coinValueInInr: groomCoinConfig.coinValueInInr || 1.0,
        coinIconUrl: groomCoinConfig.coinIconUrl || "",
        silverMinPoints: groomCoinConfig.silverMinPoints ?? 0,
        goldMinPoints: groomCoinConfig.goldMinPoints ?? 50,
        platinumMinPoints: groomCoinConfig.platinumMinPoints ?? 150,
        diamondMinPoints: groomCoinConfig.diamondMinPoints ?? 300,
      });
    }
  }, [groomCoinConfig]);

  const handleSaveEconomy = async (e) => {
    if (e) e.preventDefault();
    setSavingEconomy(true);
    try {
      await updateGroomCoinConfig({
        coinName: economyForm.coinName.trim() || "Groom Coin",
        spendAmountPerCoin: parseFloat(economyForm.spendAmountPerCoin) || 100,
        coinValueInInr: parseFloat(economyForm.coinValueInInr) || 1.0,
        coinIconUrl: economyForm.coinIconUrl ? economyForm.coinIconUrl.trim() : null,
        silverMinPoints: parseInt(economyForm.silverMinPoints, 10) || 0,
        goldMinPoints: parseInt(economyForm.goldMinPoints, 10) || 50,
        platinumMinPoints: parseInt(economyForm.platinumMinPoints, 10) || 150,
        diamondMinPoints: parseInt(economyForm.diamondMinPoints, 10) || 300,
      });
      showToast("Groom Coin economy & VIP tier point ranges saved successfully!");
      setEconomyModalOpen(false);
    } catch (err) {
      console.error("Failed to update Groom Coin config:", err);
      showToast(err.response?.data?.message || err.message || "Failed to update Groom Coin settings", "error");
    } finally {
      setSavingEconomy(false);
    }
  };

  const [form, setForm] = useState({
    title: "",
    description: "",
    pointsRequired: 100,
    serviceId: "",
    serviceName: "",
    productId: "",
    productName: "",
    targetType: "ALL",
    conditionOperator: "OR",
    discountPercent: 100,
    discountAmount: "",
    validityDays: 30,
    stock: 50,
    expiryDate: "",
    image: "",
    eligibleCategories: [],
    eligibleBrands: [],
    active: true,
  });

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: "", type: "success" });
    }, 4000);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [rewRes, servRes, prodRes, catRes, brandsRes] = await Promise.all([
        getAdminRewardsApi({ size: 100 }),
        getServicesApi().catch(() => ({ data: [] })),
        getPublicProducts().catch(() => ({ data: [] })),
        getCategoriesApi().catch(() => ({ data: [] })),
        getAdminBrands().catch(() => ({ data: [] })),
      ]);
      setRewards(extractList(rewRes.data));
      setServices(extractList(servRes.data));
      setProducts(extractList(prodRes.data));
      setCategories(extractList(catRes.data));
      setBrands(extractList(brandsRes.data));
    } catch (err) {
      console.error("Failed to load rewards/services:", err);
      setRewards([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openCreateModal = () => {
    setEditingReward(null);
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 90);
    setForm({
      title: "",
      description: "",
      pointsRequired: 100,
      serviceId: "",
      serviceName: "",
      productId: "",
      productName: "",
      targetType: "ALL",
      conditionOperator: "OR",
      discountPercent: 100,
      discountAmount: "",
      validityDays: 30,
      stock: 50,
      expiryDate: futureDate.toISOString().split("T")[0],
      image: "",
      eligibleCategories: [],
      eligibleBrands: [],
      active: true,
    });
    setError("");
    setModalOpen(true);
  };

  const openEditModal = (reward) => {
    setEditingReward(reward);
    let dateStr = "";
    if (reward.expiryDate) {
      dateStr = reward.expiryDate.split("T")[0];
    }
    setForm({
      title: reward.title || "",
      description: reward.description || "",
      pointsRequired: reward.pointsRequired !== undefined ? reward.pointsRequired : 100,
      serviceId: reward.serviceId || "",
      serviceName: reward.serviceName || "",
      productId: reward.productId || "",
      productName: reward.productName || "",
      targetType: reward.targetType || "ALL",
      conditionOperator: reward.conditionOperator || "OR",
      discountPercent: reward.discountPercent !== undefined ? reward.discountPercent : 100,
      discountAmount: reward.discountAmount != null ? String(reward.discountAmount) : "",
      validityDays: reward.validityDays !== undefined ? reward.validityDays : 30,
      stock: reward.stock !== undefined ? reward.stock : 50,
      expiryDate: dateStr,
      image: reward.image || "",
      eligibleCategories: reward.eligibleCategories || [],
      eligibleBrands: reward.eligibleBrands || [],
      active: reward.active !== undefined ? reward.active : true,
    });
    setError("");
    setModalOpen(true);
  };

  const handleServiceSelect = (serviceId) => {
    if (!serviceId) {
      setForm((prev) => ({ ...prev, serviceId: "", serviceName: "" }));
      return;
    }
    const selected = services.find((s) => s.id === serviceId);
    setForm((prev) => ({
      ...prev,
      serviceId,
      serviceName: selected ? selected.name : "",
      title: prev.title || (selected ? `Free ${selected.name} Voucher` : ""),
    }));
  };

  const handleProductSelect = (productId) => {
    if (!productId) {
      setForm((prev) => ({ ...prev, productId: "", productName: "" }));
      return;
    }
    const selected = products.find((p) => p.id === productId);
    setForm((prev) => ({
      ...prev,
      productId,
      productName: selected ? selected.name : "",
      title: prev.title || (selected ? `Exclusive ${selected.name} Voucher` : ""),
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) {
      setError("Reward voucher title is required.");
      return;
    }
    if (!form.pointsRequired || form.pointsRequired < 1) {
      setError("Points required must be at least 1 point.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        pointsRequired: Number(form.pointsRequired),
        serviceId: form.serviceId ? form.serviceId : null,
        serviceName: form.serviceName ? form.serviceName.trim() : null,
        productId: form.productId ? form.productId : null,
        productName: form.productName ? form.productName.trim() : null,
        targetType: form.targetType || "ALL",
        conditionOperator: form.conditionOperator || "OR",
        discountPercent: form.discountPercent !== "" ? Number(form.discountPercent) : 100,
        discountAmount: form.discountAmount ? Number(form.discountAmount) : null,
        validityDays: Number(form.validityDays || 30),
        stock: Number(form.stock || 0),
        eligibleCategories: form.eligibleCategories || [],
        eligibleBrands: form.eligibleBrands || [],
        active: Boolean(form.active),
        image: form.image?.trim() || null,
        expiryDate: form.expiryDate ? form.expiryDate : null,
      };

      if (editingReward) {
        await updateAdminRewardApi(editingReward.id, payload);
        showToast("Reward voucher updated successfully!", "success");
      } else {
        await createAdminRewardApi(payload);
        showToast("New reward voucher added successfully!", "success");
      }

      setModalOpen(false);
      loadData();
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.message || "Failed to save reward voucher.";
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  // Toggle Active/Deactivate directly from the table
  const handleToggleActive = async (reward) => {
    try {
      if (reward.active) {
        // Deactivate
        await deactivateAdminRewardApi(reward.id);
        showToast(`"${reward.title}" has been deactivated.`, "success");
      } else {
        // Reactivate
        await updateAdminRewardApi(reward.id, {
          title: reward.title,
          active: true,
        });
        showToast(`"${reward.title}" has been activated.`, "success");
      }
      loadData();
    } catch (err) {
      console.error("Failed to toggle status:", err);
      showToast("Could not update voucher status. Please retry.", "error");
    }
  };

  const handleForceDelete = async (reward) => {
    const ok = await showConfirm({
      title: `Force Delete "${reward.title}"?`,
      message:
        "This will permanently delete this reward voucher and all unredeemed records associated with it from the database. This action cannot be undone.",
      confirmText: "Force Delete Voucher",
      variant: "danger",
    });
    if (!ok) return;

    try {
      await forceDeleteRewardApi(reward.id);
      showToast(`Reward voucher "${reward.title}" permanently deleted.`, "success");
      loadData();
    } catch (err) {
      console.error("Failed to force delete reward:", err);
      showToast(err.response?.data?.message || "Failed to force delete reward voucher.", "error");
    }
  };

  // Filtering
  const filteredRewards = rewards.filter((r) => {
    const matchesSearch =
      r.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.serviceName?.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;
    if (filterActive === "ACTIVE") return r.active === true;
    if (filterActive === "INACTIVE") return r.active === false;
    return true;
  });

  // KPI calculations
  const totalCount = rewards.length;
  const activeCount = rewards.filter((r) => r.active).length;
  const inactiveCount = rewards.filter((r) => !r.active).length;
  const outOfStockCount = rewards.filter((r) => r.stock === 0 || r.stock === null).length;

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toast.show && (
        <div
          className={`fixed top-5 right-5 z-[99999] px-4 py-3 rounded-2xl shadow-xl text-xs font-bold flex items-center gap-2.5 animate-slide-up ${toast.type === "success"
            ? "bg-groomish-slate text-white border border-groomish-green/30"
            : "bg-groomish-crimson text-white"
            }`}
        >
          {toast.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 text-groomish-green" />
          ) : (
            <AlertCircle className="w-4 h-4 text-white" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-groomish-orange mb-1">
            <GroomCoinIcon className="w-4 h-4" />
            <span>Groom Coin & Loyalty Redemptions</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-heading font-extrabold text-groomish-slate">
            Groom Coin Rewards & Vouchers
          </h1>
          <p className="text-xs sm:text-sm text-groomish-slateLight mt-0.5">
            Manage Groom Coin, custom coin icon, and reward vouchers.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setEconomyModalOpen(true)}
            className="px-3.5 py-2.5 rounded-2xl border border-amber-300/80 bg-gradient-to-r from-amber-50 to-amber-100/70 hover:from-amber-100 hover:to-amber-200/80 text-amber-950 font-bold transition text-xs flex items-center gap-2 shadow-xs cursor-pointer active:scale-95"
            title="Configure Groom Coin Economy, Custom Coin Icon & VIP Tier Ranges"
          >
            <Crown className="w-4 h-4 text-amber-600" />
            <span>Economy & VIP Tiers</span>
          </button>

          <button
            onClick={loadData}
            disabled={loading}
            className="p-2.5 sm:px-3 sm:py-2.5 rounded-2xl border border-groomish-slate/10 bg-white text-groomish-slate hover:bg-groomish-cream transition text-xs font-semibold flex items-center gap-1.5 shadow-sm active:scale-95"
            title="Refresh list"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-groomish-orange" : ""}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <button
            onClick={openCreateModal}
            className="btn-groomish-primary text-xs flex items-center gap-2 px-4 py-2.5 shadow-md active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Reward Voucher</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-groomish-slate/10 shadow-soft flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-groomish-slateLight uppercase">Total Vouchers</p>
            <h3 className="text-2xl font-extrabold text-groomish-slate mt-1">{totalCount}</h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-groomish-cream flex items-center justify-center text-groomish-slate">
            <Gift className="w-5 h-5 text-groomish-orange" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-groomish-slate/10 shadow-soft flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-groomish-slateLight uppercase">Active in App</p>
            <h3 className="text-2xl font-extrabold text-groomish-green mt-1">{activeCount}</h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-groomish-green/10 flex items-center justify-center text-groomish-green">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-groomish-slate/10 shadow-soft flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-groomish-slateLight uppercase">Deactivated</p>
            <h3 className="text-2xl font-extrabold text-groomish-slateLight mt-1">{inactiveCount}</h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-gray-500">
            <Power className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-groomish-slate/10 shadow-soft flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-groomish-slateLight uppercase">Low / Zero Stock</p>
            <h3 className="text-2xl font-extrabold text-groomish-crimson mt-1">{outOfStockCount}</h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-groomish-crimson/10 flex items-center justify-center text-groomish-crimson">
            <AlertCircle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-groomish-slate/10 shadow-soft flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-groomish-slate/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by title, service, description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-groomish pl-10 text-xs py-2 w-full"
          />
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-groomish-cream rounded-xl border border-groomish-slate/10 w-full sm:w-auto self-stretch sm:self-auto justify-center">
          <button
            onClick={() => setFilterActive("ALL")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${filterActive === "ALL"
              ? "bg-groomish-slate text-white shadow-sm"
              : "text-groomish-slate/70 hover:text-groomish-slate"
              }`}
          >
            All ({totalCount})
          </button>
          <button
            onClick={() => setFilterActive("ACTIVE")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${filterActive === "ACTIVE"
              ? "bg-groomish-green text-white shadow-sm"
              : "text-groomish-slate/70 hover:text-groomish-green"
              }`}
          >
            <span className="w-2 h-2 rounded-full bg-groomish-green" />
            Active ({activeCount})
          </button>
          <button
            onClick={() => setFilterActive("INACTIVE")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${filterActive === "INACTIVE"
              ? "bg-gray-600 text-white shadow-sm"
              : "text-groomish-slate/70 hover:text-groomish-slate"
              }`}
          >
            <span className="w-2 h-2 rounded-full bg-gray-400" />
            Deactivated ({inactiveCount})
          </button>
        </div>
      </div>

      {/* Rewards Catalog Table */}
      <div className="bg-white rounded-3xl border border-groomish-slate/10 shadow-soft overflow-hidden">
        {loading ? (
          <div className="p-16 text-center">
            <RefreshCw className="w-8 h-8 text-groomish-orange animate-spin mx-auto mb-3" />
            <p className="text-xs font-bold text-groomish-slateLight">Loading reward vouchers catalog...</p>
          </div>
        ) : filteredRewards.length === 0 ? (
          <div className="p-16 text-center">
            <div className="w-14 h-14 rounded-2xl bg-groomish-cream text-groomish-orange flex items-center justify-center mx-auto mb-3">
              <Gift className="w-7 h-7" />
            </div>
            <h3 className="font-heading font-bold text-lg text-groomish-slate">No Reward Vouchers Found</h3>
            <p className="text-xs text-groomish-slateLight mt-1 max-w-sm mx-auto">
              {searchQuery || filterActive !== "ALL"
                ? "Try clearing your search filters to view existing reward vouchers."
                : "No vouchers exist yet. Click 'Add Reward Voucher' above to create one."}
            </p>
          </div>
        ) : (
          <div className="w-full">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-groomish-cream/70 border-b border-groomish-slate/10 text-groomish-slate font-extrabold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-3.5 text-left">Voucher Title</th>
                  <th className="py-3 px-3 text-left">Scope & Eligibility</th>
                  <th className="py-3 px-2.5 text-center">Groom Coins</th>
                  <th className="py-3 px-2.5 text-center">Discount</th>
                  <th className="py-3 px-3 text-left">Validity & Expiry</th>
                  <th className="py-3 px-2.5 text-center">Stock</th>
                  <th className="py-3 px-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-groomish-slate/10 text-groomish-slate">
                {filteredRewards.map((reward) => {
                  const isOutOfStock = reward.stock !== null && reward.stock <= 0;

                  return (
                    <tr
                      key={reward.id}
                      className="hover:bg-groomish-cream/30 transition duration-150"
                    >
                      {/* Title & Image */}
                      <td className="py-3 px-3.5">
                        <div className="flex items-center gap-2.5">
                          {reward.image ? (
                            <img
                              src={reward.image}
                              alt={reward.title}
                              className="w-10 h-10 rounded-xl object-cover border border-groomish-slate/10 shrink-0 shadow-2xs"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-groomish-orange/15 to-groomish-gold/20 text-groomish-orange flex items-center justify-center shrink-0 border border-groomish-orange/20 shadow-2xs">
                              <Gift className="w-4 h-4" />
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-bold text-groomish-slate text-xs sm:text-sm">
                                {reward.title}
                              </span>
                              {!reward.active && (
                                <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded bg-gray-100 text-gray-500 border border-gray-200 uppercase">
                                  Inactive
                                </span>
                              )}
                            </div>
                            {reward.description ? (
                              <p className="text-[11px] text-groomish-slateLight mt-0.5">
                                {reward.description.length > 40
                                  ? `${reward.description.slice(0, 40)}...`
                                  : reward.description}
                              </p>
                            ) : (
                              <span className="text-[10px] text-groomish-slate/40 italic">
                                General salon voucher
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Applicable Scope & Eligibility */}
                      <td className="py-3 px-3">
                        <div className="flex flex-col gap-1 max-w-[210px]">
                          {reward.serviceName && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-bold bg-groomish-orange/10 text-groomish-orange border border-groomish-orange/25 truncate">
                              <Scissors className="w-3 h-3 shrink-0" />
                              <span className="truncate">{reward.serviceName}</span>
                            </span>
                          )}
                          {reward.productName && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200 truncate">
                              <ShoppingBag className="w-3 h-3 shrink-0" />
                              <span className="truncate">{reward.productName}</span>
                            </span>
                          )}
                          {reward.eligibleCategories?.length > 0 && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 truncate" title={reward.eligibleCategories.join(", ")}>
                              <Layers className="w-3 h-3 shrink-0" />
                              <span className="truncate">Cats: {reward.eligibleCategories.join(", ")}</span>
                            </span>
                          )}
                          {reward.eligibleBrands?.length > 0 && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200 truncate" title={reward.eligibleBrands.join(", ")}>
                              <Tag className="w-3 h-3 shrink-0" />
                              <span className="truncate">Brands: {reward.eligibleBrands.join(", ")}</span>
                            </span>
                          )}
                          {(!reward.serviceName && !reward.productName && (!reward.eligibleCategories || reward.eligibleCategories.length === 0) && (!reward.eligibleBrands || reward.eligibleBrands.length === 0)) && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-semibold bg-groomish-cream text-groomish-slate/75 border border-groomish-slate/15">
                              <Sparkles className="w-3 h-3 text-amber-500 shrink-0" />
                              <span>Universal (All Items)</span>
                            </span>
                          )}
                          {((reward.eligibleCategories?.length > 0 && reward.eligibleBrands?.length > 0) || reward.targetType === "CUSTOM") && (
                            <span className="text-[9px] font-black uppercase tracking-wider text-groomish-slateLight/80">
                              Rule: {reward.conditionOperator || "OR"}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Groom Coins Required */}
                      <td className="py-3 px-2.5 text-center whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-extrabold bg-amber-50 text-amber-800 border border-amber-300/60 shadow-2xs">
                          <GroomCoinIcon className="w-3.5 h-3.5" />
                          <span>{reward.pointsRequired} Coins</span>
                        </span>
                      </td>

                      {/* Discount */}
                      <td className="py-3 px-2.5 text-center whitespace-nowrap">
                        {reward.discountAmount ? (
                          <span className="inline-flex items-center gap-0.5 px-2.5 py-1 rounded-lg text-xs font-black bg-rose-50 text-rose-600 border border-rose-200 shadow-2xs">
                            <span>₹{reward.discountAmount} OFF</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-0.5 px-2.5 py-1 rounded-lg text-xs font-black bg-rose-50 text-rose-600 border border-rose-200 shadow-2xs">
                            <Percent className="w-3 h-3 text-rose-500" />
                            <span>{reward.discountPercent || 100}% OFF</span>
                          </span>
                        )}
                      </td>

                      {/* Validity & Expiry */}
                      <td className="py-3 px-3">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1 text-xs font-bold text-groomish-slate whitespace-nowrap">
                            <Clock className="w-3 h-3 text-groomish-orange shrink-0" />
                            <span>{reward.validityDays || 30} Days valid</span>
                          </div>
                          {reward.expiryDate ? (
                            <div className="flex items-center gap-1 text-[10px] font-medium text-groomish-slateLight whitespace-nowrap">
                              <Calendar className="w-2.5 h-2.5 text-groomish-slate/40 shrink-0" />
                              <span>Until {new Date(reward.expiryDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
                            </div>
                          ) : (
                            <span className="text-[10px] text-emerald-600 font-medium block whitespace-nowrap">
                              • No catalog expiry
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Stock */}
                      <td className="py-3 px-2.5 text-center whitespace-nowrap">
                        {isOutOfStock ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-rose-100 text-rose-700 border border-rose-200">
                            Out of Stock
                          </span>
                        ) : reward.stock <= 10 ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-amber-50 text-amber-700 border border-amber-200">
                            {reward.stock} left
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold text-groomish-slate bg-groomish-cream/70 border border-groomish-slate/10">
                            {reward.stock} units
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleToggleActive(reward)}
                            className={`p-1.5 rounded-xl border transition shadow-2xs cursor-pointer active:scale-95 ${
                              reward.active
                                ? "text-emerald-700 bg-emerald-50 border-emerald-200 hover:bg-emerald-100"
                                : "text-gray-400 bg-gray-50 border-gray-200 hover:bg-gray-100"
                            }`}
                            title={reward.active ? "Deactivate Voucher" : "Activate Voucher"}
                          >
                            <Power className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => openEditModal(reward)}
                            className="p-1.5 rounded-xl text-groomish-slate bg-white hover:bg-groomish-orangeLight hover:text-groomish-orange border border-groomish-slate/15 hover:border-groomish-orange/40 transition shadow-2xs cursor-pointer active:scale-95"
                            title="Edit Voucher"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleForceDelete(reward)}
                            className="p-1.5 rounded-xl border border-red-200 text-red-600 bg-white hover:bg-red-50 hover:border-red-300 transition shadow-2xs cursor-pointer active:scale-95"
                            title="Force Delete Voucher"
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
      </div>

      {/* Add / Edit Voucher Modal */}
      <ModalWrapper
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        maxWidth="max-w-xl"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-groomish-orange/15 text-groomish-orange flex items-center justify-center shrink-0">
              <Gift className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-heading font-extrabold text-groomish-slate">
                {editingReward ? "Update Reward Voucher" : "Create New Reward Voucher"}
              </h2>
              <p className="text-xs text-groomish-slateLight mt-0.5">
                Configure points, special applicable service, discount %, and validity rules.
              </p>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-groomish-crimson/10 border border-groomish-crimson/20 rounded-2xl text-groomish-crimson text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-4 text-xs">
            {/* Title */}
            <div>
              <label className="block font-bold text-groomish-slate mb-1">
                Voucher Title *
              </label>
              <input
                type="text"
                placeholder="e.g. Free Scalp Analysis & Massage Voucher"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="input-groomish w-full text-xs"
                required
              />
            </div>

            {/* Voucher Scope & Multi-Condition Logic (Set by Admin) */}
            <div className="p-4 rounded-2xl bg-groomish-cream/40 border border-groomish-slate/15 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-groomish-slate flex items-center gap-1.5 text-xs">
                  <Layers className="w-3.5 h-3.5 text-groomish-orange" />
                  <span>Voucher Applicability & Multi-Condition Rules</span>
                </span>
                <span className="text-[10px] font-bold text-groomish-slate/60 bg-white px-2 py-0.5 rounded-full border border-groomish-slate/10">
                  Target: {form.targetType}
                </span>
              </div>

              {/* Target Selector Buttons */}
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 text-center">
                {[
                  { id: "ALL", label: "Universal", icon: Sparkles },
                  { id: "SERVICE", label: "Service", icon: Scissors },
                  { id: "PRODUCT", label: "Product", icon: ShoppingBag },
                  { id: "CATEGORY", label: "Category", icon: Layers },
                  { id: "BRAND", label: "Brand", icon: Tag },
                  { id: "CUSTOM", label: "Multi-Rule", icon: Crown },
                ].map((t) => {
                  const Icon = t.icon;
                  const active = form.targetType === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setForm((prev) => ({ ...prev, targetType: t.id }))}
                      className={`p-2 rounded-xl border flex flex-col items-center gap-1 transition text-[11px] font-bold ${
                        active
                          ? "bg-groomish-orange text-white border-groomish-orange shadow-xs"
                          : "bg-white text-groomish-slate border-groomish-slate/15 hover:bg-groomish-cream"
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{t.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Specific Service Dropdown */}
              {(form.targetType === "SERVICE" || form.targetType === "CUSTOM") && (
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-groomish-slate/75">
                    Target Salon Service
                  </label>
                  <CustomSelect
                    name="serviceId"
                    value={form.serviceId}
                    onChange={(e, val) => handleServiceSelect(val ?? e.target?.value)}
                    options={[
                      { value: "", label: "✨ Any Service (Universal)" },
                      ...services.map((s) => ({
                        value: s.id,
                        label: `${s.name} (₹${s.price} • ${s.durationMinutes || 30}m)`,
                      })),
                    ]}
                    placeholder="Select specific service..."
                    searchPlaceholder="Search services..."
                    className="text-xs font-semibold"
                  />
                </div>
              )}

              {/* Specific Product Dropdown */}
              {(form.targetType === "PRODUCT" || form.targetType === "CUSTOM") && (
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-groomish-slate/75">
                    Target Retail Product
                  </label>
                  <CustomSelect
                    name="productId"
                    value={form.productId}
                    onChange={(e, val) => handleProductSelect(val ?? e.target?.value)}
                    options={[
                      { value: "", label: "✨ Any Product (Universal)" },
                      ...products.map((p) => ({
                        value: p.id,
                        label: `${p.name} (₹${p.price} • ${p.brand || "Retail"})`,
                      })),
                    ]}
                    placeholder="Select specific product..."
                    searchPlaceholder="Search products..."
                    className="text-xs font-semibold"
                  />
                </div>
              )}

              {/* Eligible Categories Multi-Select */}
              {(form.targetType === "CATEGORY" || form.targetType === "CUSTOM") && (
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-groomish-slate/75">
                    Eligible Salon Categories
                  </label>
                  <CustomMultiSelect
                    value={form.eligibleCategories}
                    onChange={(selected) => setForm({ ...form, eligibleCategories: selected })}
                    options={categories.map((c) => ({
                      value: c.name,
                      label: c.name,
                    }))}
                    placeholder="🌐 All Categories"
                    searchPlaceholder="Filter categories..."
                  />
                </div>
              )}

              {/* Eligible Brands Multi-Select */}
              {(form.targetType === "BRAND" || form.targetType === "CUSTOM") && (
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-groomish-slate/75">
                    Eligible Product Brands
                  </label>
                  <CustomMultiSelect
                    value={form.eligibleBrands}
                    onChange={(selected) => setForm({ ...form, eligibleBrands: selected })}
                    options={brands.map((b) => {
                      const bName = typeof b === "string" ? b : (b.name || b.id);
                      return { value: bName, label: bName };
                    })}
                    placeholder="🏷️ All Product Brands"
                    searchPlaceholder="Filter product brands (e.g. L'Oreal, Beardo)..."
                  />
                </div>
              )}

              {/* Multi-Condition Operator (OR / AND) */}
              {form.targetType === "CUSTOM" && (
                <div className="pt-2 border-t border-groomish-slate/10 space-y-1.5">
                  <span className="block text-[11px] font-bold text-groomish-slate">
                    Condition Matching Operator
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, conditionOperator: "OR" })}
                      className={`p-2 rounded-xl border text-left text-xs transition ${
                        form.conditionOperator === "OR"
                          ? "bg-white border-groomish-orange text-groomish-orange font-bold shadow-xs"
                          : "bg-white/60 border-groomish-slate/15 text-groomish-slate"
                      }`}
                    >
                      <div className="flex items-center justify-between font-bold text-xs">
                        <span>OR Option (Default)</span>
                        {form.conditionOperator === "OR" && <Check className="w-3 h-3 text-groomish-orange" />}
                      </div>
                      <span className="text-[10px] text-groomish-slate/60 block font-normal mt-0.5">
                        Matches Service OR Product OR Category OR Brand
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setForm({ ...form, conditionOperator: "AND" })}
                      className={`p-2 rounded-xl border text-left text-xs transition ${
                        form.conditionOperator === "AND"
                          ? "bg-white border-groomish-orange text-groomish-orange font-bold shadow-xs"
                          : "bg-white/60 border-groomish-slate/15 text-groomish-slate"
                      }`}
                    >
                      <div className="flex items-center justify-between font-bold text-xs">
                        <span>AND Option</span>
                        {form.conditionOperator === "AND" && <Check className="w-3 h-3 text-groomish-orange" />}
                      </div>
                      <span className="text-[10px] text-groomish-slate/60 block font-normal mt-0.5">
                        Must match ALL configured conditions
                      </span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Points Required & Discount % in 2 columns */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-groomish-slate mb-1 flex items-center gap-1.5">
                  <GroomCoinIcon className="w-3.5 h-3.5" />
                  <span>Groom Coins Required *</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    placeholder="100"
                    value={form.pointsRequired}
                    onChange={(e) =>
                      setForm({ ...form, pointsRequired: Number(e.target.value) })
                    }
                    className="input-groomish w-full text-xs pl-8 font-bold"
                    required
                  />
                  <div className="absolute left-2.5 top-1/2 -translate-y-1/2">
                    <GroomCoinIcon className="w-4 h-4" />
                  </div>
                </div>
                <div className="flex items-center gap-1 pt-1 flex-wrap">
                  {[50, 100, 200, 500].map((pts) => (
                    <button
                      key={pts}
                      type="button"
                      onClick={() => setForm((prev) => ({ ...prev, pointsRequired: pts }))}
                      className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 transition cursor-pointer"
                    >
                      {pts}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-bold text-groomish-slate mb-1">
                  Discount in % (e.g. 100% = Free) *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    max="100"
                    placeholder="100"
                    value={form.discountPercent}
                    onChange={(e) =>
                      setForm({ ...form, discountPercent: Number(e.target.value) })
                    }
                    className="input-groomish w-full text-xs pl-8 font-bold"
                    required
                  />
                  <Percent className="w-3.5 h-3.5 text-groomish-coral absolute left-2.5 top-1/2 -translate-y-1/2" />
                </div>
                <div className="flex items-center gap-1 pt-1 flex-wrap">
                  {[
                    { label: "100% Free", val: 100 },
                    { label: "50%", val: 50 },
                    { label: "25%", val: 25 },
                    { label: "10%", val: 10 },
                  ].map((p) => (
                    <button
                      key={p.label}
                      type="button"
                      onClick={() => setForm((prev) => ({ ...prev, discountPercent: p.val }))}
                      className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition cursor-pointer"
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Validity Days After Buy Date & Reward Expire Date (Groomish Themed Calendar) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-groomish-slate mb-1">
                  Expire After Buy Date (Days) *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    placeholder="30"
                    value={form.validityDays}
                    onChange={(e) =>
                      setForm({ ...form, validityDays: Number(e.target.value) })
                    }
                    className="input-groomish w-full text-xs pl-8 font-bold"
                    required
                  />
                  <Clock className="w-3.5 h-3.5 text-groomish-orange absolute left-2.5 top-1/2 -translate-y-1/2" />
                </div>
                <div className="flex items-center gap-1 pt-1 flex-wrap">
                  {[15, 30, 45, 60, 90].map((days) => (
                    <button
                      key={days}
                      type="button"
                      onClick={() => setForm((prev) => ({ ...prev, validityDays: days }))}
                      className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-groomish-cream hover:bg-groomish-orangeLight hover:text-groomish-orange text-groomish-slate border border-groomish-slate/10 transition cursor-pointer"
                    >
                      {days}D
                    </button>
                  ))}
                </div>
              </div>

              {/* Reward Catalog Expiry Date - Groomish Themed Calendar */}
              <div className="space-y-1.5">
                <label className="block font-bold text-groomish-slate flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-groomish-orange" />
                    <span>Reward Catalog Expiry Date</span>
                  </span>
                  {form.expiryDate && (
                    <button
                      type="button"
                      onClick={() => setForm((prev) => ({ ...prev, expiryDate: "" }))}
                      className="text-[10px] font-bold text-rose-600 hover:underline cursor-pointer"
                    >
                      Clear Date
                    </button>
                  )}
                </label>
                <CustomDatePicker
                  value={form.expiryDate}
                  onChange={(e, val) =>
                    setForm((prev) => ({ ...prev, expiryDate: val || e.target?.value || "" }))
                  }
                  placeholder="Select voucher expiry date..."
                  className="w-full"
                  align="right"
                />
                {/* Groomish Quick-Pick Date Shortcuts */}
                <div className="flex items-center gap-1.5 pt-0.5 flex-wrap">
                  <span className="text-[10px] text-groomish-slate/40 font-semibold">Quick pick:</span>
                  {[
                    { label: "+30D", days: 30 },
                    { label: "+60D", days: 60 },
                    { label: "+90D", days: 90 },
                  ].map((chip) => (
                    <button
                      key={chip.label}
                      type="button"
                      onClick={() => {
                        const d = new Date();
                        d.setDate(d.getDate() + chip.days);
                        setForm((prev) => ({ ...prev, expiryDate: d.toISOString().split("T")[0] }));
                      }}
                      className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-groomish-cream hover:bg-groomish-orangeLight hover:text-groomish-orange text-groomish-slate transition border border-groomish-slate/10 cursor-pointer"
                    >
                      {chip.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Voucher Stock */}
            <div>
              <label className="block font-bold text-groomish-slate mb-1">
                Voucher Inventory Stock *
              </label>
              <input
                type="number"
                min="0"
                placeholder="50"
                value={form.stock}
                onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })}
                className="input-groomish w-full text-xs font-bold"
                required
              />
              <div className="flex items-center gap-1 pt-1 flex-wrap">
                {[10, 25, 50, 100, 500].map((stk) => (
                  <button
                    key={stk}
                    type="button"
                    onClick={() => setForm((prev) => ({ ...prev, stock: stk }))}
                    className="text-[10px] font-bold px-2.5 py-0.5 rounded-md bg-groomish-cream hover:bg-groomish-orangeLight hover:text-groomish-orange text-groomish-slate border border-groomish-slate/10 transition cursor-pointer"
                  >
                    {stk} units
                  </button>
                ))}
              </div>
            </div>

            {/* Image URL & Image Upload Functionality (Optional) */}
            <div className="p-3.5 rounded-2xl bg-groomish-cream/40 border border-groomish-slate/15 space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="font-bold text-groomish-slate text-xs flex items-center gap-1.5">
                  <span>Voucher Banner Image</span>
                  <span className="text-[10px] font-normal text-groomish-slate/50">(Optional)</span>
                </label>
                {form.image && (
                  <button
                    type="button"
                    onClick={() => setForm((prev) => ({ ...prev, image: "" }))}
                    className="text-[10px] font-bold text-groomish-crimson hover:underline cursor-pointer"
                  >
                    Remove Image
                  </button>
                )}
              </div>

              {/* Cloudinary Image Uploader */}
              <CloudinaryImageUploader
                value={form.image || ""}
                onChange={(url) => setForm((prev) => ({ ...prev, image: url }))}
                folder="groomishnow/rewards"
                label="Upload Voucher Image (PNG, JPG, WebP)"
                compact={true}
                entityName="reward_voucher_image"
              />

              {/* Direct URL write-in alternative */}
              <div>
                <span className="text-[10px] font-semibold text-groomish-slate/60 block mb-1">
                  Or enter direct Image URL (Optional):
                </span>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  value={form.image}
                  onChange={(e) => setForm({ ...form, image: e.target.value })}
                  className="input-groomish w-full text-xs"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block font-bold text-groomish-slate mb-1">
                Description & Terms
              </label>
              <textarea
                rows={2}
                placeholder="e.g. Valid on any haircut, scalp treatment, or beard styling."
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="input-groomish w-full text-xs"
              />
            </div>

            {/* Active Switch */}
            <div className="p-3 bg-groomish-cream/70 rounded-2xl border border-groomish-slate/10 flex items-center justify-between">
              <div>
                <span className="font-bold text-groomish-slate block text-xs">
                  Active Status
                </span>
                <span className="text-[11px] text-groomish-slateLight">
                  {form.active
                    ? "Available for customers to redeem on the Rewards page."
                    : "Hidden from customers (deactivated)."}
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

            {/* Groomish Themed Buttons */}
            <div className="pt-2 flex items-center justify-end gap-3 border-t border-groomish-slate/10">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="px-5 py-2.5 rounded-2xl text-xs font-bold text-groomish-slate hover:bg-groomish-cream border border-groomish-slate/15 transition cursor-pointer active:scale-95"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="btn-groomish-primary text-xs flex items-center gap-2 px-6 py-2.5 shadow-glowOrange cursor-pointer active:scale-95"
              >
                {saving ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <span>{editingReward ? "Update Voucher" : "Create Voucher"}</span>
                )}
              </button>
            </div>
          </form>
        </div>
      </ModalWrapper>

      {/* GROOM COIN ECONOMY & CUSTOM COIN ICON CONFIGURATION MODAL */}
      <ModalWrapper
        open={economyModalOpen}
        onClose={() => setEconomyModalOpen(false)}
        maxWidth="max-w-xl"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3 border-b border-groomish-slate/10 pb-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-500/20 text-amber-600 flex items-center justify-center shrink-0 border border-amber-400/30">
              <GroomCoinIcon className="w-7 h-7" overrideUrl={economyForm.coinIconUrl} />
            </div>
            <div>
              <h2 className="text-xl font-heading font-extrabold text-groomish-slate flex items-center gap-2">
                <span>Economy & VIP Tiers</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                  Managed by Admin
                </span>
              </h2>
              <p className="text-xs text-groomish-slateLight mt-0.5">
                Set conversion spend rates, coin value, and VIP tier point ranges.
              </p>
            </div>
          </div>

          <form onSubmit={handleSaveEconomy} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Spend Conversion */}
              <div className="p-3.5 rounded-2xl bg-groomish-cream/40 border border-groomish-slate/15 space-y-1.5">
                <label className="block font-bold text-groomish-slate">
                  Spend Amount per 1 Groom Coin *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-groomish-slate/50">₹</span>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={economyForm.spendAmountPerCoin}
                    onChange={(e) => setEconomyForm({ ...economyForm, spendAmountPerCoin: e.target.value })}
                    className="input-groomish w-full text-xs font-bold pl-7"
                    placeholder="100"
                    required
                  />
                </div>
                <p className="text-[10px] text-groomish-slate/60">
                  Spend ₹{economyForm.spendAmountPerCoin || 100} to earn 1 Groom Coin.
                </p>
              </div>

              {/* Redemption Value */}
              <div className="p-3.5 rounded-2xl bg-groomish-cream/40 border border-groomish-slate/15 space-y-1.5">
                <label className="block font-bold text-groomish-slate">
                  1 Groom Coin Value in INR *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-groomish-slate/50">₹</span>
                  <input
                    type="number"
                    min="0.1"
                    step="0.1"
                    value={economyForm.coinValueInInr}
                    onChange={(e) => setEconomyForm({ ...economyForm, coinValueInInr: e.target.value })}
                    className="input-groomish w-full text-xs font-bold pl-7"
                    placeholder="1.0"
                    required
                  />
                </div>
                <p className="text-[10px] text-groomish-slate/60">
                  1 Groom Coin is worth ₹{economyForm.coinValueInInr || 1} at redemption.
                </p>
              </div>
            </div>

            {/* VIP TIER POINT RANGE CONFIGURATION */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-50/70 to-groomish-cream/50 border border-amber-200/80 space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <Crown className="w-4 h-4 text-groomish-goldDark" />
                  <span className="font-bold text-xs text-groomish-slate">
                    VIP Tier Point Range Requirements
                  </span>
                </div>
                <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full border border-amber-300">
                  Lifetime Points Thresholds
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-white/80 border border-amber-200 text-[11px] text-amber-900 leading-relaxed">
                <strong>Grandfathering Guarantee:</strong> If a customer has already reached a tier label, changes will not affect their existing tier. They will simply need the required points configured below to reach the next tier.
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
                {/* Silver Tier */}
                <div className="p-3 rounded-xl bg-white border border-groomish-slate/15 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-xs text-groomish-slate">Silver</span>
                    <span className="text-[10px] font-bold text-groomish-slate/40">1.0x</span>
                  </div>
                  <input
                    type="number"
                    value={economyForm.silverMinPoints}
                    disabled
                    className="w-full text-xs font-bold px-2 py-1.5 rounded-lg bg-groomish-cream/40 border border-groomish-slate/10 text-groomish-slate/60 cursor-not-allowed"
                  />
                  <span className="text-[10px] text-groomish-slate/50 block">0 points (Starting)</span>
                </div>

                {/* Gold Tier */}
                <div className="p-3 rounded-xl bg-white border border-amber-300 shadow-2xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-xs text-groomish-goldDark">Gold</span>
                    <span className="text-[10px] font-bold text-amber-600">1.25x</span>
                  </div>
                  <input
                    type="number"
                    min="1"
                    value={economyForm.goldMinPoints}
                    onChange={(e) => setEconomyForm({ ...economyForm, goldMinPoints: e.target.value })}
                    className="input-groomish w-full text-xs font-bold px-2 py-1.5"
                    placeholder="50"
                    required
                  />
                  <span className="text-[10px] text-groomish-slate/50 block">Points to unlock</span>
                </div>

                {/* Platinum Tier */}
                <div className="p-3 rounded-xl bg-white border border-sky-300 shadow-2xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-xs text-sky-700">Platinum</span>
                    <span className="text-[10px] font-bold text-sky-600">1.5x</span>
                  </div>
                  <input
                    type="number"
                    min="1"
                    value={economyForm.platinumMinPoints}
                    onChange={(e) => setEconomyForm({ ...economyForm, platinumMinPoints: e.target.value })}
                    className="input-groomish w-full text-xs font-bold px-2 py-1.5"
                    placeholder="150"
                    required
                  />
                  <span className="text-[10px] text-groomish-slate/50 block">Points to unlock</span>
                </div>

                {/* Diamond Tier */}
                <div className="p-3 rounded-xl bg-white border border-purple-300 shadow-2xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-xs text-purple-700">Diamond</span>
                    <span className="text-[10px] font-bold text-purple-600">2.0x</span>
                  </div>
                  <input
                    type="number"
                    min="1"
                    value={economyForm.diamondMinPoints}
                    onChange={(e) => setEconomyForm({ ...economyForm, diamondMinPoints: e.target.value })}
                    className="input-groomish w-full text-xs font-bold px-2 py-1.5"
                    placeholder="300"
                    required
                  />
                  <span className="text-[10px] text-groomish-slate/50 block">Points to unlock</span>
                </div>
              </div>
            </div>

            {/* Custom Coin Icon */}
            <div className="p-4 rounded-2xl bg-groomish-cream/40 border border-groomish-slate/15 space-y-3">
              <div className="flex items-center justify-between">
                <label className="font-bold text-groomish-slate flex items-center gap-1.5">
                  <span>Groom Coin Icon Emblem</span>
                  <span className="text-[10px] font-normal text-groomish-slate/50">(PNG / SVG)</span>
                </label>
                {economyForm.coinIconUrl && (
                  <button
                    type="button"
                    onClick={() => setEconomyForm((prev) => ({ ...prev, coinIconUrl: "" }))}
                    className="text-[10px] font-bold text-groomish-crimson hover:underline cursor-pointer"
                  >
                    Reset to Default Emblem
                  </button>
                )}
              </div>

              <CloudinaryImageUploader
                value={economyForm.coinIconUrl || ""}
                onChange={(url) => setEconomyForm((prev) => ({ ...prev, coinIconUrl: url }))}
                folder="groomishnow/coin"
                label="Upload Coin Icon (Square / Circle PNG, SVG, WebP)"
                compact={true}
                entityName="groom_coin_icon"
              />

              <div>
                <span className="text-[10px] font-semibold text-groomish-slate/60 block mb-1">
                  Or enter direct Icon URL:
                </span>
                <input
                  type="url"
                  placeholder="https://..."
                  value={economyForm.coinIconUrl}
                  onChange={(e) => setEconomyForm({ ...economyForm, coinIconUrl: e.target.value })}
                  className="input-groomish w-full text-xs"
                />
              </div>
            </div>

            {/* Modal Footer Buttons */}
            <div className="pt-3 flex items-center justify-end gap-3 border-t border-groomish-slate/10">
              <button
                type="button"
                onClick={() => setEconomyModalOpen(false)}
                className="px-5 py-2.5 rounded-2xl text-xs font-bold text-groomish-slate hover:bg-groomish-cream border border-groomish-slate/15 transition cursor-pointer active:scale-95"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={savingEconomy}
                className="btn-groomish-primary text-xs flex items-center gap-2 px-6 py-2.5 shadow-glowOrange cursor-pointer active:scale-95"
              >
                {savingEconomy ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving Settings...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    <span>Save Economy & VIP Tier Settings</span>
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
