import { useEffect, useState } from "react";
import {
  getAdminRewardsApi,
  createAdminRewardApi,
  updateAdminRewardApi,
  deactivateAdminRewardApi,
  getServicesApi,
} from "../../api/admin";
import ModalWrapper from "../../components/modals/ModalWrapper";
import { extractList } from "../../utils/dataHelper";
import {
  Gift,
  Plus,
  Edit2,
  Power,
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
} from "lucide-react";

export default function AdminRewardsPage() {
  const [rewards, setRewards] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterActive, setFilterActive] = useState("ALL"); // ALL, ACTIVE, INACTIVE

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingReward, setEditingReward] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });

  const [form, setForm] = useState({
    title: "",
    description: "",
    pointsRequired: 100,
    serviceId: "",
    serviceName: "",
    discountPercent: 100,
    validityDays: 30,
    stock: 50,
    expiryDate: "",
    image: "",
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
      const [rewRes, servRes] = await Promise.all([
        getAdminRewardsApi({ size: 100 }),
        getServicesApi().catch(() => ({ data: [] })),
      ]);
      setRewards(extractList(rewRes.data));
      setServices(extractList(servRes.data));
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
      discountPercent: 100,
      validityDays: 30,
      stock: 50,
      expiryDate: futureDate.toISOString().split("T")[0],
      image: "",
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
      discountPercent: reward.discountPercent !== undefined ? reward.discountPercent : 100,
      validityDays: reward.validityDays !== undefined ? reward.validityDays : 30,
      stock: reward.stock !== undefined ? reward.stock : 50,
      expiryDate: dateStr,
      image: reward.image || "",
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
        discountPercent: Number(form.discountPercent || 100),
        validityDays: Number(form.validityDays || 30),
        stock: Number(form.stock || 0),
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
          className={`fixed top-5 right-5 z-[99999] px-4 py-3 rounded-2xl shadow-xl text-xs font-bold flex items-center gap-2.5 animate-slide-up ${
            toast.type === "success"
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
            <Gift className="w-4 h-4" />
            <span>Loyalty & Redemptions</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-heading font-extrabold text-groomish-slate">
            Redeem Rewards Vouchers
          </h1>
          <p className="text-xs sm:text-sm text-groomish-slateLight mt-0.5">
            Configure reward points, link special salon services, set discount %, validity days, and active status.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadData}
            disabled={loading}
            className="p-2.5 rounded-2xl border border-groomish-slate/10 bg-white text-groomish-slate hover:bg-groomish-cream transition text-xs font-semibold flex items-center gap-1.5 shadow-sm"
            title="Refresh list"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-groomish-orange" : ""}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <button
            onClick={openCreateModal}
            className="btn-groomish-primary text-xs flex items-center gap-2 px-4 py-2.5 shadow-md"
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
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              filterActive === "ALL"
                ? "bg-groomish-slate text-white shadow-sm"
                : "text-groomish-slate/70 hover:text-groomish-slate"
            }`}
          >
            All ({totalCount})
          </button>
          <button
            onClick={() => setFilterActive("ACTIVE")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              filterActive === "ACTIVE"
                ? "bg-groomish-green text-white shadow-sm"
                : "text-groomish-slate/70 hover:text-groomish-green"
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-groomish-green" />
            Active ({activeCount})
          </button>
          <button
            onClick={() => setFilterActive("INACTIVE")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              filterActive === "INACTIVE"
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
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-groomish-cream/70 border-b border-groomish-slate/10 text-groomish-slate font-extrabold uppercase tracking-wider text-[11px]">
                  <th className="py-3.5 px-4">Voucher Title</th>
                  <th className="py-3.5 px-4">Applicable Service</th>
                  <th className="py-3.5 px-4">Points</th>
                  <th className="py-3.5 px-4">Discount</th>
                  <th className="py-3.5 px-4">Validity</th>
                  <th className="py-3.5 px-4">Stock</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-groomish-slate/10 text-groomish-slate">
                {filteredRewards.map((reward) => {
                  const isExpired =
                    reward.expiryDate && new Date(reward.expiryDate) < new Date();
                  const isOutOfStock = reward.stock !== null && reward.stock <= 0;

                  return (
                    <tr
                      key={reward.id}
                      className="hover:bg-groomish-cream/30 transition duration-150"
                    >
                      {/* Title & Image */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          {reward.image ? (
                            <img
                              src={reward.image}
                              alt={reward.title}
                              className="w-11 h-11 rounded-xl object-cover border border-groomish-slate/10 shrink-0"
                            />
                          ) : (
                            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-groomish-orange/20 to-groomish-gold/20 text-groomish-orange flex items-center justify-center shrink-0 border border-groomish-orange/20">
                              <Gift className="w-5 h-5" />
                            </div>
                          )}
                          <div className="min-w-0 max-w-xs">
                            <span className="font-bold text-groomish-slate block truncate text-sm">
                              {reward.title}
                            </span>
                            {reward.description && (
                              <p className="text-[11px] text-groomish-slateLight line-clamp-1 mt-0.5">
                                {reward.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Applicable Service */}
                      <td className="py-3.5 px-4">
                        {reward.serviceName ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-groomish-orange/10 text-groomish-orange border border-groomish-orange/20">
                            <Scissors className="w-3.5 h-3.5 shrink-0" />
                            <span className="truncate max-w-[150px]">{reward.serviceName}</span>
                          </span>
                        ) : (
                          <span className="text-groomish-slateLight text-[11px] italic">
                            All Services
                          </span>
                        )}
                      </td>

                      {/* Points Required */}
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-extrabold bg-groomish-goldLight text-groomish-goldDark border border-groomish-gold/30">
                          <Sparkles className="w-3 h-3 text-groomish-goldDark" />
                          {reward.pointsRequired} pts
                        </span>
                      </td>

                      {/* Discount % */}
                      <td className="py-3.5 px-4">
                        <span className="px-2.5 py-1 rounded-lg text-xs font-extrabold bg-groomish-coral/15 text-groomish-coral border border-groomish-coral/30">
                          {reward.discountPercent || 100}% OFF
                        </span>
                      </td>

                      {/* Validity Days */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1 text-[11px] font-bold text-groomish-slate">
                            <Clock className="w-3 h-3 text-groomish-orange shrink-0" />
                            <span>{reward.validityDays || 30} days</span>
                          </div>
                          <span className="text-[10px] text-groomish-slateLight block">
                            after buy date
                          </span>
                        </div>
                      </td>

                      {/* Stock */}
                      <td className="py-3.5 px-4">
                        {isOutOfStock ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-groomish-crimson/10 text-groomish-crimson border border-groomish-crimson/20">
                            0 left
                          </span>
                        ) : reward.stock <= 10 ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-50 text-amber-700 border border-amber-200">
                            {reward.stock} left
                          </span>
                        ) : (
                          <span className="font-bold text-groomish-slate">
                            {reward.stock} units
                          </span>
                        )}
                      </td>

                      {/* Active Status */}
                      <td className="py-3.5 px-4">
                        <button
                          onClick={() => handleToggleActive(reward)}
                          title={
                            reward.active
                              ? "Click to deactivate this reward voucher"
                              : "Click to activate this reward voucher"
                          }
                          className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wide flex items-center gap-1.5 transition ${
                            reward.active
                              ? "bg-groomish-green/15 text-groomish-green border border-groomish-green/30 hover:bg-groomish-green/25"
                              : "bg-gray-100 text-gray-500 border border-gray-200 hover:bg-gray-200"
                          }`}
                        >
                          <span
                            className={`w-2 h-2 rounded-full ${
                              reward.active ? "bg-groomish-green" : "bg-gray-400"
                            }`}
                          />
                          <span>{reward.active ? "Active" : "Deactivated"}</span>
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openEditModal(reward)}
                            className="p-1.5 rounded-xl text-groomish-slate hover:bg-groomish-cream border border-groomish-slate/10 hover:border-groomish-orange/40 transition"
                            title="Edit Voucher"
                          >
                            <Edit2 className="w-3.5 h-3.5 text-groomish-slate" />
                          </button>

                          <button
                            onClick={() => handleToggleActive(reward)}
                            className={`p-1.5 rounded-xl border transition ${
                              reward.active
                                ? "text-groomish-crimson border-groomish-crimson/20 hover:bg-groomish-crimson/10"
                                : "text-groomish-green border-groomish-green/20 hover:bg-groomish-green/10"
                            }`}
                            title={reward.active ? "Deactivate Voucher" : "Activate Voucher"}
                          >
                            <Power className="w-3.5 h-3.5" />
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

            {/* Applicable Service (Dropdown) */}
            <div>
              <label className="block font-bold text-groomish-slate mb-1">
                Special Applicable Service (Set by Admin)
              </label>
              <select
                value={form.serviceId}
                onChange={(e) => handleServiceSelect(e.target.value)}
                className="input-groomish w-full text-xs cursor-pointer font-medium"
              >
                <option value="">-- All Services / General Salon Perk --</option>
                {services.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} (₹{s.price})
                  </option>
                ))}
              </select>
              <p className="text-[10px] text-groomish-slate/50 mt-1">
                When selected, the redeemed voucher will specially apply to this salon service.
              </p>
            </div>

            {/* Points Required & Discount % in 2 columns */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-groomish-slate mb-1">
                  Reward Points Required *
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
                  <Sparkles className="w-4 h-4 text-groomish-goldDark absolute left-2.5 top-1/2 -translate-y-1/2" />
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
              </div>
            </div>

            {/* Validity Days After Buy Date & Reward Expire Date */}
            <div className="grid grid-cols-2 gap-3">
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
              </div>

              <div>
                <label className="block font-bold text-groomish-slate mb-1">
                  Reward Catalog Expiry Date
                </label>
                <input
                  type="date"
                  value={form.expiryDate}
                  onChange={(e) => setForm({ ...form, expiryDate: e.target.value })}
                  className="input-groomish w-full text-xs"
                />
              </div>
            </div>

            {/* Stock & Image URL in 2 columns */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-groomish-slate mb-1">
                  Voucher Stock *
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
              </div>

              <div>
                <label className="block font-bold text-groomish-slate mb-1">
                  Image URL (Optional)
                </label>
                <input
                  type="url"
                  placeholder="https://..."
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

            {/* Buttons */}
            <div className="pt-2 flex items-center justify-end gap-3 border-t border-groomish-slate/10">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-groomish-slate hover:bg-groomish-cream transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="btn-groomish-primary text-xs flex items-center gap-2 px-5 py-2 shadow-md cursor-pointer"
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
    </div>
  );
}
