import { useEffect, useState } from "react";
import ModalWrapper from "./ModalWrapper";
import { updateCategoryApi } from "../../api/category";
import CloudinaryImageUploader from "../common/CloudinaryImageUploader";
import { Layers, AlertCircle, Save, CheckCircle2 } from "lucide-react";

export default function EditCategoryModal({
  open,
  onClose,
  category,
  refresh,
}) {
  const [form, setForm] = useState({
    name: "",
    description: "",
    image: "",
    active: true,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (category) {
      setForm({
        name: category.name || "",
        description: category.description || "",
        image: category.image || "",
        active: category.active !== undefined ? Boolean(category.active) : true,
      });
      setError("");
    }
  }, [category]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleImageChange = (url) => {
    setForm((prev) => ({ ...prev, image: url }));
  };

  const handleUpdate = async (e) => {
    if (e) e.preventDefault();
    if (!form.name.trim()) {
      setError("Please enter a category name.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await updateCategoryApi(category.id, form);
      refresh();
      onClose();
    } catch (err) {
      console.error("Failed to update category:", err);
      setError(
        err.response?.data?.message ||
        err.message ||
        "Failed to update category. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  if (!category) return null;

  return (
    <ModalWrapper open={open} onClose={onClose} maxWidth="max-w-md">
      <div className="space-y-5">
        {/* Header */}
        <div className="border-b border-groomish-slate/10 pb-3">
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-groomish-orange mb-1">
            <Layers className="w-3.5 h-3.5" />
            <span>Salon Catalog</span>
          </div>
          <h2 className="text-xl font-heading font-extrabold text-groomish-slate">
            Edit Salon Category
          </h2>
          <p className="text-xs text-groomish-slate/60 mt-0.5">
            Update category details, service grouping, and cover photography.
          </p>
        </div>

        {error && (
          <div className="p-3 bg-groomish-crimson/10 text-groomish-crimson text-xs rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleUpdate} className="space-y-4">
          {/* Category Name */}
          <div>
            <label className="block text-xs font-bold text-groomish-slate mb-1">
              Category Name <span className="text-groomish-crimson">*</span>
            </label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="e.g. Hair Care & Styling"
              required
              className="w-full px-3.5 py-2.5 rounded-xl border border-groomish-slate/15 bg-white text-xs text-groomish-slate placeholder:text-groomish-slate/40 focus:outline-none focus:ring-2 focus:ring-groomish-orange/40"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-groomish-slate mb-1">
              Description
            </label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Short description of treatments included in this collection..."
              rows={3}
              className="w-full px-3.5 py-2.5 rounded-xl border border-groomish-slate/15 bg-white text-xs text-groomish-slate placeholder:text-groomish-slate/40 focus:outline-none focus:ring-2 focus:ring-groomish-orange/40 resize-none"
            />
          </div>

          {/* Cloudinary Image Uploader */}
          <div>
            <CloudinaryImageUploader
              value={form.image}
              onChange={handleImageChange}
              folder="groomishnow/category"
              label="Category Cover Photo"
              entityName={form.name || category.name}
            />
            <p className="text-[10px] text-groomish-slate/50 mt-1.5 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-groomish-orange" />
              <span>
                Images are saved in Cloudinary under the category name and overwritten on file replacement.
              </span>
            </p>
          </div>

          {/* Active Status Toggle */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-groomish-cream/40 border border-groomish-slate/10">
            <div>
              <p className="text-xs font-bold text-groomish-slate">
                Active Category
              </p>
              <p className="text-[10px] text-groomish-slate/60">
                Visible to customers on the salon mobile app and web booking.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                name="active"
                checked={form.active}
                onChange={handleChange}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-groomish-slate/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-groomish-green"></div>
            </label>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-groomish-slate/10">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 rounded-xl text-xs font-bold text-groomish-slate/70 hover:bg-groomish-cream transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary text-xs px-5 py-2.5 inline-flex items-center gap-1.5"
            >
              {loading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Updating...</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>Update Category</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </ModalWrapper>
  );
}
