import { useState } from "react";
import ModalWrapper from "./ModalWrapper";
import { addCategoryApi } from "../../api/category";
import CloudinaryImageUploader from "../common/CloudinaryImageUploader";
import { Plus, AlertCircle, Layers } from "lucide-react";

export default function AddCategoryModal({ open, onClose, refresh }) {
  const [form, setForm] = useState({
    name: "",
    description: "",
    image: "",
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
      setError("Please enter a category name.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await addCategoryApi(form);
      setForm({ name: "", description: "", image: "" });
      refresh();
      onClose();
    } catch (err) {
      console.error("Failed to add category:", err);
      setError(
        err.response?.data?.message ||
        err.message ||
        "Failed to create category. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

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
            Add Salon Category
          </h2>
          <p className="text-xs text-groomish-slate/60 mt-0.5">
            Organize salon offerings with high-res cover photography.
          </p>
        </div>

        {error && (
          <div className="p-3 bg-groomish-crimson/10 text-groomish-crimson text-xs rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
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
          <CloudinaryImageUploader
            value={form.image}
            onChange={handleImageChange}
            folder="groomishnow/category"
            label="Category Cover Photo"
          />

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
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>Add Category</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </ModalWrapper>
  );
}
