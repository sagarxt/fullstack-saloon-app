import { useEffect, useState } from "react";
import ModalWrapper from "./ModalWrapper";
import {
  getAdminCohortsApi,
  createAdminCohortApi,
  updateAdminCohortApi,
  deleteAdminCohortApi,
  toggleAdminCohortStatusApi,
  applyAdminCohortToUsersApi,
  applyAllAdminCohortsToUsersApi,
  getAdminCohortUsersApi,
} from "../../api/admin";
import { extractList } from "../../utils/dataHelper";
import { showConfirm, showAlert } from "../../context/ConfirmContext";
import {
  Users,
  Plus,
  Edit2,
  Trash2,
  Power,
  RefreshCw,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Clock,
  Calendar,
  Crown,
  Search,
  X,
  Play,
  ArrowRight,
  ShieldCheck,
  Check,
} from "lucide-react";

const COHORT_COLORS = [
  { id: "groomish-orange", name: "Orange", bg: "bg-groomish-orange/10", text: "text-groomish-orange", border: "border-groomish-orange/20" },
  { id: "emerald", name: "Emerald", bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
  { id: "blue", name: "Blue", bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
  { id: "indigo", name: "Indigo", bg: "bg-indigo-50", text: "text-indigo-700", border: "border-indigo-200" },
  { id: "purple", name: "Purple", bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200" },
  { id: "amber", name: "Amber", bg: "bg-amber-50", text: "text-amber-800", border: "border-amber-300" },
  { id: "rose", name: "Rose", bg: "bg-rose-50", text: "text-rose-700", border: "border-rose-200" },
  { id: "cyan", name: "Cyan", bg: "bg-cyan-50", text: "text-cyan-700", border: "border-cyan-200" },
  { id: "slate", name: "Slate", bg: "bg-gray-100", text: "text-gray-700", border: "border-gray-300" },
];

const getColorObj = (colorId) => {
  return COHORT_COLORS.find((c) => c.id === colorId) || COHORT_COLORS[0];
};

const TIERS = [
  { id: "SILVER", label: "Silver" },
  { id: "GOLD", label: "Gold" },
  { id: "PLATINUM", label: "Platinum" },
  { id: "DIAMOND", label: "Diamond" },
];

export default function CohortManagementModal({
  open,
  onClose,
  onCohortsUpdated,
}) {
  const [cohorts, setCohorts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [applyingAll, setApplyingAll] = useState(false);
  const [applyingCohortId, setApplyingCohortId] = useState(null);

  // Editor Sub-Modal (Create / Edit)
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingCohort, setEditingCohort] = useState(null);
  const [savingCohort, setSavingCohort] = useState(false);
  const [editorError, setEditorError] = useState("");

  const [form, setForm] = useState({
    name: "",
    code: "",
    description: "",
    color: "groomish-orange",
    active: true,
    autoApply: true,
    conditionOperator: "AND",
    eligibleTiers: [],
    minDaysSinceRegistration: "",
    maxDaysSinceRegistration: "",
    minLifetimePoints: "",
    maxLifetimePoints: "",
    minCurrentPoints: "",
    maxCurrentPoints: "",
    minTotalSpend: "",
    maxTotalSpend: "",
    minBookingsCount: "",
    maxBookingsCount: "",
    minDaysSinceLastVisit: "",
    maxDaysSinceLastVisit: "",
    gender: "ALL",
  });

  // View Users Sub-Modal
  const [viewUsersModalOpen, setViewUsersModalOpen] = useState(false);
  const [selectedCohortForUsers, setSelectedCohortForUsers] = useState(null);
  const [cohortUsersList, setCohortUsersList] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  const loadCohorts = async () => {
    setLoading(true);
    try {
      const res = await getAdminCohortsApi();
      const list = extractList(res.data);
      setCohorts(list);
      if (onCohortsUpdated) onCohortsUpdated(list);
    } catch (err) {
      console.error("Failed to load cohorts:", err);
      showAlert({
        title: "Error",
        message: "Failed to load customer cohorts catalog.",
        variant: "danger",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      loadCohorts();
    }
  }, [open]);

  // Open Create Modal
  const handleOpenCreate = () => {
    setEditingCohort(null);
    setForm({
      name: "",
      code: "",
      description: "",
      color: "groomish-orange",
      active: true,
      autoApply: true,
      conditionOperator: "AND",
      eligibleTiers: [],
      minDaysSinceRegistration: "",
      maxDaysSinceRegistration: "",
      minLifetimePoints: "",
      maxLifetimePoints: "",
      minCurrentPoints: "",
      maxCurrentPoints: "",
      minTotalSpend: "",
      maxTotalSpend: "",
      minBookingsCount: "",
      maxBookingsCount: "",
      minDaysSinceLastVisit: "",
      maxDaysSinceLastVisit: "",
      gender: "ALL",
    });
    setEditorError("");
    setEditorOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (c) => {
    setEditingCohort(c);
    setForm({
      name: c.name || "",
      code: c.code || "",
      description: c.description || "",
      color: c.color || "groomish-orange",
      active: c.active !== undefined ? c.active : true,
      autoApply: c.autoApply !== undefined ? c.autoApply : true,
      conditionOperator: c.conditionOperator || "AND",
      eligibleTiers: c.eligibleTiers ? Array.from(c.eligibleTiers) : [],
      minDaysSinceRegistration: c.minDaysSinceRegistration != null ? String(c.minDaysSinceRegistration) : "",
      maxDaysSinceRegistration: c.maxDaysSinceRegistration != null ? String(c.maxDaysSinceRegistration) : "",
      minLifetimePoints: c.minLifetimePoints != null ? String(c.minLifetimePoints) : "",
      maxLifetimePoints: c.maxLifetimePoints != null ? String(c.maxLifetimePoints) : "",
      minCurrentPoints: c.minCurrentPoints != null ? String(c.minCurrentPoints) : "",
      maxCurrentPoints: c.maxCurrentPoints != null ? String(c.maxCurrentPoints) : "",
      minTotalSpend: c.minTotalSpend != null ? String(c.minTotalSpend) : "",
      maxTotalSpend: c.maxTotalSpend != null ? String(c.maxTotalSpend) : "",
      minBookingsCount: c.minBookingsCount != null ? String(c.minBookingsCount) : "",
      maxBookingsCount: c.maxBookingsCount != null ? String(c.maxBookingsCount) : "",
      minDaysSinceLastVisit: c.minDaysSinceLastVisit != null ? String(c.minDaysSinceLastVisit) : "",
      maxDaysSinceLastVisit: c.maxDaysSinceLastVisit != null ? String(c.maxDaysSinceLastVisit) : "",
      gender: c.gender || "ALL",
    });
    setEditorError("");
    setEditorOpen(true);
  };

  // Auto-generate code slug when typing name in Create mode
  const handleNameChange = (val) => {
    if (!editingCohort) {
      const slug = val.trim().toUpperCase().replace(/[^A-Z0-9]/g, "_");
      setForm((prev) => ({ ...prev, name: val, code: slug }));
    } else {
      setForm((prev) => ({ ...prev, name: val }));
    }
  };

  // Toggle Tier selection
  const handleToggleTier = (tierId) => {
    setForm((prev) => {
      const exists = prev.eligibleTiers.includes(tierId);
      const nextTiers = exists
        ? prev.eligibleTiers.filter((t) => t !== tierId)
        : [...prev.eligibleTiers, tierId];
      return { ...prev, eligibleTiers: nextTiers };
    });
  };

  // Save Cohort & Logics
  const handleSaveCohort = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setEditorError("Cohort name is required.");
      return;
    }
    if (!form.code.trim()) {
      setEditorError("Cohort code/key is required.");
      return;
    }

    setSavingCohort(true);
    setEditorError("");

    try {
      const payload = {
        name: form.name.trim(),
        code: form.code.trim().toUpperCase().replace(/[^A-Z0-9_]/g, "_"),
        description: form.description.trim(),
        color: form.color,
        active: Boolean(form.active),
        autoApply: Boolean(form.autoApply),
        conditionOperator: form.conditionOperator || "AND",
        eligibleTiers: form.eligibleTiers,
        minDaysSinceRegistration: form.minDaysSinceRegistration !== "" ? Number(form.minDaysSinceRegistration) : null,
        maxDaysSinceRegistration: form.maxDaysSinceRegistration !== "" ? Number(form.maxDaysSinceRegistration) : null,
        minLifetimePoints: form.minLifetimePoints !== "" ? Number(form.minLifetimePoints) : null,
        maxLifetimePoints: form.maxLifetimePoints !== "" ? Number(form.maxLifetimePoints) : null,
        minCurrentPoints: form.minCurrentPoints !== "" ? Number(form.minCurrentPoints) : null,
        maxCurrentPoints: form.maxCurrentPoints !== "" ? Number(form.maxCurrentPoints) : null,
        minTotalSpend: form.minTotalSpend !== "" ? Number(form.minTotalSpend) : null,
        maxTotalSpend: form.maxTotalSpend !== "" ? Number(form.maxTotalSpend) : null,
        minBookingsCount: form.minBookingsCount !== "" ? Number(form.minBookingsCount) : null,
        maxBookingsCount: form.maxBookingsCount !== "" ? Number(form.maxBookingsCount) : null,
        minDaysSinceLastVisit: form.minDaysSinceLastVisit !== "" ? Number(form.minDaysSinceLastVisit) : null,
        maxDaysSinceLastVisit: form.maxDaysSinceLastVisit !== "" ? Number(form.maxDaysSinceLastVisit) : null,
        gender: form.gender && form.gender !== "ALL" ? form.gender : null,
      };

      if (editingCohort) {
        await updateAdminCohortApi(editingCohort.id, payload);
        showAlert({
          title: "Cohort Updated",
          message: `Cohort "${form.name}" and its logic rules have been updated and applied to users.`,
          variant: "success",
        });
      } else {
        await createAdminCohortApi(payload);
        showAlert({
          title: "Cohort Created",
          message: `New cohort "${form.name}" has been created and evaluated across your customer base.`,
          variant: "success",
        });
      }

      setEditorOpen(false);
      loadCohorts();
    } catch (err) {
      console.error(err);
      setEditorError(err.response?.data?.message || err.message || "Failed to save cohort.");
    } finally {
      setSavingCohort(false);
    }
  };

  // Toggle active/inactive
  const handleToggleStatus = async (cohort) => {
    try {
      await toggleAdminCohortStatusApi(cohort.id, !cohort.active);
      loadCohorts();
    } catch (err) {
      showAlert({
        title: "Action Failed",
        message: err.response?.data?.message || "Failed to update cohort status.",
        variant: "danger",
      });
    }
  };

  // Delete custom cohort
  const handleDeleteCohort = async (cohort) => {
    if (cohort.isDefault) {
      showAlert({
        title: "Protected System Cohort",
        message: "Default system cohorts cannot be deleted. You can deactivate them instead.",
        variant: "warning",
      });
      return;
    }

    const confirmed = await showConfirm({
      title: `Delete Cohort "${cohort.name}"?`,
      message: `This will permanently remove the "${cohort.name}" cohort definition and remove it from all assigned users.`,
      confirmText: "Delete Cohort",
      variant: "danger",
    });

    if (confirmed) {
      try {
        await deleteAdminCohortApi(cohort.id);
        showAlert({
          title: "Cohort Deleted",
          message: `Cohort "${cohort.name}" was successfully removed.`,
          variant: "success",
        });
        loadCohorts();
      } catch (err) {
        showAlert({
          title: "Delete Failed",
          message: err.response?.data?.message || "Failed to delete cohort.",
          variant: "danger",
        });
      }
    }
  };

  // Apply single cohort logic to users
  const handleApplySingleCohort = async (cohort) => {
    setApplyingCohortId(cohort.id);
    try {
      const res = await applyAdminCohortToUsersApi(cohort.id);
      const msg = res.data?.message || `Cohort "${cohort.name}" applied successfully!`;
      showAlert({
        title: "Cohort Logic Applied",
        message: msg,
        variant: "success",
      });
      loadCohorts();
    } catch (err) {
      showAlert({
        title: "Application Failed",
        message: err.response?.data?.message || "Failed to evaluate and apply cohort rules.",
        variant: "danger",
      });
    } finally {
      setApplyingCohortId(null);
    }
  };

  // Bulk sync all cohorts to users
  const handleApplyAllCohorts = async () => {
    setApplyingAll(true);
    try {
      const res = await applyAllAdminCohortsToUsersApi();
      const msg = res.data?.message || "All active cohort rules synchronized across customers!";
      showAlert({
        title: "Sync Complete",
        message: msg,
        variant: "success",
      });
      loadCohorts();
    } catch (err) {
      showAlert({
        title: "Bulk Sync Failed",
        message: err.response?.data?.message || "Failed to synchronize cohorts across users.",
        variant: "danger",
      });
    } finally {
      setApplyingAll(false);
    }
  };

  // View matching users
  const handleOpenUsersList = async (cohort) => {
    setSelectedCohortForUsers(cohort);
    setViewUsersModalOpen(true);
    setLoadingUsers(true);
    try {
      const res = await getAdminCohortUsersApi(cohort.id);
      setCohortUsersList(extractList(res.data));
    } catch (err) {
      console.error(err);
      setCohortUsersList([]);
    } finally {
      setLoadingUsers(false);
    }
  };

  // Filter cohorts by search
  const filteredCohorts = cohorts.filter((c) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      c.name?.toLowerCase().includes(q) ||
      c.code?.toLowerCase().includes(q) ||
      c.description?.toLowerCase().includes(q)
    );
  });

  return (
    <>
      {/* MAIN COHORT LIST MODAL */}
      <ModalWrapper open={open} onClose={onClose} maxWidth="max-w-4xl">
        <div className="space-y-5">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-groomish-slate/10 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-groomish-orange/10 text-groomish-orange flex items-center justify-center shrink-0">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-heading font-extrabold text-groomish-slate">
                    Customer Cohorts & Logic Rules
                  </h2>
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-groomish-cream text-groomish-slate border border-groomish-slate/15">
                    {cohorts.length} Cohorts
                  </span>
                </div>
                <p className="text-xs text-groomish-slateLight mt-0.5">
                  Define automated segmentation criteria. Logics evaluate and dynamically attach cohorts to qualifying users.
                </p>
              </div>
            </div>

            {/* Top CTA Buttons */}
            <div className="flex items-center gap-2 self-start sm:self-center">
              <button
                type="button"
                onClick={handleApplyAllCohorts}
                disabled={applyingAll}
                className="px-3.5 py-2 rounded-xl text-xs font-bold text-groomish-slate bg-groomish-cream hover:bg-groomish-orangeLight hover:text-groomish-orange border border-groomish-slate/15 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                title="Synchronize all active cohort rules across all customers in the database"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${applyingAll ? "animate-spin text-groomish-orange" : ""}`} />
                <span>{applyingAll ? "Syncing..." : "Sync All to Users"}</span>
              </button>

              <button
                type="button"
                onClick={handleOpenCreate}
                className="btn-primary text-xs px-4 py-2 flex items-center gap-1.5 shadow-soft cursor-pointer whitespace-nowrap"
              >
                <Plus className="w-4 h-4" />
                <span>Create Cohort</span>
              </button>
            </div>
          </div>

          {/* Search bar */}
          <div className="flex items-center justify-between gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 text-groomish-slate/40 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search cohorts by name, code or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-groomish-cream/70 text-xs text-groomish-slate border border-transparent focus:border-groomish-orange focus:bg-white outline-none transition"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-groomish-slate/40 hover:text-groomish-slate"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Cohorts Catalog Grid */}
          {loading ? (
            <div className="p-16 text-center">
              <RefreshCw className="w-7 h-7 text-groomish-orange animate-spin mx-auto mb-2" />
              <p className="text-xs font-bold text-groomish-slateLight">Loading customer cohorts...</p>
            </div>
          ) : filteredCohorts.length === 0 ? (
            <div className="p-12 text-center bg-groomish-cream/40 rounded-3xl border border-groomish-slate/10">
              <Users className="w-8 h-8 text-groomish-slate/30 mx-auto mb-2" />
              <h4 className="text-sm font-heading font-bold text-groomish-slate">No cohorts found</h4>
              <p className="text-xs text-groomish-slateLight mt-0.5 max-w-sm mx-auto">
                {searchQuery ? "No cohorts match your search." : "No cohorts exist. Click 'Create Cohort' above."}
              </p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-3.5 max-h-[60vh] overflow-y-auto pr-1">
              {filteredCohorts.map((cohort) => {
                const colorObj = getColorObj(cohort.color);
                const isApplyingThis = applyingCohortId === cohort.id;

                return (
                  <div
                    key={cohort.id}
                    className={`p-4 rounded-2xl border transition flex flex-col justify-between ${
                      cohort.active
                        ? "bg-white border-groomish-slate/15 hover:border-groomish-orange/40 hover:shadow-soft"
                        : "bg-gray-50 border-gray-200 opacity-70"
                    }`}
                  >
                    <div className="space-y-2">
                      {/* Top row: badge, active toggle, actions */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span
                            className={`px-2 py-0.5 rounded-lg text-[11px] font-black border uppercase tracking-wider ${colorObj.bg} ${colorObj.text} ${colorObj.border}`}
                          >
                            {cohort.code}
                          </span>
                          {cohort.isDefault && (
                            <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200/80">
                              System
                            </span>
                          )}
                          {!cohort.active && (
                            <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-gray-200 text-gray-600">
                              Inactive
                            </span>
                          )}
                        </div>

                        {/* Top quick actions */}
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(cohort)}
                            className={`p-1.5 rounded-lg border transition cursor-pointer active:scale-95 ${
                              cohort.active
                                ? "text-emerald-700 bg-emerald-50 border-emerald-200 hover:bg-emerald-100"
                                : "text-gray-400 bg-gray-100 border-gray-200 hover:bg-gray-200"
                            }`}
                            title={cohort.active ? "Deactivate Cohort" : "Activate Cohort"}
                          >
                            <Power className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenEdit(cohort)}
                            className="p-1.5 rounded-lg text-groomish-slate bg-white hover:bg-groomish-orangeLight hover:text-groomish-orange border border-groomish-slate/15 transition cursor-pointer active:scale-95"
                            title="Modify Cohort & Rules"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          {!cohort.isDefault && (
                            <button
                              type="button"
                              onClick={() => handleDeleteCohort(cohort)}
                              className="p-1.5 rounded-lg text-red-600 bg-white hover:bg-red-50 border border-red-200 transition cursor-pointer active:scale-95"
                              title="Delete Cohort"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Cohort Name & Description */}
                      <div>
                        <h3 className="font-heading font-extrabold text-sm text-groomish-slate">
                          {cohort.name}
                        </h3>
                        {cohort.description && (
                          <p className="text-[11px] text-groomish-slateLight mt-0.5 line-clamp-2">
                            {cohort.description}
                          </p>
                        )}
                      </div>

                      {/* Logic Rules Summary */}
                      <div className="p-2.5 rounded-xl bg-groomish-cream/70 border border-groomish-slate/10 space-y-1">
                        <div className="flex items-center justify-between text-[10px] font-bold text-groomish-slate/60 uppercase tracking-wider">
                          <span>Condition Logic</span>
                          <span className="px-1.5 py-0.2 rounded font-black text-groomish-slate bg-white border border-groomish-slate/15">
                            Rule: {cohort.conditionOperator || "AND"}
                          </span>
                        </div>
                        <p className="text-[11px] font-semibold text-groomish-slate leading-relaxed">
                          {cohort.ruleSummary || "All registered patrons"}
                        </p>
                      </div>
                    </div>

                    {/* Bottom Row: Qualified Count & Apply Button */}
                    <div className="flex items-center justify-between pt-3 mt-3 border-t border-groomish-slate/10">
                      <button
                        type="button"
                        onClick={() => handleOpenUsersList(cohort)}
                        className="text-xs font-bold text-groomish-orange hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <Users className="w-3.5 h-3.5" />
                        <span>{cohort.matchingUsersCount} Qualifying Customers</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleApplySingleCohort(cohort)}
                        disabled={isApplyingThis}
                        className="px-2.5 py-1 rounded-lg text-xs font-bold text-groomish-slate bg-groomish-cream hover:bg-groomish-orange hover:text-white border border-groomish-slate/15 transition flex items-center gap-1 cursor-pointer disabled:opacity-50"
                        title="Evaluate logic and add this cohort to qualifying users"
                      >
                        <Play className={`w-3 h-3 ${isApplyingThis ? "animate-spin text-groomish-orange" : ""}`} />
                        <span>{isApplyingThis ? "Applying..." : "Apply to Users"}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Footer Close */}
          <div className="flex justify-end pt-3 border-t border-groomish-slate/10">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary text-xs px-5 py-2 cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </ModalWrapper>

      {/* CREATE / MODIFY COHORT MODAL */}
      <ModalWrapper
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleSaveCohort} className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-groomish-slate/10 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-groomish-orange/15 text-groomish-orange flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-heading font-extrabold text-lg text-groomish-slate">
                  {editingCohort ? `Modify Cohort: ${editingCohort.name}` : "Create Customer Cohort & Rules"}
                </h3>
                <p className="text-xs text-groomish-slateLight">
                  Configure dynamic criteria that automatically segment qualifying users.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setEditorOpen(false)}
              className="p-1.5 rounded-full text-groomish-slate/40 hover:text-groomish-slate hover:bg-groomish-cream transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {editorError && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{editorError}</span>
            </div>
          )}

          {/* Form Content Scrollable */}
          <div className="space-y-4 max-h-[65vh] overflow-y-auto pr-1">
            {/* Section 1: Basic Cohort Info */}
            <div className="space-y-3">
              <h4 className="text-xs font-black text-groomish-slate uppercase tracking-wider">
                1. Cohort Profile & Appearance
              </h4>

              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-groomish-slate block mb-1">
                    Cohort Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="E.g. High Value Spenders"
                    value={form.name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-groomish-cream text-xs text-groomish-slate border border-transparent focus:border-groomish-orange focus:bg-white outline-none transition"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-groomish-slate block mb-1">
                    Cohort Code / Identifier <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    disabled={editingCohort?.isDefault}
                    placeholder="E.g. HIGH_VALUE_SPENDERS"
                    value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                    className="w-full px-3.5 py-2 rounded-xl bg-groomish-cream text-xs text-groomish-slate font-mono uppercase tracking-wider border border-transparent focus:border-groomish-orange focus:bg-white outline-none transition disabled:opacity-50"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-groomish-slate block mb-1">
                  Description / Purpose
                </label>
                <textarea
                  rows={2}
                  placeholder="Describe the target audience and intent for this cohort..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-groomish-cream text-xs text-groomish-slate border border-transparent focus:border-groomish-orange focus:bg-white outline-none transition resize-none"
                />
              </div>

              {/* Color picker */}
              <div>
                <label className="text-xs font-bold text-groomish-slate block mb-1.5">
                  Badge Theme Color
                </label>
                <div className="flex items-center gap-2 flex-wrap">
                  {COHORT_COLORS.map((col) => {
                    const isSelected = form.color === col.id;
                    return (
                      <button
                        key={col.id}
                        type="button"
                        onClick={() => setForm({ ...form, color: col.id })}
                        className={`px-3 py-1 rounded-lg text-xs font-bold border transition flex items-center gap-1.5 cursor-pointer ${col.bg} ${col.text} ${col.border} ${
                          isSelected ? "ring-2 ring-groomish-orange ring-offset-1 scale-105" : "hover:opacity-80"
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3" />}
                        <span>{col.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Section 2: Condition Matching Rule Operator */}
            <div className="p-3.5 rounded-2xl bg-groomish-cream/70 border border-groomish-slate/10 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-black text-groomish-slate uppercase tracking-wider">
                    2. Condition Evaluation Mode
                  </h4>
                  <p className="text-[11px] text-groomish-slateLight">
                    Choose how multiple configured criteria below are evaluated for customer matching.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setForm({ ...form, conditionOperator: "AND" })}
                  className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                    form.conditionOperator === "AND"
                      ? "bg-white border-groomish-orange shadow-2xs text-groomish-slate"
                      : "bg-white/60 border-groomish-slate/15 text-groomish-slate/70 hover:bg-white"
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded-full border border-groomish-orange flex items-center justify-center shrink-0">
                      {form.conditionOperator === "AND" && (
                        <span className="w-2 h-2 rounded-full bg-groomish-orange" />
                      )}
                    </span>
                    <span className="font-extrabold text-xs">Match ALL Rules (AND)</span>
                  </div>
                  <p className="text-[10px] text-groomish-slateLight mt-1 pl-5.5">
                    Patron must satisfy every active rule specified below to enter cohort.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setForm({ ...form, conditionOperator: "OR" })}
                  className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                    form.conditionOperator === "OR"
                      ? "bg-white border-groomish-orange shadow-2xs text-groomish-slate"
                      : "bg-white/60 border-groomish-slate/15 text-groomish-slate/70 hover:bg-white"
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded-full border border-groomish-orange flex items-center justify-center shrink-0">
                      {form.conditionOperator === "OR" && (
                        <span className="w-2 h-2 rounded-full bg-groomish-orange" />
                      )}
                    </span>
                    <span className="font-extrabold text-xs">Match ANY Rule (OR)</span>
                  </div>
                  <p className="text-[10px] text-groomish-slateLight mt-1 pl-5.5">
                    Patron qualifies if they satisfy at least one active condition below.
                  </p>
                </button>
              </div>
            </div>

            {/* Section 3: Logic Rules Configuration */}
            <div className="space-y-3.5">
              <h4 className="text-xs font-black text-groomish-slate uppercase tracking-wider">
                3. Logic Rule Criteria
              </h4>

              {/* Tier Multi-Select */}
              <div>
                <label className="text-xs font-bold text-groomish-slate block mb-1">
                  Loyalty Tiers (Leave empty for all tiers)
                </label>
                <div className="flex items-center gap-2 flex-wrap">
                  {TIERS.map((tier) => {
                    const isSelected = form.eligibleTiers.includes(tier.id);
                    return (
                      <button
                        key={tier.id}
                        type="button"
                        onClick={() => handleToggleTier(tier.id)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition flex items-center gap-1.5 cursor-pointer ${
                          isSelected
                            ? "bg-groomish-orange text-white border-groomish-orange shadow-2xs"
                            : "bg-groomish-cream text-groomish-slate/75 border-groomish-slate/15 hover:border-groomish-orange/40"
                        }`}
                      >
                        <Crown className="w-3 h-3" />
                        <span>{tier.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Account Registration Recency (Age) */}
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-groomish-slate block mb-1">
                    Min Days Since Registration
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="E.g. 365 (Loyal for 1+ year)"
                    value={form.minDaysSinceRegistration}
                    onChange={(e) => setForm({ ...form, minDaysSinceRegistration: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-groomish-cream text-xs text-groomish-slate border border-transparent focus:border-groomish-orange focus:bg-white outline-none transition"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-groomish-slate block mb-1">
                    Max Days Since Registration
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="E.g. 30 (New within 30 days)"
                    value={form.maxDaysSinceRegistration}
                    onChange={(e) => setForm({ ...form, maxDaysSinceRegistration: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-groomish-cream text-xs text-groomish-slate border border-transparent focus:border-groomish-orange focus:bg-white outline-none transition"
                  />
                </div>
              </div>

              {/* Lifetime Points Earned */}
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-groomish-slate block mb-1">
                    Min Lifetime Points
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="E.g. 300"
                    value={form.minLifetimePoints}
                    onChange={(e) => setForm({ ...form, minLifetimePoints: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-groomish-cream text-xs text-groomish-slate border border-transparent focus:border-groomish-orange focus:bg-white outline-none transition"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-groomish-slate block mb-1">
                    Max Lifetime Points
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="E.g. 1000"
                    value={form.maxLifetimePoints}
                    onChange={(e) => setForm({ ...form, maxLifetimePoints: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-groomish-cream text-xs text-groomish-slate border border-transparent focus:border-groomish-orange focus:bg-white outline-none transition"
                  />
                </div>
              </div>

              {/* Total Spend */}
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-groomish-slate block mb-1">
                    Min Total Lifetime Spend (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="E.g. 5000"
                    value={form.minTotalSpend}
                    onChange={(e) => setForm({ ...form, minTotalSpend: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-groomish-cream text-xs text-groomish-slate border border-transparent focus:border-groomish-orange focus:bg-white outline-none transition"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-groomish-slate block mb-1">
                    Max Total Lifetime Spend (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="Optional ceiling"
                    value={form.maxTotalSpend}
                    onChange={(e) => setForm({ ...form, maxTotalSpend: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-groomish-cream text-xs text-groomish-slate border border-transparent focus:border-groomish-orange focus:bg-white outline-none transition"
                  />
                </div>
              </div>

              {/* Completed Appointments / Bookings */}
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-groomish-slate block mb-1">
                    Min Completed Bookings
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="E.g. 3 (Regular visitor)"
                    value={form.minBookingsCount}
                    onChange={(e) => setForm({ ...form, minBookingsCount: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-groomish-cream text-xs text-groomish-slate border border-transparent focus:border-groomish-orange focus:bg-white outline-none transition"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-groomish-slate block mb-1">
                    Max Completed Bookings
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="E.g. 0 (Lead / Non-booker)"
                    value={form.maxBookingsCount}
                    onChange={(e) => setForm({ ...form, maxBookingsCount: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-groomish-cream text-xs text-groomish-slate border border-transparent focus:border-groomish-orange focus:bg-white outline-none transition"
                  />
                </div>
              </div>

              {/* Inactivity / Churn Risk (Days Since Last Visit) */}
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-groomish-slate block mb-1">
                    Min Days Since Last Visit (Churn Risk)
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="E.g. 60 (No visit in 60d)"
                    value={form.minDaysSinceLastVisit}
                    onChange={(e) => setForm({ ...form, minDaysSinceLastVisit: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-groomish-cream text-xs text-groomish-slate border border-transparent focus:border-groomish-orange focus:bg-white outline-none transition"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-groomish-slate block mb-1">
                    Max Days Since Last Visit (Recent Activity)
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="E.g. 30 (Visited in last 30d)"
                    value={form.maxDaysSinceLastVisit}
                    onChange={(e) => setForm({ ...form, maxDaysSinceLastVisit: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-groomish-cream text-xs text-groomish-slate border border-transparent focus:border-groomish-orange focus:bg-white outline-none transition"
                  />
                </div>
              </div>

              {/* Demographic / Gender */}
              <div>
                <label className="text-xs font-bold text-groomish-slate block mb-1">
                  Gender Target
                </label>
                <div className="flex items-center gap-2">
                  {["ALL", "MALE", "FEMALE"].map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setForm({ ...form, gender: g })}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer ${
                        form.gender === g
                          ? "bg-groomish-slate text-white border-groomish-slate"
                          : "bg-groomish-cream text-groomish-slate/75 border-groomish-slate/15 hover:bg-white"
                      }`}
                    >
                      {g === "ALL" ? "All Genders" : g === "MALE" ? "Men Only" : "Women Only"}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Auto Apply Toggle */}
            <div className="p-3.5 rounded-2xl bg-groomish-orangeLight/40 border border-groomish-orange/20 flex items-center justify-between">
              <div>
                <span className="text-xs font-extrabold text-groomish-slate block">
                  Automatic Dynamic Synchronization
                </span>
                <span className="text-[11px] text-groomish-slateLight block">
                  Keep users automatically evaluated and added to this cohort on save and customer events.
                </span>
              </div>
              <input
                type="checkbox"
                checked={form.autoApply}
                onChange={(e) => setForm({ ...form, autoApply: e.target.checked })}
                className="w-4 h-4 accent-groomish-orange cursor-pointer"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-groomish-slate/10">
            <button
              type="button"
              onClick={() => setEditorOpen(false)}
              className="btn-secondary text-xs px-4 py-2 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={savingCohort}
              className="btn-primary text-xs px-5 py-2 flex items-center gap-1.5 shadow-soft cursor-pointer"
            >
              {savingCohort ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Evaluating & Saving...</span>
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>{editingCohort ? "Update & Apply to Users" : "Create & Apply to Users"}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </ModalWrapper>

      {/* VIEW MATCHING USERS LIST MODAL */}
      <ModalWrapper
        open={viewUsersModalOpen}
        onClose={() => setViewUsersModalOpen(false)}
        maxWidth="max-w-2xl"
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-groomish-slate/10 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-groomish-orange/15 text-groomish-orange flex items-center justify-center shrink-0">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-heading font-extrabold text-lg text-groomish-slate">
                  Qualifying Patrons: {selectedCohortForUsers?.name}
                </h3>
                <span className="text-xs text-groomish-slateLight">
                  {cohortUsersList.length} customers currently qualify under this cohort's logic rules.
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setViewUsersModalOpen(false)}
              className="p-1.5 rounded-full text-groomish-slate/40 hover:text-groomish-slate hover:bg-groomish-cream transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {loadingUsers ? (
            <div className="p-12 text-center">
              <RefreshCw className="w-6 h-6 text-groomish-orange animate-spin mx-auto mb-2" />
              <p className="text-xs text-groomish-slateLight font-bold">Evaluating cohort rules on customers...</p>
            </div>
          ) : cohortUsersList.length === 0 ? (
            <div className="p-8 text-center bg-groomish-cream/40 rounded-2xl">
              <p className="text-xs text-groomish-slateLight">No customers currently match these criteria.</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {cohortUsersList.map((u) => (
                <div
                  key={u.id}
                  className="p-2.5 rounded-xl border border-groomish-slate/10 bg-white hover:bg-groomish-cream/30 transition flex items-center justify-between"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-groomish-orange/10 text-groomish-orange flex items-center justify-center font-bold text-xs uppercase">
                      {u.name ? u.name.charAt(0) : "U"}
                    </div>
                    <div>
                      <span className="font-bold text-xs text-groomish-slate block">
                        {u.name || "Customer"}
                      </span>
                      <span className="text-[11px] text-groomish-slateLight block">
                        {u.email} {u.phone ? `• ${u.phone}` : ""}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200 block">
                      {u.tier || "SILVER"}
                    </span>
                    <span className="text-[10px] text-groomish-slate/60 block mt-0.5">
                      {u.lifetimePoints || u.points || 0} Coins
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-end pt-3 border-t border-groomish-slate/10">
            <button
              type="button"
              onClick={() => setViewUsersModalOpen(false)}
              className="btn-secondary text-xs px-4 py-2 cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </ModalWrapper>
    </>
  );
}
