import { useEffect, useState, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import AuthModal from "../../components/modals/AuthModal";
import CustomSelect from "../../components/common/CustomSelect";
import Pagination from "../../components/common/Pagination";
import BrandShowcaseSection from "../../components/shop/BrandShowcaseSection";
import { getPublicProducts, getProductCategories, getProductBrands } from "../../api/products";
import { getPublicCoupons } from "../../api/public";
import { useAuth } from "../../context/useAuth";
import { useCart } from "../../context/CartContext";
import { useGroomCoin } from "../../context/GroomCoinContext";
import GroomCoinIcon from "../../components/common/GroomCoinIcon";
import { extractList } from "../../utils/dataHelper";
import { getOptimizedImageUrl } from "../../utils/imageHelper";
import { extractBrandsFromProducts, getBrandInfo } from "../../utils/brandHelper";
import {
  ShoppingBag,
  ShoppingCart,
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
  Copy,
  Award,
} from "lucide-react";

export default function ProductsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const { addItem, items } = useCart();
  const { calculateCoins } = useGroomCoin();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [serverBrands, setServerBrands] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [copiedCode, setCopiedCode] = useState("");
  const [addingToCartId, setAddingToCartId] = useState(null);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const brandFromUrl = searchParams.get("brand") || "ALL";
  const [selectedBrand, setSelectedBrand] = useState(brandFromUrl);
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("DEFAULT"); // DEFAULT | PRICE_LOW | PRICE_HIGH
  const [page, setPage] = useState(1);

  const PAGE_SIZE = 20;

  useEffect(() => {
    const brandParam = searchParams.get("brand") || "ALL";
    setSelectedBrand(brandParam);
  }, [searchParams]);

  useEffect(() => {
    setPage(1);
  }, [selectedBrand, selectedCategory, search, sortBy]);

  const handleSelectBrand = (brandName) => {
    setSelectedBrand(brandName);
    setPage(1);
    const newParams = new URLSearchParams(searchParams);
    if (!brandName || brandName === "ALL") {
      newParams.delete("brand");
    } else {
      newParams.set("brand", brandName);
    }
    setSearchParams(newParams, { replace: true });
  };

  // Modals
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
      const [prodsRes, catsRes, coupRes, brandsRes] = await Promise.all([
        getPublicProducts(),
        getProductCategories().catch(() => ({ data: [] })),
        getPublicCoupons().catch(() => ({ data: [] })),
        getProductBrands().catch(() => ({ data: [] })),
      ]);
      const rawProducts = extractList(prodsRes.data);
      // Strictly show only active products in shop
      const activeProducts = rawProducts.filter((p) => p && p.active !== false);
      setProducts(activeProducts);
      setCoupons(extractList(coupRes.data));
      setServerBrands(extractList(brandsRes?.data));

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
      setServerBrands([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async (product) => {
    if (!user) {
      setAuthOpen(true);
      return;
    }
    setAddingToCartId(product.id);
    await addItem({
      itemType: "PRODUCT",
      productId: product.id,
      name: product.name,
      quantity: 1,
    });
    setAddingToCartId(null);
  };

  const handleCopyCode = (code) => {
    navigator.clipboard?.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(""), 2500);
  };

  const productList = extractList(products);
  const categoryList = extractList(categories);

  const brandList = useMemo(() => {
    return extractBrandsFromProducts(productList, serverBrands);
  }, [productList, serverBrands]);

  const filteredProducts = useMemo(() => {
    return productList.filter((p) => {
      // Brand filter
      if (selectedBrand !== "ALL") {
        const pBrand = p.brand || "Groomish Pro";
        if (pBrand.toLowerCase() !== selectedBrand.toLowerCase()) {
          return false;
        }
      }
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
  }, [productList, selectedBrand, selectedCategory, search]);

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
                  className={`px-4 py-2 rounded-full text-xs font-bold shrink-0 transition ${selectedCategory === "ALL"
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
                    className={`px-4 py-2 rounded-full text-xs font-bold shrink-0 transition ${selectedCategory.toLowerCase() === cat.toLowerCase()
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

        {/* PRODUCTS & BRANDS SECTION */}
        <section className="py-8 sm:py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          {/* BRAND HIERARCHY & LOGOS SHOWCASE WITH PAGINATION */}
          <BrandShowcaseSection
            brands={brandList}
            selectedBrand={selectedBrand}
            onSelectBrand={handleSelectBrand}
            totalProductsCount={productList.length}
          />

          {/* PROMOTIONAL OFFERS STRIP */}
          {coupons.length > 0 && (
            <div className="bg-gradient-to-r from-groomish-slateDark via-groomish-slate to-groomish-slateDark text-white p-5 sm:p-6 rounded-3xl shadow-soft">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-groomish-orange text-white flex items-center justify-center shrink-0">
                    <Tag className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-heading font-extrabold text-sm sm:text-base tracking-tight">
                      Exclusive Retail & Salon Offers Available
                    </h3>
                    <p className="text-[11px] text-white/70">
                      Copy any promo voucher code below and redeem at checkout for instant savings.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
                  {coupons.map((coupon) => (
                    <div
                      key={coupon.id}
                      className="px-3 py-2 rounded-2xl bg-white/10 hover:bg-white/15 backdrop-blur-md border border-white/15 flex items-center gap-2.5 shrink-0 transition"
                    >
                      <div>
                        <span className="font-mono text-xs font-black text-groomish-gold block">
                          {coupon.code}
                        </span>
                        <span className="text-[10px] text-white/80 block">
                          ₹{coupon.discount} OFF • Min ₹{coupon.minAmount || 0}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopyCode(coupon.code)}
                        className="px-2 py-1 rounded-lg bg-groomish-orange hover:bg-groomish-orangeDark text-white text-[10px] font-bold transition flex items-center gap-1"
                      >
                        {copiedCode === coupon.code ? (
                          <>
                            <Check className="w-3 h-3" />
                            <span>Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

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
                    {selectedBrand !== "ALL"
                      ? `We couldn't find any products under brand "${selectedBrand}".`
                      : "We couldn't find any active products matching your selected filters or search keyword."}
                  </p>
                  <button
                    onClick={() => {
                      handleSelectBrand("ALL");
                      setSelectedCategory("ALL");
                      setSearch("");
                    }}
                    className="btn-secondary text-xs px-4 py-2"
                  >
                    Reset All Filters
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
                    const coinsEarned = calculateCoins ? calculateCoins(product.price) : Math.max(1, Math.floor(product.price / 100));
                    const discountPercent =
                      product.mrp && product.mrp > product.price
                        ? Math.round(((product.mrp - product.price) / product.mrp) * 100)
                        : 0;
                    const isInCart = items?.some(
                      (i) =>
                        (i.itemType === "PRODUCT" || !i.itemType) &&
                        (i.productId === product.id || i.product?.id === product.id)
                    );

                    return (
                      <div
                        key={product.id}
                        className="card-groomish flex flex-col justify-between overflow-hidden group hover:border-groomish-orange/40 hover:-translate-y-1 transition duration-300"
                      >
                        <div>
                          {/* Image Thumbnail */}
                          <div
                            onClick={() => navigate(`/products/${product.id}`)}
                            className="relative h-52 overflow-hidden bg-white flex items-center justify-center p-4 cursor-pointer"
                          >
                            <img
                              src={getOptimizedImageUrl(
                                product.image ||
                                "https://images.unsplash.com/photo-1608248597359-586616035ec8?auto=format&fit=crop&w=600&q=80",
                                { width: 500 }
                              )}
                              alt={product.name}
                              loading="lazy"
                              decoding="async"
                              className="max-h-full max-w-full object-contain transition-transform duration-500 group-hover:scale-105"
                            />

                            {/* Interactive Brand Badge */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSelectBrand(product.brand || "Groomish Pro");
                              }}
                              className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white/95 text-groomish-slate shadow-sm border border-groomish-slate/10 hover:border-groomish-orange hover:text-groomish-orange transition-all flex items-center gap-1 z-10"
                              title={`Filter by ${product.brand || "Groomish Pro"}`}
                            >
                              <ShieldCheck className="w-3 h-3 text-groomish-green shrink-0" />
                              <span>{product.brand || "Groomish Pro"}</span>
                            </button>

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
                              onClick={() => navigate(`/products/${product.id}`)}
                              className="font-heading font-bold text-base text-groomish-slate group-hover:text-groomish-orange transition-colors line-clamp-1 cursor-pointer"
                            >
                              {product.name}
                            </h3>

                            <p className="text-xs text-groomish-slate/60 line-clamp-2 leading-relaxed">
                              {product.description || "Premium salon-grade formula crafted for daily nourishment."}
                            </p>

                            {/* Groom Coin badge */}
                            <div className="pt-1 flex items-center gap-1.5 text-[11px] font-bold text-groomish-orange">
                              <GroomCoinIcon className="w-3.5 h-3.5 shrink-0" />
                              <span>Earn {coinsEarned} Groom Coin{coinsEarned !== 1 ? "s" : ""}</span>
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

                          {isInCart ? (
                            <button
                              type="button"
                              onClick={() => navigate("/cart")}
                              className="btn-secondary text-xs px-3.5 py-2 flex items-center gap-1.5 bg-groomish-orangeLight/60 border border-groomish-orange/40 text-groomish-orange hover:bg-groomish-orange hover:text-white transition shadow-2xs font-bold"
                            >
                              <ShoppingCart className="w-3.5 h-3.5" />
                              <span>View Cart</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleAddToCart(product)}
                              disabled={addingToCartId === product.id}
                              className="btn-primary text-xs px-3.5 py-2 shadow-sm group-hover:shadow-glowOrange flex items-center gap-1.5"
                            >
                              <ShoppingCart className="w-3.5 h-3.5" />
                              <span>{addingToCartId === product.id ? "Adding..." : "Add Product"}</span>
                            </button>
                          )}
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

      {/* AUTH MODAL */}
      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />

      <Footer />
    </div>
  );
}
