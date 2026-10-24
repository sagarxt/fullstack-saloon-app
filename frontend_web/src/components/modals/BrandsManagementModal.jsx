import React, { useState, useEffect } from "react";
import ModalWrapper from "./ModalWrapper";
import {
  getAdminBrands,
  createAdminBrand,
  updateAdminBrand,
  deleteAdminBrand,
} from "../../api/brand";
import { uploadImageApi } from "../../api/upload";
import { showConfirm, showAlert } from "../../context/ConfirmContext";
import { getOptimizedImageUrl } from "../../utils/imageHelper";
import {
  Award,
  Plus,
  Search,
  Edit2,
  Trash2,
  X,
  Upload,
  CheckCircle2,
  AlertCircle,
  Package,
  Sparkles,
  RefreshCw,
  Image as ImageIcon,
  Check,
  ChevronLeft,
  ExternalLink,
} from "lucide-react";

export default function BrandsManagementModal({
  open,
  onClose,
  onBrandsUpdated,
  initialEditingBrand = null,
}) {
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Sub-view: "LIST" or "FORM"
  const [view, setView] = useState("LIST");
  const [editingBrand, setEditingBrand] = useState(null);

  // Form State
  const [form, setForm] = useState({
    name: "",
    logo: "",
    shortDescription: "",
    active: true,
  });
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadError, setUploadError] = useState("");

  const loadBrands = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getAdminBrands();
      const list = Array.isArray(res.data) ? res.data : [];
      setBrands(list);
      if (onBrandsUpdated) {
        onBrandsUpdated(list);
      }
    } catch (err) {
      console.error("Failed to load brands:", err);
      setError(err.response?.data?.message || "Failed to load brands.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      loadBrands();
      if (initialEditingBrand) {
        handleOpenEdit(initialEditingBrand);
      } else {
        setView("LIST");
        setEditingBrand(null);
      }
    } else {
      setError("");
      setSuccess("");
      setUploadError("");
    }
  }, [open, initialEditingBrand]);

  const handleOpenCreate = () => {
    setEditingBrand(null);
    setForm({
      name: "",
      logo: "",
      shortDescription: "",
      active: true,
    });
    setError("");
    setSuccess("");
    setUploadError("");
    setView("FORM");
  };

  const handleOpenEdit = (brand) => {
    setEditingBrand(brand);
    setForm({
      name: brand.name || "",
      logo: brand.logo || "",
      shortDescription: brand.shortDescription || "",
      active: brand.active !== false,
    });
    setError("");
    setSuccess("");
    setUploadError("");
    setView("FORM");
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setUploadError("Please select a valid image file (PNG, JPG, WebP).");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setUploadError("Image size must be less than 10MB.");
      return;
    }

    setUploadingLogo(true);
    setUploadError("");
    try {
      const baseSlug = form.name?.trim()
        ? form.name.trim().toLowerCase().replace(/[^a-z0-9]/g, "_")
        : "brand";
      const nameKey = `${baseSlug}_${Date.now()}`;
      const res = await uploadImageApi(file, "groomishnow/brands", nameKey);
      if (res && res.url) {
        setForm((prev) => ({ ...prev, logo: res.url }));
        setSuccess("1:1 Brand logo uploaded successfully!");
        setTimeout(() => setSuccess(""), 3000);
      }
    } catch (err) {
      console.error("Logo upload failed:", err);
      setUploadError(err.response?.data?.message || "Failed to upload logo image.");
    } finally {
      setUploadingLogo(false);
      e.target.value = "";
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setError("Brand name is required.");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    const payload = {
      name: form.name.trim(),
      logo: form.logo ? form.logo.trim() : null,
      shortDescription: form.shortDescription ? form.shortDescription.trim() : null,
      active: Boolean(form.active),
    };

    try {
      if (editingBrand) {
        await updateAdminBrand(editingBrand.id, payload);
        setSuccess(`Brand "${payload.name}" updated successfully!`);
      } else {
        await createAdminBrand(payload);
        setSuccess(`Brand "${payload.name}" created successfully!`);
      }
      await loadBrands();
      setTimeout(() => {
        setView("LIST");
        setSuccess("");
      }, 1000);
    } catch (err) {
      console.error("Failed to save brand:", err);
      setError(err.response?.data?.message || "Failed to save brand.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (brand) => {
    const count = brand.productCount || 0;
    const countWarning = count > 0 ? `\n\nNotice: ${count} product(s) are currently associated with this brand.` : "";

    const ok = await showConfirm({
      title: "Remove Brand",
      message: `Are you sure you want to remove brand "${brand.name}"?${countWarning}`,
      confirmText: "Remove Brand",
      variant: "danger",
    });

    if (!ok) return;

    try {
      await deleteAdminBrand(brand.id);
      await loadBrands();
      setSuccess(`Brand "${brand.name}" removed successfully.`);
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error("Failed to delete brand:", err);
      await showAlert({
        title: "Action Failed",
        message: err.response?.data?.message || "Failed to delete brand.",
        variant: "danger",
      });
    }
  };

  const filteredBrands = brands.filter((b) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      b.name?.toLowerCase().includes(q) ||
      b.shortDescription?.toLowerCase().includes(q)
    );
  });

  return (
    <ModalWrapper open={open} onClose={onClose} maxWidth="max-w-2xl">
      <div className="space-y-4 text-xs">
        {/* MODAL HEADER */}
        <div className="flex items-center justify-between pb-3 border-b border-groomish-slate/10">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-groomish-orangeLight text-groomish-orange flex items-center justify-center shrink-0 shadow-sm">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-heading font-extrabold text-groomish-slate">
                  {view === "FORM"
                    ? editingBrand
                      ? `Modify Brand: ${editingBrand.name}`
                      : "Add New Product Brand"
                    : "Product Brands Catalog"}
                </h2>
                <span className="text-[10px] font-bold bg-groomish-orangeLight text-groomish-orange px-2 py-0.5 rounded-full">
                  {brands.length} Brands
                </span>
              </div>
              <p className="text-[11px] text-groomish-slate/60 mt-0.5">
                Manage retail brand partners, 1:1 square logos, and brand descriptions.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-groomish-slate/40 hover:text-groomish-slate hover:bg-groomish-cream transition"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ALERTS */}
        {error && (
          <div className="p-3 bg-groomish-crimson/10 text-groomish-crimson border border-groomish-crimson/20 rounded-xl flex items-center justify-between gap-2 animate-fade-in">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span className="font-medium">{error}</span>
            </div>
            <button onClick={() => setError("")} className="hover:opacity-75">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {success && (
          <div className="p-3 bg-groomish-green/10 text-groomish-green border border-groomish-green/20 rounded-xl flex items-center justify-between gap-2 animate-fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span className="font-semibold">{success}</span>
            </div>
            <button onClick={() => setSuccess("")} className="hover:opacity-75">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* VIEW: FORM (ADD / MODIFY BRAND) */}
        {view === "FORM" ? (
          <form onSubmit={handleSubmit} className="space-y-4 animate-fade-in">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setView("LIST")}
                className="text-xs font-bold text-groomish-slate/70 hover:text-groomish-orange flex items-center gap-1 transition"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Back to Brands List</span>
              </button>
              <span className="text-[11px] text-groomish-slate/50">
                {editingBrand ? "Editing existing brand profile" : "Creating new brand entry"}
              </span>
            </div>

            {/* Brand Name */}
            <div>
              <label className="block text-xs font-bold text-groomish-slate mb-1">
                Brand Name <span className="text-groomish-orange">*</span>
              </label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. L'Oréal Professionnel, Moroccanoil, Olaplex..."
                className="input-groomish font-semibold"
              />
            </div>

            {/* 1:1 Brand Logo Upload & Preview */}
            <div className="p-4 rounded-2xl bg-groomish-cream/40 border border-groomish-slate/10 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <label className="block text-xs font-bold text-groomish-slate">
                    1:1 Brand Logo
                  </label>
                  <p className="text-[10px] text-groomish-slate/60">
                    Square 1:1 aspect ratio logo (recommended 400x400 px, PNG or SVG with transparent background).
                  </p>
                </div>
                {form.logo && (
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, logo: "" })}
                    className="text-[10px] text-groomish-crimson hover:underline font-bold"
                  >
                    Remove Logo
                  </button>
                )}
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-4">
                {/* 1:1 Square Logo Preview Box */}
                <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-2xl border-2 border-dashed border-groomish-slate/20 bg-white shadow-soft flex items-center justify-center p-2 overflow-hidden shrink-0 group">
                  {uploadingLogo ? (
                    <div className="text-center space-y-1">
                      <RefreshCw className="w-6 h-6 text-groomish-orange animate-spin mx-auto" />
                      <span className="text-[10px] font-bold text-groomish-slate/60 block">Uploading...</span>
                    </div>
                  ) : form.logo ? (
                    <img
                      src={getOptimizedImageUrl(form.logo, { width: 240 })}
                      alt={form.name || "Brand Logo"}
                      className="w-full h-full object-contain transition-transform group-hover:scale-105"
                    />
                  ) : (
                    <div className="text-center text-groomish-slate/40 space-y-1">
                      <ImageIcon className="w-7 h-7 mx-auto opacity-50" />
                      <span className="text-[10px] font-semibold block">1:1 Square</span>
                    </div>
                  )}
                </div>

                {/* Upload & URL Input Controls */}
                <div className="flex-1 space-y-2 w-full">
                  <div className="flex items-center gap-2">
                    <label className="btn-secondary text-xs px-3.5 py-2 cursor-pointer inline-flex items-center gap-1.5 shadow-2xs">
                      <Upload className="w-3.5 h-3.5 text-groomish-orange" />
                      <span>{uploadingLogo ? "Uploading..." : "Upload 1:1 Logo"}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        disabled={uploadingLogo}
                        className="hidden"
                      />
                    </label>
                    <span className="text-[11px] text-groomish-slate/50">or paste direct image URL below</span>
                  </div>

                  <input
                    type="url"
                    value={form.logo}
                    onChange={(e) => setForm({ ...form, logo: e.target.value })}
                    placeholder="https://res.cloudinary.com/... or image link"
                    className="input-groomish text-[11px]"
                  />

                  {uploadError && (
                    <p className="text-[10px] text-groomish-crimson font-medium flex items-center gap-1">
                      <AlertCircle className="w-3 h-3 shrink-0" />
                      <span>{uploadError}</span>
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Short Description */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-groomish-slate">
                  Short Description
                </label>
                <span className="text-[10px] text-groomish-slate/50">
                  {form.shortDescription.length} / 500 chars
                </span>
              </div>
              <textarea
                rows={3}
                maxLength={500}
                value={form.shortDescription}
                onChange={(e) => setForm({ ...form, shortDescription: e.target.value })}
                placeholder="Brief summary of the brand, specialties, origin or salon formulation..."
                className="input-groomish leading-relaxed resize-none"
              />
            </div>

            {/* Active Switch */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-groomish-cream/40 border border-groomish-slate/10">
              <div>
                <span className="font-bold text-xs text-groomish-slate block">
                  Active in Catalog
                </span>
                <span className="text-[10px] text-groomish-slate/60">
                  Allow this brand to be selected when creating or filtering store products.
                </span>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={form.active}
                onClick={() => setForm((prev) => ({ ...prev, active: !prev.active }))}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-groomish-green focus:ring-offset-2 ${
                  form.active ? "bg-groomish-green" : "bg-gray-300"
                }`}
              >
                <span className="sr-only">Active in Catalog</span>
                <span
                  aria-hidden="true"
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    form.active ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            {/* Form Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-groomish-slate/10">
              <button
                type="button"
                onClick={() => setView("LIST")}
                disabled={saving}
                className="btn-secondary text-xs px-4 py-2"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving || uploadingLogo}
                className="btn-primary text-xs px-5 py-2 flex items-center gap-1.5"
              >
                {saving ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving Brand...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>{editingBrand ? "Save Changes" : "Create Brand"}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        ) : (
          /* VIEW: LIST (ALL BRANDS) */
          <div className="space-y-3 animate-fade-in">
            {/* Search and Add Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-groomish-slate/40 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search brands by name or description..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-groomish-cream text-xs text-groomish-slate outline-none border border-groomish-slate/15 focus:border-groomish-orange"
                />
                {search && (
                  <button
                    onClick={() => setSearch("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-groomish-slate/40 hover:text-groomish-slate"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={loadBrands}
                  className="p-2 rounded-xl border border-groomish-slate/15 bg-white text-groomish-slate hover:bg-groomish-cream transition"
                  title="Refresh list"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-groomish-orange" : ""}`} />
                </button>
                <button
                  type="button"
                  onClick={handleOpenCreate}
                  className="btn-primary text-xs px-3.5 py-2 flex items-center gap-1.5 shadow-soft"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add New Brand</span>
                </button>
              </div>
            </div>

            {/* Brands List Container */}
            {loading ? (
              <div className="py-16 text-center">
                <div className="w-8 h-8 border-4 border-groomish-orange border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                <p className="text-xs text-groomish-slate/60">Loading brands catalog...</p>
              </div>
            ) : filteredBrands.length === 0 ? (
              <div className="py-12 text-center text-groomish-slate/50 space-y-2 bg-groomish-cream/30 rounded-2xl border border-groomish-slate/10 p-6">
                <Award className="w-9 h-9 mx-auto opacity-40 text-groomish-slate" />
                <p className="font-bold text-sm text-groomish-slate">
                  {search ? `No brands matching "${search}"` : "No Brands Added Yet"}
                </p>
                <p className="text-xs text-groomish-slate/60 max-w-sm mx-auto">
                  {search
                    ? "Try adjusting your search keywords."
                    : "Create your first brand with a 1:1 square logo to categorize salon products."}
                </p>
                {!search && (
                  <button
                    type="button"
                    onClick={handleOpenCreate}
                    className="btn-primary text-xs px-4 py-2 mt-2 inline-flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add First Brand</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[55vh] overflow-y-auto pr-1">
                {filteredBrands.map((brand) => (
                  <div
                    key={brand.id}
                    className="p-3.5 rounded-2xl bg-white border border-groomish-slate/10 hover:border-groomish-orange/40 hover:shadow-soft transition-all space-y-2 flex flex-col justify-between group"
                  >
                    <div className="flex items-start gap-3">
                      {/* 1:1 Logo Box */}
                      <div className="w-13 h-13 rounded-xl bg-white border border-groomish-slate/15 p-1 shrink-0 flex items-center justify-center overflow-hidden shadow-2xs">
                        {brand.logo ? (
                          <img
                            src={getOptimizedImageUrl(brand.logo, { width: 120 })}
                            alt={brand.name}
                            className="w-full h-full object-contain aspect-square"
                          />
                        ) : (
                          <div className="w-full h-full rounded-lg bg-gradient-to-tr from-groomish-orange/20 to-groomish-coral/20 text-groomish-orange font-heading font-extrabold text-base flex items-center justify-center">
                            {brand.name?.charAt(0) || "B"}
                          </div>
                        )}
                      </div>

                      {/* Brand Info */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h4 className="font-heading font-extrabold text-sm text-groomish-slate leading-tight truncate">
                            {brand.name}
                          </h4>
                          {brand.active === false && (
                            <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded-full bg-gray-100 text-gray-500">
                              Inactive
                            </span>
                          )}
                        </div>

                        <p className="text-[11px] text-groomish-slateLight line-clamp-2 mt-1 leading-snug">
                          {brand.shortDescription || "No short description provided."}
                        </p>

                        <div className="flex items-center gap-2 mt-2">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-groomish-cream text-groomish-slate/80 border border-groomish-slate/10">
                            <Package className="w-3 h-3 text-groomish-orange" />
                            <span>{brand.productCount || 0} Products</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Card Actions */}
                    <div className="flex items-center justify-end gap-1.5 pt-2 border-t border-groomish-slate/10">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(brand)}
                        className="px-2.5 py-1.5 rounded-xl text-[11px] font-bold text-groomish-slate hover:text-groomish-orange hover:bg-groomish-orangeLight/40 border border-groomish-slate/15 transition flex items-center gap-1"
                        title="Modify Brand details"
                      >
                        <Edit2 className="w-3 h-3" />
                        <span>Modify</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDelete(brand)}
                        className="p-1.5 rounded-xl text-groomish-crimson hover:bg-groomish-crimson/10 border border-groomish-crimson/20 transition"
                        title="Remove Brand"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </ModalWrapper>
  );
}
