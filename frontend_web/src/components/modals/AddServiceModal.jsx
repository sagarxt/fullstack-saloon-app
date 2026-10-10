import { useState } from "react";
import ModalWrapper from "./ModalWrapper";
import { addServiceApi } from "../../api/service";
import CloudinaryImageUploader from "../common/CloudinaryImageUploader";
import CustomSelect from "../common/CustomSelect";
import { Plus, AlertCircle, Scissors } from "lucide-react";

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
    durationMinutes: "30",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleImageChange = (url) => {
    setForm((prev) => ({ ...prev, image: url }));
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
    if (!form.price) {
      setError("Please specify the service price.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const payload = {
        ...form,
        mrp: form.mrp ? parseFloat(form.mrp) : parseFloat(form.price),
        price: parseFloat(form.price),
        durationMinutes: parseInt(form.durationMinutes || "30", 10),
        rewards: Math.round(parseFloat(form.price) / 10),
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
        durationMinutes: "30",
      });
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
          <p className="text-[11px] text-groomish-slate/60 hidden sm:block max-w-[260px] text-right">
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
                placeholder="Select Category"
                options={categories.map((c) => ({ value: c.id, label: c.name }))}
                className="py-2 text-xs"
              />
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
                MRP (₹)
              </label>
              <input
                type="number"
                name="mrp"
                value={form.mrp}
                onChange={handleChange}
                placeholder="1499"
                min="0"
                className="w-full px-3 py-2 rounded-xl border border-groomish-slate/15 bg-white text-xs text-groomish-slate placeholder:text-groomish-slate/40 focus:outline-none focus:ring-2 focus:ring-groomish-orange/40"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-groomish-slate mb-1">
                Offer Price (₹) <span className="text-groomish-crimson">*</span>
              </label>
              <input
                type="number"
                name="price"
                value={form.price}
                onChange={handleChange}
                placeholder="999"
                required
                min="0"
                className="w-full px-3 py-2 rounded-xl border border-groomish-slate/15 bg-white text-xs text-groomish-slate placeholder:text-groomish-slate/40 focus:outline-none focus:ring-2 focus:ring-groomish-orange/40"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-groomish-slate mb-1">
                Duration (mins)
              </label>
              <input
                type="number"
                name="durationMinutes"
                value={form.durationMinutes}
                onChange={handleChange}
                placeholder="30"
                min="5"
                step="5"
                className="w-full px-3 py-2 rounded-xl border border-groomish-slate/15 bg-white text-xs text-groomish-slate placeholder:text-groomish-slate/40 focus:outline-none focus:ring-2 focus:ring-groomish-orange/40"
              />
            </div>
          </div>

          {/* Row 3: Description & Photo Uploader side by side */}
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
            />
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
