import { useEffect, useState } from "react";
import ModalWrapper from "./ModalWrapper";
import { updateServiceApi } from "../../api/service";
import CloudinaryImageUploader from "../common/CloudinaryImageUploader";
import CustomSelect from "../common/CustomSelect";
import GroomCoinIcon from "../common/GroomCoinIcon";
import { Scissors, AlertCircle, Save, Plus, Trash2, Layers } from "lucide-react";

export default function EditServiceModal({
  open,
  onClose,
  service,
  categories = [],
  refresh,
}) {
  const [form, setForm] = useState({});
  const [enableSubServices, setEnableSubServices] = useState(false);
  const [subServices, setSubServices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (service) {
      setForm({
        ...service,
        categoryId: service.categoryId || service.category?.id || "",
        gender: service.gender || "UNISEX",
        rewards: service.rewards ?? 0,
        active: service.active ?? true,
      });
      const subs = service.subServices || [];
      setSubServices(
        subs.map((s) => ({
          id: s.id,
          name: s.name,
          price: s.price,
          durationMinutes: s.durationMinutes,
        }))
      );
      setEnableSubServices(subs.length > 0);
      setError("");
    }
  }, [service]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const addSubServiceRow = () => {
    setSubServices((prev) => [
      ...prev,
      {
        name: "",
        price: form.price || "",
        durationMinutes: form.durationMinutes || "30",
      },
    ]);
  };

  const updateSubService = (index, field, value) => {
    setSubServices((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const removeSubService = (index) => {
    setSubServices((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpdate = async (e) => {
    if (e) e.preventDefault();
    if (!form.name?.trim()) {
      setError("Service name is required.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const validSubServices = enableSubServices
        ? subServices
          .filter((s) => s.name && s.name.trim())
          .map((s) => ({
            id: s.id || null,
            name: s.name.trim(),
            price: parseFloat(s.price || form.price || 0),
            durationMinutes: s.durationMinutes
              ? parseInt(s.durationMinutes, 10)
              : parseInt(form.durationMinutes || "30", 10),
            active: true,
          }))
        : [];

      const payload = {
        ...form,
        active: form.active !== undefined ? Boolean(form.active) : true,
        mrp: form.mrp ? parseFloat(form.mrp) : parseFloat(form.price),
        price: parseFloat(form.price),
        durationMinutes: parseInt(form.durationMinutes || "30", 10),
        rewards: form.rewards ? parseInt(form.rewards, 10) : 0,
        subServices: validSubServices,
      };
      await updateServiceApi(service.id, payload);
      refresh();
      onClose();
    } catch (err) {
      console.error("Failed to update service:", err);
      setError(err.response?.data?.message || err.message || "Failed to update service.");
    } finally {
      setLoading(false);
    }
  };

  if (!service) return null;

  return (
    <ModalWrapper open={open} onClose={onClose} maxWidth="max-w-2xl">
      <div className="space-y-3.5">
        <div className="flex items-center justify-between border-b border-groomish-slate/10 pb-2.5">
          <div>
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-groomish-orange">
              <Scissors className="w-3 h-3" />
              <span>Salon Catalog</span>
            </div>
            <h2 className="text-lg font-heading font-extrabold text-groomish-slate">
              Edit Salon Service
            </h2>
          </div>
          <p className="text-[11px] text-groomish-slate/60 hidden sm:block max-w-[350px] text-right">
            Update pricing, duration, gender target, or photography.
          </p>
        </div>

        {error && (
          <div className="p-2.5 bg-groomish-crimson/10 text-groomish-crimson text-xs rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleUpdate} className="space-y-3">
          {/* Row 1: Service Name & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-groomish-slate mb-1">
                Service Name <span className="text-groomish-crimson">*</span>
              </label>
              <input
                name="name"
                value={form.name || ""}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 rounded-xl border border-groomish-slate/15 bg-white text-xs text-groomish-slate focus:outline-none focus:ring-2 focus:ring-groomish-orange/40"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-groomish-slate mb-1">
                Category
              </label>
              <CustomSelect
                name="categoryId"
                value={form.categoryId || ""}
                onChange={handleChange}
                placeholder="Select Category"
                options={categories.map((c) => ({ value: c.id, label: c.name }))}
                className="py-2 text-xs"
              />
            </div>
          </div>

          {/* Row 2: Target Gender, MRP, Price, Duration */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div>
              <label className="block text-xs font-bold text-groomish-slate mb-1">
                Target Gender
              </label>
              <CustomSelect
                name="gender"
                value={form.gender || "UNISEX"}
                onChange={handleChange}
                options={[
                  { value: "UNISEX", label: "Unisex (All)" },
                  { value: "FEMALE", label: "Women" },
                  { value: "MALE", label: "Men" },
                ]}
                className="py-2 text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-groomish-slate mb-1">
                MRP (₹)
              </label>
              <input
                type="number"
                name="mrp"
                value={form.mrp ?? ""}
                onChange={handleChange}
                className="w-full px-3 py-2 rounded-xl border border-groomish-slate/15 bg-white text-xs text-groomish-slate focus:outline-none focus:ring-2 focus:ring-groomish-orange/40"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-groomish-slate mb-1">
                Price (₹) <span className="text-groomish-crimson">*</span>
              </label>
              <input
                type="number"
                name="price"
                value={form.price ?? ""}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 rounded-xl border border-groomish-slate/15 bg-white text-xs text-groomish-slate focus:outline-none focus:ring-2 focus:ring-groomish-orange/40"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-groomish-slate mb-1">
                Duration (mins)
              </label>
              <input
                type="number"
                name="durationMinutes"
                value={form.durationMinutes ?? ""}
                onChange={handleChange}
                className="w-full px-3 py-2 rounded-xl border border-groomish-slate/15 bg-white text-xs text-groomish-slate focus:outline-none focus:ring-2 focus:ring-groomish-orange/40"
              />
            </div>
          </div>

          {/* Row 3: Groom Coins & Active Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-start">
            <div>
              <label className="block text-xs font-bold text-groomish-slate mb-1 flex items-center gap-1.5">
                <GroomCoinIcon className="w-3.5 h-3.5" />
                <span>Extra Groom Coins</span>
                <span className="text-[10px] font-normal text-groomish-slate/50">(Optional)</span>
              </label>
              <input
                type="number"
                name="rewards"
                value={form.rewards ?? ""}
                onChange={handleChange}
                placeholder="0"
                min="0"
                className="w-full px-3 py-2 rounded-xl border border-amber-300/60 bg-amber-50/40 text-xs text-groomish-slate focus:outline-none focus:ring-2 focus:ring-groomish-gold/40"
              />
            </div>
            {/* active status toggle based on */}
            <div>
              <label className="block text-xs font-bold text-groomish-slate mb-1">
                Active Status
              </label>
              <div className="flex items-center justify-between px-3.5 py-2 rounded-xl bg-groomish-cream/40 border border-groomish-slate/15 hover:border-groomish-slate/30 transition">
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-block w-2.5 h-2.5 rounded-full ${
                      form.active ? "bg-emerald-500 animate-pulse" : "bg-rose-400"
                    }`}
                  />
                  <span className="text-xs font-semibold text-groomish-slate">
                    {form.active ? "Active" : "Deactive"}
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    name="active"
                    checked={Boolean(form.active)}
                    onChange={handleChange}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-groomish-slate/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-groomish-green"></div>
                </label>
              </div>
            </div>
          </div>

          {/* Row 4: Description & Image Uploader side by side */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-start">
            <div className="flex flex-col h-full">
              <label className="block text-xs font-bold text-groomish-slate mb-1">
                Description
              </label>
              <textarea
                name="description"
                rows={3}
                value={form.description || ""}
                onChange={handleChange}
                className="w-full flex-1 min-h-[78px] px-3 py-2 rounded-xl border border-groomish-slate/15 bg-white text-xs text-groomish-slate focus:outline-none focus:ring-2 focus:ring-groomish-orange/40 resize-none"
              />
            </div>

            <CloudinaryImageUploader
              value={form.image || ""}
              onChange={(url) => setForm((prev) => ({ ...prev, image: url }))}
              folder="groomishnow/service"
              label="Service Photo"
              compact={true}
              entityName={form.name || service?.name}
            />
          </div>

          {/* Row 4: Sub-Services / Service Variations (Optional) */}
          <div className="pt-2.5 border-t border-groomish-slate/10 space-y-2.5">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-xs font-bold text-groomish-slate flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={enableSubServices}
                    onChange={(e) => {
                      setEnableSubServices(e.target.checked);
                      if (e.target.checked && subServices.length === 0) {
                        addSubServiceRow();
                      }
                    }}
                    className="rounded text-groomish-orange focus:ring-groomish-orange w-4 h-4"
                  />
                  <span className="flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-groomish-orange" />
                    <span>Enable Sub-Service Options / Variations (Optional)</span>
                  </span>
                </label>
                <p className="text-[11px] text-groomish-slate/50 ml-6">
                  For example Hair Color: Faded color, Full color, Dual color, Highlight — each with custom price & duration.
                </p>
              </div>

              {enableSubServices && (
                <button
                  type="button"
                  onClick={addSubServiceRow}
                  className="text-[11px] font-bold text-groomish-orange hover:text-groomish-orangeDark px-2.5 py-1 rounded-lg bg-groomish-orangeLight flex items-center gap-1 transition shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Option</span>
                </button>
              )}
            </div>

            {enableSubServices && (
              <div className="space-y-2 bg-groomish-cream/50 p-3 rounded-2xl border border-groomish-slate/10 max-h-56 overflow-y-auto">
                <div className="grid grid-cols-12 gap-2 text-[10px] font-bold text-groomish-slate/50 uppercase px-1">
                  <span className="col-span-1 text-center">#</span>
                  <span className="col-span-5">Sub-Service Name</span>
                  <span className="col-span-3">Price (₹)</span>
                  <span className="col-span-2">Time (m)</span>
                  <span className="col-span-1 text-center">Del</span>
                </div>

                {subServices.length === 0 ? (
                  <p className="text-xs text-groomish-slate/50 text-center py-2">
                    No options added yet. Click "+ Add Option" to create variations.
                  </p>
                ) : (
                  subServices.map((sub, idx) => (
                    <div
                      key={idx}
                      className="grid grid-cols-12 gap-2 items-center bg-white p-2 rounded-xl border border-groomish-slate/10 shadow-2xs"
                    >
                      <span className="col-span-1 text-center text-xs font-bold text-groomish-slate/40">
                        {idx + 1}
                      </span>
                      <div className="col-span-5">
                        <input
                          type="text"
                          value={sub.name}
                          onChange={(e) => updateSubService(idx, "name", e.target.value)}
                          placeholder="e.g. Full color, Highlight"
                          className="w-full px-2.5 py-1.5 rounded-lg border border-groomish-slate/15 text-xs text-groomish-slate focus:outline-none focus:ring-1 focus:ring-groomish-orange"
                        />
                      </div>
                      <div className="col-span-3">
                        <input
                          type="number"
                          value={sub.price}
                          onChange={(e) => updateSubService(idx, "price", e.target.value)}
                          placeholder="Price ₹"
                          min="0"
                          className="w-full px-2.5 py-1.5 rounded-lg border border-groomish-slate/15 text-xs text-groomish-slate focus:outline-none focus:ring-1 focus:ring-groomish-orange"
                        />
                      </div>
                      <div className="col-span-2">
                        <input
                          type="number"
                          value={sub.durationMinutes}
                          onChange={(e) => updateSubService(idx, "durationMinutes", e.target.value)}
                          placeholder="Mins"
                          min="5"
                          step="5"
                          className="w-full px-2.5 py-1.5 rounded-lg border border-groomish-slate/15 text-xs text-groomish-slate focus:outline-none focus:ring-1 focus:ring-groomish-orange"
                        />
                      </div>
                      <div className="col-span-1 flex justify-center">
                        <button
                          type="button"
                          onClick={() => removeSubService(idx)}
                          className="p-1 rounded-lg text-groomish-slate/40 hover:text-groomish-crimson hover:bg-groomish-crimson/10 transition"
                          title="Remove option"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-2 pt-2.5 border-t border-groomish-slate/10">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-3.5 py-2 rounded-xl text-xs font-bold text-groomish-slate/70 hover:bg-groomish-cream transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary text-xs px-4 py-2 inline-flex items-center gap-1.5"
            >
              {loading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Update Service</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div >
    </ModalWrapper >
  );
}
