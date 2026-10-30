import { useState, useMemo } from "react";
import {
  ShoppingBag,
  ShoppingCart,
  Search,
  ArrowRight,
  ShieldCheck,
  Store,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { extractList } from "../../utils/dataHelper";
import { getOptimizedImageUrl } from "../../utils/imageHelper";
import { useGroomCoin } from "../../context/GroomCoinContext";
import GroomCoinIcon from "../common/GroomCoinIcon";

export default function ProductsSection({
  products = [],
  onAddToCart,
  addingToCartId = null,
  isInCart = () => false,
}) {
  const navigate = useNavigate();
  const { calculateCoins } = useGroomCoin();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [selectedBrand, setSelectedBrand] = useState("ALL");

  const productList = extractList(products);

  // Extract unique categories dynamically from products
  const availableCategories = useMemo(() => {
    const set = new Set();
    productList.forEach((p) => {
      const cat = p.category || p.categoryName;
      if (cat && typeof cat === "string" && cat.trim()) {
        set.add(cat.trim());
      }
    });
    return ["ALL", ...Array.from(set)];
  }, [productList]);

  // Extract unique brands dynamically from products
  const availableBrands = useMemo(() => {
    const set = new Set();
    productList.forEach((p) => {
      if (p.brand && typeof p.brand === "string" && p.brand.trim()) {
        set.add(p.brand.trim());
      }
    });
    return Array.from(set);
  }, [productList]);

  const filteredProducts = useMemo(() => {
    return productList.filter((prod) => {
      // Brand filter
      if (selectedBrand !== "ALL") {
        const prodBrand = (prod.brand || "Groomish Pro").trim().toLowerCase();
        if (prodBrand !== selectedBrand.toLowerCase()) {
          return false;
        }
      }
      // Category filter
      if (selectedCategory !== "ALL") {
        const prodCat = (prod.category || prod.categoryName || "").trim().toLowerCase();
        if (prodCat !== selectedCategory.toLowerCase()) {
          return false;
        }
      }
      // Search
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const nameMatch = prod.name?.toLowerCase().includes(term);
        const descMatch = prod.description?.toLowerCase().includes(term);
        const brandMatch = prod.brand?.toLowerCase().includes(term);
        return nameMatch || descMatch || brandMatch;
      }
      return true;
    });
  }, [productList, selectedCategory, selectedBrand, searchTerm]);

  // Limit to featured items on landing page
  const displayedProducts = filteredProducts.slice(0, 12);

  const defaultProductImage =
    "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=600&q=80";

  return (
    <section id="products" className="bg-[#FAF6ED] py-8 sm:py-14 border-t border-groomish-slate/10 w-full max-w-full overflow-x-hidden">
      <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 w-full max-w-full min-w-0">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 sm:gap-6 mb-5 sm:mb-8">
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-groomish-orangeLight text-groomish-orange mb-2 sm:mb-3">
              <ShoppingBag className="w-3.5 h-3.5" />
              Salon Retail &amp; Care
            </span>
            <h2 className="text-2xl sm:text-4xl font-heading font-extrabold text-groomish-slate">
              Professional Salon Products
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-groomish-slateLight">
              Authentic hair styling clays, nourishing serums, and grooming essentials trusted by our stylists.
            </p>
          </div>

          {/* Search & Direct Link to Dedicated Products Page */}
          <div className="flex flex-col sm:flex-row items-center gap-2.5 sm:gap-3 w-full md:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-groomish-slateLight" />
              <input
                type="text"
                placeholder="Search products or brands..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-full bg-white text-groomish-slate text-xs border border-groomish-slate/15 focus:border-groomish-orange outline-none transition"
              />
            </div>

            <button
              onClick={() => navigate("/products")}
              className="btn-secondary text-xs px-4 py-2 shrink-0 flex items-center gap-1.5 w-full sm:w-auto justify-center"
            >
              <span>Full Products Shop</span>
              <ArrowRight className="w-3.5 h-3.5 text-groomish-orange" />
            </button>
          </div>
        </div>

        {/* Filters Bar: Category Tabs & Active Brand Filter */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6 pb-3 border-b border-groomish-slate/10">
          <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1 max-w-full no-scrollbar">
            {availableCategories.map((c) => (
              <button
                key={c}
                onClick={() => setSelectedCategory(c)}
                className={`px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-full text-xs font-bold transition whitespace-nowrap ${
                  selectedCategory === c
                    ? "bg-groomish-slate text-white shadow-xs"
                    : "bg-white text-groomish-slate border border-groomish-slate/10 hover:border-groomish-slate/30"
                }`}
              >
                {c === "ALL" ? "All Products" : c}
              </button>
            ))}

            {selectedBrand !== "ALL" && (
              <div className="flex items-center gap-1.5 pl-2 border-l border-groomish-slate/20">
                <span className="text-xs text-groomish-slateLight font-medium">Brand:</span>
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-groomish-orangeLight text-groomish-orange flex items-center gap-1">
                  {selectedBrand}
                  <button
                    type="button"
                    onClick={() => setSelectedBrand("ALL")}
                    className="hover:text-red-500 font-extrabold text-xs ml-0.5"
                    title="Clear brand filter"
                  >
                    ×
                  </button>
                </span>
              </div>
            )}
          </div>

          <div className="text-xs text-groomish-slateLight">
            Showing <span className="font-bold text-groomish-slate">{displayedProducts.length}</span> featured products
          </div>
        </div>

        {/* Products Grid */}
        {displayedProducts.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-groomish-slate/10 max-w-md mx-auto p-8 shadow-soft">
            <ShoppingBag className="w-10 h-10 text-groomish-slateLight mx-auto mb-3" />
            <h3 className="font-heading font-bold text-lg text-groomish-slate">
              {productList.length === 0 ? "No Salon Products Available" : "No Products Found"}
            </h3>
            <p className="text-xs text-groomish-slateLight mt-1 mb-4">
              {productList.length === 0
                ? "Retail products and hair care kits will appear here once published by salon administration."
                : "Try adjusting your search query or category filter."}
            </p>
            {productList.length > 0 && (
              <button
                onClick={() => {
                  setSearchTerm("");
                  setSelectedCategory("ALL");
                  setSelectedBrand("ALL");
                }}
                className="btn-secondary text-xs px-4 py-2"
              >
                Reset Filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
            {displayedProducts.map((product) => {
              const imgSrc = product.image || product.imageUrl || defaultProductImage;
              const coinsEarned = calculateCoins ? calculateCoins(product.price) : Math.max(1, Math.round(product.price / 100));
              const inCart = isInCart ? isInCart(product.id) : false;
              const isAdding = addingToCartId === product.id;
              const hasDiscount = product.mrp && product.mrp > product.price;
              const discountPercent = hasDiscount
                ? Math.round(((product.mrp - product.price) / product.mrp) * 100)
                : 0;

              return (
                <div
                  key={product.id}
                  className="card-groomish flex flex-col justify-between overflow-hidden group hover:border-groomish-orange/40 hover:-translate-y-1 transition duration-300 bg-white rounded-2xl border border-groomish-slate/10 shadow-soft"
                >
                  <div>
                    {/* Image Thumbnail Container */}
                    <div
                      onClick={() => navigate(`/products/${product.id}`)}
                      className="relative h-44 sm:h-48 overflow-hidden bg-white flex items-center justify-center p-3 cursor-pointer"
                    >
                      <img
                        src={getOptimizedImageUrl(imgSrc, { width: 500 })}
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
                          setSelectedBrand(product.brand || "Groomish Pro");
                        }}
                        className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold uppercase tracking-wider bg-white/95 text-groomish-slate shadow-xs border border-groomish-slate/15 hover:border-groomish-orange hover:text-groomish-orange transition-all flex items-center gap-1 z-10"
                        title={`Filter by ${product.brand || "Groomish Pro"}`}
                      >
                        <ShieldCheck className="w-3 h-3 text-groomish-green shrink-0" />
                        <span>{product.brand || "Groomish Pro"}</span>
                      </button>

                      {/* In-Store Pickup Badge */}
                      <span className="absolute bottom-2.5 left-2.5 px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider bg-[#2C343F] text-white backdrop-blur-sm flex items-center gap-1 z-10 shadow-xs">
                        <Store className="w-2.5 h-2.5 text-groomish-gold" />
                        <span>In-Store Pickup</span>
                      </span>

                      {/* Discount Chip on Top Right */}
                      {discountPercent > 0 && (
                        <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-md text-[9px] sm:text-[10px] font-extrabold bg-[#EF4444] text-white shadow-xs z-10 tracking-wide">
                          {discountPercent}% OFF
                        </span>
                      )}
                    </div>

                    {/* Content */}
                    <div className="p-3.5 sm:p-4 space-y-1.5">
                      <div className="flex items-center justify-between text-[10px] sm:text-[11px] font-semibold text-groomish-slate/50">
                        <span>{product.category || product.categoryName || "Salon Care"}</span>
                        {product.volumeOrSize && (
                          <span className="font-mono">{product.volumeOrSize}</span>
                        )}
                      </div>

                      <h3
                        onClick={() => navigate(`/products/${product.id}`)}
                        className="font-heading font-bold text-sm sm:text-base text-groomish-slate group-hover:text-groomish-orange transition-colors line-clamp-1 cursor-pointer"
                        title={product.name}
                      >
                        {product.name}
                      </h3>

                      <p className="text-xs text-groomish-slate/60 line-clamp-2 leading-relaxed">
                        {product.description || "Premium salon-grade formula crafted for daily nourishment."}
                      </p>

                      {/* Groom Coin badge */}
                      <div className="pt-0.5 flex items-center gap-1.5 text-[10px] sm:text-[11px] font-bold text-groomish-orange">
                        <GroomCoinIcon className="w-3.5 h-3.5 shrink-0" />
                        <span>Earn {coinsEarned} Groom Coin{coinsEarned !== 1 ? "s" : ""}</span>
                      </div>
                    </div>
                  </div>

                  {/* Bottom Pricing & Action */}
                  <div className="p-3.5 sm:p-4 pt-0 border-t border-groomish-slate/10 mt-1 flex items-center justify-between">
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

                    {inCart ? (
                      <button
                        type="button"
                        onClick={() => navigate("/cart")}
                        className="btn-secondary text-xs px-3.5 py-2 flex items-center gap-1.5 bg-groomish-orangeLight/60 border border-groomish-orange/40 text-groomish-orange hover:bg-groomish-orange hover:text-white transition shadow-2xs font-bold rounded-xl"
                      >
                        <ShoppingCart className="w-3.5 h-3.5" />
                        <span>In Cart</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onAddToCart && onAddToCart(product)}
                        disabled={isAdding}
                        className="btn-primary text-xs px-3.5 py-2 shadow-sm group-hover:shadow-glowOrange flex items-center gap-1.5 rounded-xl font-bold"
                      >
                        <ShoppingCart className="w-3.5 h-3.5" />
                        <span>{isAdding ? "Adding..." : "Add Product"}</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Bottom CTA to View All Products */}
        {displayedProducts.length > 0 && (
          <div className="mt-8 sm:mt-10 text-center">
            <button
              onClick={() => navigate("/products")}
              className="btn-secondary text-xs sm:text-sm px-6 py-2.5 inline-flex items-center gap-2 rounded-xl"
            >
              <span>Explore All Salon Products</span>
              <ArrowRight className="w-4 h-4 text-groomish-orange" />
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

