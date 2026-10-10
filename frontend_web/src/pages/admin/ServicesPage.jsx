import { useEffect, useState } from "react";
import { getServicesApi } from "../../api/service";
import { getCategoriesApi } from "../../api/category";
import ServiceCard from "../../components/admin/ServiceCard";
import AddServiceModal from "../../components/modals/AddServiceModal";
import CustomSelect from "../../components/common/CustomSelect";
import { extractList } from "../../utils/dataHelper";
import { Scissors, Plus, RefreshCw, Filter } from "lucide-react";

export default function ServicesPage() {
  const [services, setServices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState("ALL");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [srvRes, catRes] = await Promise.all([
        getServicesApi(),
        getCategoriesApi(),
      ]);
      setServices(extractList(srvRes.data));
      setCategories(extractList(catRes.data));
    } catch (err) {
      console.error(err);
      setServices([]);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const serviceList = extractList(services);
  const categoryList = extractList(categories);

  const filtered = serviceList.filter((s) => {
    if (filter === "ACTIVE" && !s.active) return false;
    if (filter === "INACTIVE" && s.active) return false;
    if (categoryFilter !== "ALL" && s.categoryId !== categoryFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-extrabold text-groomish-slate">
            Salon Services Catalog
          </h1>
          <p className="text-xs text-groomish-slate/60 mt-0.5">
            Manage treatment pricing, duration, gender classification, and category links.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            className="p-2.5 rounded-2xl bg-white border border-groomish-slate/15 text-groomish-slate hover:bg-groomish-cream transition"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-groomish-orange" : ""}`} />
          </button>
          <button
            className="btn-primary text-xs px-4 py-2.5"
            onClick={() => setOpen(true)}
          >
            <Plus className="w-4 h-4" />
            <span>Add Service</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3">
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

        <div className="w-56">
          <CustomSelect
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            options={[
              { value: "ALL", label: "All Categories" },
              ...categories.map((c) => ({ value: c.id, label: c.name })),
            ]}
          />
        </div>
      </div>

      {/* Services List */}
      {loading ? (
        <div className="py-16 text-center">
          <div className="w-8 h-8 border-4 border-groomish-orange border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-xs text-groomish-slate/60">Loading services...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-3xl border border-groomish-slate/10 p-12 text-center max-w-md mx-auto shadow-soft">
          <Scissors className="w-10 h-10 text-groomish-slate/30 mx-auto mb-3" />
          <h3 className="font-heading font-bold text-base text-groomish-slate">
            No Services Found
          </h3>
          <p className="text-xs text-groomish-slate/50 mt-1">
            Add treatments to populate your salon booking menu.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((srv) => (
            <ServiceCard
              key={srv.id}
              service={srv}
              categories={categories}
              refresh={loadData}
            />
          ))}
        </div>
      )}

      <AddServiceModal
        open={open}
        onClose={() => setOpen(false)}
        categories={categories}
        refresh={loadData}
      />
    </div>
  );
}
