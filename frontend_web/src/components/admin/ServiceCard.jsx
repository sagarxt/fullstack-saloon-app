import { useState } from "react";
import { deactivateServiceApi } from "../../api/admin";
import EditServiceModal from "../modals/EditServiceModal";
import { Scissors, Edit3, Clock, Tag, Trash2 } from "lucide-react";
import { forceDeleteServiceApi } from "../../api/maintenance";
import { getOptimizedImageUrl } from "../../utils/imageHelper";

import GroomCoinIcon from "../common/GroomCoinIcon";

export default function ServiceCard({ service, categories, refresh }) {
  const [editOpen, setEditOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const categoryName =
    categories.find((c) => c.id === service.categoryId)?.name ||
    service.categoryName ||
    "Salon Care";

  const handleDeactivate = async () => {
    setLoading(true);
    try {
      await deactivateServiceApi(service.id);
      refresh();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const defaultServiceImages = {
    MALE: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=400&q=80",
    FEMALE: "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=400&q=80",
    UNISEX: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=400&q=80",
  };

  const imgSrc = service.image || defaultServiceImages[service.gender] || defaultServiceImages.UNISEX;

  return (
    <>
      <div className="bg-white rounded-2xl border border-groomish-slate/10 p-5 flex flex-col sm:flex-row gap-5 items-start sm:items-center shadow-soft hover:shadow-card transition">
        {/* Service Image */}
        <img
          src={getOptimizedImageUrl(imgSrc, { width: 250 })}
          alt={service.name}
          loading="lazy"
          decoding="async"
          className="h-20 w-20 object-cover rounded-2xl border border-groomish-slate/10 shrink-0"
        />

        {/* Details */}
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-heading font-bold text-base text-groomish-slate">
              {service.name}
            </h3>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-groomish-orangeLight text-groomish-orange uppercase">
              {service.gender}
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-groomish-cream text-groomish-slate/70">
              {categoryName}
            </span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                service.active
                  ? "bg-groomish-greenLight text-groomish-green"
                  : "bg-groomish-crimsonLight text-groomish-crimson"
              }`}
            >
              {service.active ? "Active" : "Disabled"}
            </span>
            {service.rewards > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1">
                <GroomCoinIcon className="w-3 h-3" />
                <span>+{service.rewards} Extra Coins</span>
              </span>
            )}
          </div>

          <p className="text-xs text-groomish-slate/60 line-clamp-1">
            {service.description || "Premium styling & beauty treatment."}
          </p>

          <div className="flex items-center gap-4 text-xs text-groomish-slate/70 pt-1 flex-wrap">
            <span className="flex items-center gap-1 text-groomish-slate/60">
              <Clock className="w-3.5 h-3.5 text-groomish-orange" />
              {service.durationMinutes} mins
            </span>
            <span className="font-extrabold text-sm text-groomish-slate">
              ₹{service.price}
              {service.mrp > service.price && (
                <span className="text-xs font-normal text-groomish-slate/40 line-through ml-1.5">
                  ₹{service.mrp}
                </span>
              )}
            </span>
          </div>

          {/* Sub-Services Options display if configured */}
          {service.subServices && service.subServices.length > 0 && (
            <div className="pt-1.5 flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] font-bold text-groomish-slate/60 uppercase tracking-wider">
                {service.subServices.length} Options:
              </span>
              {service.subServices.map((sub, sIdx) => (
                <span
                  key={sub.id || sIdx}
                  className="px-2 py-0.5 rounded-md bg-groomish-orangeLight/60 text-groomish-slate text-[10px] font-semibold border border-groomish-orange/20"
                >
                  {sub.name} • ₹{sub.price} ({sub.durationMinutes}m)
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <button
            onClick={() => setEditOpen(true)}
            className="p-2 rounded-xl bg-groomish-cream hover:bg-groomish-orange/15 text-groomish-slate transition"
            title="Edit Service"
          >
            <Edit3 className="w-4 h-4" />
          </button>

          <button
            disabled={loading}
            onClick={handleDeactivate}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition ${
              service.active
                ? "bg-groomish-crimsonLight text-groomish-crimson hover:bg-groomish-crimson hover:text-white"
                : "bg-groomish-greenLight text-groomish-green hover:bg-groomish-green hover:text-white"
            }`}
          >
            {service.active ? "Deactivate" : "Activate"}
          </button>

          <button
            disabled={loading}
            onClick={async () => {
              if (window.confirm(`FORCE DELETE service "${service.name}"?\nThis permanently removes this service from database and bookings.`)) {
                try {
                  setLoading(true);
                  await forceDeleteServiceApi(service.id);
                  refresh();
                } catch (err) {
                  alert(err.response?.data?.message || "Failed to force delete service.");
                } finally {
                  setLoading(false);
                }
              }
            }}
            className="px-2.5 py-1.5 text-xs font-bold rounded-xl bg-red-600 text-white hover:bg-red-700 transition flex items-center gap-1 shadow-xs"
            title="Permanently remove service from database"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Force Delete</span>
          </button>
        </div>
      </div>

      <EditServiceModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        service={service}
        categories={categories}
        refresh={refresh}
      />
    </>
  );
}
