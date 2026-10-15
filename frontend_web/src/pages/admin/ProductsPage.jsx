import { useEffect, useState, useMemo } from "react";
import {
  getAdminProducts,
  createAdminProduct,
  updateAdminProduct,
  deleteAdminProduct,
} from "../../api/products";
import ModalWrapper from "../../components/modals/ModalWrapper";
import CloudinaryMultiImageUploader from "../../components/common/CloudinaryMultiImageUploader";
import CustomSelect from "../../components/common/CustomSelect";
import Pagination from "../../components/common/Pagination";
import { extractList } from "../../utils/dataHelper";
import { storeApi } from "../../api/store";
import StaffBranchInventoryTab from "../../components/staff/StaffBranchInventoryTab";
import { showConfirm } from "../../context/ConfirmContext";
import { forceDeleteProductApi } from "../../api/maintenance";
import {
  Package,
  Plus,
  RefreshCw,
  Search,
  Edit,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Tag,
  DollarSign,
  Store,
} from "lucide-react";

const PAGE_SIZE = 20;

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [form, setForm] = useState({
    name: "",
    brand: "",
    category: "Hair Care",
    price: "",
    mrp: "",
    volumeOrSize: "",
    stockQuantity: "",
    image: "",
    images: [],
    description: "",
    inStorePickupOnly: true,
    active: true,
  });

  const [stores, setStores] = useState([]);
  const [selectedStoreId, setSelectedStoreId] = useState("GLOBAL");

  const loadProducts = async () => {
    setLoading(true);
    try {
      const [res, storeRes] = await Promise.all([
        getAdminProducts(0, 200),
        storeApi.getAdminStores().catch(() => ({ data: [] })),
      ]);
      setProducts(extractList(res.data));
      setStores(Array.isArray(storeRes.data) ? storeRes.data : []);
    } catch (err) {
      console.error(err);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    setPage(1);
  }, [categoryFilter, search, selectedStoreId]);

  const selectedStore = stores.find((s) => s.id === selectedStoreId);

  const handleOpenCreate = () => {
    setEditingProduct(null);
    setForm({
      name: "",
      brand: "",
      category: "Hair Care",
      price: "",
      mrp: "",
      volumeOrSize: "",
      stockQuantity: "",
      image: "",
      images: [],
      description: "",
      inStorePickupOnly: true,
      active: true,
    });
    setError("");
    setSuccess("");
    setModalOpen(true);
  };

  const handleOpenEdit = (p) => {
    setEditingProduct(p);
    const prodImages = Array.isArray(p.images) && p.images.length > 0
      ? p.images
      : p.image ? [p.image] : [];

    setForm({
      name: p.name || "",
      brand: p.brand || "",
      category: p.category || "Hair Care",
      price: p.price ?? "",
      mrp: p.mrp ?? "",
      volumeOrSize: p.volumeOrSize || "",
      stockQuantity: p.stockQuantity ?? "",
      image: prodImages[0] || p.image || "",
      images: prodImages,
      description: p.description || "",
      inStorePickupOnly: p.inStorePickupOnly ?? true,
      active: p.active ?? true,
    });
    setError("");
    setSuccess("");
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.price) {
      setError("Product name and price are required.");
      return;
    }

    setActionLoading(true);
    setError("");
    setSuccess("");

    try {
      const imgList = Array.isArray(form.images) && form.images.length > 0
        ? form.images
        : form.image ? [form.image] : [];

      const payload = {
        ...form,
        image: imgList[0] || form.image || "",
        images: imgList,
        price: Number(form.price),
        mrp: form.mrp ? Number(form.mrp) : Number(form.price),
        stockQuantity: Number(form.stockQuantity) || 0,
      };

      if (editingProduct) {
        await updateAdminProduct(editingProduct.id, payload);
        setSuccess("Product updated successfully!");
      } else {
        await createAdminProduct(payload);
        setSuccess("Product added to catalog!");
      }

      setTimeout(() => {
        setModalOpen(false);
        loadProducts();
      }, 1000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save product.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (id) => {
    const ok = await showConfirm({
      title: "Deactivate Product",
      message: "Are you sure you want to deactivate this product from the shop catalog?",
      confirmText: "Deactivate",
      variant: "danger",
    });
    if (!ok) return;
    try {
      await deleteAdminProduct(id);
      loadProducts();
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleActive = async (p) => {
    try {
      await updateAdminProduct(p.id, { active: !p.active });
      loadProducts();
    } catch (err) {
      console.error(err);
    }
  };

  const filtered = useMemo(() => {
    return extractList(products).filter((p) => {
      if (categoryFilter !== "ALL" && p.category?.toLowerCase() !== categoryFilter.toLowerCase()) {
        return false;
      }
      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          p.name?.toLowerCase().includes(q) ||
          p.brand?.toLowerCase().includes(q) ||
          p.description?.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [products, categoryFilter, search]);

  const handleForceDelete = async (product) => {
    const ok = await showConfirm({
      title: "Force Delete Product",
      message: `Are you sure you want to FORCE DELETE product "${product.name}"?\nThis permanently removes the product from master catalog and branch inventories.`,
      confirmText: "Force Delete Product",
      variant: "danger",
    });
    if (!ok) return;

    try {
      await forceDeleteProductApi(product.id);
      loadProducts();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to force delete product.");
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-extrabold text-groomish-slate">
            Retail Store Products
          </h1>
          <p className="text-xs text-groomish-slate/60 mt-0.5">
            Manage salon inventory, pricing, stock levels, and store products sold during client visits.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadProducts}
            className="p-2.5 rounded-2xl bg-white border border-groomish-slate/15 text-groomish-slate hover:bg-groomish-cream transition"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-groomish-orange" : ""}`} />
          </button>
          <button
            onClick={handleOpenCreate}
            className="btn-primary text-xs px-4 py-2.5 flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Product</span>
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
              Inventory View & Branch Scope
            </span>
            <span className="text-[10px] text-groomish-slate/50">
              Select Global Master Catalog or switch to a branch to track real-time stock and adjust inventory
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
        <StaffBranchInventoryTab
          storeId={selectedStore.id}
          storeName={selectedStore.name}
          isAdmin={true}
        />
      ) : (
        <>
      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-3xl border border-groomish-slate/10 shadow-soft flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-groomish-slate/40" />
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-groomish-cream text-xs text-groomish-slate outline-none"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
          {["ALL", "Hair Care", "Skin & Facial", "Beard Care", "Styling"].map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold shrink-0 transition ${
                categoryFilter === cat
                  ? "bg-groomish-slate text-white"
                  : "bg-groomish-cream text-groomish-slate hover:bg-groomish-slate/10"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-3xl border border-groomish-slate/10 shadow-soft overflow-hidden">
        {loading ? (
          <div className="py-20 text-center">
            <div className="w-10 h-10 border-4 border-groomish-orange border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-xs text-groomish-slate/60">Loading products catalog...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-groomish-slate/50">
            <Package className="w-10 h-10 mx-auto mb-2 opacity-40 text-groomish-slate" />
            <p className="text-sm font-bold text-groomish-slate">
              {products.length === 0 ? "No retail products created yet in the catalog." : "No products found matching your search."}
            </p>
            {products.length === 0 && (
              <p className="text-xs text-groomish-slate/40 mt-1">
                Click "Add Product" to add retail items available for in-store pickup.
              </p>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-groomish-cream/70 text-groomish-slate uppercase tracking-wider text-[11px] font-bold border-b border-groomish-slate/10">
                <tr>
                  <th className="p-4">Product</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">Price / MRP</th>
                  <th className="p-4">Stock</th>
                  <th className="p-4">Pickup</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-groomish-slate/10">
                {filtered
                  .slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
                  .map((p) => (
                  <tr key={p.id} className="hover:bg-groomish-cream/30 transition">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="relative shrink-0">
                          {p.image ? (
                            <img
                              src={p.image}
                              alt={p.name}
                              className="w-10 h-10 rounded-xl object-contain bg-white border border-groomish-slate/10 p-1"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-xl bg-groomish-slate/10 flex items-center justify-center text-groomish-slate/40 border border-groomish-slate/10">
                              <Package className="w-5 h-5" />
                            </div>
                          )}
                          {p.images && p.images.length > 1 && (
                            <span className="absolute -bottom-1 -right-1 px-1.5 py-0.2 rounded-full bg-groomish-slate text-white text-[8px] font-bold shadow-sm">
                              {p.images.length}
                            </span>
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-groomish-slate">{p.name}</p>
                          <p className="text-[10px] text-groomish-slate/50">
                            {p.brand} • {p.volumeOrSize || "Standard"}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="p-4">
                      <span className="font-medium text-groomish-slate/80">{p.category}</span>
                    </td>

                    <td className="p-4 font-mono font-bold text-groomish-slate">
                      <div>₹{p.price}</div>
                      {p.mrp > p.price && (
                        <div className="text-[10px] text-groomish-slate/40 line-through">₹{p.mrp}</div>
                      )}
                    </td>

                    <td className="p-4">
                      <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                        p.stockQuantity > 10
                          ? "bg-groomish-greenLight text-groomish-green"
                          : "bg-groomish-crimsonLight text-groomish-crimson"
                      }`}>
                        {p.stockQuantity} units
                      </span>
                    </td>

                    <td className="p-4">
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-groomish-orange">
                        <Store className="w-3 h-3" />
                        <span>In-Store</span>
                      </span>
                    </td>

                    <td className="p-4">
                      <button
                        onClick={() => handleToggleActive(p)}
                        className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] transition cursor-pointer ${
                          p.active
                            ? "bg-groomish-greenLight text-groomish-green hover:bg-groomish-crimsonLight hover:text-groomish-crimson"
                            : "bg-groomish-slate/10 text-groomish-slate/50 hover:bg-groomish-greenLight hover:text-groomish-green"
                        }`}
                        title={p.active ? "Click to deactivate from shop" : "Click to activate in shop"}
                      >
                        {p.active ? "ACTIVE ✓" : "INACTIVE ✕"}
                      </button>
                    </td>

                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(p)}
                          className="p-1.5 text-groomish-slate hover:bg-groomish-cream rounded-lg transition"
                          title="Edit Product"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(p.id)}
                          className="p-1.5 text-groomish-crimson hover:bg-groomish-crimson/10 rounded-lg transition"
                          title="Deactivate product"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleForceDelete(p)}
                          className="px-2 py-1 text-[10px] font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg transition flex items-center gap-1 shadow-2xs"
                          title="Force Delete product permanently"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Force Delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {filtered.length > 0 && (
          <div className="p-4 border-t border-groomish-slate/10 bg-white">
            <Pagination
              currentPage={page}
              totalItems={filtered.length}
              pageSize={PAGE_SIZE}
              onPageChange={setPage}
              itemName="products"
            />
          </div>
        )}
      </div>
        </>
      )}

      {/* CREATE / EDIT MODAL */}
      <ModalWrapper
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        maxWidth="max-w-xl"
      >
        <div className="space-y-4 text-xs">
          <div className="border-b border-groomish-slate/10 pb-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-groomish-orange bg-groomish-orangeLight px-2.5 py-0.5 rounded-full inline-block mb-1">
              Store Catalog Management
            </span>
            <h2 className="text-xl font-heading font-bold text-groomish-slate">
              {editingProduct ? "Edit Product" : "Add New Retail Product"}
            </h2>
          </div>

          {error && (
            <div className="p-3 bg-groomish-crimson/10 text-groomish-crimson rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3 bg-groomish-green/10 text-groomish-green rounded-xl flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{success}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-groomish-slate/70 mb-1">
                Product Name
              </label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                className="input-groomish"
                placeholder="e.g. Moroccan Argan Hair Elixir"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-groomish-slate/70 mb-1">
                  Brand Name
                </label>
                <input
                  value={form.brand}
                  onChange={(e) => setForm({ ...form, brand: e.target.value })}
                  className="input-groomish"
                  placeholder="e.g. Groomish Pro / L'Oréal"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-groomish-slate/70 mb-1">
                  Category
                </label>
                <CustomSelect
                  name="category"
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  options={[
                    "Hair Care",
                    "Skin & Facial",
                    "Beard Care",
                    "Styling",
                    "Body & Spa",
                  ]}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-groomish-slate/70 mb-1">
                  Selling Price (₹)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  required
                  className="input-groomish"
                  placeholder="899"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-groomish-slate/70 mb-1">
                  MRP (₹)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={form.mrp}
                  onChange={(e) => setForm({ ...form, mrp: e.target.value })}
                  className="input-groomish"
                  placeholder="1199"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-groomish-slate/70 mb-1">
                  Volume / Size
                </label>
                <input
                  value={form.volumeOrSize}
                  onChange={(e) => setForm({ ...form, volumeOrSize: e.target.value })}
                  className="input-groomish"
                  placeholder="100ml / 50g"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-groomish-slate/70 mb-1">
                Stock Units Available
              </label>
              <input
                type="number"
                value={form.stockQuantity}
                onChange={(e) => setForm({ ...form, stockQuantity: e.target.value })}
                className="input-groomish"
                placeholder="50"
              />
            </div>

            <CloudinaryMultiImageUploader
              value={form.images || (form.image ? [form.image] : [])}
              onChange={(urls) =>
                setForm((prev) => ({
                  ...prev,
                  images: urls,
                  image: urls[0] || "",
                }))
              }
              maxImages={6}
              folder="groomishnow/product"
              label="Product Photos & Gallery Angles (Up to 6)"
              entityName={form.name || form.brand || "product"}
            />

            <div>
              <label className="block text-xs font-semibold text-groomish-slate/70 mb-1">
                Description & Benefits
              </label>
              <textarea
                rows={2}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="input-groomish"
                placeholder="Product ingredients, usage directions, and hair/skin benefits..."
              />
            </div>

            <div className="flex items-center gap-6 pt-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.inStorePickupOnly}
                  onChange={(e) => setForm({ ...form, inStorePickupOnly: e.target.checked })}
                  className="rounded text-groomish-orange focus:ring-groomish-orange"
                />
                <span className="font-semibold text-groomish-slate">In-Store Pickup Only</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.active}
                  onChange={(e) => setForm({ ...form, active: e.target.checked })}
                  className="rounded text-groomish-orange focus:ring-groomish-orange"
                />
                <span className="font-semibold text-groomish-slate">Active in Store Catalog</span>
              </label>
            </div>

            <div className="flex items-center gap-2 pt-3">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="btn-secondary flex-1 py-3"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={actionLoading}
                className="btn-primary flex-1 py-3"
              >
                {actionLoading ? "Saving..." : editingProduct ? "Save Changes" : "Create Product"}
              </button>
            </div>
          </form>
        </div>
      </ModalWrapper>
    </div>
  );
}
