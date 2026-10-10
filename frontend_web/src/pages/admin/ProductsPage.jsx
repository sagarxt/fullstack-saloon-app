import { useEffect, useState, useMemo } from "react";
import {
  getAdminProducts,
  createAdminProduct,
  updateAdminProduct,
  deleteAdminProduct,
} from "../../api/products";
import ModalWrapper from "../../components/modals/ModalWrapper";
import CloudinaryImageUploader from "../../components/common/CloudinaryImageUploader";
import CustomSelect from "../../components/common/CustomSelect";
import { extractList } from "../../utils/dataHelper";
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

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [form, setForm] = useState({
    name: "",
    brand: "Groomish Pro",
    category: "Hair Care",
    price: "",
    mrp: "",
    volumeOrSize: "100ml",
    stockQuantity: 50,
    image: "",
    description: "",
    inStorePickupOnly: true,
    active: true,
  });

  const loadProducts = async () => {
    setLoading(true);
    try {
      const res = await getAdminProducts(0, 50);
      setProducts(extractList(res.data));
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

  const handleOpenCreate = () => {
    setEditingProduct(null);
    setForm({
      name: "",
      brand: "Groomish Pro",
      category: "Hair Care",
      price: "",
      mrp: "",
      volumeOrSize: "100ml",
      stockQuantity: 50,
      image: "https://images.unsplash.com/photo-1608248597359-586616035ec8?auto=format&fit=crop&w=600&q=80",
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
    setForm({
      name: p.name || "",
      brand: p.brand || "Groomish Pro",
      category: p.category || "Hair Care",
      price: p.price ?? "",
      mrp: p.mrp ?? "",
      volumeOrSize: p.volumeOrSize || "",
      stockQuantity: p.stockQuantity ?? 50,
      image: p.image || "",
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
      const payload = {
        ...form,
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
    if (!window.confirm("Are you sure you want to deactivate this product from the shop?")) return;
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
            <Package className="w-10 h-10 mx-auto mb-2 opacity-40" />
            <p className="text-sm font-bold text-groomish-slate">No products found</p>
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
                {filtered.map((p) => (
                  <tr key={p.id} className="hover:bg-groomish-cream/30 transition">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={p.image || "https://images.unsplash.com/photo-1608248597359-586616035ec8?auto=format&fit=crop&w=100&q=80"}
                          alt={p.name}
                          className="w-10 h-10 rounded-xl object-contain bg-white border border-groomish-slate/10 p-1 shrink-0"
                        />
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
                      <div className="flex items-center justify-end gap-1">
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
                          title="Deactivate"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

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

            <CloudinaryImageUploader
              value={form.image}
              onChange={(url) => setForm({ ...form, image: url })}
              folder="groomishnow/product"
              label="Retail Product Photo"
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
