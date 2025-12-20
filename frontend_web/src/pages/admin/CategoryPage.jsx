// src/pages/admin/CategoryPage.jsx
import React, { useEffect, useState } from "react";
import {
  getAdminCategories,
  createAdminCategory,
  updateAdminCategory,
  deleteAdminCategory,
} from "../../api/admin";
import CategoryFormModal from "../../components/admin/CategoryFormModal";
import { Plus, Search, Filter, Trash2, Edit2 } from "lucide-react";

const CategoryPage = () => {
  const [categories, setCategories] = useState([]);
  const [page, setPage] = useState(0);
  const [size] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL"); // ALL | ACTIVE | INACTIVE
  const [loading, setLoading] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);

  const [toast, setToast] = useState(null);

  const showToast = (msg) => {
    const id = Date.now();
    setToast({ id, msg });
    setTimeout(() => setToast(null), 2500);
  };

  const loadCategories = async () => {
    try {
      setLoading(true);
      const res = await getAdminCategories({
        page,
        size,
        search,
        active: statusFilter,
      });

      const data = res.data;
      const content = Array.isArray(data.content) ? data.content : [];
      setCategories(content);
      setTotalPages(data.totalPages ?? 1);
    } catch (err) {
      console.error("Error loading categories", err);
      showToast("Failed to load categories");
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(0);
    loadCategories();
  };

  const handleOpenCreate = () => {
    setEditingCategory(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (cat) => {
    setEditingCategory(cat);
    setModalOpen(true);
  };

  const handleSaveCategory = async ({ name, description, active, imageFile }) => {
    try {
      const formData = new FormData();
      formData.append("name", name);
      if (description) formData.append("description", description);
      formData.append("active", active);

      if (imageFile) {
        formData.append("image", imageFile);
      }

      if (editingCategory) {
        await updateAdminCategory(editingCategory.id, formData);
        showToast("Category updated");
      } else {
        await createAdminCategory(formData);
        showToast("Category created");
      }

      setModalOpen(false);
      setEditingCategory(null);
      loadCategories();
    } catch (err) {
      console.error("Error saving category", err);
      showToast("Failed to save category");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this category?")) return;

    try {
      await deleteAdminCategory(id);
      showToast("Category deleted");
      loadCategories();
    } catch (err) {
      console.error("Error deleting category", err);
      showToast("Failed to delete category");
    }
  };

  return (
    <div className="min-h-screen bg-luxe-black text-white flex">
      {/* MAIN (without sidebar; you can wrap in your Admin layout later) */}
      <main className="flex-1 p-4 md:p-8">
        <div className="max-w-6xl mx-auto space-y-6">

          {/* Toast */}
          {toast && (
            <div className="fixed top-6 right-6 bg-luxe-gold text-luxe-black px-4 py-2 rounded-md shadow-lg text-sm font-semibold animate-slideFade">
              {toast.msg}
            </div>
          )}

          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-serif font-semibold">
                Categories
              </h1>
              <p className="text-xs text-luxe-gray-medium mt-1">
                Manage all service categories and their visibility.
              </p>
            </div>

            <button
              onClick={handleOpenCreate}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-luxe-gold text-luxe-black text-sm font-semibold hover:bg-luxe-gold-soft shadow-goldSoft"
            >
              <Plus className="w-4 h-4" />
              Add Category
            </button>
          </div>

          {/* Filters */}
          <div className="bg-luxe-gray-dark/70 border border-luxe-gold/20 rounded-2xl p-4 flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
            <form
              onSubmit={handleSearchSubmit}
              className="flex-1 flex items-center gap-2"
            >
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-luxe-gray-medium" />
                <input
                  className="w-full bg-black/40 border border-luxe-gray-medium/40 rounded-full pl-9 pr-3 py-2 text-sm text-white placeholder:text-luxe-gray-medium focus:outline-none focus:ring-2 focus:ring-luxe-gold"
                  placeholder="Search by name..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <button
                type="submit"
                className="px-3 py-2 text-xs rounded-full bg-luxe-gold text-luxe-black font-semibold hover:bg-luxe-gold-soft"
              >
                Search
              </button>
            </form>

            <div className="flex items-center gap-2 text-xs">
              <Filter className="w-4 h-4 text-luxe-gold" />
              <span className="text-luxe-gray-medium">Status:</span>
              <button
                onClick={() => setStatusFilter("ALL")}
                className={`px-3 py-1 rounded-full border text-[11px] ${
                  statusFilter === "ALL"
                    ? "bg-luxe-gold text-luxe-black border-luxe-gold"
                    : "border-luxe-gray-medium/40 text-luxe-gray-light"
                }`}
              >
                All
              </button>
              <button
                onClick={() => setStatusFilter("ACTIVE")}
                className={`px-3 py-1 rounded-full border text-[11px] ${
                  statusFilter === "ACTIVE"
                    ? "bg-emerald-500 text-white border-emerald-500"
                    : "border-luxe-gray-medium/40 text-luxe-gray-light"
                }`}
              >
                Active
              </button>
              <button
                onClick={() => setStatusFilter("INACTIVE")}
                className={`px-3 py-1 rounded-full border text-[11px] ${
                  statusFilter === "INACTIVE"
                    ? "bg-red-500 text-white border-red-500"
                    : "border-luxe-gray-medium/40 text-luxe-gray-light"
                }`}
              >
                Inactive
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="bg-luxe-gray-dark/70 border border-luxe-gold/20 rounded-2xl overflow-hidden">
            <div className="hidden md:grid grid-cols-12 px-4 py-3 text-[11px] uppercase tracking-[0.16em] text-luxe-gray-medium border-b border-luxe-gold/20 bg-black/50">
              <div className="col-span-4">Category</div>
              <div className="col-span-3">Description</div>
              <div className="col-span-2">Status</div>
              <div className="col-span-2 text-right">Created</div>
              <div className="col-span-1 text-right">Actions</div>
            </div>

            {loading ? (
              <div className="px-4 py-6 text-xs text-luxe-gray-medium">
                Loading categories...
              </div>
            ) : categories.length === 0 ? (
              <div className="px-4 py-6 text-xs text-luxe-gray-medium">
                No categories found.
              </div>
            ) : (
              <div>
                {categories.map((cat) => (
                  <div
                    key={cat.id}
                    className="grid grid-cols-1 md:grid-cols-12 px-4 py-3 border-t border-luxe-gray-dark/60 hover:bg-black/40 text-sm"
                  >
                    {/* Category + image */}
                    <div className="col-span-4 flex items-center gap-3">
                      {cat.image && (
                        <div className="w-10 h-10 rounded-md overflow-hidden bg-black/40 border border-luxe-gray-medium/40">
                          <img
                            src={cat.image}
                            alt={cat.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <div>
                        <div className="font-semibold">{cat.name}</div>
                        <div className="text-[11px] text-luxe-gray-medium">
                          ID: {cat.id?.slice(0, 8)}...
                        </div>
                      </div>
                    </div>

                    {/* Description */}
                    <div className="col-span-3 text-xs text-luxe-gray-light mt-2 md:mt-0">
                      {cat.description || "-"}
                    </div>

                    {/* Status */}
                    <div className="col-span-2 mt-2 md:mt-0 flex items-center">
                      <span
                        className={`inline-flex px-2 py-1 rounded-full text-[11px] ${
                          cat.active
                            ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                            : "bg-red-500/20 text-red-300 border border-red-500/40"
                        }`}
                      >
                        {cat.active ? "Active" : "Inactive"}
                      </span>
                    </div>

                    {/* Created at */}
                    <div className="col-span-2 mt-2 md:mt-0 text-right text-[11px] text-luxe-gray-medium">
                      {cat.createdAt
                        ? new Date(cat.createdAt).toLocaleDateString()
                        : "-"}
                    </div>

                    {/* Actions */}
                    <div className="col-span-1 mt-2 md:mt-0 flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleOpenEdit(cat)}
                        className="p-1 rounded-full bg-black/40 border border-luxe-gray-medium/50 hover:border-luxe-gold"
                      >
                        <Edit2 className="w-4 h-4 text-luxe-gold" />
                      </button>
                      <button
                        onClick={() => handleDelete(cat.id)}
                        className="p-1 rounded-full bg-black/40 border border-red-500/60 hover:bg-red-500/20"
                      >
                        <Trash2 className="w-4 h-4 text-red-400" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between text-xs text-luxe-gray-medium">
            <div>
              Page {page + 1} of {totalPages}
            </div>
            <div className="flex gap-2">
              <button
                disabled={page === 0}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                className={`px-3 py-1 rounded-full border ${
                  page === 0
                    ? "border-gray-700 text-gray-600 cursor-not-allowed"
                    : "border-luxe-gray-medium/40 hover:border-luxe-gold"
                }`}
              >
                Prev
              </button>
              <button
                disabled={page + 1 >= totalPages}
                onClick={() =>
                  setPage((p) => (p + 1 < totalPages ? p + 1 : p))
                }
                className={`px-3 py-1 rounded-full border ${
                  page + 1 >= totalPages
                    ? "border-gray-700 text-gray-600 cursor-not-allowed"
                    : "border-luxe-gray-medium/40 hover:border-luxe-gold"
                }`}
              >
                Next
              </button>
            </div>
          </div>
        </div>

        {/* Modal */}
        <CategoryFormModal
          open={modalOpen}
          initial={editingCategory}
          onClose={() => {
            setModalOpen(false);
            setEditingCategory(null);
          }}
          onSave={handleSaveCategory}
        />
      </main>
    </div>
  );
};

export default CategoryPage;
