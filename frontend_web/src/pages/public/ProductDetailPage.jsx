import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import AuthModal from "../../components/modals/AuthModal";
import { getPublicProduct, getPublicProducts } from "../../api/products";
import { getPublicCoupons } from "../../api/public";
import { useAuth } from "../../context/useAuth";
import { useCart } from "../../context/CartContext";
import { useGroomCoin } from "../../context/GroomCoinContext";
import GroomCoinIcon from "../../components/common/GroomCoinIcon";
import { extractList } from "../../utils/dataHelper";
import { getOptimizedImageUrl } from "../../utils/imageHelper";
import { getBrandInfo } from "../../utils/brandHelper";
import {
  ShoppingCart,
  Sparkles,
  ArrowRight,
  ChevronRight,
  ChevronDown,
  Home,
  ShieldCheck,
  Store,
  Tag,
  Clock,
  Package,
  CheckCircle2,
  Star,
  Info,
  PhoneCall,
  Award,
} from "lucide-react";

export default function ProductDetailPage() {
  const { productId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addItem, items } = useCart();
  const { calculateCoins, config } = useGroomCoin();

  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [selectedImageIdx, setSelectedImageIdx] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);
  const [loading, setLoading] = useState(true);
  const [authOpen, setAuthOpen] = useState(false);
  const [showAllOffers, setShowAllOffers] = useState(false);

  useEffect(() => {
    loadProductDetails();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [productId]);

  const loadProductDetails = async () => {
    setLoading(true);
    setSelectedImageIdx(0);
    setQuantity(1);
    try {
      const [prodRes, allProdsRes, coupRes] = await Promise.all([
        getPublicProduct(productId).catch(() => ({ data: null })),
        getPublicProducts().catch(() => ({ data: [] })),
        getPublicCoupons().catch(() => ({ data: [] })),
      ]);

      const curProd = prodRes?.data || null;
      setProduct(curProd);
      setCoupons(extractList(coupRes?.data));

      if (curProd) {
        const all = extractList(allProdsRes?.data);
        const related = all
          .filter(
            (p) =>
              p &&
              String(p.id) !== String(curProd.id) &&
              p.category === curProd.category
          )
          .slice(0, 4);
        setRelatedProducts(related);
      }
    } catch (err) {
      console.error("Failed to load product details", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async (targetProduct = product, qty = quantity) => {
    if (!user) {
      setAuthOpen(true);
      return;
    }
    setAddingToCart(true);
    await addItem({
      itemType: "PRODUCT",
      productId: targetProduct.id,
      name: targetProduct.name,
      quantity: qty,
    });
    setAddingToCart(false);
  };

  const isAlreadyInCart = items?.some(
    (i) =>
      (i.itemType === "PRODUCT" || !i.itemType) &&
      (i.productId === product?.id || i.product?.id === product?.id)
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-groomish-cream flex flex-col font-sans">
        <Navbar />
        <div className="flex-1 flex items-center justify-center py-24">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-groomish-orange border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs text-groomish-slate/60 font-semibold">
              Loading salon product details...
            </p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-groomish-cream flex flex-col font-sans">
        <Navbar />
        <div className="flex-1 max-w-lg mx-auto py-24 px-4 text-center">
          <Package className="w-12 h-12 text-groomish-slate/30 mx-auto mb-3" />
          <h2 className="text-xl font-heading font-bold text-groomish-slate">
            Product Not Found
          </h2>
          <p className="text-xs text-groomish-slate/60 mt-1 mb-6">
            The beauty item you are looking for may have been archived or removed from the store catalog.
          </p>
          <Link to="/products" className="btn-primary text-xs px-6 py-2.5 inline-flex items-center gap-2">
            <span>Return to Retail Shop</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const galleryImages =
    product.images && product.images.length > 0
      ? product.images
      : [
          product.image ||
            "https://images.unsplash.com/photo-1608248597359-586616035ec8?auto=format&fit=crop&w=800&q=80",
        ];

  const mainImageUrl = galleryImages[selectedImageIdx] || galleryImages[0];
  const discountPercent =
    product.mrp && product.mrp > product.price
      ? Math.round(((product.mrp - product.price) / product.mrp) * 100)
      : 0;
  const coinsEarned = calculateCoins(product.price);
  const brandName = product.brand || "Groomish Pro";
  const brandInfo = getBrandInfo(brandName);

  return (
    <div className="min-h-screen bg-groomish-cream flex flex-col font-sans">
      <Navbar />

      <main className="flex-1">
        {/* BREADCRUMBS */}
        <div className="bg-white border-b border-groomish-slate/10 py-3">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-2 text-xs text-groomish-slate/60">
            <Link to="/" className="hover:text-groomish-orange flex items-center gap-1">
              <Home className="w-3.5 h-3.5" />
              <span>Home</span>
            </Link>
            <ChevronRight className="w-3 h-3 text-groomish-slate/30" />
            <Link to="/products" className="hover:text-groomish-orange">
              Retail Products
            </Link>
            <ChevronRight className="w-3 h-3 text-groomish-slate/30" />
            <Link
              to={`/products?brand=${encodeURIComponent(brandName)}`}
              className="hover:text-groomish-orange font-medium"
            >
              {brandName}
            </Link>
            {product.category && (
              <>
                <ChevronRight className="w-3 h-3 text-groomish-slate/30" />
                <span className="text-groomish-slate/60">
                  {product.category}
                </span>
              </>
            )}
            <ChevronRight className="w-3 h-3 text-groomish-slate/30" />
            <span className="font-bold text-groomish-slate truncate max-w-[200px]">
              {product.name}
            </span>
          </div>
        </div>

        {/* HERO / PRODUCT DETAILS SECTION */}
        <section className="py-5 sm:py-7 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-12 gap-5 lg:gap-7">
            {/* LEFT / CENTER COLUMN: IMAGERY & DETAILS */}
            <div className="lg:col-span-7 space-y-5">
              {/* Image Preview Card */}
              <div className="relative rounded-3xl overflow-hidden bg-white border border-groomish-slate/10 shadow-soft p-6 sm:p-10 flex flex-col items-center justify-center min-h-[340px] sm:min-h-[460px]">
                <img
                  src={getOptimizedImageUrl(mainImageUrl, { width: 900 })}
                  alt={product.name}
                  loading="eager"
                  decoding="async"
                  className="max-h-[360px] max-w-full object-contain transition-transform duration-500 hover:scale-105"
                />

                {/* Floating Chips */}
                <div className="absolute top-4 left-4 flex gap-2 flex-wrap">
                  <Link
                    to={`/products?brand=${encodeURIComponent(brandName)}`}
                    className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-white/95 text-groomish-slate backdrop-blur-md shadow-sm border border-groomish-slate/10 hover:border-groomish-orange hover:text-groomish-orange transition flex items-center gap-1.5"
                    title={`Browse all ${brandName} products`}
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-groomish-green" />
                    <span>{brandName}</span>
                  </Link>
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-groomish-orange text-white shadow-sm">
                    {product.category || "Professional Care"}
                  </span>
                </div>

                <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-xs font-semibold">
                  <span className="px-3 py-1.5 rounded-full bg-groomish-slateDark/80 text-white backdrop-blur-md flex items-center gap-1.5">
                    <Store className="w-3.5 h-3.5 text-groomish-gold" />
                    <span>In-Store Pickup Available</span>
                  </span>
                  <span className="px-3 py-1.5 rounded-full bg-white/95 text-groomish-green border border-groomish-green/30 backdrop-blur-md flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>100% Genuine</span>
                  </span>
                </div>
              </div>

              {/* Multi-Image Thumbnails Bar */}
              {galleryImages.length > 1 && (
                <div className="flex items-center gap-3 overflow-x-auto py-1 scrollbar-none">
                  {galleryImages.map((img, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedImageIdx(idx)}
                      className={`w-20 h-20 rounded-2xl overflow-hidden border p-1 bg-white transition shrink-0 ${
                        selectedImageIdx === idx
                          ? "border-groomish-orange ring-2 ring-groomish-orange/30 shadow-sm"
                          : "border-groomish-slate/20 hover:border-groomish-slate/40 opacity-70 hover:opacity-100"
                      }`}
                    >
                      <img
                        src={getOptimizedImageUrl(img, { width: 160 })}
                        alt={`${product.name} ${idx + 1}`}
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-contain rounded-xl"
                      />
                    </button>
                  ))}
                </div>
              )}

              {/* Title & Overview Card */}
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-groomish-slate/10 shadow-soft space-y-6">
                <div>
                  <h1 className="text-2xl sm:text-4xl font-heading font-extrabold text-groomish-slate tracking-tight">
                    {product.name}
                  </h1>
                  <p className="text-xs sm:text-sm text-groomish-slate/60 mt-1 flex items-center gap-2">
                    <span>By <strong className="text-groomish-slate">{brandName}</strong></span>
                    <span>•</span>
                    <span>{product.category || "Hair & Skin Care"}</span>
                    {product.volumeOrSize && (
                      <>
                        <span>•</span>
                        <span className="font-mono">{product.volumeOrSize}</span>
                      </>
                    )}
                  </p>
                </div>

                {/* Authentic Brand Card & Quick Link */}
                <div className="p-4 rounded-2xl bg-groomish-cream/70 border border-groomish-slate/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-xl bg-white border border-groomish-slate/15 p-1.5 flex items-center justify-center shrink-0 shadow-xs overflow-hidden">
                      {brandInfo.logo ? (
                        <img
                          src={getOptimizedImageUrl(brandInfo.logo, { width: 96 })}
                          alt={`${brandName} Logo`}
                          className="max-h-full max-w-full object-contain"
                        />
                      ) : (
                        <div
                          className="w-full h-full rounded-lg flex items-center justify-center font-heading font-extrabold text-sm text-white"
                          style={{
                            background: `linear-gradient(135deg, ${brandInfo.accentColor || "#F36A22"}, #1E293B)`,
                          }}
                        >
                          {brandInfo.initials}
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-heading font-extrabold text-sm text-groomish-slate">
                          {brandName}
                        </h4>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-groomish-green/10 text-groomish-green border border-groomish-green/20">
                          <ShieldCheck className="w-3 h-3" />
                          <span>Authorized Brand</span>
                        </span>
                      </div>
                      <p className="text-[11px] text-groomish-slate/60 mt-0.5">
                        {brandInfo.tagline || "Authentic salon formulations backed by manufacturer guarantee."}
                      </p>
                    </div>
                  </div>

                  <Link
                    to={`/products?brand=${encodeURIComponent(brandName)}`}
                    className="btn-secondary text-xs px-3.5 py-2 inline-flex items-center justify-center gap-1.5 shrink-0 self-start sm:self-center hover:bg-groomish-orange hover:text-white hover:border-groomish-orange transition"
                  >
                    <span>View all {brandName}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                {/* Description */}
                <div>
                  <h3 className="font-heading font-bold text-sm text-groomish-slate uppercase tracking-wider mb-2">
                    Product Description
                  </h3>
                  <p className="text-xs sm:text-sm text-groomish-slate/80 leading-relaxed font-normal">
                    {product.description ||
                      "Specially formulated with certified active salon botanicals to deliver intensive nourishment, vitality, and effortless salon grooming. Ideal for daily maintenance between professional treatments."}
                  </p>
                </div>

                {/* What to Expect / Formulation Highlights */}
                <div className="pt-4 border-t border-groomish-slate/10">
                  <h3 className="font-heading font-bold text-sm text-groomish-slate uppercase tracking-wider mb-3">
                    What to Expect from Groomish Products
                  </h3>
                  <div className="grid sm:grid-cols-2 gap-3 text-xs text-groomish-slate">
                    <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-groomish-cream/70">
                      <CheckCircle2 className="w-4 h-4 text-groomish-green shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold block">100% Genuine Certification</span>
                        <span className="text-groomish-slate/60 text-[11px]">Directly sourced from authorized laboratory distributors.</span>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-groomish-cream/70">
                      <CheckCircle2 className="w-4 h-4 text-groomish-green shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold block">Certified Stylist Tested</span>
                        <span className="text-groomish-slate/60 text-[11px]">Tested and recommended by master salon stylists.</span>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-groomish-cream/70">
                      <CheckCircle2 className="w-4 h-4 text-groomish-green shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold block">Ready for In-Store Pickup</span>
                        <span className="text-groomish-slate/60 text-[11px]">Held securely at your salon reception desk.</span>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-groomish-cream/70">
                      <CheckCircle2 className="w-4 h-4 text-groomish-green shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold block">Instant Groom Coin Accrual</span>
                        <span className="text-groomish-slate/60 text-[11px]">Earn Groom Coins automatically on every ₹{config?.spendAmountPerCoin || 100} spent.</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT SIDEBAR: STICKY PRICING & PURCHASE CARD (STICKY UNTIL DETAILS END) */}
            <div className="lg:col-span-5 relative">
              <div className="lg:sticky lg:top-24 space-y-4">
                <div className="bg-white rounded-2xl p-4 sm:p-5.5 border border-groomish-slate/10 shadow-card space-y-4">
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-groomish-slate/50 block mb-1">
                    Product Price & Availability
                  </span>

                  <div className="flex items-baseline gap-3">
                    <span className="text-4xl font-heading font-extrabold text-groomish-slate">
                      ₹{product.price}
                    </span>
                    {product.mrp && product.mrp > product.price && (
                      <>
                        <span className="text-sm font-semibold text-groomish-slate/40 line-through">
                          ₹{product.mrp}
                        </span>
                        <span className="text-xs font-bold text-groomish-green bg-groomish-greenLight px-2.5 py-0.5 rounded-full">
                          {discountPercent}% OFF
                        </span>
                      </>
                    )}
                  </div>
                  <p className="text-[11px] text-groomish-slate/50 mt-1">
                    Inclusive of all taxes & professional salon counter packaging.
                  </p>
                </div>

                {/* Groom Coin Bonus Banner */}
                <div className="p-4 rounded-2xl bg-groomish-goldLight border border-groomish-gold/30 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-groomish-gold/20 flex items-center justify-center shrink-0">
                    <GroomCoinIcon className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-groomish-slate block flex items-center gap-1.5">
                      Earn +{coinsEarned * quantity} Groom Coins
                    </span>
                    <span className="text-[11px] text-groomish-slate/70">
                      Redeem Groom Coins for discounts & complimentary salon treatments.
                    </span>
                  </div>
                </div>

                {/* Quantity Stepper */}
                <div className="p-3.5 rounded-2xl bg-groomish-cream/60 border border-groomish-slate/10 flex items-center justify-between">
                  <span className="text-xs font-bold text-groomish-slate">
                    Select Quantity:
                  </span>
                  <div className="flex items-center gap-3 bg-white p-1 rounded-xl border border-groomish-slate/10 shadow-2xs">
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      disabled={quantity <= 1}
                      className="w-8 h-8 rounded-lg bg-groomish-cream hover:bg-groomish-slate/10 disabled:opacity-40 text-groomish-slate font-extrabold text-sm transition flex items-center justify-center"
                    >
                      -
                    </button>
                    <span className="w-8 text-center font-bold text-sm text-groomish-slate">
                      {quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => q + 1)}
                      className="w-8 h-8 rounded-lg bg-groomish-cream hover:bg-groomish-slate/10 text-groomish-slate font-extrabold text-sm transition flex items-center justify-center"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* CTA Action Buttons */}
                <div className="space-y-2.5">
                  {isAlreadyInCart ? (
                    <>
                      <button
                        type="button"
                        onClick={() => navigate("/cart")}
                        className="btn-auth w-full py-4 text-sm flex items-center justify-center gap-2 shadow-glowOrange cursor-pointer"
                      >
                        <ShoppingCart className="w-4 h-4" />
                        <span>View Cart</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAddToCart(product, quantity)}
                        disabled={addingToCart}
                        className="btn-secondary w-full py-2.5 text-xs flex items-center justify-center gap-2 font-bold text-groomish-slate/75 hover:text-groomish-orange cursor-pointer"
                      >
                        <span>
                          {addingToCart
                            ? "Adding..."
                            : `Add More to Cart (${quantity}) • ₹${product.price * quantity}`}
                        </span>
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => handleAddToCart(product, quantity)}
                        disabled={addingToCart}
                        className="btn-auth w-full py-4 text-sm flex items-center justify-center gap-2 shadow-glowOrange cursor-pointer"
                      >
                        <ShoppingCart className="w-4 h-4" />
                        <span>
                          {addingToCart
                            ? "Adding to Cart..."
                            : `Add Product to Cart • ₹${product.price * quantity}`}
                        </span>
                      </button>
                      {items?.length > 0 && (
                        <button
                          type="button"
                          onClick={() => navigate("/cart")}
                          className="btn-secondary w-full py-3 text-xs flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <span>View Cart & Checkout</span>
                          <ArrowRight className="w-3.5 h-3.5 text-groomish-orange" />
                        </button>
                      )}
                    </>
                  )}
                </div>

                {/* Trust Points */}
                <div className="space-y-2.5 pt-2 text-xs text-groomish-slate/70">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-groomish-green shrink-0" />
                    <span>100% Genuine certified formula</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Store className="w-4 h-4 text-groomish-orange shrink-0" />
                    <span>Pickup available across all salon branches</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-groomish-blue shrink-0" />
                    <span>Pay online (UPI / Card) or pay at reception counter</span>
                  </div>
                </div>

                {/* Concierge Support Contact */}
                <div className="pt-4 border-t border-groomish-slate/10 text-center text-xs text-groomish-slate/60">
                  <span>Questions about this beauty product?</span>
                  <p className="font-bold text-groomish-orange mt-0.5 flex items-center justify-center gap-1.5">
                    <PhoneCall className="w-3.5 h-3.5" />
                    <span>Call Salon Concierge: +91 90000 80000</span>
                  </p>
                </div>
              </div>

              {/* AVAILABLE OFFERS & PROMOTIONAL COUPONS (RIGHT SIDEBAR BELOW PURCHASE CARD) */}
              {(coupons.length > 0 || coinsEarned > 0) && (
                <div className="bg-white rounded-3xl p-5 sm:p-6 border border-groomish-slate/10 shadow-card space-y-4">
                  <div className="flex items-center justify-between border-b border-groomish-slate/10 pb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-xl bg-groomish-orangeLight text-groomish-orange flex items-center justify-center shrink-0">
                        <Tag className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <h3 className="font-heading font-extrabold text-sm text-groomish-slate">
                          Available Offers & Promotional Coupons
                        </h3>
                        <p className="text-[11px] text-groomish-slate/60">
                          Redeemable during cart checkout on {product.category || "retail"} products
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-extrabold text-groomish-orange bg-groomish-orangeLight px-2.5 py-0.5 rounded-full shrink-0">
                      {coupons.length + (coinsEarned > 0 ? 1 : 0)} Active
                    </span>
                  </div>

                  {/* EXTRA GROOM COINS OFFER - ONE LINE */}
                  {coinsEarned > 0 && (
                    <div className="p-3 px-3.5 rounded-2xl bg-gradient-to-r from-amber-500/15 via-amber-400/20 to-amber-500/10 border border-amber-300/80 flex items-center justify-between gap-2.5 text-xs shadow-2xs">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-6 h-6 rounded-lg bg-amber-500/25 text-amber-800 flex items-center justify-center shrink-0 border border-amber-400/40">
                          <GroomCoinIcon className="w-3.5 h-3.5" />
                        </div>
                        <span className="font-extrabold text-groomish-slate truncate text-xs">
                          <span className="text-amber-800 uppercase font-black tracking-wider text-[10px] mr-1">Coin Offer:</span>
                          <span>Earn +{coinsEarned} Groom Coins on this product purchase!</span>
                        </span>
                      </div>
                      <span className="text-[10px] font-bold text-amber-800 bg-amber-200/80 px-2 py-0.5 rounded-full shrink-0">
                        VIP Loyalty
                      </span>
                    </div>
                  )}

                  {/* PROMOTIONAL COUPONS - 2 LINES PER COUPON, NO COPY BUTTON */}
                  {coupons.length > 0 && (
                    <div className="space-y-2.5 pt-0.5">
                      {(showAllOffers ? coupons : coupons.slice(0, 3)).map((coupon) => (
                        <div
                          key={coupon.id}
                          className="bg-white rounded-2xl border border-groomish-slate/15 hover:border-groomish-orange/50 transition-all shadow-2xs p-3.5 space-y-2 group"
                        >
                          {/* LINE 1: Discount & Min order on left, Promo Code on right (NO COPY BUTTON) */}
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs sm:text-sm font-black text-groomish-green tracking-tight whitespace-nowrap">
                                FLAT ₹{coupon.discount} OFF
                              </span>
                              <span className="text-[10px] sm:text-[11px] font-semibold text-groomish-slate/60 bg-groomish-cream px-2 py-0.5 rounded-md border border-groomish-slate/10 whitespace-nowrap">
                                Min. order: ₹{coupon.minAmount || 0}
                              </span>
                            </div>

                            <span
                              className="font-mono text-xs font-black tracking-wider text-groomish-orange bg-groomish-orangeLight/80 px-2.5 py-1 rounded-lg border border-groomish-orange/30 shrink-0"
                              title={coupon.code}
                            >
                              {coupon.code}
                            </span>
                          </div>

                          {/* LINE 2: Offer Description */}
                          <p className="text-xs text-groomish-slate/75 font-medium leading-relaxed">
                            {coupon.description || "Valid on selected salon retail products at checkout"}
                          </p>
                        </div>
                      ))}

                      {/* View More Offers Toggle */}
                      {coupons.length > 3 && (
                        <div className="pt-1 text-center">
                          <button
                            type="button"
                            onClick={() => setShowAllOffers((prev) => !prev)}
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-groomish-orange bg-groomish-orangeLight/80 hover:bg-groomish-orange hover:text-white border border-groomish-orange/30 transition shadow-2xs cursor-pointer active:scale-95"
                          >
                            <span>{showAllOffers ? "Show Less Offers" : `View More Offers (+${coupons.length - 3} more)`}</span>
                            <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${showAllOffers ? "rotate-180" : ""}`} />
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

        {/* RELATED PRODUCTS SECTION */}
        {relatedProducts.length > 0 && (
          <section className="py-8 bg-white border-t border-groomish-slate/10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-groomish-orange">
                    More From {product.category}
                  </span>
                  <h2 className="text-xl sm:text-2xl font-heading font-extrabold text-groomish-slate mt-0.5">
                    Recommended Salon Companions
                  </h2>
                </div>
                <Link
                  to="/products"
                  className="text-xs font-bold text-groomish-orange hover:underline flex items-center gap-1"
                >
                  <span>Explore Shop</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {relatedProducts.map((rel) => {
                  const relCoins = calculateCoins ? calculateCoins(rel.price) : Math.max(1, Math.round(rel.price / 100));
                  return (
                    <div
                      key={rel.id}
                      className="card-groomish flex flex-col justify-between overflow-hidden group hover:border-groomish-orange/40 hover:-translate-y-1 transition duration-300"
                    >
                      <div>
                        {/* Image: Clickable to product detail */}
                        <div
                          onClick={() => navigate(`/products/${rel.id}`)}
                          className="relative h-48 overflow-hidden bg-white flex items-center justify-center p-4 cursor-pointer"
                        >
                          <img
                            src={
                              rel.image ||
                              "https://images.unsplash.com/photo-1608248597359-586616035ec8?auto=format&fit=crop&w=600&q=80"
                            }
                            alt={rel.name}
                            className="max-h-full max-w-full object-contain transition-transform duration-500 group-hover:scale-105"
                          />
                          <span className="absolute top-3 left-3 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-white/95 text-groomish-slate shadow-xs border border-groomish-slate/10">
                            {rel.brand || "Groomish Pro"}
                          </span>
                        </div>

                        {/* Title: Clickable to product detail */}
                        <div className="p-4 space-y-1.5">
                          <h4
                            onClick={() => navigate(`/products/${rel.id}`)}
                            className="font-heading font-bold text-sm text-groomish-slate group-hover:text-groomish-orange transition-colors line-clamp-1 cursor-pointer"
                          >
                            {rel.name}
                          </h4>
                          <p className="text-[11px] text-groomish-slate/60 line-clamp-2">
                            {rel.description || "Signature beauty formula."}
                          </p>
                          <div className="pt-1 flex items-center gap-1.5 text-[10px] font-bold text-groomish-orange">
                            <GroomCoinIcon className="w-3 h-3 shrink-0" />
                            <span>Earn +{relCoins} Groom Coin{relCoins !== 1 ? "s" : ""}</span>
                          </div>
                        </div>
                      </div>

                      <div className="p-4 pt-0 border-t border-groomish-slate/10 mt-2 flex items-center justify-between">
                        <span className="text-base font-extrabold text-groomish-slate">
                          ₹{rel.price}
                        </span>
                        {items?.some(
                          (i) =>
                            (i.itemType === "PRODUCT" || !i.itemType) &&
                            (i.productId === rel.id || i.product?.id === rel.id)
                        ) ? (
                          <button
                            type="button"
                            onClick={() => navigate("/cart")}
                            className="btn-secondary text-xs px-2.5 py-1.5 flex items-center gap-1 bg-groomish-orangeLight/60 text-groomish-orange font-bold border border-groomish-orange/40 hover:bg-groomish-orange hover:text-white transition shadow-2xs"
                          >
                            <ShoppingCart className="w-3 h-3" />
                            <span>View Cart</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleAddToCart(rel, 1)}
                            className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1 shadow-xs"
                          >
                            <ShoppingCart className="w-3 h-3" />
                            <span>Add</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        )}
      </main>

      <Footer />

      {/* Auth Modal for Unauthenticated Add to Cart */}
      <AuthModal
        open={authOpen}
        onClose={() => setAuthOpen(false)}
        defaultMode="login"
        onSuccess={() => {
          setAuthOpen(false);
          handleAddToCart(product, quantity);
        }}
      />
    </div>
  );
}
