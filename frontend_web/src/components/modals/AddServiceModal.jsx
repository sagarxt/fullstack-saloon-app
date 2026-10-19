import { useState } from "react";
import ModalWrapper from "./ModalWrapper";
import { addServiceApi } from "../../api/service";
import CloudinaryImageUploader from "../common/CloudinaryImageUploader";
import CustomSelect from "../common/CustomSelect";
import GroomCoinIcon from "../common/GroomCoinIcon";
import { Plus, AlertCircle, Scissors, Trash2, Layers } from "lucide-react";

export default function AddServiceModal({
  open,
  onClose,
  categories = [],
  refresh,
}) {
  const [form, setForm] = useState({
    name: "",
    description: "",
    image: "",
    categoryId: "",
    gender: "UNISEX",
    mrp: "",
    price: "",
    durationMinutes: "",
    rewards: "",
  });
  const [enableSubServices, setEnableSubServices] = useState(false);
  const [subServices, setSubServices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleImageChange = (url) => {
    setForm((prev) => ({ ...prev, image: url }));
  };

  const addSubServiceRow = () => {
    setSubServices((prev) => [
      ...prev,
      {
        name: "",
        description: "",
        mrp: form.mrp || "",
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

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!form.name.trim()) {
      setError("Please enter a service name.");
      return;
    }
    if (!form.categoryId) {
      setError("Please select a category for this service.");
      return;
    }
    if (!enableSubServices && !form.price) {
      setError("Please specify the service price.");
      return;
    }
    if (enableSubServices) {
      const validSubs = subServices.filter((s) => s.name && s.name.trim() && s.price);
      if (validSubs.length === 0) {
        setError("Please add at least one sub-service option with a name and price.");
        return;
      }
    }

    setLoading(true);
    setError("");

    try {
      const validSubServices = enableSubServices
        ? subServices
          .filter((s) => s.name && s.name.trim())
          .map((s) => ({
            name: s.name.trim(),
            description: s.description ? s.description.trim() : null,
            mrp: s.mrp ? parseFloat(s.mrp) : (s.price ? parseFloat(s.price) : null),
            price: parseFloat(s.price || 0),
            durationMinutes: s.durationMinutes
              ? parseInt(s.durationMinutes, 10)
              : 30,
            active: true,
          }))
        : [];

      const minSubPrice = validSubServices.length > 0 ? Math.min(...validSubServices.map(s => s.price)) : 0;
      const minSubMrp = validSubServices.length > 0 ? Math.min(...validSubServices.map(s => s.mrp || s.price)) : 0;
      const minSubDuration = validSubServices.length > 0 ? Math.min(...validSubServices.map(s => s.durationMinutes || 30)) : 30;

      const finalPrice = form.price ? parseFloat(form.price) : (validSubServices.length > 0 ? minSubPrice : 0);
      const finalMrp = form.mrp ? parseFloat(form.mrp) : (form.price ? parseFloat(form.price) : (validSubServices.length > 0 ? minSubMrp : finalPrice));
      const finalDuration = form.durationMinutes ? parseInt(form.durationMinutes, 10) : (validSubServices.length > 0 ? minSubDuration : 30);

      const payload = {
        ...form,
        mrp: finalMrp,
        price: finalPrice,
        durationMinutes: finalDuration,
        rewards: form.rewards ? parseInt(form.rewards, 10) : 0,
        subServices: validSubServices,
      };

      await addServiceApi(payload);
      setForm({
        name: "",
        description: "",
        image: "",
        categoryId: "",
        gender: "UNISEX",
        mrp: "",
        price: "",
        durationMinutes: "",
        rewards: "",
      });
      setEnableSubServices(false);
      setSubServices([]);
      refresh();
      onClose();
    } catch (err) {
      console.error("Failed to add service:", err);
      setError(
        err.response?.data?.message ||
        err.message ||
        "Failed to create service. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalWrapper open={open} onClose={onClose} maxWidth="max-w-2xl">
      <div className="space-y-3.5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-groomish-slate/10 pb-2.5">
          <div>
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-groomish-orange">
              <Scissors className="w-3 h-3" />
              <span>Salon Catalog</span>
            </div>
            <h2 className="text-lg font-heading font-extrabold text-groomish-slate">
              Add Salon Service
            </h2>
          </div>
          <p className="text-[11px] text-groomish-slate/60 hidden sm:block max-w-[350px] text-right">
            Configure new treatment pricing, duration, and photography.
          </p>
        </div>

        {error && (
          <div className="p-2.5 bg-groomish-crimson/10 text-groomish-crimson text-xs rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Row 1: Service Name & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-groomish-slate mb-1">
                Service Name <span className="text-groomish-crimson">*</span>
              </label>
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="e.g. Keratin Hair Spa & Treatment"
                required
                className="w-full px-3 py-2 rounded-xl border border-groomish-slate/15 bg-white text-xs text-groomish-slate placeholder:text-groomish-slate/40 focus:outline-none focus:ring-2 focus:ring-groomish-orange/40"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-groomish-slate mb-1">
                Category <span className="text-groomish-crimson">*</span>
              </label>
              <CustomSelect
                name="categoryId"
                value={form.categoryId}
                onChange={handleChange}
                placeholder={categories.length === 0 ? "No categories available" : "Select Category"}
                options={categories.map((c) => ({ value: c.id, label: c.name }))}
                className="py-2 text-xs"
              />
              {categories.length === 0 && (
                <p className="text-[10px] text-amber-600 mt-1 font-medium">
                  No categories found. Please create a category first.
                </p>
              )}
            </div>
          </div>

          {/* Row 2: Target Gender, MRP, Offer Price, Duration */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div>
              <label className="block text-xs font-bold text-groomish-slate mb-1">
                Target Gender
              </label>
              <CustomSelect
                name="gender"
                value={form.gender}
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
                MRP (₹) {enableSubServices && <span className="text-[10px] font-normal text-groomish-slate/50">(Optional)</span>}
              </label>
              <input
                type="number"
                name="mrp"
                value={form.mrp}
                onChange={handleChange}
                placeholder={enableSubServices ? "From options" : "1499"}
                min="0"
                className="w-full px-3 py-2 rounded-xl border border-groomish-slate/15 bg-white text-xs text-groomish-slate placeholder:text-groomish-slate/40 focus:outline-none focus:ring-2 focus:ring-groomish-orange/40"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-groomish-slate mb-1">
                Offer Price (₹) {!enableSubServices ? <span className="text-groomish-crimson">*</span> : <span className="text-[10px] font-normal text-groomish-slate/50">(Optional)</span>}
              </label>
              <input
                type="number"
                name="price"
                value={form.price}
                onChange={handleChange}
                placeholder={enableSubServices ? "From options" : "999"}
                required={!enableSubServices}
                min="0"
                className="w-full px-3 py-2 rounded-xl border border-groomish-slate/15 bg-white text-xs text-groomish-slate placeholder:text-groomish-slate/40 focus:outline-none focus:ring-2 focus:ring-groomish-orange/40"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-groomish-slate mb-1">
                Duration (mins) {enableSubServices && <span className="text-[10px] font-normal text-groomish-slate/50">(Optional)</span>}
              </label>
              <input
                type="number"
                name="durationMinutes"
                value={form.durationMinutes}
                onChange={handleChange}
                placeholder={enableSubServices ? "From options" : "30"}
                min="5"
                step="5"
                className="w-full px-3 py-2 rounded-xl border border-groomish-slate/15 bg-white text-xs text-groomish-slate placeholder:text-groomish-slate/40 focus:outline-none focus:ring-2 focus:ring-groomish-orange/40"
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
                    className={`inline-block w-2.5 h-2.5 rounded-full ${form.active ? "bg-emerald-500 animate-pulse" : "bg-rose-400"
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

          {/* Row 4: Description & Photo Uploader side by side */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-start">
            <div className="flex flex-col h-full">
              <label className="block text-xs font-bold text-groomish-slate mb-1">
                Service Description
              </label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="Detail what this service involves, products used, benefits..."
                rows={3}
                className="w-full flex-1 min-h-[78px] px-3 py-2 rounded-xl border border-groomish-slate/15 bg-white text-xs text-groomish-slate placeholder:text-groomish-slate/40 focus:outline-none focus:ring-2 focus:ring-groomish-orange/40 resize-none"
              />
            </div>

            <CloudinaryImageUploader
              value={form.image}
              onChange={handleImageChange}
              folder="groomishnow/service"
              label="Service Photo"
              compact={true}
              entityName={form.name}
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
              <div className="space-y-2.5 bg-groomish-cream/50 p-3 rounded-2xl border border-groomish-slate/10 max-h-72 overflow-y-auto">
                {subServices.length === 0 ? (
                  <p className="text-xs text-groomish-slate/50 text-center py-2">
                    No options added yet. Click "+ Add Option" to create variations.
                  </p>
                ) : (
                  subServices.map((sub, idx) => (
                    <div
                      key={idx}
                      className="bg-white p-3 rounded-xl border border-groomish-slate/10 shadow-2xs space-y-2"
                    >
                      <div className="flex items-center justify-between pb-1 border-b border-groomish-slate/10">
                        <span className="text-[11px] font-extrabold text-groomish-orange">
                          Variation #{idx + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeSubService(idx)}
                          className="px-2 py-0.5 rounded-lg text-groomish-slate/40 hover:text-groomish-crimson hover:bg-groomish-crimson/10 transition flex items-center gap-1 text-[10px] font-bold"
                          title="Remove option"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Remove</span>
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] font-bold text-groomish-slate/70 mb-0.5">
                            Sub-Service Name <span className="text-groomish-crimson">*</span>
                          </label>
                          <input
                            type="text"
                            value={sub.name}
                            onChange={(e) => updateSubService(idx, "name", e.target.value)}
                            placeholder="e.g. Beard Trim & Shape"
                            className="w-full px-2.5 py-1.5 rounded-lg border border-groomish-slate/15 text-xs text-groomish-slate focus:outline-none focus:ring-1 focus:ring-groomish-orange"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-groomish-slate/70 mb-0.5">
                            Description <span className="text-[9px] font-normal text-groomish-slate/40">(Optional)</span>
                          </label>
                          <input
                            type="text"
                            value={sub.description || ""}
                            onChange={(e) => updateSubService(idx, "description", e.target.value)}
                            placeholder="e.g. Precision shaping with hot towel"
                            className="w-full px-2.5 py-1.5 rounded-lg border border-groomish-slate/15 text-xs text-groomish-slate focus:outline-none focus:ring-1 focus:ring-groomish-orange"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="block text-[10px] font-bold text-groomish-slate/70 mb-0.5">
                            MRP (₹)
                          </label>
                          <input
                            type="number"
                            value={sub.mrp ?? ""}
                            onChange={(e) => updateSubService(idx, "mrp", e.target.value)}
                            placeholder="1499"
                            min="0"
                            className="w-full px-2.5 py-1.5 rounded-lg border border-groomish-slate/15 text-xs text-groomish-slate focus:outline-none focus:ring-1 focus:ring-groomish-orange"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-groomish-slate/70 mb-0.5">
                            Price (₹) <span className="text-groomish-crimson">*</span>
                          </label>
                          <input
                            type="number"
                            value={sub.price}
                            onChange={(e) => updateSubService(idx, "price", e.target.value)}
                            placeholder="999"
                            min="0"
                            className="w-full px-2.5 py-1.5 rounded-lg border border-groomish-slate/15 text-xs text-groomish-slate focus:outline-none focus:ring-1 focus:ring-groomish-orange"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-groomish-slate/70 mb-0.5">
                            Duration (mins)
                          </label>
                          <input
                            type="number"
                            value={sub.durationMinutes}
                            onChange={(e) => updateSubService(idx, "durationMinutes", e.target.value)}
                            placeholder="30"
                            min="5"
                            step="5"
                            className="w-full px-2.5 py-1.5 rounded-lg border border-groomish-slate/15 text-xs text-groomish-slate focus:outline-none focus:ring-1 focus:ring-groomish-orange"
                          />
                        </div>
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
                  <Plus className="w-4 h-4" />
                  <span>Add Service</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </ModalWrapper>
  );
}
