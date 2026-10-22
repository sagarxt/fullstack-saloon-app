import { useState } from "react";
import { deactivateCategoryApi, activateCategoryApi } from "../../api/admin";
import EditCategoryModal from "../modals/EditCategoryModal";
import CategoryServicesModal from "../modals/CategoryServicesModal";
import { Layers, Edit3, Power, ListFilter, Trash2 } from "lucide-react";
import { forceDeleteCategoryApi } from "../../api/maintenance";
import { getOptimizedImageUrl } from "../../utils/imageHelper";
import { showConfirm, showAlert } from "../../context/ConfirmContext";

export default function CategoryCard({ category, refresh }) {
  const [editOpen, setEditOpen] = useState(false);
  const [viewServicesOpen, setViewServicesOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleToggleActive = async () => {
    try {
      setLoading(true);
      if (category.active) {
        await deactivateCategoryApi(category.id);
      } else {
        await activateCategoryApi(category.id);
      }
      refresh();
    } catch (err) {
      await showAlert({
        title: "Action Failed",
        message: err.response?.data?.message || "Failed to update category status.",
        variant: "danger",
      });
    } finally {
      setLoading(false);
    }
  };

  const defaultCategoryImages = {
    Hair: "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=400&q=80",
    Beard: "https://images.unsplash.com/photo-1621605815971-fbc98d665033?auto=format&fit=crop&w=400&q=80",
    Facial: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=400&q=80",
    Spa: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=400&q=80",
    Bridal: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=400&q=80",
  };

  const imgSrc =
    category.image ||
    defaultCategoryImages[category.name] ||
    "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=400&q=80";

  return (
    <>
      <div className="bg-white rounded-2xl border border-groomish-slate/10 p-5 flex flex-col sm:flex-row gap-5 items-start sm:items-center shadow-soft hover:shadow-card transition">
        {/* Category Image */}
        <img
          src={getOptimizedImageUrl(imgSrc, { width: 250 })}
          alt={category.name}
          loading="lazy"
          decoding="async"
          className="h-20 w-20 object-cover rounded-full border-2 border-groomish-orange/30 p-0.5 bg-white shrink-0 shadow-sm"
        />

        {/* Details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-heading font-bold text-base text-groomish-slate">
              {category.name}
            </h3>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                category.active
                  ? "bg-groomish-greenLight text-groomish-green"
                  : "bg-groomish-crimsonLight text-groomish-crimson"
              }`}
            >
              {category.active ? "Active" : "Disabled"}
            </span>
          </div>

          <p className="text-xs text-groomish-slate/60 line-clamp-2 leading-relaxed">
            {category.description || "Salon category for Groomish Now services."}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <button
            onClick={() => setViewServicesOpen(true)}
            className="btn-secondary text-xs px-3 py-1.5"
          >
            <ListFilter className="w-3.5 h-3.5" />
            <span>Services</span>
          </button>

          <button
            onClick={() => setEditOpen(true)}
            className="p-2 rounded-xl bg-groomish-cream hover:bg-groomish-orange/15 text-groomish-slate transition"
            title="Edit Category"
          >
            <Edit3 className="w-4 h-4" />
          </button>

          <button
            disabled={loading}
            onClick={handleToggleActive}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition ${
              category.active
                ? "bg-groomish-crimsonLight text-groomish-crimson hover:bg-groomish-crimson hover:text-white"
                : "bg-groomish-greenLight text-groomish-green hover:bg-groomish-green hover:text-white"
            }`}
          >
            {category.active ? "Deactivate" : "Activate"}
          </button>

          <button
            disabled={loading}
            onClick={async () => {
              const ok = await showConfirm({
                title: "Force Delete Category",
                message: `Are you sure you want to FORCE DELETE category "${category.name}"?\nThis permanently removes this category and unlinks all treatments.`,
                confirmText: "Force Delete Category",
                variant: "danger",
              });
              if (!ok) return;

              try {
                setLoading(true);
                await forceDeleteCategoryApi(category.id);
                refresh();
              } catch (err) {
                await showAlert({
                  title: "Deletion Failed",
                  message: err.response?.data?.message || "Failed to force delete category.",
                  variant: "danger",
                });
              } finally {
                setLoading(false);
              }
            }}
            className="px-2.5 py-1.5 text-xs font-bold rounded-xl bg-red-600 text-white hover:bg-red-700 transition flex items-center gap-1 shadow-xs cursor-pointer active:scale-95"
            title="Permanently remove category from database"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Force Delete</span>
          </button>
        </div>
      </div>

      <EditCategoryModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        category={category}
        refresh={refresh}
      />

      <CategoryServicesModal
        open={viewServicesOpen}
        onClose={() => setViewServicesOpen(false)}
        category={category}
      />
    </>
  );
}
