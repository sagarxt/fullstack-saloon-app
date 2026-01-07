import { useEffect, useState } from "react";

export default function CategoryFormModal({ open, onClose, onSave, initial }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [active, setActive] = useState(true);

  const [imageFile, setImageFile] = useState(null);
  const [preview, setPreview] = useState("");

  /* ===============================
     Populate data on EDIT
     =============================== */
  useEffect(() => {
    if (open) {
      if (initial) {
        setName(initial.name || "");
        setDescription(initial.description || "");
        setActive(initial.active ?? true);

        // Existing image from backend
        setPreview(initial.image || "");
        setImageFile(null);
      } else {
        // CREATE MODE
        setName("");
        setDescription("");
        setActive(true);
        setPreview("");
        setImageFile(null);
      }
    }
  }, [initial, open]);

  if (!open) return null;

  /* ===============================
     Handlers
     =============================== */
  const handleImageChange = (file) => {
    if (!file) return;
    setImageFile(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleSubmit = () => {
    if (!name.trim()) return;

    onSave({
      name,
      description,
      active,
      imageFile, // <-- important
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-xl bg-white shadow-xl">

        {/* ================= HEADER ================= */}
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">
            {initial ? "Edit Category" : "Add Category"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl"
          >
            ×
          </button>
        </div>

        {/* ================= BODY ================= */}
        <div className="px-6 py-5 space-y-4">

          {/* Category Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category Name
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Hair Care"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm
                focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 outline-none"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Short description"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm
                focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 outline-none resize-none"
            />
          </div>

          {/* ================= IMAGE UPLOAD ================= */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category Image
            </label>

            <div
              onClick={() => document.getElementById("cat-img-input").click()}
              className="mt-1 border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:border-indigo-500 transition"
            >
              {!preview ? (
                <p className="text-sm text-gray-500">
                  Click to upload image
                </p>
              ) : (
                <div className="relative inline-block">
                  <img
                    src={preview}
                    alt="Preview"
                    className="w-32 h-32 object-cover rounded-md border"
                  />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setPreview("");
                      setImageFile(null);
                    }}
                    className="absolute -top-2 -right-2 bg-gray-800 text-white rounded-full w-6 h-6 text-xs"
                  >
                    ×
                  </button>
                </div>
              )}
            </div>

            <input
              id="cat-img-input"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleImageChange(e.target.files?.[0])}
            />
          </div>

          {/* Active Toggle */}
          <div className="flex items-center justify-between pt-2">
            <span className="text-sm font-medium text-gray-700">
              Status
            </span>
            <button
              type="button"
              onClick={() => setActive(!active)}
              className={`px-3 py-1 rounded-full text-xs font-medium border ${
                active
                  ? "bg-green-100 text-green-700 border-green-300"
                  : "bg-gray-100 text-gray-600 border-gray-300"
              }`}
            >
              {active ? "Active" : "Inactive"}
            </button>
          </div>
        </div>

        {/* ================= FOOTER ================= */}
        <div className="flex justify-end gap-3 border-t px-6 py-4 bg-gray-50 rounded-b-xl">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm rounded-md border border-gray-300 text-gray-700 hover:bg-gray-100"
          >
            Cancel
          </button>

          <button
            onClick={handleSubmit}
            className="px-5 py-2 text-sm rounded-md bg-indigo-600 text-white font-medium hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500/40"
          >
            {initial ? "Update Category" : "Create Category"}
          </button>
        </div>
      </div>
    </div>
  );
}
