import { useState, useEffect } from "react";
import { policyFaqApi } from "../../api/policyFaq";
import ModalWrapper from "../../components/modals/ModalWrapper";
import { showConfirm, showAlert } from "../../context/ConfirmContext";
import {
  FileText,
  HelpCircle,
  Plus,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  Search,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  ShoppingBag,
  CreditCard,
  CalendarX,
  Calendar,
  Gift,
  Scissors,
  ArrowUpDown,
  RefreshCw,
} from "lucide-react";

export default function AdminPolicyQAPage() {
  const [activeTab, setActiveTab] = useState("POLICY"); // "POLICY" | "QA"
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    type: "POLICY",
    category: "ORDER",
    heading: "",
    description: "",
    displayOrder: 0,
    active: true,
  });

  useEffect(() => {
    fetchItems();
  }, [activeTab]);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const res = await policyFaqApi.getAdminItems(activeTab);
      setItems(res.data || []);
    } catch (err) {
      console.error(err);
      showAlert({
        title: "Load Error",
        message: "Failed to load policy & Q&A content from server.",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormData({
      type: activeTab,
      category: activeTab === "POLICY" ? "ORDER" : "BOOKINGS",
      heading: "",
      description: "",
      displayOrder: items.length + 1,
      active: true,
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (item) => {
    setEditingItem(item);
    setFormData({
      type: item.type || activeTab,
      category: item.category || "GENERAL",
      heading: item.heading || "",
      description: item.description || "",
      displayOrder: item.displayOrder ?? 0,
      active: item.active ?? true,
    });
    setModalOpen(true);
  };

  const handleSaveSubmit = async (e) => {
    e.preventDefault();
    if (!formData.heading.trim()) {
      showAlert({ title: "Validation Error", message: "Heading is required.", type: "warning" });
      return;
    }
    if (!formData.description.trim()) {
      showAlert({ title: "Validation Error", message: "Description / Answer is required.", type: "warning" });
      return;
    }

    try {
      setFormSubmitting(true);
      if (editingItem) {
        await policyFaqApi.updateItem(editingItem.id, formData);
        showAlert({
          title: "Updated Successfully",
          message: `${formData.type === "POLICY" ? "Policy" : "Question"} section updated.`,
          type: "success",
        });
      } else {
        await policyFaqApi.createItem(formData);
        showAlert({
          title: "Created Successfully",
          message: `New ${formData.type === "POLICY" ? "policy" : "question"} section published.`,
          type: "success",
        });
      }
      setModalOpen(false);
      fetchItems();
    } catch (err) {
      console.error(err);
      showAlert({
        title: "Save Failed",
        message: err.response?.data?.message || "Failed to save changes. Please try again.",
        type: "error",
      });
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleToggleStatus = async (item) => {
    try {
      await policyFaqApi.toggleItemStatus(item.id);
      setItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, active: !i.active } : i))
      );
    } catch (err) {
      console.error(err);
      showAlert({
        title: "Status Toggle Error",
        message: "Failed to update item visibility status.",
        type: "error",
      });
    }
  };

  const handleForceDelete = (item) => {
    showConfirm({
      title: "Force Delete Content?",
      message: `Are you sure you want to permanently delete "${item.heading}"? This action cannot be undone.`,
      confirmText: "Force Delete",
      cancelText: "Cancel",
      isDanger: true,
      onConfirm: async () => {
        try {
          await policyFaqApi.forceDeleteItem(item.id);
          setItems((prev) => prev.filter((i) => i.id !== item.id));
          showAlert({
            title: "Deleted",
            message: "Section force deleted successfully.",
            type: "success",
          });
        } catch (err) {
          console.error(err);
          showAlert({
            title: "Delete Error",
            message: "Failed to delete section.",
            type: "error",
          });
        }
      },
    });
  };

  // Filter items
  const filteredItems = items.filter((item) => {
    const matchCategory = categoryFilter === "ALL" || item.category === categoryFilter;
    const matchStatus =
      statusFilter === "ALL"
        ? true
        : statusFilter === "ACTIVE"
        ? item.active
        : !item.active;
    const query = searchQuery.toLowerCase().trim();
    const matchQuery =
      !query ||
      item.heading?.toLowerCase().includes(query) ||
      item.description?.toLowerCase().includes(query) ||
      item.category?.toLowerCase().includes(query);
    return matchCategory && matchStatus && matchQuery;
  });

  const categories = ["ALL", ...new Set(items.map((i) => i.category || "GENERAL"))];

  const policySuggestions = ["ORDER", "PAYMENT", "CANCELLATION", "REFUND", "GENERAL"];
  const qaSuggestions = ["BOOKINGS", "PAYMENT", "CANCELLATION", "LOYALTY", "SERVICES", "GENERAL"];

  return (
    <div className="space-y-4">
      {/* Header & Tabs */}
      <div className="bg-white rounded-xl border border-groomish-slate/10 p-4 sm:p-5 shadow-card flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-groomish-orange/10 text-groomish-orange text-[10px] font-bold uppercase tracking-wider mb-1">
            <ShieldCheck className="w-3 h-3" />
            Content Management
          </div>
          <h1 className="text-lg sm:text-xl font-heading font-extrabold text-groomish-slate">
            Policy & Q&A Management
          </h1>
          <p className="text-xs text-groomish-slate/60 mt-0.5">
            Create, edit, disable, or delete salon policies (Order, Payment, Cancellation, Refund) and Q&A items.
          </p>
        </div>

        {/* Action Button */}
        <button
          onClick={handleOpenAdd}
          className="btn-primary flex items-center gap-1.5 text-xs font-bold"
        >
          <Plus className="w-4 h-4" />
          {activeTab === "POLICY" ? "Add New Policy Section" : "Add New Question & Answer"}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-groomish-slate/10 pb-1">
        <button
          onClick={() => {
            setActiveTab("POLICY");
            setCategoryFilter("ALL");
          }}
          className={`px-4 py-2 text-xs font-bold rounded-lg flex items-center gap-2 transition-all ${
            activeTab === "POLICY"
              ? "bg-groomish-orange text-white shadow-sm font-extrabold"
              : "bg-white text-groomish-slate/70 hover:bg-groomish-orange/5 hover:text-groomish-slate border border-groomish-slate/10"
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          Salon Policies (Order, Payment, Cancellation, Refund)
        </button>

        <button
          onClick={() => {
            setActiveTab("QA");
            setCategoryFilter("ALL");
          }}
          className={`px-4 py-2 text-xs font-bold rounded-lg flex items-center gap-2 transition-all ${
            activeTab === "QA"
              ? "bg-groomish-orange text-white shadow-sm font-extrabold"
              : "bg-white text-groomish-slate/70 hover:bg-groomish-orange/5 hover:text-groomish-slate border border-groomish-slate/10"
          }`}
        >
          <HelpCircle className="w-3.5 h-3.5" />
          Customer Questions & Answers (Q&A)
        </button>
      </div>

      {/* Filters Bar */}
      <div className="bg-white rounded-xl border border-groomish-slate/10 p-3 sm:p-3.5 shadow-card flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 text-xs">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-groomish-slate/40" />
          <input
            type="text"
            placeholder={`Search ${activeTab === "POLICY" ? "policies" : "Q&A"} by heading, category, description...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-groomish pl-9 w-full text-xs"
          />
        </div>

        {/* Category & Status Filters */}
        <div className="flex items-center gap-2 shrink-0">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="input-groomish text-xs py-1.5 px-2.5"
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                Category: {c}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input-groomish text-xs py-1.5 px-2.5"
          >
            <option value="ALL">All Status</option>
            <option value="ACTIVE">Active Only</option>
            <option value="DISABLED">Disabled Only</option>
          </select>
        </div>
      </div>

      {/* Items List */}
      {loading ? (
        <div className="bg-white rounded-xl p-10 text-center border border-groomish-slate/10 shadow-card">
          <RefreshCw className="w-6 h-6 text-groomish-orange animate-spin mx-auto mb-2" />
          <p className="text-xs text-groomish-slate/60 font-medium">Loading content sections...</p>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="bg-white rounded-xl p-10 text-center border border-groomish-slate/10 shadow-card space-y-2">
          <FileText className="w-9 h-9 text-groomish-slate/30 mx-auto" />
          <h3 className="text-xs sm:text-sm font-bold text-groomish-slate">
            No {activeTab === "POLICY" ? "Policies" : "Q&A Items"} Found
          </h3>
          <p className="text-xs text-groomish-slate/60 max-w-sm mx-auto">
            {searchQuery
              ? "No entries match your search criteria."
              : `Click "${activeTab === "POLICY" ? "Add New Policy Section" : "Add New Question & Answer"}" to create the first one.`}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className={`bg-white rounded-xl border p-4 sm:p-4.5 shadow-card transition-all ${
                item.active
                  ? "border-groomish-slate/10 hover:border-groomish-orange/30"
                  : "border-amber-200/60 bg-amber-50/20 opacity-80"
              }`}
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                {/* Heading & Meta */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-groomish-orange bg-groomish-orange/10 px-2 py-0.5 rounded-full">
                      {item.category}
                    </span>
                    <span className="text-[10px] font-mono text-groomish-slate/50 bg-groomish-slate/5 px-1.5 py-0.5 rounded">
                      Order: {item.displayOrder}
                    </span>
                    {item.active ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        <CheckCircle2 className="w-2.5 h-2.5" />
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                        <AlertTriangle className="w-2.5 h-2.5" />
                        Disabled
                      </span>
                    )}
                  </div>
                  <h3 className="text-xs sm:text-sm font-heading font-extrabold text-groomish-slate leading-snug">
                    {item.heading}
                  </h3>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                  {/* Toggle Active/Disabled */}
                  <button
                    onClick={() => handleToggleStatus(item)}
                    title={item.active ? "Disable Section" : "Enable Section"}
                    className={`p-2 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors ${
                      item.active
                        ? "text-groomish-slate/60 hover:text-amber-700 hover:bg-amber-50"
                        : "text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                    }`}
                  >
                    {item.active ? (
                      <>
                        <EyeOff className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Disable</span>
                      </>
                    ) : (
                      <>
                        <Eye className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Enable</span>
                      </>
                    )}
                  </button>

                  {/* Edit */}
                  <button
                    onClick={() => handleOpenEdit(item)}
                    title="Edit Content"
                    className="p-2 rounded-lg text-xs font-semibold text-groomish-slate/70 hover:text-groomish-orange hover:bg-groomish-orange/10 flex items-center gap-1 transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Edit</span>
                  </button>

                  {/* Force Delete */}
                  <button
                    onClick={() => handleForceDelete(item)}
                    title="Force Delete Permanently"
                    className="p-2 rounded-lg text-xs font-semibold text-red-600 hover:text-red-700 hover:bg-red-50 flex items-center gap-1 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Force Delete</span>
                  </button>
                </div>
              </div>

              {/* Description Preview */}
              <div className="mt-2.5 pt-2 border-t border-groomish-slate/5 text-xs text-groomish-slate/75 leading-relaxed whitespace-pre-line line-clamp-3">
                {item.description}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Modal */}
      {modalOpen && (
        <ModalWrapper
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          title={
            editingItem
              ? `Edit ${formData.type === "POLICY" ? "Policy Section" : "Question & Answer"}`
              : `Add New ${formData.type === "POLICY" ? "Policy Section" : "Question & Answer"}`
          }
          description="Manage heading, description / answer, category, and display order."
          maxWidth="max-w-2xl"
        >
          <form onSubmit={handleSaveSubmit} className="space-y-3.5 text-xs">
            {/* Type & Category Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-groomish-slate font-bold mb-1">
                  Type <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="input-groomish w-full"
                  disabled={!!editingItem}
                >
                  <option value="POLICY">Policy (Order, Payment, Refund, etc.)</option>
                  <option value="QA">Question & Answer (FAQ)</option>
                </select>
              </div>

              <div>
                <label className="block text-groomish-slate font-bold mb-1">
                  Category / Section <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. ORDER, PAYMENT, CANCELLATION, REFUND"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value.toUpperCase() })}
                  className="input-groomish w-full uppercase"
                  required
                />
                <div className="flex items-center gap-1 mt-1 flex-wrap">
                  <span className="text-[10px] text-groomish-slate/50">Suggestions:</span>
                  {(formData.type === "POLICY" ? policySuggestions : qaSuggestions).map((s) => (
                    <button
                      type="button"
                      key={s}
                      onClick={() => setFormData({ ...formData, category: s })}
                      className="text-[10px] text-groomish-orange hover:underline font-semibold"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Heading */}
            <div>
              <label className="block text-groomish-slate font-bold mb-1">
                {formData.type === "POLICY" ? "Policy Heading / Section Title" : "Question Heading"}{" "}
                <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder={
                  formData.type === "POLICY"
                    ? "e.g. Cancellation & Rescheduling Terms"
                    : "e.g. How do I cancel or reschedule my appointment?"
                }
                value={formData.heading}
                onChange={(e) => setFormData({ ...formData, heading: e.target.value })}
                className="input-groomish w-full"
                required
              />
            </div>

            {/* Description / Answer */}
            <div>
              <label className="block text-groomish-slate font-bold mb-1">
                {formData.type === "POLICY" ? "Policy Description & Details" : "Detailed Answer / Explanation"}{" "}
                <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={6}
                placeholder="Enter detailed content, terms, bullet points, or instructions..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="input-groomish w-full leading-relaxed"
                required
              />
            </div>

            {/* Display Order & Active Toggle */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center pt-1 border-t border-groomish-slate/10">
              <div>
                <label className="block text-groomish-slate font-bold mb-1">
                  Display Order
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.displayOrder}
                  onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value) || 0 })}
                  className="input-groomish w-full"
                />
                <span className="text-[10px] text-groomish-slate/50 mt-0.5 block">
                  Lower numbers display first.
                </span>
              </div>

              <div className="pt-4 sm:pt-0">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={formData.active}
                    onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                    className="w-4 h-4 rounded text-groomish-orange focus:ring-groomish-orange border-groomish-slate/20"
                  />
                  <div>
                    <span className="text-xs font-bold text-groomish-slate block">
                      Active / Published
                    </span>
                    <span className="text-[10px] text-groomish-slate/50 block">
                      When unchecked, this item will be hidden from customer pages.
                    </span>
                  </div>
                </label>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-groomish-slate/10">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="btn-secondary text-xs"
                disabled={formSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary text-xs"
                disabled={formSubmitting}
              >
                {formSubmitting
                  ? "Saving..."
                  : editingItem
                  ? "Save Changes"
                  : "Publish Content"}
              </button>
            </div>
          </form>
        </ModalWrapper>
      )}
    </div>
  );
}
