import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import AuthModal from "../../components/modals/AuthModal";
import { getPublicProduct, getPublicProducts } from "../../api/products";
import { getPublicCoupons } from "../../api/public";
import { useAuth } from "../../context/useAuth";
import { useCart } from "../../context/CartContext";
import { extractList } from "../../utils/dataHelper";
import {
  ShoppingCart,
  Sparkles,
  ArrowRight,
  ChevronRight,
  Home,
  ShieldCheck,
  Store,
  Check,
  Tag,
  Copy,
  Clock,
  Package,
  CheckCircle2,
  Star,
  Info,
  PhoneCall,
} from "lucide-react";

export default function ProductDetailPage() {
  const { productId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addItem, items } = useCart();

  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [copiedCode, setCopiedCode] = useState("");
  const [selectedImageIdx, setSelectedImageIdx] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);
  const [loading, setLoading] = useState(true);
  const [authOpen, setAuthOpen] = useState(false);

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

  const handleCopyCode = (code) => {
    navigator.clipboard?.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(""), 2500);
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

  const isAlreadyInCart = items.some((i) => i.productId === product?.id);

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
  const pointsEarned = Math.floor(product.price / 100);

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
        <section className="py-8 sm:py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-12 gap-8 lg:gap-12 items-start">
            {/* LEFT / CENTER COLUMN: IMAGERY & DETAILS */}
            <div className="lg:col-span-7 space-y-8">
              {/* Image Preview Card */}
              <div className="relative rounded-3xl overflow-hidden bg-white border border-groomish-slate/10 shadow-soft p-6 sm:p-10 flex flex-col items-center justify-center min-h-[340px] sm:min-h-[460px]">
                <img
                  src={mainImageUrl}
                  alt={product.name}
                  className="max-h-[360px] max-w-full object-contain transition-transform duration-500 hover:scale-105"
                />

                {/* Floating Chips */}
                <div className="absolute top-4 left-4 flex gap-2 flex-wrap">
                  <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-white/95 text-groomish-slate backdrop-blur-md shadow-sm border border-groomish-slate/10">
                    {product.brand || "Groomish Pro"}
                  </span>
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
                        src={img}
                        alt={`${product.name} ${idx + 1}`}
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
                    <span>By <strong className="text-groomish-slate">{product.brand || "Groomish Pro"}</strong></span>
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
                        <span className="font-bold block">Instant Loyalty Points Accrual</span>
                        <span className="text-groomish-slate/60 text-[11px]">Earn +1 VIP Point on every ₹100 spent automatically.</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* AVAILABLE OFFERS & PROMOTIONAL COUPONS */}
              {coupons.length > 0 && (
                <div className="bg-gradient-to-br from-white to-groomish-cream/40 rounded-3xl p-6 sm:p-8 border border-groomish-orange/20 shadow-soft space-y-5">
                  <div className="flex items-center justify-between border-b border-groomish-slate/10 pb-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-groomish-orangeLight text-groomish-orange flex items-center justify-center">
                        <Tag className="w-4 h-4" />
                      </div>
                      <div>
                        <h2 className="font-heading font-extrabold text-base sm:text-lg text-groomish-slate">
                          Available Offers & Promotional Coupons
                        </h2>
                        <p className="text-[11px] text-groomish-slate/60">
                          Redeemable during cart checkout on {product.category || "retail"} products
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-extrabold text-groomish-orange bg-groomish-orangeLight px-2.5 py-1 rounded-full">
                      {coupons.length} Offers Active
                    </span>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-3.5">
                    {coupons.map((coupon) => (
                      <div
                        key={coupon.id}
                        className="p-4 rounded-2xl bg-white border border-groomish-slate/15 hover:border-groomish-orange transition-all shadow-sm space-y-2.5 flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-mono text-xs font-extrabold tracking-wider bg-groomish-cream text-groomish-orange px-2.5 py-1 rounded-lg border border-groomish-orange/20">
                              {coupon.code}
                            </span>
                            <span className="text-xs font-black text-groomish-green">
                              FLAT ₹{coupon.discount} OFF
                            </span>
                          </div>

                          <p className="text-xs text-groomish-slate/80 mt-2 leading-relaxed font-medium">
                            {coupon.description}
                          </p>
                        </div>

                        <div className="pt-2 border-t border-groomish-slate/10 flex items-center justify-between">
                          <span className="text-[11px] text-groomish-slate/50">
                            Min Order: ₹{coupon.minAmount || 0}
                          </span>

                          <button
                            type="button"
                            onClick={() => handleCopyCode(coupon.code)}
                            className="px-3 py-1.5 rounded-xl bg-groomish-orange hover:bg-groomish-orangeDark text-white font-bold text-[11px] flex items-center gap-1.5 transition-all shadow-xs"
                          >
                            {copiedCode === coupon.code ? (
                              <>
                                <Check className="w-3.5 h-3.5" />
                                <span>Copied</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                <span>Copy Code</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* RIGHT SIDEBAR: STICKY PRICING & PURCHASE CARD */}
            <div className="lg:col-span-5 lg:sticky lg:top-24 space-y-5">
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-groomish-slate/10 shadow-card space-y-6">
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

                {/* Loyalty Bonus Banner */}
                <div className="p-4 rounded-2xl bg-groomish-goldLight border border-groomish-gold/30 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-groomish-gold text-groomish-slate flex items-center justify-center shrink-0">
                    <Sparkles className="w-5 h-5 text-groomish-slate fill-current" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-groomish-slate block">
                      Earn +{pointsEarned * quantity} Loyalty Points
                    </span>
                    <span className="text-[11px] text-groomish-slate/70">
                      Redeem points for discounts & complimentary treatments.
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
                  <button
                    type="button"
                    onClick={() => handleAddToCart(product, quantity)}
                    disabled={addingToCart}
                    className="btn-auth w-full py-4 text-sm flex items-center justify-center gap-2 shadow-glowOrange"
                  >
                    <ShoppingCart className="w-4 h-4" />
                    <span>
                      {addingToCart
                        ? "Adding to Cart..."
                        : isAlreadyInCart
                        ? `Add More to Cart (${quantity}) • ₹${product.price * quantity}`
                        : `Add Product to Cart • ₹${product.price * quantity}`}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => navigate("/cart")}
                    className="btn-secondary w-full py-3 text-xs flex items-center justify-center gap-2"
                  >
                    <span>View Cart & Checkout</span>
                    <ArrowRight className="w-3.5 h-3.5 text-groomish-orange" />
                  </button>
                </div>

                {/* Trust Points */}
                <div className="space-y-2.5 pt-2 text-xs text-groomish-slate/70">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-groomish-green shrink-0" />
                    <span>100% Genuine certified formula</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Store className="w-4 h-4 text-groomish-orange shrink-0" />
                    <span>Pickup available across all Bangalore salon branches</span>
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
                    <span>Call Salon Concierge: +91 98765 43210</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* RELATED PRODUCTS SECTION */}
        {relatedProducts.length > 0 && (
          <section className="py-12 bg-white border-t border-groomish-slate/10">
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
                  const relPoints = Math.floor(rel.price / 100);
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
                          <div className="pt-1 flex items-center gap-1 text-[10px] font-bold text-groomish-orange">
                            <Sparkles className="w-3 h-3" />
                            <span>Earn +{relPoints} pts</span>
                          </div>
                        </div>
                      </div>

                      <div className="p-4 pt-0 border-t border-groomish-slate/10 mt-2 flex items-center justify-between">
                        <span className="text-base font-extrabold text-groomish-slate">
                          ₹{rel.price}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleAddToCart(rel, 1)}
                          className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1 shadow-xs"
                        >
                          <ShoppingCart className="w-3 h-3" />
                          <span>Add</span>
                        </button>
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
