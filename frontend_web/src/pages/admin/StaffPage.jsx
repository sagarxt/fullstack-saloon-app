import { useEffect, useState } from "react";
import { getUsersApi, createStaffApi, deactivateUserApi } from "../../api/admin";
import ModalWrapper from "../../components/modals/ModalWrapper";
import { extractList } from "../../utils/dataHelper";
import { UserCheck, Plus, RefreshCw, Mail, Phone, Lock, User, AlertCircle, CheckCircle2 } from "lucide-react";

export default function StaffPage() {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
  });

  const loadStaff = async () => {
    setLoading(true);
    try {
      const res = await getUsersApi("STAFF", 0, 100);
      setStaff(extractList(res.data));
    } catch (err) {
      console.error(err);
      setStaff([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStaff();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) {
      setError("Please fill in all required fields.");
      return;
    }

    setCreateLoading(true);
    setError("");
    try {
      await createStaffApi(form);
      setOpen(false);
      setForm({ name: "", email: "", phone: "", password: "" });
      loadStaff();
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to create staff member.";
      setError(msg);
    } finally {
      setCreateLoading(false);
    }
  };

  const handleToggleActive = async (id) => {
    try {
      await deactivateUserApi(id);
      loadStaff();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-extrabold text-groomish-slate">
            Stylists & Salon Staff
          </h1>
          <p className="text-xs text-groomish-slate/60 mt-0.5">
            Manage salon professionals, barbers, and service personnel.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadStaff}
            className="p-2.5 rounded-2xl bg-white border border-groomish-slate/15 text-groomish-slate hover:bg-groomish-cream transition"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-groomish-orange" : ""}`} />
          </button>
          <button
            onClick={() => {
              setOpen(true);
              setError("");
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
                  <th className="py-3 px-6">Email Address</th>
                  <th className="py-3 px-6">Phone Number</th>
                  <th className="py-3 px-6">Status</th>
                  <th className="py-3 px-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-groomish-slate/10">
                {staff.map((s) => (
                  <tr key={s.id} className="hover:bg-groomish-cream/30 transition">
                    <td className="py-4 px-6 font-bold text-groomish-slate flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-groomish-blueLight text-groomish-blue flex items-center justify-center font-extrabold text-xs">
                        <UserCheck className="w-4 h-4" />
                      </div>
                      <span>{s.name}</span>
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
                    <td className="py-4 px-6 text-right">
                      <button
                        onClick={() => handleToggleActive(s.id)}
                        className={`text-xs font-bold ${
                          s.active !== false
                            ? "text-groomish-crimson hover:underline"
                            : "text-groomish-green hover:underline"
                        }`}
                      >
                        {s.active !== false ? "Deactivate" : "Activate"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
                Stylist Name
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
                Email Address
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
              <input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="input-groomish"
                placeholder="Phone number"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-groomish-slate/70 mb-1">
                Staff Password
              </label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
                className="input-groomish"
                placeholder="••••••••"
              />
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
    </div>
  );
}
