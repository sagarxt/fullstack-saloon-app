import { useEffect, useState } from "react";

export default function ServiceFormModal({
  open,
  onClose,
  onSave,
  initial,
  categories,
}) {
  const [form, setForm] = useState({
    name: "",
    categoryId: "",
    description: "",
    gender: "UNISEX",
    mrp: "",
    price: "",
    rewards: "",
    durationMinutes: "",
  });

  const [imageFile, setImageFile] = useState(null);
  const [preview, setPreview] = useState("");

  useEffect(() => {
    if (open) {
      if (initial) {
        setForm({
          name: initial.name || "",
          categoryId: initial.categoryId || "",
          description: initial.description || "",
          gender: initial.gender || "UNISEX",
          mrp: initial.mrp || "",
          price: initial.price || "",
          rewards: initial.rewards || "",
          durationMinutes: initial.durationMinutes || "",
        });
        setPreview(initial.image || "");
      } else {
        setForm({
          name: "",
          categoryId: "",
          description: "",
          gender: "UNISEX",
          mrp: "",
          price: "",
          rewards: "",
          durationMinutes: "",
        });
        setPreview("");
      }
      setImageFile(null);
    }
  }, [open, initial]);

  if (!open) return null;

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = () => {
    if (!form.name || !form.categoryId) return;

    onSave({
      ...form,
      image: imageFile,
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
      <div className="bg-white w-full max-w-2xl rounded-xl shadow-xl">

        {/* Header */}
        <div className="px-6 py-4 border-b flex justify-between">
          <h2 className="text-lg font-semibold">
            {initial ? "Edit Service" : "Add Service"}
          </h2>
          <button onClick={onClose} className="text-xl text-gray-400">×</button>
        </div>

        {/* Body */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">

          <input name="name" value={form.name} onChange={handleChange}
            placeholder="Service Name" className="input" />

          <select name="categoryId" value={form.categoryId}
            onChange={handleChange} className="input">
            <option value="">Select Category</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          <select name="gender" value={form.gender}
            onChange={handleChange} className="input">
            <option>MALE</option>
            <option>FEMALE</option>
            <option>UNISEX</option>
          </select>

          <input name="durationMinutes" type="number"
            value={form.durationMinutes} onChange={handleChange}
            placeholder="Duration (minutes)" className="input" />

          <input name="mrp" type="number"
            value={form.mrp} onChange={handleChange}
            placeholder="MRP" className="input" />

          <input name="price" type="number"
            value={form.price} onChange={handleChange}
            placeholder="Selling Price" className="input" />

          <input name="rewards" type="number"
            value={form.rewards} onChange={handleChange}
            placeholder="Reward Points" className="input" />

          <textarea name="description" value={form.description}
            onChange={handleChange}
            placeholder="Description"
            className="md:col-span-2 input resize-none"
          />

          {/* Image */}
          <div className="md:col-span-2">
            <div
              onClick={() => document.getElementById("srv-img").click()}
              className="border-2 border-dashed rounded-md p-4 text-center cursor-pointer"
            >
              {preview ? (
                <img src={preview} className="h-32 mx-auto rounded-md" />
              ) : (
                <span className="text-sm text-gray-500">
                  Click to upload image
                </span>
              )}
            </div>
            <input
              id="srv-img"
              type="file"
              className="hidden"
              onChange={(e) => {
                setImageFile(e.target.files[0]);
                setPreview(URL.createObjectURL(e.target.files[0]));
              }}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t flex justify-end gap-3 bg-gray-50">
          <button onClick={onClose} className="btn-secondary text-gray-700">
            Cancel
          </button>
          <button onClick={handleSubmit} className="btn-primary">
            {initial ? "Update" : "Create"}
          </button>
        </div>
      </div>
    </div>
  );
}
