import { useState, useMemo } from "react";
import { ShoppingBag, ShoppingCart, Search, ArrowRight, Star, Eye, Check, Clock, Sparkles } from "lucide-react";
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

  const filteredProducts = useMemo(() => {
    return productList.filter((prod) => {
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
  }, [productList, selectedCategory, searchTerm]);

  // Limit to 8-12 featured items on landing page
  const displayedProducts = filteredProducts.slice(0, 12);

  const defaultProductImage =
    "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=600&q=80";

  return (
    <section id="products" className="bg-white py-8 sm:py-14 border-t border-groomish-slate/10 w-full max-w-full overflow-x-hidden">
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
                className="w-full pl-10 pr-4 py-2 rounded-full bg-groomish-cream text-groomish-slate text-xs border border-groomish-slate/15 focus:border-groomish-orange outline-none transition"
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

        {/* Filters Bar: Category Tabs */}
        {availableCategories.length > 2 && (
          <div className="flex flex-wrap items-center justify-between gap-3 mb-5 pb-3 border-b border-groomish-slate/10">
            <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1 max-w-full">
              {availableCategories.map((c) => (
                <button
                  key={c}
                  onClick={() => setSelectedCategory(c)}
                  className={`px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-full text-xs font-bold transition whitespace-nowrap ${
                    selectedCategory === c
                      ? "bg-groomish-slate text-white shadow-sm"
                      : "bg-groomish-cream text-groomish-slate border border-groomish-slate/10 hover:border-groomish-slate/30"
                  }`}
                >
                  {c === "ALL" ? "All Products" : c}
                </button>
              ))}
            </div>

            <div className="text-xs text-groomish-slateLight">
              Showing <span className="font-bold text-groomish-slate">{displayedProducts.length}</span> featured products
            </div>
          </div>
        )}

        {/* Products Grid */}
        {displayedProducts.length === 0 ? (
          <div className="text-center py-16 bg-groomish-cream rounded-3xl border border-groomish-slate/10 max-w-md mx-auto p-8 shadow-soft">
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
                }}
                className="btn-secondary text-xs px-4 py-2"
              >
                Reset Filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {displayedProducts.map((product) => {
              const imgSrc = product.image || product.imageUrl || defaultProductImage;
              const coinsEarned = calculateCoins(product.price);
              const inCart = isInCart(product.id);
              const isAdding = addingToCartId === product.id;
              const hasDiscount = product.mrp && product.mrp > product.price;
              const discountPercent = hasDiscount
                ? Math.round(((product.mrp - product.price) / product.mrp) * 100)
                : 0;

              return (
                <div
                  key={product.id}
                  className="card-groomish overflow-hidden flex flex-col group hover:-translate-y-1 transition duration-300 bg-white"
                >
                  <div className="flex-1 flex flex-col">
                    {/* Image & Badges */}
                    <div
                      onClick={() => navigate(`/products/${product.id}`)}
                      style={{ aspectRatio: "3 / 4" }}
                      className="relative w-full aspect-[3/4] overflow-hidden bg-groomish-slate/10 cursor-pointer shrink-0"
                    >
                      <img
                        src={getOptimizedImageUrl(imgSrc, { width: 600 })}
                        alt={product.name}
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-groomish-slateDark/60 via-transparent to-transparent" />

                      {/* Brand Badge */}
                      {product.brand && (
                        <span className="absolute top-3 left-3 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white/95 text-groomish-slate shadow-sm backdrop-blur-sm">
                          {product.brand}
                        </span>
                      )}

                      {/* Discount Badge */}
                      {discountPercent > 0 && (
                        <span className="absolute top-3 right-3 px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-red-500 text-white shadow-sm">
                          {discountPercent}% OFF
                        </span>
                      )}

                      {/* Stock / Availability Status */}
                      <span className="absolute bottom-3 left-3 flex items-center gap-1 text-[11px] font-semibold text-white bg-black/40 backdrop-blur-sm px-2.5 py-0.5 rounded-full">
                        <Check className="w-3 h-3 text-emerald-400" />
                        In Stock
                      </span>
                    </div>

                    {/* Content Details */}
                    <div className="p-4 sm:p-5 pb-3 flex-1 flex flex-col justify-between">
                      <div className="space-y-1.5">
                        <div className="text-[11px] font-bold text-groomish-orange uppercase tracking-wider truncate">
                          {product.category || product.categoryName || "Grooming Retail"}
                        </div>

                        <h3
                          onClick={() => navigate(`/products/${product.id}`)}
                          className="font-heading font-bold text-base text-groomish-slate leading-snug group-hover:text-groomish-orange transition-colors cursor-pointer line-clamp-1"
                        >
                          {product.name}
                        </h3>

                        <p className="text-xs text-groomish-slateLight line-clamp-2 leading-relaxed">
                          {product.description || "Authentic professional salon product formulation for daily hair and skin care."}
                        </p>
                      </div>

                      {/* GroomCoin Rewards Badge */}
                      <div className="mt-3 pt-2.5 border-t border-groomish-slate/10 flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-xs text-groomish-goldDark font-bold bg-groomish-goldLight/70 px-2.5 py-0.5 rounded-full">
                          <GroomCoinIcon className="w-3.5 h-3.5 text-groomish-gold" />
                          <span>+{coinsEarned} Coins</span>
                        </div>

                        {product.rating && (
                          <div className="flex items-center gap-1 text-xs font-bold text-groomish-slate">
                            <Star className="w-3 h-3 fill-amber-400 text-amber-500" />
                            <span>{Number(product.rating).toFixed(1)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Price & Action Row */}
                  <div className="p-4 sm:p-5 pt-3 bg-groomish-cream/40 border-t border-groomish-slate/10 flex items-center justify-between gap-2">
                    <div>
                      <div className="text-[10px] text-groomish-slateLight uppercase font-semibold">
                        Retail Price
                      </div>
                      <div className="flex items-baseline gap-1.5">
                        <span className="font-heading font-extrabold text-base sm:text-lg text-groomish-slate">
                          ₹{Number(product.price || 0).toLocaleString("en-IN")}
                        </span>
                        {hasDiscount && (
                          <span className="text-xs text-groomish-slateLight line-through">
                            ₹{Number(product.mrp).toLocaleString("en-IN")}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => navigate(`/products/${product.id}`)}
                        className="p-2 rounded-xl bg-white hover:bg-groomish-cream border border-groomish-slate/10 text-groomish-slateLight hover:text-groomish-slate transition"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => onAddToCart && onAddToCart(product)}
                        disabled={isAdding}
                        className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm ${
                          inCart
                            ? "bg-emerald-600 text-white hover:bg-emerald-700"
                            : "btn-primary"
                        }`}
                      >
                        <ShoppingCart className="w-3.5 h-3.5" />
                        <span>{isAdding ? "Adding..." : inCart ? "In Cart" : "Add to Cart"}</span>
                      </button>
                    </div>
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
              className="btn-secondary text-xs sm:text-sm px-6 py-2.5 inline-flex items-center gap-2"
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
