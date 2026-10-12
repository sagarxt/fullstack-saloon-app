import { useState, useEffect, useMemo } from "react";
import {
  getStaffStoreProducts,
  updateStaffStoreProductStock,
} from "../../api/staff";
import {
  getAdminStoreProducts,
  updateAdminStoreProductStock,
} from "../../api/admin";
import {
  Package,
  Search,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Plus,
  Minus,
  Check,
  AlertCircle,
  Store,
  Tag,
  DollarSign,
  Layers,
} from "lucide-react";

export default function StaffBranchInventoryTab({
  storeId = null,
  storeName = null,
  isAdmin = false,
}) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [stockFilter, setStockFilter] = useState("ALL"); // ALL | IN_STOCK | LOW_STOCK | OUT_OF_STOCK | DISABLED
  const [toast, setToast] = useState(null);

  // Local editing draft state: map of productId -> { stockQuantity, lowStockThreshold, storeActive, saving, saved }
  const [drafts, setDrafts] = useState({});

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const loadProducts = async () => {
    setLoading(true);
    try {
      const res = isAdmin && storeId
        ? await getAdminStoreProducts(storeId)
        : await getStaffStoreProducts();
      const list = Array.isArray(res.data) ? res.data : [];
      setProducts(list);

      // Initialize drafts
      const initialDrafts = {};
      list.forEach((p) => {
        initialDrafts[p.productId] = {
          stockQuantity: p.stockQuantity ?? 0,
          lowStockThreshold: p.lowStockThreshold ?? 10,
          storeActive: p.storeActive ?? true,
          saving: false,
          saved: false,
        };
      });
      setDrafts(initialDrafts);
    } catch (err) {
      console.error("Failed to load branch products:", err);
      showToast("Unable to load branch inventory", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, [storeId]);

  const categories = useMemo(() => {
    const set = new Set();
    products.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return Array.from(set).sort();
  }, [products]);

  // Handle draft field change
  const handleDraftChange = (productId, field, value) => {
    setDrafts((prev) => ({
      ...prev,
      [productId]: {
        ...(prev[productId] || {}),
        [field]: value,
        saved: false,
      },
    }));
  };

  // Quick increment/decrement
  const handleAdjustStock = (productId, delta) => {
    setDrafts((prev) => {
      const cur = prev[productId]?.stockQuantity ?? 0;
      const next = Math.max(0, cur + delta);
      return {
        ...prev,
        [productId]: {
          ...(prev[productId] || {}),
          stockQuantity: next,
          saved: false,
        },
      };
    });
  };

  // Save stock update for a product
  const handleSaveStock = async (product) => {
    const draft = drafts[product.productId];
    if (!draft) return;

    setDrafts((prev) => ({
      ...prev,
      [product.productId]: { ...prev[product.productId], saving: true },
    }));

    try {
      const payload = {
        stockQuantity: Number(draft.stockQuantity) || 0,
        lowStockThreshold: Number(draft.lowStockThreshold) || 10,
        active: Boolean(draft.storeActive),
      };

      const res = isAdmin && storeId
        ? await updateAdminStoreProductStock(storeId, product.productId, payload)
        : await updateStaffStoreProductStock(product.productId, payload);

      const updated = res.data;
      setProducts((prev) =>
        prev.map((p) => (p.productId === product.productId ? updated : p))
      );

      setDrafts((prev) => ({
        ...prev,
        [product.productId]: {
          stockQuantity: updated.stockQuantity,
          lowStockThreshold: updated.lowStockThreshold,
          storeActive: updated.storeActive,
          saving: false,
          saved: true,
        },
      }));

      showToast(`Inventory updated for "${product.name}"!`, "success");
      setTimeout(() => {
        setDrafts((prev) => ({
          ...prev,
          [product.productId]: {
            ...(prev[product.productId] || {}),
            saved: false,
          },
        }));
      }, 2500);
    } catch (err) {
      console.error("Failed to update stock:", err);
      const msg = err.response?.data?.message || "Failed to update stock quantity";
      showToast(msg, "error");
      setDrafts((prev) => ({
        ...prev,
        [product.productId]: { ...prev[product.productId], saving: false },
      }));
    }
  };

  // Quick Toggle Active
  const handleToggleActive = (product) => {
    const cur = drafts[product.productId]?.storeActive ?? product.storeActive;
    handleDraftChange(product.productId, "storeActive", !cur);
  };

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const draft = drafts[p.productId];
      const stock = draft?.stockQuantity ?? p.stockQuantity ?? 0;
      const threshold = draft?.lowStockThreshold ?? p.lowStockThreshold ?? 10;
      const active = draft?.storeActive ?? p.storeActive;

      // Category filter
      if (selectedCategory !== "ALL" && p.category !== selectedCategory) {
        return false;
      }
      // Stock Status filter
      if (stockFilter === "IN_STOCK" && (stock <= threshold || stock === 0 || !active)) {
        return false;
      }
      if (stockFilter === "LOW_STOCK" && (stock === 0 || stock > threshold || !active)) {
        return false;
      }
      if (stockFilter === "OUT_OF_STOCK" && (stock > 0 || !active)) {
        return false;
      }
      if (stockFilter === "DISABLED" && active) {
        return false;
      }

      // Search
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchName = p.name?.toLowerCase().includes(q);
        const matchBrand = p.brand?.toLowerCase().includes(q);
        const matchCat = p.category?.toLowerCase().includes(q);
        if (!matchName && !matchBrand && !matchCat) return false;
      }
      return true;
    });
  }, [products, drafts, selectedCategory, stockFilter, search]);

  const stats = useMemo(() => {
    const total = products.length;
    let inStock = 0;
    let lowStock = 0;
    let outOfStock = 0;
    let disabled = 0;

    products.forEach((p) => {
      const draft = drafts[p.productId];
      const stock = draft?.stockQuantity ?? p.stockQuantity ?? 0;
      const threshold = draft?.lowStockThreshold ?? p.lowStockThreshold ?? 10;
      const active = draft?.storeActive ?? p.storeActive;

      if (!active) {
        disabled++;
      } else if (stock === 0) {
        outOfStock++;
      } else if (stock <= threshold) {
        lowStock++;
      } else {
        inStock++;
      }
    });

    return { total, inStock, lowStock, outOfStock, disabled };
  }, [products, drafts]);

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toast && (
        <div
          className={`p-4 rounded-2xl flex items-center justify-between gap-3 text-xs font-semibold shadow-soft animate-fade-in ${
            toast.type === "success"
              ? "bg-groomish-greenLight text-groomish-green border border-groomish-green/20"
              : toast.type === "warning"
              ? "bg-amber-50 text-amber-800 border border-amber-200"
              : "bg-groomish-crimsonLight text-groomish-crimson border border-groomish-crimson/20"
          }`}
        >
          <div className="flex items-center gap-2">
            {toast.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : toast.type === "warning" ? (
              <AlertTriangle className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            <span>{toast.message}</span>
          </div>
          <button
            onClick={() => setToast(null)}
            className="text-xs opacity-60 hover:opacity-100"
          >
            ✕
          </button>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-white rounded-3xl p-6 border border-groomish-slate/10 shadow-soft">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-groomish-orange font-bold text-xs uppercase tracking-wider mb-1">
              <Store className="w-4 h-4" />
              <span>{storeName ? `${storeName} Inventory` : "Branch Product Inventory"}</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-heading font-extrabold text-groomish-slate">
              Stock & Inventory Management
            </h2>
            <p className="text-xs text-groomish-slate/60 mt-1 max-w-2xl">
              Track real-time branch stock levels, adjust units on hand, define low-stock reorder thresholds, and manage retail product availability for clients at this location.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadProducts}
              disabled={loading}
              className="p-2.5 rounded-2xl bg-groomish-cream border border-groomish-slate/10 text-groomish-slate hover:bg-groomish-slate/10 transition"
              title="Refresh inventory"
            >
              <RefreshCw
                className={`w-4 h-4 ${loading ? "animate-spin text-groomish-orange" : ""}`}
              />
            </button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6 pt-6 border-t border-groomish-slate/10">
          <div className="bg-groomish-cream/70 rounded-2xl p-3.5 border border-groomish-slate/10">
            <span className="text-[10px] uppercase font-bold text-groomish-slate/50 block">
              Total Products
            </span>
            <span className="text-xl font-heading font-extrabold text-groomish-slate mt-0.5 block">
              {stats.total}
            </span>
          </div>
          <div className="bg-groomish-greenLight/60 rounded-2xl p-3.5 border border-groomish-green/20">
            <span className="text-[10px] uppercase font-bold text-groomish-green block">
              In Stock & Healthy
            </span>
            <span className="text-xl font-heading font-extrabold text-groomish-green mt-0.5 block">
              {stats.inStock}
            </span>
          </div>
          <div className="bg-amber-50 rounded-2xl p-3.5 border border-amber-200">
            <span className="text-[10px] uppercase font-bold text-amber-700 block">
              Low Stock Alerts
            </span>
            <span className="text-xl font-heading font-extrabold text-amber-800 mt-0.5 block">
              {stats.lowStock}
            </span>
          </div>
          <div className="bg-groomish-crimsonLight/60 rounded-2xl p-3.5 border border-groomish-crimson/20">
            <span className="text-[10px] uppercase font-bold text-groomish-crimson block">
              Out of Stock
            </span>
            <span className="text-xl font-heading font-extrabold text-groomish-crimson mt-0.5 block">
              {stats.outOfStock}
            </span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-groomish-slate/10 shadow-soft flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-groomish-slate/40 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products by brand, title, or category..."
            className="w-full pl-9 pr-8 py-2.5 rounded-xl bg-groomish-cream/60 border border-groomish-slate/15 text-xs text-groomish-slate placeholder:text-groomish-slate/40 focus:outline-none focus:ring-2 focus:ring-groomish-orange/40 focus:bg-white transition"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-groomish-slate/40 hover:text-groomish-slate text-xs"
            >
              ✕
            </button>
          )}
        </div>

        {/* Stock Filter Pills */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex rounded-xl bg-groomish-cream/70 p-1 border border-groomish-slate/10 text-xs">
            {[
              { id: "ALL", label: "All" },
              { id: "IN_STOCK", label: "In Stock" },
              { id: "LOW_STOCK", label: "Low Stock" },
              { id: "OUT_OF_STOCK", label: "Out of Stock" },
              { id: "DISABLED", label: "Disabled" },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setStockFilter(f.id)}
                className={`px-3 py-1.5 rounded-lg font-bold text-[11px] transition ${
                  stockFilter === f.id
                    ? "bg-groomish-slate text-white shadow-xs"
                    : "text-groomish-slate/60 hover:text-groomish-slate"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Category Dropdown */}
          {categories.length > 0 && (
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="py-2 px-3 rounded-xl bg-groomish-cream/70 border border-groomish-slate/15 text-xs font-semibold text-groomish-slate focus:outline-none focus:ring-2 focus:ring-groomish-orange/40"
            >
              <option value="ALL">All Categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Products Grid */}
      {loading ? (
        <div className="bg-white rounded-3xl p-16 text-center border border-groomish-slate/10 shadow-soft">
          <div className="w-10 h-10 border-4 border-groomish-orange border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-groomish-slate/60">Loading branch inventory catalog...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-groomish-slate/10 shadow-soft space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-groomish-cream flex items-center justify-center mx-auto text-groomish-slate/40">
            <Package className="w-6 h-6" />
          </div>
          <h3 className="font-heading font-bold text-sm text-groomish-slate">
            No products match the selected criteria
          </h3>
          <p className="text-xs text-groomish-slate/50 max-w-sm mx-auto">
            Try adjusting your search query, stock status filter, or category.
          </p>
          {(search || selectedCategory !== "ALL" || stockFilter !== "ALL") && (
            <button
              onClick={() => {
                setSearch("");
                setSelectedCategory("ALL");
                setStockFilter("ALL");
              }}
              className="btn-outline text-xs px-4 py-2 mt-2"
            >
              Reset Filters
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((p) => {
            const draft = drafts[p.productId] || {
              stockQuantity: p.stockQuantity ?? 0,
              lowStockThreshold: p.lowStockThreshold ?? 10,
              storeActive: p.storeActive ?? true,
              saving: false,
              saved: false,
            };

            const stock = Number(draft.stockQuantity) || 0;
            const threshold = Number(draft.lowStockThreshold) || 10;
            const isActive = Boolean(draft.storeActive);
            const isOutOfStock = stock <= 0;
            const isLowStock = !isOutOfStock && stock <= threshold;

            return (
              <div
                key={p.productId}
                className={`bg-white rounded-3xl p-5 border transition-all duration-200 flex flex-col justify-between shadow-soft hover:shadow-card ${
                  !isActive
                    ? "border-gray-200/80 bg-gray-50/40"
                    : isOutOfStock
                    ? "border-groomish-crimson/30 bg-groomish-crimsonLight/10"
                    : isLowStock
                    ? "border-amber-300 bg-amber-50/20"
                    : "border-groomish-slate/10"
                }`}
              >
                <div>
                  {/* Top Bar: Brand, Category, Status Badge */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {p.brand && (
                        <span className="text-[10px] font-bold uppercase tracking-wider bg-groomish-slate text-white px-2 py-0.5 rounded-full">
                          {p.brand}
                        </span>
                      )}
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-groomish-cream text-groomish-slate/70 px-2.5 py-0.5 rounded-full border border-groomish-slate/10">
                        {p.category || "Retail"}
                      </span>
                      {p.volumeOrSize && (
                        <span className="text-[10px] font-mono text-groomish-slate/50">
                          {p.volumeOrSize}
                        </span>
                      )}
                    </div>

                    {/* Stock status pill */}
                    <span
                      className={`text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full flex items-center gap-1 shrink-0 ${
                        !isActive
                          ? "bg-gray-100 text-gray-500 border border-gray-200"
                          : isOutOfStock
                          ? "bg-groomish-crimsonLight text-groomish-crimson border border-groomish-crimson/20"
                          : isLowStock
                          ? "bg-amber-100 text-amber-800 border border-amber-300"
                          : "bg-groomish-greenLight text-groomish-green border border-groomish-green/20"
                      }`}
                    >
                      {!isActive ? (
                        <>
                          <XCircle className="w-3 h-3" />
                          <span>Branch Disabled</span>
                        </>
                      ) : isOutOfStock ? (
                        <>
                          <AlertCircle className="w-3 h-3" />
                          <span>Out of Stock</span>
                        </>
                      ) : isLowStock ? (
                        <>
                          <AlertTriangle className="w-3 h-3" />
                          <span>Low Stock ({stock})</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-3 h-3" />
                          <span>In Stock ({stock})</span>
                        </>
                      )}
                    </span>
                  </div>

                  {/* Product Details: Image + Title */}
                  <div className="flex items-start gap-3.5 mb-3">
                    <div className="w-16 h-16 rounded-2xl bg-groomish-cream overflow-hidden shrink-0 border border-groomish-slate/10 flex items-center justify-center">
                      {p.image ? (
                        <img
                          src={p.image}
                          alt={p.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.style.display = "none";
                          }}
                        />
                      ) : (
                        <Package className="w-7 h-7 text-groomish-slate/30" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <h4 className="font-heading font-extrabold text-sm text-groomish-slate leading-tight truncate">
                        {p.name}
                      </h4>
                      {p.description && (
                        <p className="text-[11px] text-groomish-slate/60 line-clamp-2 mt-1 leading-snug">
                          {p.description}
                        </p>
                      )}
                      <div className="flex items-baseline gap-1.5 mt-1.5">
                        <span className="font-heading font-extrabold text-sm text-groomish-slate">
                          ₹{p.price}
                        </span>
                        {p.mrp && p.mrp > p.price && (
                          <span className="text-[11px] text-groomish-slate/40 line-through">
                            ₹{p.mrp}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Stock Quantity Editor */}
                  <div className="bg-groomish-cream/70 rounded-2xl p-3 border border-groomish-slate/10 space-y-2.5 mb-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-groomish-slate">
                        On-Hand Stock Units:
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleAdjustStock(p.productId, -1)}
                          className="w-7 h-7 rounded-lg bg-white border border-groomish-slate/20 text-groomish-slate flex items-center justify-center hover:bg-groomish-cream active:scale-95 transition"
                          title="Decrease 1 unit"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <input
                          type="number"
                          min="0"
                          value={draft.stockQuantity}
                          onChange={(e) =>
                            handleDraftChange(
                              p.productId,
                              "stockQuantity",
                              Math.max(0, parseInt(e.target.value) || 0)
                            )
                          }
                          className="w-14 text-center py-1 rounded-lg bg-white border border-groomish-slate/20 text-xs font-mono font-bold text-groomish-slate focus:outline-none focus:ring-2 focus:ring-groomish-orange/50"
                        />
                        <button
                          type="button"
                          onClick={() => handleAdjustStock(p.productId, 1)}
                          className="w-7 h-7 rounded-lg bg-white border border-groomish-slate/20 text-groomish-slate flex items-center justify-center hover:bg-groomish-cream active:scale-95 transition"
                          title="Increase 1 unit"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAdjustStock(p.productId, 5)}
                          className="px-2 h-7 rounded-lg bg-groomish-slate text-white text-[10px] font-bold hover:bg-groomish-slate/90 active:scale-95 transition"
                          title="Add +5 units"
                        >
                          +5
                        </button>
                      </div>
                    </div>

                    {/* Low stock threshold configuration */}
                    <div className="flex items-center justify-between text-[11px] text-groomish-slate/70 pt-1.5 border-t border-groomish-slate/10">
                      <span>Low-stock alert threshold:</span>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          min="0"
                          value={draft.lowStockThreshold}
                          onChange={(e) =>
                            handleDraftChange(
                              p.productId,
                              "lowStockThreshold",
                              Math.max(0, parseInt(e.target.value) || 0)
                            )
                          }
                          className="w-12 text-center py-0.5 rounded-lg bg-white border border-groomish-slate/20 text-xs font-mono text-groomish-slate focus:outline-none focus:ring-2 focus:ring-groomish-orange/50"
                        />
                        <span className="text-[10px] text-groomish-slate/40">units</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer Actions: Branch Active Toggle & Save Button */}
                <div className="pt-3 border-t border-groomish-slate/10 flex items-center justify-between gap-3">
                  {/* Branch Active Toggle */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleToggleActive(p)}
                      title={isActive ? "Disable product for this branch" : "Enable product for this branch"}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full p-0.5 transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-groomish-orange/40 ${
                        isActive ? "bg-groomish-green" : "bg-gray-300"
                      }`}
                    >
                      <span
                        className={`inline-flex h-5 w-5 items-center justify-center rounded-full bg-white shadow-sm transition-transform duration-200 ease-in-out text-[9px] font-bold ${
                          isActive
                            ? "translate-x-5 text-groomish-green"
                            : "translate-x-0 text-gray-400"
                        }`}
                      >
                        {isActive ? <Check className="w-3 h-3" /> : <span className="leading-none">✕</span>}
                      </span>
                    </button>
                    <span className="text-[11px] font-bold text-groomish-slate select-none">
                      {isActive ? "Offered at Branch" : "Disabled at Branch"}
                    </span>
                  </div>

                  {/* Save Button */}
                  <button
                    onClick={() => handleSaveStock(p)}
                    disabled={draft.saving}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs ${
                      draft.saved
                        ? "bg-groomish-green text-white"
                        : "bg-groomish-orange text-white hover:bg-groomish-orange/90 active:scale-95"
                    }`}
                  >
                    {draft.saving ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : draft.saved ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Saved</span>
                      </>
                    ) : (
                      <span>Save Stock</span>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
