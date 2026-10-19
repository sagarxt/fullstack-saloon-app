import { useEffect, useState } from "react";
import { getUsersApi, createStaffApi, deactivateUserApi, updateUserApi } from "../../api/admin";
import { storeApi } from "../../api/store";
import ModalWrapper from "../../components/modals/ModalWrapper";
import CustomSelect from "../../components/common/CustomSelect";
import Pagination from "../../components/common/Pagination";
import { extractList } from "../../utils/dataHelper";
import {
  UserCheck,
  Plus,
  RefreshCw,
  Mail,
  Phone,
  Lock,
  User,
  AlertCircle,
  CheckCircle2,
  MapPin,
  Edit2,
  Eye,
  EyeOff,
  Trash2,
  Power,
} from "lucide-react";
import { forceDeleteStaffApi } from "../../api/maintenance";
import { showConfirm, showAlert } from "../../context/ConfirmContext";

const PAGE_SIZE = 20;

export default function StaffPage() {
  const [staff, setStaff] = useState([]);
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [createLoading, setCreateLoading] = useState(false);
  const [error, setError] = useState("");
  const [showCreatePassword, setShowCreatePassword] = useState(false);
  const [showEditPassword, setShowEditPassword] = useState(false);

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    storeId: "",
  });
  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    storeId: "",
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [usersRes, storesRes] = await Promise.all([
        getUsersApi("STAFF", 0, 100),
        storeApi.getAdminStores(),
      ]);
      setStaff(extractList(usersRes.data));
      setStores(Array.isArray(storesRes.data) ? storesRes.data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) {
      setError("Please fill in all required fields.");
      return;
    }

    if (form.phone && form.phone.trim().length !== 10) {
      setError("Phone number must be exactly 10 digits after +91.");
      return;
    }

    setCreateLoading(true);
    setError("");
    try {
      const cleanStoreId =
        typeof form.storeId === "object" && form.storeId !== null
          ? (form.storeId.target?.value ?? form.storeId.value)
          : form.storeId;

      const formattedPhone = form.phone?.trim() ? `+91${form.phone.trim()}` : null;

      const payload = {
        name: form.name.trim(),
        email: form.email.trim(),
        phone: formattedPhone,
        password: form.password,
        storeId: cleanStoreId && String(cleanStoreId).trim() !== "" ? String(cleanStoreId).trim() : null,
      };

      await createStaffApi(payload);
      setOpen(false);
      setForm({ name: "", email: "", phone: "", password: "", storeId: "" });
      setShowCreatePassword(false);
      loadData();
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to create staff member.";
      setError(msg);
    } finally {
      setCreateLoading(false);
    }
  };

  const handleOpenEdit = (s) => {
    setEditingStaff(s);
    const rawPhone = s.phone || "";
    const cleanDigits = rawPhone.replace(/^\+91/, "").replace(/\D/g, "").slice(-10);

    setEditForm({
      name: s.name || "",
      email: s.email || "",
      phone: cleanDigits,
      password: "",
      storeId: s.storeId || "",
    });
    setShowEditPassword(false);
    setError("");
    setEditOpen(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!editingStaff) return;

    if (editForm.phone && editForm.phone.trim().length !== 10) {
      setError("Phone number must be exactly 10 digits after +91.");
      return;
    }

    setCreateLoading(true);
    setError("");
    try {
      const cleanStoreId =
        typeof editForm.storeId === "object" && editForm.storeId !== null
          ? (editForm.storeId.target?.value ?? editForm.storeId.value)
          : editForm.storeId;

      const formattedPhone = editForm.phone?.trim() ? `+91${editForm.phone.trim()}` : null;

      const payload = {
        name: editForm.name?.trim(),
        email: editForm.email?.trim(),
        phone: formattedPhone,
        storeId: cleanStoreId && String(cleanStoreId).trim() !== "" ? String(cleanStoreId).trim() : null,
      };

      // Admin updates staff password directly without old password
      if (editForm.password && editForm.password.trim() !== "") {
        payload.password = editForm.password.trim();
      }

      await updateUserApi(editingStaff.id, payload);
      setEditOpen(false);
      loadData();
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to update staff member.";
      setError(msg);
    } finally {
      setCreateLoading(false);
    }
  };

  const handleToggleActive = async (id) => {
    try {
      await deactivateUserApi(id);
      loadData();
    } catch (err) {
      console.error(err);
      await showAlert({
        title: "Action Failed",
        message: err.response?.data?.message || "Failed to update staff status.",
        variant: "danger",
      });
    }
  };

  const storeOptions = [
    { value: "", label: "-- None / Floating Stylist --" },
    ...stores.map((st) => ({
      value: st.id,
      label: `${st.name} (${st.code || "Branch"}) - ${st.city}`,
    })),
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-extrabold text-groomish-slate">
            Stylists & Salon Staff
          </h1>
          <p className="text-xs text-groomish-slate/60 mt-0.5">
            Manage salon professionals, station assignments, and store branch queues.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            className="p-2.5 rounded-2xl bg-white border border-groomish-slate/15 text-groomish-slate hover:bg-groomish-cream transition"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-groomish-orange" : ""}`} />
          </button>
          <button
            onClick={() => {
              setOpen(true);
              setError("");
              setForm({
                name: "",
                email: "",
                phone: "",
                password: "",
                storeId: stores.length > 0 ? stores[0].id : "",
              });
            }}
            className="btn-primary text-xs px-4 py-2.5"
          >
            <Plus className="w-4 h-4" />
            <span>Add Staff Member</span>
          </button>
        </div>
      </div>

      {/* Staff Grid */}
      <div className="bg-white rounded-3xl border border-groomish-slate/10 shadow-soft overflow-hidden">
        {loading ? (
          <div className="py-16 text-center">
            <div className="w-8 h-8 border-4 border-groomish-orange border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-xs text-groomish-slate/60">Loading staff members...</p>
          </div>
        ) : staff.length === 0 ? (
          <div className="py-12 text-center text-xs text-groomish-slate/50">
            No staff members found. Add your first stylist above!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-groomish-cream/60 border-b border-groomish-slate/10 text-groomish-slate/60 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-6">Stylist Name</th>
                  <th className="py-3 px-6">Assigned Branch</th>
                  <th className="py-3 px-6">Email Address</th>
                  <th className="py-3 px-6">Phone Number</th>
                  <th className="py-3 px-6">Status</th>
                  <th className="py-3 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-groomish-slate/10">
                {staff
                  .slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
                  .map((s) => (
                  <tr key={s.id} className="hover:bg-groomish-cream/30 transition">
                    <td className="py-4 px-6 font-bold text-groomish-slate flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-groomish-blueLight text-groomish-blue flex items-center justify-center font-extrabold text-xs">
                        <UserCheck className="w-4 h-4" />
                      </div>
                      <span>{s.name}</span>
                    </td>
                    <td className="py-4 px-6">
                      {s.storeName ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold text-groomish-slate bg-groomish-cream border border-groomish-slate/15">
                          <MapPin className="w-3 h-3 text-groomish-orange shrink-0" />
                          <span className="truncate max-w-[140px]">{s.storeName}</span>
                          {s.storeCode && (
                            <span className="text-[9px] font-mono text-groomish-orange bg-groomish-orange/10 px-1 rounded">
                              {s.storeCode}
                            </span>
                          )}
                        </span>
                      ) : (
                        <span className="text-[11px] text-groomish-slate/40 italic">
                          Unassigned
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-groomish-slate/80">{s.email}</td>
                    <td className="py-4 px-6 text-groomish-slate/80">{s.phone || "—"}</td>
                    <td className="py-4 px-6">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          s.active !== false
                            ? "bg-groomish-greenLight text-groomish-green"
                            : "bg-groomish-crimsonLight text-groomish-crimson"
                        }`}
                      >
                        {s.active !== false ? "Active" : "Disabled"}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(s)}
                          className="p-2 rounded-xl text-groomish-slate bg-white hover:bg-groomish-orangeLight hover:text-groomish-orange border border-groomish-slate/15 hover:border-groomish-orange/40 transition shadow-2xs cursor-pointer active:scale-95"
                          title="Edit Staff Member"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => handleToggleActive(s.id)}
                          className={`p-2 rounded-xl border transition shadow-2xs cursor-pointer active:scale-95 ${
                            s.active !== false
                              ? "bg-white text-groomish-crimson border-groomish-crimson/20 hover:bg-groomish-crimson/10"
                              : "bg-white text-groomish-green border-groomish-green/20 hover:bg-groomish-green/10"
                          }`}
                          title={s.active !== false ? "Deactivate Staff" : "Activate Staff"}
                        >
                          <Power className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={async () => {
                            const ok = await showConfirm({
                              title: "Force Delete Staff Member",
                              message: `Are you sure you want to FORCE DELETE staff member "${s.name}"?\nThis permanently removes their staff profile.`,
                              confirmText: "Force Delete Staff",
                              variant: "danger",
                            });
                            if (!ok) return;

                            try {
                              await forceDeleteStaffApi(s.id);
                              loadData();
                            } catch (err) {
                              await showAlert({
                                title: "Deletion Failed",
                                message: err.response?.data?.message || "Failed to force delete staff.",
                                variant: "danger",
                              });
                            }
                          }}
                          className="p-2 rounded-xl border border-red-200 text-red-600 bg-white hover:bg-red-50 hover:border-red-300 transition shadow-2xs cursor-pointer active:scale-95"
                          title="Force Delete Staff Member Permanently"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {staff.length > 0 && (
          <div className="p-4 border-t border-groomish-slate/10 bg-white">
            <Pagination
              currentPage={page}
              totalItems={staff.length}
              pageSize={PAGE_SIZE}
              onPageChange={setPage}
              itemName="stylists"
            />
          </div>
        )}
      </div>

      {/* CREATE STAFF MODAL */}
      <ModalWrapper open={open} onClose={() => setOpen(false)} maxWidth="max-w-md">
        <div className="space-y-4">
          <div className="border-b border-groomish-slate/10 pb-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-groomish-blue bg-groomish-blueLight px-2.5 py-0.5 rounded-full inline-block mb-1">
              New Salon Specialist
            </span>
            <h2 className="text-xl font-heading font-bold text-groomish-slate">
              Add Staff Member
            </h2>
            <p className="text-xs text-groomish-slate/60 mt-0.5">
              Assign staff to their respective branch so their station queue reflects the store appointments.
            </p>
          </div>

          {error && (
            <div className="p-3 bg-groomish-crimson/10 text-groomish-crimson text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleCreate} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-groomish-slate/70 mb-1">
                Stylist Name *
              </label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                className="input-groomish"
                placeholder="e.g. Vikram Singhania"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-groomish-slate/70 mb-1">
                Salon Store Branch *
              </label>
              <CustomSelect
                name="storeId"
                options={storeOptions}
                value={form.storeId}
                onChange={(e) => {
                  const val = typeof e === "object" && e !== null ? (e.target?.value ?? e.value) : e;
                  setForm((prev) => ({ ...prev, storeId: val }));
                }}
                placeholder="Select Salon Branch"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-groomish-slate/70 mb-1">
                Email Address *
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
                className="input-groomish"
                placeholder="vikram@groomish.com"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-groomish-slate/70 mb-1">
                Phone Number
              </label>
              <div className="flex rounded-xl overflow-hidden border border-groomish-slate/15 bg-white focus-within:border-groomish-orange focus-within:ring-2 focus-within:ring-groomish-orange/20 transition-all">
                <span className="inline-flex items-center px-3 bg-groomish-cream text-groomish-slate font-semibold text-xs border-r border-groomish-slate/15 select-none">
                  🇮🇳 +91
                </span>
                <input
                  type="tel"
                  inputMode="numeric"
                  maxLength={10}
                  value={form.phone}
                  onChange={(e) => {
                    const digitsOnly = e.target.value.replace(/\D/g, "").slice(0, 10);
                    setForm({ ...form, phone: digitsOnly });
                  }}
                  className="w-full px-3 py-2 text-xs text-groomish-slate outline-none bg-transparent"
                  placeholder="9876543210"
                />
              </div>
              <div className="flex justify-between items-center mt-1">
                <span className="text-[11px] text-groomish-slate/50">10-digit mobile number</span>
                {form.phone && (
                  <span className={`text-[10px] font-mono ${form.phone.length === 10 ? "text-emerald-600 font-semibold" : "text-groomish-slate/40"}`}>
                    {form.phone.length}/10
                  </span>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-groomish-slate/70 mb-1">
                Staff Password *
              </label>
              <div className="relative">
                <input
                  type={showCreatePassword ? "text" : "password"}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                  className="input-groomish pr-10"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowCreatePassword(!showCreatePassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-groomish-slate/40 hover:text-groomish-slate"
                >
                  {showCreatePassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={createLoading}
              className="btn-auth mt-2"
            >
              {createLoading ? "Creating Staff..." : "Create Staff Account"}
            </button>
          </form>
        </div>
      </ModalWrapper>

      {/* EDIT / REASSIGN STAFF MODAL */}
      <ModalWrapper open={editOpen} onClose={() => setEditOpen(false)} maxWidth="max-w-md">
        <div className="space-y-4">
          <div className="border-b border-groomish-slate/10 pb-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-groomish-orange bg-groomish-orangeLight px-2.5 py-0.5 rounded-full inline-block mb-1">
              Station & Profile
            </span>
            <h2 className="text-xl font-heading font-bold text-groomish-slate">
              Edit Staff Member
            </h2>
          </div>

          {error && (
            <div className="p-3 bg-groomish-crimson/10 text-groomish-crimson text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleUpdate} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-groomish-slate/70 mb-1">
                Stylist Name
              </label>
              <input
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                required
                className="input-groomish"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-groomish-slate/70 mb-1">
                Assigned Salon Branch
              </label>
              <CustomSelect
                name="storeId"
                options={storeOptions}
                value={editForm.storeId}
                onChange={(e) => {
                  const val = typeof e === "object" && e !== null ? (e.target?.value ?? e.value) : e;
                  setEditForm((prev) => ({ ...prev, storeId: val }));
                }}
                placeholder="Select Salon Branch"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-groomish-slate/70 mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={editForm.email}
                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                required
                className="input-groomish"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-groomish-slate/70 mb-1">
                Phone Number
              </label>
              <div className="flex rounded-xl overflow-hidden border border-groomish-slate/15 bg-white focus-within:border-groomish-orange focus-within:ring-2 focus-within:ring-groomish-orange/20 transition-all">
                <span className="inline-flex items-center px-3 bg-groomish-cream text-groomish-slate font-semibold text-xs border-r border-groomish-slate/15 select-none">
                  🇮🇳 +91
                </span>
                <input
                  type="tel"
                  inputMode="numeric"
                  maxLength={10}
                  value={editForm.phone}
                  onChange={(e) => {
                    const digitsOnly = e.target.value.replace(/\D/g, "").slice(0, 10);
                    setEditForm({ ...editForm, phone: digitsOnly });
                  }}
                  className="w-full px-3 py-2 text-xs text-groomish-slate outline-none bg-transparent"
                  placeholder="9876543210"
                />
              </div>
              <div className="flex justify-between items-center mt-1">
                <span className="text-[11px] text-groomish-slate/50">10-digit mobile number</span>
                {editForm.phone && (
                  <span className={`text-[10px] font-mono ${editForm.phone.length === 10 ? "text-emerald-600 font-semibold" : "text-groomish-slate/40"}`}>
                    {editForm.phone.length}/10
                  </span>
                )}
              </div>
            </div>

            <div className="pt-2 border-t border-groomish-slate/10">
              <label className="block text-xs font-semibold text-groomish-slate/70 mb-1">
                Update Password
              </label>
              <div className="relative">
                <input
                  type={showEditPassword ? "text" : "password"}
                  value={editForm.password}
                  onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                  className="input-groomish pr-10"
                  placeholder="Enter new password to override"
                />
                <button
                  type="button"
                  onClick={() => setShowEditPassword(!showEditPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-groomish-slate/40 hover:text-groomish-slate"
                >
                  {showEditPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[11px] text-groomish-slate/50 mt-1">
                Leave blank to keep existing password. Admin can directly override without old password.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditOpen(false)}
                className="btn-secondary text-xs px-4 py-2"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={createLoading}
                className="btn-primary text-xs px-5 py-2"
              >
                {createLoading ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      </ModalWrapper>
    </div>
  );
}
