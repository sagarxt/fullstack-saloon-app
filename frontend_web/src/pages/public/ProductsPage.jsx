import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import ModalWrapper from "../../components/modals/ModalWrapper";
import AuthModal from "../../components/modals/AuthModal";
import CustomSelect from "../../components/common/CustomSelect";
import Pagination from "../../components/common/Pagination";
import { getPublicProducts, getProductCategories } from "../../api/products";
import { useAuth } from "../../context/useAuth";
import { extractList } from "../../utils/dataHelper";
import {
  ShoppingBag,
  Sparkles,
  Search,
  Package,
  Store,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  Star,
  Check,
  Tag,
  Clock,
  Info,
} from "lucide-react";

export default function ProductsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("DEFAULT"); // DEFAULT | PRICE_LOW | PRICE_HIGH
  const [page, setPage] = useState(1);

  const PAGE_SIZE = 20;

  useEffect(() => {
    setPage(1);
  }, [selectedCategory, search, sortBy]);

  // Modals
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [modalImageIdx, setModalImageIdx] = useState(0);
  const [pickupModalOpen, setPickupModalOpen] = useState(false);
  const [reservationSuccess, setReservationSuccess] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);

  useEffect(() => {
    const role = (user?.role || "").replace("ROLE_", "");
    if (role === "ADMIN") {
      navigate("/admin/products", { replace: true });
    } else if (role === "STAFF") {
      navigate("/staff/dashboard", { replace: true });
    }
  }, [user, navigate]);

  useEffect(() => {
    loadProductsData();
  }, []);

  const loadProductsData = async () => {
    setLoading(true);
    try {
      const [prodsRes, catsRes] = await Promise.all([
        getPublicProducts(),
        getProductCategories().catch(() => ({ data: [] })),
      ]);
      const rawProducts = extractList(prodsRes.data);
      // Strictly show only active products in shop
      const activeProducts = rawProducts.filter((p) => p && p.active !== false);
      setProducts(activeProducts);

      // Dynamically load categories strictly from active products or backend
      const serverCats = extractList(catsRes.data).filter(Boolean);
      if (serverCats.length > 0) {
        setCategories(serverCats);
      } else {
        const derived = Array.from(new Set(activeProducts.map((p) => p.category).filter(Boolean)));
        setCategories(derived);
      }
    } catch (err) {
      console.error("Failed to load products from backend", err);
      setProducts([]);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  const productList = extractList(products);
  const categoryList = extractList(categories);

  const filteredProducts = useMemo(() => {
    return productList.filter((p) => {
      // Category filter
      if (selectedCategory !== "ALL" && p.category?.toLowerCase() !== selectedCategory.toLowerCase()) {
        return false;
      }
      // Search
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchName = p.name?.toLowerCase().includes(q);
        const matchBrand = p.brand?.toLowerCase().includes(q);
        const matchDesc = p.description?.toLowerCase().includes(q);
        if (!matchName && !matchBrand && !matchDesc) return false;
      }
      return true;
    });
  }, [products, selectedCategory, search]);

  const sortedProducts = useMemo(() => {
    const list = [...filteredProducts];
    if (sortBy === "PRICE_LOW") list.sort((a, b) => a.price - b.price);
    if (sortBy === "PRICE_HIGH") list.sort((a, b) => b.price - a.price);
    return list;
  }, [filteredProducts, sortBy]);

  const handleOpenReserve = (product) => {
    if (!user) {
      setAuthOpen(true);
      return;
    }
    setSelectedProduct(product);
    setReservationSuccess(false);
    setPickupModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-groomish-cream flex flex-col font-sans">
      <Navbar />

      <main className="flex-1">
        {/* HERO SECTION */}
        <section className="bg-gradient-to-b from-white to-groomish-cream/40 border-b border-groomish-slate/10 py-12 sm:py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div className="max-w-2xl">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-groomish-orangeLight text-groomish-orange mb-3">
                  <ShoppingBag className="w-3.5 h-3.5" />
                  Salon Retail Collection
                </span>
                <h1 className="text-3xl sm:text-5xl font-heading font-extrabold text-groomish-slate tracking-tight">
                  Beauty Shop & In-Store Pickup
                </h1>
                <p className="mt-2 text-sm sm:text-base text-groomish-slate/70 leading-relaxed">
                  Professional hair serums, clinical facial cleansers, and styling formulations. Pick up your products directly at our salon during your appointment or visit anytime.
                </p>
              </div>

              {/* In-Store Notice Pill */}
              <div className="flex items-center gap-3 bg-white p-3.5 rounded-2xl border border-groomish-slate/10 shadow-soft max-w-sm">
                <div className="w-10 h-10 rounded-xl bg-groomish-cream text-groomish-orange flex items-center justify-center shrink-0">
                  <Store className="w-5 h-5" />
                </div>
                <div className="text-xs">
                  <p className="font-bold text-groomish-slate">In-Store Pickup Exclusively</p>
                  <p className="text-groomish-slate/60 text-[11px] mt-0.5">
                    Reserve online, collect at the front desk or add to your service appointment.
                  </p>
                </div>
              </div>
            </div>

            {/* SEARCH & FILTERS BAR */}
            <div className="mt-10 flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-4 rounded-3xl border border-groomish-slate/10 shadow-soft">
              {/* Category Pills */}
              <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-none">
                <button
                  onClick={() => setSelectedCategory("ALL")}
                  className={`px-4 py-2 rounded-full text-xs font-bold shrink-0 transition ${
                    selectedCategory === "ALL"
                      ? "bg-groomish-slate text-white shadow-sm"
                      : "bg-groomish-cream text-groomish-slate hover:bg-groomish-slate/10"
                  }`}
                >
                  All Products
                </button>
                {categoryList.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-4 py-2 rounded-full text-xs font-bold shrink-0 transition ${
                      selectedCategory.toLowerCase() === cat.toLowerCase()
                        ? "bg-groomish-slate text-white shadow-sm"
                        : "bg-groomish-cream text-groomish-slate hover:bg-groomish-slate/10"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Search & Sort Controls */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full md:w-auto justify-end">
                <div className="relative flex-1 md:w-64">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-groomish-slate/40 pointer-events-none" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search hair serum, cleanser..."
                    className="w-full pl-9 pr-3 py-2 rounded-full bg-groomish-cream text-xs text-groomish-slate outline-none border border-transparent focus:border-groomish-orange transition"
                  />
                </div>

                <div className="w-full sm:w-48">
                  <CustomSelect
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="rounded-full bg-groomish-cream border-transparent py-2"
                    options={[
                      { value: "DEFAULT", label: "Recommended" },
                      { value: "PRICE_LOW", label: "Price: Low to High" },
                      { value: "PRICE_HIGH", label: "Price: High to Low" },
                    ]}
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* PRODUCTS GRID */}
        <section className="py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {loading ? (
            <div className="py-20 text-center">
              <div className="w-10 h-10 border-4 border-groomish-orange border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-xs text-groomish-slate/60 font-medium">Loading salon products...</p>
            </div>
          ) : sortedProducts.length === 0 ? (
            <div className="bg-white rounded-3xl border border-groomish-slate/10 p-12 text-center max-w-md mx-auto shadow-soft">
              <Package className="w-10 h-10 text-groomish-slate/30 mx-auto mb-3" />
              {productList.length === 0 ? (
                <>
                  <h3 className="font-heading font-bold text-base text-groomish-slate">
                    No Products in Shop Yet
                  </h3>
                  <p className="text-xs text-groomish-slate/50 mt-1">
                    Our salon retail collection and beauty care essentials will appear here once published by salon administration.
                  </p>
                </>
              ) : (
                <>
                  <h3 className="font-heading font-bold text-base text-groomish-slate">
                    No Matching Products Found
                  </h3>
                  <p className="text-xs text-groomish-slate/50 mt-1 mb-4">
                    We couldn't find any active products matching your selected category or search keyword.
                  </p>
                  <button
                    onClick={() => {
                      setSelectedCategory("ALL");
                      setSearch("");
                    }}
                    className="btn-secondary text-xs px-4 py-2"
                  >
                    Reset Filters
                  </button>
                </>
              )}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {sortedProducts
                .slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
                .map((product) => {
                const pointsEarned = Math.floor(product.price / 100);
                const discountPercent =
                  product.mrp && product.mrp > product.price
                    ? Math.round(((product.mrp - product.price) / product.mrp) * 100)
                    : 0;

                return (
                  <div
                    key={product.id}
                    className="card-groomish flex flex-col justify-between overflow-hidden group hover:border-groomish-orange/40 hover:-translate-y-1 transition duration-300"
                  >
                    <div>
                      {/* Image Thumbnail */}
                      <div
                        onClick={() => {
                          setSelectedProduct(product);
                          setModalImageIdx(0);
                        }}
                        className="relative h-52 overflow-hidden bg-white flex items-center justify-center p-4 cursor-pointer"
                      >
                        <img
                          src={
                            product.image ||
                            "https://images.unsplash.com/photo-1608248597359-586616035ec8?auto=format&fit=crop&w=600&q=80"
                          }
                          alt={product.name}
                          className="max-h-full max-w-full object-contain transition-transform duration-500 group-hover:scale-105"
                        />

                        {/* Brand Badge */}
                        <span className="absolute top-3 left-3 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white/95 text-groomish-slate shadow-sm border border-groomish-slate/10">
                          {product.brand || "Groomish Pro"}
                        </span>

                        {/* Multi-image photo count badge */}
                        {product.images && product.images.length > 1 && (
                          <span className="absolute top-3 right-3 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-groomish-slate/85 backdrop-blur-sm text-white shadow-sm">
                            {product.images.length} photos
                          </span>
                        )}

                        {/* In-Store Pickup Badge */}
                        <span className="absolute bottom-3 left-3 px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider bg-groomish-slateDark/80 text-white backdrop-blur-sm flex items-center gap-1">
                          <Store className="w-2.5 h-2.5 text-groomish-gold" />
                          <span>In-Store Pickup</span>
                        </span>

                        {/* Discount Chip */}
                        {discountPercent > 0 && !(product.images && product.images.length > 1) && (
                          <span className="absolute top-3 right-3 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-groomish-crimson text-white shadow-sm">
                            {discountPercent}% OFF
                          </span>
                        )}
                      </div>

                      {/* Content */}
                      <div className="p-5 space-y-2">
                        <div className="flex items-center justify-between text-[11px] font-semibold text-groomish-slate/50">
                          <span>{product.category || "Salon Care"}</span>
                          {product.volumeOrSize && (
                            <span className="font-mono">{product.volumeOrSize}</span>
                          )}
                        </div>

                        <h3
                          onClick={() => setSelectedProduct(product)}
                          className="font-heading font-bold text-base text-groomish-slate group-hover:text-groomish-orange transition-colors line-clamp-1 cursor-pointer"
                        >
                          {product.name}
                        </h3>

                        <p className="text-xs text-groomish-slate/60 line-clamp-2 leading-relaxed">
                          {product.description || "Premium salon-grade formula crafted for daily nourishment."}
                        </p>

                        {/* Points badge */}
                        <div className="pt-1 flex items-center gap-1 text-[11px] font-bold text-groomish-orange">
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Earn +{pointsEarned} Groomish Points</span>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Pricing & Action */}
                    <div className="p-5 pt-0 border-t border-groomish-slate/10 mt-2 flex items-center justify-between">
                      <div>
                        <div className="text-lg font-extrabold text-groomish-slate">
                          ₹{product.price}
                        </div>
                        {product.mrp > product.price && (
                          <div className="text-[11px] text-groomish-slate/40 line-through">
                            ₹{product.mrp}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setSelectedProduct(product)}
                          className="btn-secondary text-xs px-2.5 py-2"
                        >
                          Details
                        </button>
                        <button
                          onClick={() => handleOpenReserve(product)}
                          className="btn-primary text-xs px-3.5 py-2 shadow-sm group-hover:shadow-glowOrange flex items-center gap-1"
                        >
                          <ShoppingBag className="w-3.5 h-3.5" />
                          <span>Reserve</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {sortedProducts.length > 0 && (
              <div className="mt-8 bg-white p-4 rounded-2xl border border-groomish-slate/10 shadow-soft">
                <Pagination
                  currentPage={page}
                  totalItems={sortedProducts.length}
                  pageSize={PAGE_SIZE}
                  onPageChange={setPage}
                  itemName="products"
                />
              </div>
            )}
          </>
        )}
      </section>
      </main>

      {/* PRODUCT DETAILS MODAL */}
      {selectedProduct && (
        <ModalWrapper
          open={!!selectedProduct && !pickupModalOpen}
          onClose={() => setSelectedProduct(null)}
          maxWidth="max-w-xl"
        >
          <div className="space-y-5">
            <div className="flex flex-col sm:flex-row gap-5 items-center sm:items-start">
              <div className="flex flex-col items-center gap-2 shrink-0">
                <div className="w-44 h-44 bg-white rounded-2xl border border-groomish-slate/10 p-2 flex items-center justify-center relative overflow-hidden">
                  <img
                    src={
                      (selectedProduct.images && selectedProduct.images[modalImageIdx]) ||
                      selectedProduct.image
                    }
                    alt={selectedProduct.name}
                    className="max-h-full max-w-full object-contain transition-all duration-300"
                  />
                </div>

                {/* Multi-image thumbnail bar */}
                {selectedProduct.images && selectedProduct.images.length > 1 && (
                  <div className="flex items-center gap-1.5 max-w-[176px] overflow-x-auto py-1">
                    {selectedProduct.images.map((img, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setModalImageIdx(idx)}
                        className={`w-9 h-9 rounded-lg overflow-hidden border p-0.5 bg-white transition shrink-0 ${
                          modalImageIdx === idx
                            ? "border-groomish-orange ring-2 ring-groomish-orange/20"
                            : "border-groomish-slate/20 hover:border-groomish-slate/40 opacity-70 hover:opacity-100"
                        }`}
                      >
                        <img src={img} alt="Thumb" className="w-full h-full object-cover rounded" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-2 text-center sm:text-left flex-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-groomish-orange bg-groomish-orangeLight px-2.5 py-0.5 rounded-full">
                  {selectedProduct.brand || "Groomish Pro"}
                </span>
                <h3 className="font-heading font-extrabold text-xl text-groomish-slate">
                  {selectedProduct.name}
                </h3>
                <p className="text-xs text-groomish-slate/60">
                  Category: <b>{selectedProduct.category}</b> • Volume: <b>{selectedProduct.volumeOrSize || "Standard Size"}</b>
                </p>

                <div className="flex items-baseline gap-2 justify-center sm:justify-start pt-1">
                  <span className="text-2xl font-extrabold text-groomish-slate">
                    ₹{selectedProduct.price}
                  </span>
                  {selectedProduct.mrp > selectedProduct.price && (
                    <span className="text-sm text-groomish-slate/40 line-through">
                      ₹{selectedProduct.mrp}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-groomish-cream p-4 rounded-2xl text-xs text-groomish-slate/80 leading-relaxed">
              <h4 className="font-bold text-groomish-slate mb-1">Product Description</h4>
              <p>{selectedProduct.description}</p>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl border border-groomish-slate/10 bg-white flex items-center gap-2.5">
                <ShieldCheck className="w-5 h-5 text-groomish-green shrink-0" />
                <div>
                  <p className="font-bold text-groomish-slate">100% Genuine</p>
                  <p className="text-[10px] text-groomish-slate/50">Direct from authorized distributors</p>
                </div>
              </div>
              <div className="p-3 rounded-xl border border-groomish-slate/10 bg-white flex items-center gap-2.5">
                <Store className="w-5 h-5 text-groomish-orange shrink-0" />
                <div>
                  <p className="font-bold text-groomish-slate">Store Pickup</p>
                  <p className="text-[10px] text-groomish-slate/50">Collect or add during appointment</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setSelectedProduct(null)}
                className="btn-secondary flex-1 text-xs py-3"
              >
                Close
              </button>
              <button
                onClick={() => {
                  const prod = selectedProduct;
                  setSelectedProduct(null);
                  handleOpenReserve(prod);
                }}
                className="btn-primary flex-1 text-xs py-3 flex items-center justify-center gap-2"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Reserve for In-Store Pickup</span>
              </button>
            </div>
          </div>
        </ModalWrapper>
      )}

      {/* IN-STORE PICKUP CONFIRMATION MODAL */}
      {selectedProduct && pickupModalOpen && (
        <ModalWrapper
          open={pickupModalOpen}
          onClose={() => setPickupModalOpen(false)}
          maxWidth="max-w-md"
        >
          {reservationSuccess ? (
            <div className="text-center py-4 space-y-4">
              <div className="w-14 h-14 bg-groomish-greenLight text-groomish-green rounded-full flex items-center justify-center mx-auto">
                <Check className="w-7 h-7" />
              </div>
              <h3 className="font-heading font-extrabold text-xl text-groomish-slate">
                Product Reserved Successfully!
              </h3>
              <p className="text-xs text-groomish-slate/70 max-w-sm mx-auto leading-relaxed">
                Your reservation for <b>{selectedProduct.name}</b> has been received. Our salon team will hold it at the front desk.
              </p>
              <div className="p-4 bg-groomish-cream rounded-2xl text-left text-xs space-y-1.5 border border-groomish-slate/10">
                <p className="text-groomish-slate font-bold">How to collect:</p>
                <p className="text-groomish-slate/70">• Pick up anytime during salon opening hours.</p>
                <p className="text-groomish-slate/70">• Or ask your stylist during your next appointment; they will include it directly on your final bill with your loyalty discount!</p>
              </div>
              <button
                onClick={() => setPickupModalOpen(false)}
                className="btn-primary w-full text-xs py-3 mt-2"
              >
                Done
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-center">
                <div className="w-12 h-12 bg-groomish-orangeLight text-groomish-orange rounded-2xl flex items-center justify-center mx-auto mb-2">
                  <Store className="w-6 h-6" />
                </div>
                <h3 className="font-heading font-extrabold text-xl text-groomish-slate">
                  In-Store Product Reservation
                </h3>
                <p className="text-xs text-groomish-slate/60 mt-1">
                  Hold this item at the salon for your next visit. No online payment required.
                </p>
              </div>

              <div className="p-4 bg-groomish-cream rounded-2xl flex items-center gap-3 border border-groomish-slate/10">
                <img
                  src={selectedProduct.image}
                  alt={selectedProduct.name}
                  className="w-14 h-14 object-contain rounded-xl bg-white p-1"
                />
                <div className="text-xs flex-1">
                  <p className="font-bold text-groomish-slate">{selectedProduct.name}</p>
                  <p className="text-[11px] text-groomish-slate/60">{selectedProduct.brand} • {selectedProduct.volumeOrSize}</p>
                  <p className="font-extrabold text-groomish-orange mt-1">₹{selectedProduct.price}</p>
                </div>
              </div>

              <div className="text-xs text-groomish-slate/70 space-y-2 bg-white p-3 rounded-xl border border-groomish-slate/10">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-groomish-green shrink-0" />
                  <span>Held for 48 hours under your name (<b>{user?.name}</b>).</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-groomish-green shrink-0" />
                  <span>Pay upon pickup or have your stylist bill it with your service.</span>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={() => setPickupModalOpen(false)}
                  className="btn-secondary flex-1 text-xs py-3"
                >
                  Cancel
                </button>
                <button
                  onClick={() => setReservationSuccess(true)}
                  className="btn-primary flex-1 text-xs py-3"
                >
                  Confirm Reservation
                </button>
              </div>
            </div>
          )}
        </ModalWrapper>
      )}

      {/* AUTH MODAL */}
      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />

      <Footer />
    </div>
  );
}
