import { useEffect, useState } from "react";
import { getServicesApi } from "../../api/service";
import { getCategoriesApi } from "../../api/category";
import { storeApi } from "../../api/store";
import ServiceCard from "../../components/admin/ServiceCard";
import AddServiceModal from "../../components/modals/AddServiceModal";
import StaffBranchServicesTab from "../../components/staff/StaffBranchServicesTab";
import CustomSelect from "../../components/common/CustomSelect";
import Pagination from "../../components/common/Pagination";
import { extractList } from "../../utils/dataHelper";
import { Scissors, Plus, RefreshCw, Filter, Store, Sparkles } from "lucide-react";

const PAGE_SIZE = 20;

export default function ServicesPage() {
  const [services, setServices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [stores, setStores] = useState([]);
  const [selectedStoreId, setSelectedStoreId] = useState("GLOBAL");
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState("ALL");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [srvRes, catRes, storeRes] = await Promise.all([
        getServicesApi(0, 1000),
        getCategoriesApi(),
        storeApi.getAdminStores().catch(() => ({ data: [] })),
      ]);
      setServices(extractList(srvRes.data));
      setCategories(extractList(catRes.data));
      setStores(Array.isArray(storeRes.data) ? storeRes.data : []);
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

  useEffect(() => {
    setPage(1);
  }, [filter, categoryFilter, selectedStoreId]);

  const selectedStore = stores.find((s) => s.id === selectedStoreId);

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

      {/* Branch Scope Selector Bar */}
      <div className="bg-white rounded-3xl p-4 border border-groomish-slate/10 shadow-soft flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-groomish-orangeLight text-groomish-orange flex items-center justify-center shrink-0">
            <Store className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-bold text-groomish-slate block">
              Catalog View & Branch Scope
            </span>
            <span className="text-[10px] text-groomish-slate/50">
              Select Global Master or switch to a specific branch to enable/disable treatments
            </span>
          </div>
        </div>

        <div className="w-full sm:w-80">
          <CustomSelect
            value={selectedStoreId}
            onChange={(e) => {
              const val = typeof e === "object" && e !== null ? (e.target?.value ?? e.value) : e;
              setSelectedStoreId(val);
            }}
            options={[
              { value: "GLOBAL", label: "🌐 Global Master Catalog (All Branches)" },
              ...stores.map((s) => ({
                value: s.id,
                label: `📍 Branch: ${s.name} (${s.code || s.city})`,
              })),
            ]}
            placeholder="Select Branch Scope"
            searchable={stores.length > 3}
            searchPlaceholder="Search branch..."
            className="!py-2 !px-3.5 !rounded-xl font-bold text-xs !bg-groomish-cream/60 hover:!bg-white"
          />
        </div>
      </div>

      {selectedStoreId !== "GLOBAL" && selectedStore ? (
        <StaffBranchServicesTab
          storeId={selectedStore.id}
          storeName={selectedStore.name}
          isAdmin={true}
        />
      ) : (
        <>
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
            <div className="space-y-4">
              <div className="space-y-3">
                {filtered
                  .slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
                  .map((srv) => (
                    <ServiceCard
                      key={srv.id}
                      service={srv}
                      categories={categories}
                      refresh={loadData}
                    />
                  ))}
              </div>

              <Pagination
                currentPage={page}
                totalItems={filtered.length}
                pageSize={PAGE_SIZE}
                onPageChange={setPage}
                itemName="services"
              />
            </div>
          )}
        </>
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
