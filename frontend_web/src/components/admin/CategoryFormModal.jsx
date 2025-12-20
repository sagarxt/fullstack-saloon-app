// src/components/admin/CategoryFormModal.jsx
import React, { useEffect, useState } from "react";

export default function CategoryFormModal({ open, onClose, onSave, initial }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [active, setActive] = useState(true);
  const [imageFile, setImageFile] = useState(null);
  const [preview, setPreview] = useState("");

  useEffect(() => {
    if (initial) {
      setName(initial.name || "");
      setDescription(initial.description || "");
      setActive(initial.active ?? true);
      setPreview(initial.image || "");
      setImageFile(null);
    } else {
      setName("");
      setDescription("");
      setActive(true);
      setPreview("");
      setImageFile(null);
    }
  }, [initial, open]);

  if (!open) return null;

  const handleImageChange = (file) => {
    if (!file) return;
    setImageFile(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleFileFromInput = (e) => {
    const file = e.target.files?.[0];
    handleImageChange(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    handleImageChange(file);
  };

  const handleSubmit = () => {
    if (!name.trim()) return;
    onSave({ name, description, active, imageFile });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center">
      <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl border border-luxe-gold/40 relative">
        
        {/* Close */}
        <button
          className="absolute top-3 right-4 text-gray-400 hover:text-black text-xl"
          onClick={onClose}
        >
          ✕
        </button>

        <h2 className="text-2xl font-serif font-semibold text-luxe-black mb-4">
          {initial ? "Edit Category" : "Add Category"}
        </h2>

        <div className="space-y-4">

          {/* NAME */}
          <div>
            <label className="text-sm font-medium text-gray-700">Name</label>
            <input
              className="mt-1 w-full border border-luxe-gray-light rounded-md px-3 py-2 text-luxe-black focus:outline-none focus:ring-2 focus:ring-luxe-gold"
              placeholder="e.g. Hair Care"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          {/* DESCRIPTION */}
          <div>
            <label className="text-sm font-medium text-gray-700">Description</label>
            <textarea
              className="mt-1 w-full border border-luxe-gray-light rounded-md px-3 py-2 text-luxe-black focus:outline-none focus:ring-2 focus:ring-luxe-gold"
              rows={3}
              placeholder="Short description about this category..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* IMAGE UPLOAD */}
          <div>
            <label className="text-sm font-medium text-gray-700">Category Image</label>

            <div
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              className="mt-1 border-2 border-dashed border-luxe-gold/40 hover:border-luxe-gold rounded-xl p-4 text-center cursor-pointer transition"
              onClick={() => document.getElementById("categoryImgInput").click()}
            >
              {!preview ? (
                <>
                  <p className="text-luxe-black text-sm">Drag & Drop or Click to Upload</p>
                  <p className="text-xs text-luxe-gray-medium mt-1">PNG, JPG, JPEG</p>
                </>
              ) : (
                <div className="relative w-full flex justify-center">
                  <img
                    src={preview}
                    alt="Preview"
                    className="w-40 h-40 rounded-xl object-cover shadow-md animate-slideFade"
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setPreview("");
                      setImageFile(null);
                    }}
                    className="absolute -top-2 -right-2 bg-black/80 text-white px-2 py-[2px] rounded-full text-xs hover:bg-black"
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>

            <input
              id="categoryImgInput"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileFromInput}
            />
          </div>

          {/* ACTIVE TOGGLE */}
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700">Active</label>

            <button
              type="button"
              onClick={() => setActive((prev) => !prev)}
              className={`px-3 py-1 text-xs rounded-full border transition ${
                active
                  ? "bg-emerald-100 text-emerald-700 border-emerald-300"
                  : "bg-gray-200 text-gray-700 border-gray-300"
              }`}
            >
              {active ? "Active" : "Inactive"}
            </button>
          </div>

          {/* FOOTER BUTTONS */}
          <div className="pt-2 flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm rounded-full border border-gray-300 text-gray-700 hover:bg-gray-100"
            >
              Cancel
            </button>

            <button
              onClick={handleSubmit}
              className="px-5 py-2 text-sm rounded-full bg-luxe-gold text-luxe-black font-semibold hover:bg-luxe-gold-soft"
            >
              {initial ? "Update Category" : "Create Category"}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
