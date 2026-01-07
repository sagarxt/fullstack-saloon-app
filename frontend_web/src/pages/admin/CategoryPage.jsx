import { useEffect, useState } from "react";
import {
  getAdminCategories,
  createAdminCategory,
  updateAdminCategory,
  deleteAdminCategory,
} from "../../api/admin";
import CategoryFormModal from "../../components/admin/CategoryFormModal";
import { Plus, Edit2, Trash2 } from "lucide-react";

const CategoryPage = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const loadCategories = async () => {
    setLoading(true);
    try {
      const res = await getAdminCategories();
      setCategories(res.data?.content ?? []);
    } catch {
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const handleSave = async ({ name, description, active, imageFile }) => {
    const formData = new FormData();
    formData.append("name", name);
    formData.append("description", description || "");
    formData.append("active", active);

    if (imageFile) {
      formData.append("image", imageFile);
    }

    if (editing) {
      await updateAdminCategory(editing.id, formData);
    } else {
      await createAdminCategory(formData);
    }

    setModalOpen(false);
    setEditing(null);
    loadCategories();
  };


  const handleDelete = async (id) => {
    if (!window.confirm("Delete this category?")) return;
    await deleteAdminCategory(id);
    loadCategories();
  };

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-serif font-semibold">Categories</h1>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 bg-luxe-gold text-black px-4 py-2 rounded-full font-semibold"
        >
          <Plus className="w-4 h-4" />
          Add Category
        </button>
      </div>

      {/* Table */}
      <div className="bg-luxe-gray-dark/70 border border-luxe-gold/20 rounded-2xl overflow-hidden">

        <div className="grid grid-cols-5 px-4 py-3 text-[11px] uppercase tracking-widest text-luxe-gray-medium border-b border-luxe-gold/20">
          <div>Image</div>
          <div>Name</div>
          <div>Description</div>
          <div>Status</div>
          {/* <div>Created</div> */}
          <div className="text-right">Actions</div>
        </div>

        {loading ? (
          <div className="px-4 py-6 text-xs text-luxe-gray-medium">
            Loading categories...
          </div>
        ) : categories.length === 0 ? (
          <div className="px-4 py-6 text-xs text-luxe-gray-medium">
            No categories found
          </div>
        ) : (
          categories.map((cat) => (
            <div
              key={cat.id}
              className="grid grid-cols-5 px-4 py-3 border-t border-white/5 text-sm"
            >
              <div className="w-10 h-10 rounded-full flex items-center gap-4">
                {cat.image ? (
                  <img
                    src={cat.image}
                    alt={cat.name}
                    className="w-50 h-50 object-cover rounded-full"
                  />
                ) : (
                  <div className="w-10 h-10 bg-luxe-gray-dark rounded-full flex items-center justify-center text-luxe-gray-medium text-xs">
                    No Image
                  </div>
                )
                }
              </div>
              <div className="font-semibold">{cat.name}</div>
              <div className="text-xs text-luxe-gray-light">
                {cat.description || "-"}
              </div>
              <div>
                <span
                  className={`px-2 py-1 text-xs rounded-full ${
                    cat.active
                      ? "bg-emerald-500/20 text-emerald-300"
                      : "bg-red-500/20 text-red-300"
                  }`}
                >
                  {cat.active ? "Active" : "Inactive"}
                </span>
              </div>
              {/* <div className="text-xs text-luxe-gray-medium">
                {cat.createdAt
                  ? new Date(cat.createdAt).toLocaleDateString()
                  : "-"}
              </div> */}
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => {
                    setEditing(cat);
                    setModalOpen(true);
                  }}
                  className="p-1 border border-luxe-gold/40 rounded-full"
                >
                  <Edit2 className="w-4 h-4 text-luxe-gold" />
                </button>
                <button
                  onClick={() => handleDelete(cat.id)}
                  className="p-1 border border-red-500/40 rounded-full"
                >
                  <Trash2 className="w-4 h-4 text-red-400" />
                </button>
              </div>
            </div>
          ))
        )}

      </div>

      <CategoryFormModal
        open={modalOpen}
        initial={editing}
        onClose={() => {
          setModalOpen(false);
          setEditing(null);
        }}
        onSave={handleSave}
      />
    </div>
  );
};

export default CategoryPage;
