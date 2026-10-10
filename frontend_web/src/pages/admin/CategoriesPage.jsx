import { useEffect, useState } from "react";
import { getCategoriesApi } from "../../api/category";
import CategoryCard from "../../components/admin/CategoryCard";
import AddCategoryModal from "../../components/modals/AddCategoryModal";
import { extractList } from "../../utils/dataHelper";
import { Layers, Plus, RefreshCw } from "lucide-react";

export default function CategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);

  const loadCategories = async () => {
    setLoading(true);
    try {
      const res = await getCategoriesApi();
      setCategories(extractList(res.data));
    } catch (err) {
      console.error(err);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const categoryList = extractList(categories);
  const filtered = categoryList.filter((c) => {
    if (filter === "ALL") return true;
    if (filter === "ACTIVE") return c.active;
    if (filter === "INACTIVE") return !c.active;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-extrabold text-groomish-slate">
            Salon Service Categories
          </h1>
          <p className="text-xs text-groomish-slate/60 mt-0.5">
            Organize salon offerings into grooming, styling, bridal, and wellness collections.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadCategories}
            className="p-2.5 rounded-2xl bg-white border border-groomish-slate/15 text-groomish-slate hover:bg-groomish-cream transition"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-groomish-orange" : ""}`} />
          </button>
          <button
            className="btn-primary text-xs px-4 py-2.5"
            onClick={() => setOpen(true)}
          >
            <Plus className="w-4 h-4" />
            <span>Add Category</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        {["ALL", "ACTIVE", "INACTIVE"].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              filter === s
                ? "bg-groomish-slate text-white shadow-soft"
                : "bg-white text-groomish-slate/70 border border-groomish-slate/10 hover:bg-groomish-cream"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Category List */}
      {loading ? (
        <div className="py-16 text-center">
          <div className="w-8 h-8 border-4 border-groomish-orange border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-xs text-groomish-slate/60">Loading categories...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-3xl border border-groomish-slate/10 p-12 text-center max-w-md mx-auto shadow-soft">
          <Layers className="w-10 h-10 text-groomish-slate/30 mx-auto mb-3" />
          <h3 className="font-heading font-bold text-base text-groomish-slate">
            No Categories Found
          </h3>
          <p className="text-xs text-groomish-slate/50 mt-1">
            Create your first salon category above.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((cat) => (
            <CategoryCard
              key={cat.id}
              category={cat}
              refresh={loadCategories}
            />
          ))}
        </div>
      )}

      <AddCategoryModal
        open={open}
        onClose={() => setOpen(false)}
        refresh={loadCategories}
      />
    </div>
  );
}
