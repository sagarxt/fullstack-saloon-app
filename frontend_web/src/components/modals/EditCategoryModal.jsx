import { useEffect, useState } from "react";
import ModalWrapper from "./ModalWrapper";
import { updateCategoryApi } from "../../api/category";

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
  });

  useEffect(() => {
    if (category) {
      setForm({
        name: category.name || "",
        description: category.description || "",
        image: category.image || "",
      });
    }
  }, [category]);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleUpdate = async () => {
    await updateCategoryApi(category.id, form);
    refresh();
    onClose();
  };

  if (!category) return null;

  return (
    <ModalWrapper open={open} onClose={onClose}>
      <h2 className="text-xl font-serif text-luxe-gold mb-4">
        Edit Category
      </h2>

      <input
        name="name"
        value={form.name}
        placeholder="Category Name"
        className="input mb-3"
        onChange={handleChange}
      />

      <textarea
        name="description"
        value={form.description}
        placeholder="Category Description"
        className="input mb-3"
        onChange={handleChange}
      />

      <input
        name="image"
        value={form.image}
        placeholder="Image URL"
        className="input mb-4"
        onChange={handleChange}
      />

      <button
        className="btn-primary w-full"
        onClick={handleUpdate}
      >
        Update Category
      </button>
    </ModalWrapper>
  );
}
