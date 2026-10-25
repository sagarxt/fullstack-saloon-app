import { useState, useEffect, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import CustomSelect from "../../components/common/CustomSelect";
import GroomCoinIcon from "../../components/common/GroomCoinIcon";
import { useGroomCoin } from "../../context/GroomCoinContext";
import { useCart } from "../../context/CartContext";
import { useAuth } from "../../context/useAuth";
import { useStore } from "../../context/StoreContext";
import { useToast } from "../../context/ToastProvider";
import { useConfirm } from "../../context/ConfirmContext";
import { storeApi } from "../../api/store";
import { getPublicServicesApi } from "../../api/service";
import { extractList, formatServiceName } from "../../utils/dataHelper";
import { getOptimizedImageUrl } from "../../utils/imageHelper";
import ModalWrapper from "../../components/modals/ModalWrapper";
import {
  ShoppingCart,
  Scissors,
  Package,
  Plus,
  Minus,
  Trash2,
  ArrowRight,
  ShieldCheck,
  Clock,
  Sparkles,
  Store,
  ChevronRight,
  Home,
  CheckCircle2,
  AlertCircle,
  Tag,
  Loader2,
  Search,
  X,
  RefreshCw,
} from "lucide-react";

export default function CartPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { stores, selectedStore, selectStore } = useStore();
  const { showToast } = useToast();
  const { confirm } = useConfirm();
  const {
    cart,
    loading,
    cartCount,
    items,
    servicesCount,
    productsCount,
    totalAmount,
    addItem,
    updateQuantity,
    removeItem,
    clearCart,
    updateStore,
  } = useCart();
  const { calculateCoins } = useGroomCoin();

  const [notesState, setNotesState] = useState({});
  const [checkingBranch, setCheckingBranch] = useState(false);
  const [unavailableItemsMap, setUnavailableItemsMap] = useState({});

  // Add Service Modal State
  const [addServiceModalOpen, setAddServiceModalOpen] = useState(false);
  const [availableServices, setAvailableServices] = useState([]);
  const [serviceLoading, setServiceLoading] = useState(false);
  const [serviceSearchQuery, setServiceSearchQuery] = useState("");
  const [selectedServiceCategory, setSelectedServiceCategory] = useState("ALL");
  const [addingServiceId, setAddingServiceId] = useState(null);
  const [selectedSubServiceByServiceId, setSelectedSubServiceByServiceId] = useState({});

  const loadAvailableServices = async () => {
    setServiceLoading(true);
    try {
      let list = [];
      const currentStoreId = cart?.storeId || selectedStore?.id;
      if (currentStoreId) {
        try {
          const res = await storeApi.getStoreServices(currentStoreId);
          list = extractList(res.data);
        } catch (e) {
          // fallback to public
        }
      }
      if (!list || list.length === 0) {
        const res = await getPublicServicesApi();
        list = extractList(res.data);
      }
      const normalized = (list || []).map((s) => ({
        ...s,
        id: s.serviceId || s.id,
        serviceId: s.serviceId || s.id,
      }));
      setAvailableServices(normalized);
    } catch (err) {
      console.error(err);
      setAvailableServices([]);
    } finally {
      setServiceLoading(false);
    }
  };

  const handleOpenAddServiceModal = () => {
    setServiceSearchQuery("");
    setSelectedServiceCategory("ALL");
    setAddServiceModalOpen(true);
    loadAvailableServices();
  };

  const handleAddServiceToCart = async (srv) => {
    setAddingServiceId(srv.id);
    try {
      const activeSub =
        selectedSubServiceByServiceId[srv.id] ||
        (srv.subServices && srv.subServices.length > 0 ? srv.subServices[0] : null);

      const ok = await addItem({
        itemType: "SERVICE",
        serviceId: srv.id,
        quantity: 1,
        name: srv.name,
        subServiceName: activeSub ? activeSub.name : null,
        subServicePrice: activeSub ? activeSub.price : null,
        subServiceDuration: activeSub ? activeSub.durationMinutes : null,
      });
      if (ok !== false) {
        showToast(
          `Added ${srv.name}${activeSub ? ` (${activeSub.name})` : ""} to cart!`,
          "success"
        );
      }
    } catch (e) {
      console.error(e);
      showToast("Failed to add service to cart", "error");
    } finally {
      setAddingServiceId(null);
    }
  };

  const serviceCategories = [
    "ALL",
    ...Array.from(new Set(availableServices.map((s) => s.categoryName).filter(Boolean))),
  ];

  const filteredServices = availableServices.filter((s) => {
    if (selectedServiceCategory !== "ALL" && s.categoryName !== selectedServiceCategory) {
      return false;
    }
    if (!serviceSearchQuery.trim()) return true;
    const q = serviceSearchQuery.toLowerCase();
    return (
      (s.name && s.name.toLowerCase().includes(q)) ||
      (s.categoryName && s.categoryName.toLowerCase().includes(q)) ||
      (s.description && s.description.toLowerCase().includes(q))
    );
  });

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const serviceItems = items.filter((i) => i.itemType === "SERVICE");
  const productItems = items.filter((i) => i.itemType === "PRODUCT");

  const totalDuration = serviceItems.reduce(
    (acc, item) => acc + (item.serviceDurationMinutes || 0) * (item.quantity || 1),
    0
  );

  const estimatedPoints = calculateCoins(totalAmount);

  const handleStoreChange = async (targetStoreId) => {
    if (!targetStoreId || targetStoreId === cart?.storeId) return;

    const targetStore = stores.find((s) => s.id === targetStoreId);

    // If cart has no items, directly switch
    if (items.length === 0) {
      await updateStore(targetStoreId);
      if (targetStore) selectStore(targetStore);
      return;
    }

    setCheckingBranch(true);
    try {
      const [servicesRes, productsRes] = await Promise.all([
        storeApi.getStoreServices(targetStoreId).catch(() => ({ data: [] })),
        storeApi.getStoreProducts(targetStoreId).catch(() => ({ data: [] })),
      ]);

      const branchServices = Array.isArray(servicesRes.data) ? servicesRes.data : [];
      const branchProducts = Array.isArray(productsRes.data) ? productsRes.data : [];

      const unavailable = [];
      const newUnavailableMap = {};

      for (const item of items) {
        if (item.itemType === "SERVICE") {
          const s = branchServices.find((b) => b.serviceId === item.serviceId);
          const isAvailable = s && s.effectiveActive !== false && s.storeActive !== false && s.globalActive !== false;
          if (!isAvailable) {
            const reason = "Not offered at this branch";
            unavailable.push({ ...item, reason });
            newUnavailableMap[item.id] = { reason, isOutOfStock: false };
          }
        } else if (item.itemType === "PRODUCT") {
          const p = branchProducts.find((b) => b.productId === item.productId);
          const isOutOfStock = !p || p.outOfStock || (p.stockQuantity !== null && p.stockQuantity <= 0);
          const isInsufficient = p && p.stockQuantity !== null && p.stockQuantity < (item.quantity || 1);
          const isAvailable = p && p.effectiveActive !== false && !isOutOfStock && !isInsufficient;
          if (!isAvailable) {
            const reason = isOutOfStock
              ? "Out of stock at this branch"
              : isInsufficient
                ? `Only ${p.stockQuantity} in stock at this branch`
                : "Not carried at this branch";
            unavailable.push({ ...item, reason });
            newUnavailableMap[item.id] = { reason, isOutOfStock: true };
          }
        }
      }

      if (unavailable.length > 0) {
        setUnavailableItemsMap(newUnavailableMap);

        const listText = unavailable
          .map((i) => `• ${i.serviceName || i.productName} (${i.reason})`)
          .join("\n");

        const targetName = targetStore?.name || "this branch";

        const confirmed = await confirm({
          title: "Unavailable Items at Selected Branch",
          message: `The following item(s) in your cart are not available at ${targetName}:\n\n${listText}\n\nWould you like to remove these unavailable items from your cart and switch to ${targetName}?`,
          confirmText: "Remove Items & Switch Branch",
          cancelText: "Keep Current Branch",
          variant: "warning",
        });

        if (confirmed) {
          for (const item of unavailable) {
            await removeItem(item.id, item.serviceName || item.productName);
          }
          await updateStore(targetStoreId);
          if (targetStore) selectStore(targetStore);
          setUnavailableItemsMap({});
          showToast(`Switched to ${targetName}. Unavailable items removed.`, "success");
        } else {
          setUnavailableItemsMap({});
          showToast(`Branch not changed. Kept current branch items.`, "info");
        }
      } else {
        setUnavailableItemsMap({});
        await updateStore(targetStoreId);
        if (targetStore) selectStore(targetStore);
        showToast(`Assigned branch changed to ${targetStore?.name || "selected branch"}`, "success");
      }
    } catch (err) {
      console.error("Failed to check branch catalog in CartPage:", err);
      showToast("Unable to check branch catalog availability", "error");
    } finally {
      setCheckingBranch(false);
    }
  };

  const handleQuantityDelta = async (item, delta) => {
    const nextQty = (item.quantity || 1) + delta;
    if (nextQty <= 0) {
      await removeItem(item.id, item.serviceName || item.productName || "Item");
    } else {
      await updateQuantity(item.id, nextQty, item.customNotes);
    }
  };

  const handleNoteBlur = async (item) => {
    const note = notesState[item.id];
    if (note !== undefined && note !== item.customNotes) {
      await updateQuantity(item.id, item.quantity, note);
    }
  };

  const totalMrp = useMemo(() => {
    return (items || []).reduce((sum, item) => {
      const unit = Number(item.unitPrice || item.price || 0);
      const rawMrp = Number(item.subServiceMrp || item.mrp || item.serviceMrp || item.productMrp || 0);
      const itemMrp = Math.max(rawMrp, unit);
      return sum + (itemMrp * (item.quantity || 1));
    }, 0);
  }, [items]);
  const totalSavings = Math.max(0, totalMrp - totalAmount);

  return (
    <div className="min-h-screen bg-groomish-cream flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 pb-8">
        {/* BREADCRUMB */}
        <div className="bg-white border-b border-groomish-slate/10 py-2.5">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-2 text-xs text-groomish-slate/60">
            <Link to="/" className="hover:text-groomish-orange flex items-center gap-1">
              <Home className="w-3.5 h-3.5" />
              <span>Home</span>
            </Link>
            <ChevronRight className="w-3 h-3 text-groomish-slate/30" />
            <span className="font-bold text-groomish-slate">Shopping Cart</span>
          </div>
        </div>

        {/* HEADER */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-5 pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-groomish-orange text-white flex items-center justify-center shadow-sm">
                  <ShoppingCart className="w-5 h-5" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-heading font-extrabold text-groomish-slate tracking-tight">
                    Your Salon Cart
                  </h1>
                  <p className="text-xs text-groomish-slate/60 mt-0.5">
                    Persistent database cart • Services and retail products ready for checkout
                  </p>
                </div>
              </div>
            </div>

            {items.length > 0 && (
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={clearCart}
                  className="text-xs font-semibold text-groomish-crimson hover:text-groomish-crimsonDark flex items-center gap-1.5 px-3 py-1.5 rounded-full hover:bg-groomish-crimson/10 transition"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear Entire Cart</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* CONTENT */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
          {items.length === 0 ? (
            /* EMPTY CART STATE */
            <div className="bg-white rounded-3xl p-10 sm:p-16 border border-groomish-slate/10 shadow-soft text-center max-w-2xl mx-auto my-8">
              <div className="w-20 h-20 rounded-full bg-groomish-cream flex items-center justify-center mx-auto mb-5 text-groomish-slate/30">
                <ShoppingCart className="w-10 h-10" />
              </div>
              <h2 className="text-xl sm:text-2xl font-heading font-extrabold text-groomish-slate">
                Your cart is currently empty
              </h2>
              <p className="text-xs sm:text-sm text-groomish-slate/60 max-w-md mx-auto mt-2 leading-relaxed">
                Explore our signature salon treatments or browse retail haircare and skincare essentials. Items you add will be securely saved to your account.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-8">
                <button
                  onClick={() => navigate("/services")}
                  className="btn-primary w-full sm:w-auto text-xs px-6 py-3 flex items-center justify-center gap-2 shadow-glowOrange"
                >
                  <Scissors className="w-4 h-4" />
                  <span>Explore Salon Services</span>
                </button>
                <button
                  onClick={() => navigate("/products")}
                  className="btn-secondary w-full sm:w-auto text-xs px-6 py-3 flex items-center justify-center gap-2"
                >
                  <Package className="w-4 h-4" />
                  <span>Shop Retail Products</span>
                </button>
              </div>
            </div>
          ) : (
            /* ACTIVE CART GRID */
            <div className="grid lg:grid-cols-12 gap-5 items-start">
              {/* LEFT COLUMN: ITEMS & STORE */}
              <div className="lg:col-span-8 space-y-4">
                {/* SALON BRANCH SELECTION */}
                <div className="bg-white rounded-3xl p-5 border border-groomish-slate/10 shadow-soft flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-groomish-cream text-groomish-orange flex items-center justify-center shrink-0">
                      <Store className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-groomish-slate/50 block">
                        Assigned Salon Branch
                      </span>
                      <span className="text-xs font-extrabold text-groomish-slate">
                        {cart?.storeName || "Select Salon Location"}
                      </span>
                      {cart?.storeAddress && (
                        <p className="text-[11px] text-groomish-slate/60 truncate max-w-sm">
                          {cart.storeAddress}
                        </p>
                      )}
                    </div>
                  </div>

                  {stores && stores.length > 0 && (
                    <div className="w-full sm:w-64 space-y-1">
                      {checkingBranch && (
                        <div className="flex items-center gap-1.5 text-[10px] text-groomish-orange font-bold">
                          <Loader2 className="w-3 h-3 animate-spin" />
                          <span>Checking branch availability...</span>
                        </div>
                      )}
                      <CustomSelect
                        value={cart?.storeId || selectedStore?.id || ""}
                        onChange={(e) => handleStoreChange(e.target.value)}
                        disabled={checkingBranch}
                        className="py-1.5 text-xs bg-groomish-cream rounded-xl border-transparent"
                        options={stores.map((s) => ({
                          value: s.id,
                          label: `${s.name} (${s.city})`,
                        }))}
                      />
                    </div>
                  )}
                </div>

                {/* SECTION 1: SALON SERVICES */}
                {serviceItems.length > 0 && (
                  <div className="bg-white rounded-3xl p-6 border border-groomish-slate/10 shadow-soft space-y-4">
                    <div className="flex items-center justify-between border-b border-groomish-slate/10 pb-3 flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <Scissors className="w-4 h-4 text-groomish-orange" />
                        <h2 className="font-heading font-extrabold text-sm sm:text-base text-groomish-slate">
                          Salon Services & Treatments ({serviceItems.length})
                        </h2>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-[11px] font-bold text-groomish-slate/50">
                          {totalDuration} mins estimated
                        </span>
                        <button
                          type="button"
                          onClick={handleOpenAddServiceModal}
                          className="inline-flex items-center gap-1 text-xs font-bold text-groomish-orange bg-groomish-orangeLight hover:bg-groomish-orange hover:text-white px-2.5 py-1 rounded-xl transition shadow-xs"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add Service</span>
                        </button>
                      </div>
                    </div>

                    <div className="divide-y divide-groomish-slate/10">
                      {serviceItems.map((item) => {
                        const unavailableInfo = unavailableItemsMap[item.id];
                        return (
                          <div
                            key={item.id}
                            className={`py-4 first:pt-0 last:pb-0 space-y-3 rounded-2xl transition ${unavailableInfo ? "bg-red-50/70 p-3 border border-red-200" : ""
                              }`}
                          >
                            <div className="flex items-start gap-4 justify-between">
                              <div className="flex items-start gap-3.5 min-w-0">
                                <div className="w-16 h-16 rounded-2xl bg-groomish-cream overflow-hidden border border-groomish-slate/10 shrink-0">
                                  <img
                                    src={getOptimizedImageUrl(
                                      item.serviceImage || "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=300&q=80",
                                      { width: 200 }
                                    )}
                                    alt={item.serviceName}
                                    loading="lazy"
                                    decoding="async"
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-groomish-cream text-groomish-slate">
                                      {item.serviceGender || "UNISEX"}
                                    </span>
                                    {item.serviceCategoryName && (
                                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-groomish-orangeLight text-groomish-orange">
                                        {item.serviceCategoryName}
                                      </span>
                                    )}
                                    {unavailableInfo && (
                                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-red-100 text-groomish-crimson border border-red-200">
                                        {unavailableInfo.reason}
                                      </span>
                                    )}
                                  </div>
                                  <h3 className={`font-heading font-bold text-sm text-groomish-slate mt-1 truncate ${unavailableInfo ? "line-through text-groomish-crimson" : ""}`}>
                                    {formatServiceName(item.serviceName, item.subServiceName)}
                                  </h3>
                                  {item.subServiceName && (
                                    <div className="inline-flex items-center gap-1.5 px-2 py-0.5 mt-0.5 rounded-md bg-amber-50 text-amber-800 text-[11px] font-semibold border border-amber-200/60">
                                      <span>Option: {item.subServiceName}</span>
                                      {item.subServiceDuration && (
                                        <span className="text-[10px] text-amber-600/80">• {item.subServiceDuration}m</span>
                                      )}
                                    </div>
                                  )}
                                  <div className="flex items-center gap-2 text-[11px] text-groomish-slate/60 mt-0.5">
                                    <Clock className="w-3 h-3 text-groomish-gold" />
                                    <span>{item.subServiceDuration || item.serviceDurationMinutes || 30} mins per treatment</span>
                                  </div>
                                </div>
                              </div>

                              {/* Price */}
                              <div className="text-right shrink-0">
                                <span className={`text-base font-extrabold block ${unavailableInfo ? "text-groomish-crimson text-xs" : "text-groomish-slate"}`}>
                                  {unavailableInfo ? "Unavailable" : `₹${item.totalPrice}`}
                                </span>
                                {(item.mrp || item.serviceMrp) && (item.mrp || item.serviceMrp) > item.unitPrice && !unavailableInfo && (
                                  <span className="text-[11px] text-groomish-slate/40 line-through block">
                                    ₹{(item.mrp || item.serviceMrp) * item.quantity}
                                  </span>
                                )}
                                {item.quantity > 1 && !unavailableInfo && (
                                  <span className="text-[11px] text-groomish-slate/40 block">
                                    ₹{item.unitPrice} each
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Controls Bar */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                              {/* Quantity Controls */}
                              <div className="flex items-center gap-2">
                                <span className="text-[11px] font-semibold text-groomish-slate/60">Qty:</span>
                                <div className="flex items-center border border-groomish-slate/20 rounded-full bg-groomish-cream p-0.5">
                                  <button
                                    type="button"
                                    onClick={() => handleQuantityDelta(item, -1)}
                                    className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-white text-groomish-slate transition"
                                  >
                                    <Minus className="w-3 h-3" />
                                  </button>
                                  <span className={`w-7 text-center text-xs font-extrabold ${unavailableInfo ? "text-groomish-crimson" : "text-groomish-slate"}`}>
                                    {unavailableInfo ? "0" : item.quantity}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => handleQuantityDelta(item, 1)}
                                    className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-white text-groomish-slate transition"
                                  >
                                    <Plus className="w-3 h-3" />
                                  </button>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => removeItem(item.id, item.serviceName)}
                                  className="p-1.5 rounded-full hover:bg-groomish-crimson/10 text-groomish-slate/40 hover:text-groomish-crimson transition ml-1"
                                  title="Remove service"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>

                              {/* Note input */}
                              <div className="flex-1 sm:max-w-xs">
                                <input
                                  type="text"
                                  placeholder="Add preference note (e.g. low fade, sensitive skin)..."
                                  value={notesState[item.id] !== undefined ? notesState[item.id] : (item.customNotes || "")}
                                  onChange={(e) => setNotesState({ ...notesState, [item.id]: e.target.value })}
                                  onBlur={() => handleNoteBlur(item)}
                                  className="w-full px-3 py-1 text-xs rounded-xl bg-groomish-cream border border-transparent focus:border-groomish-orange focus:bg-white outline-none transition placeholder:text-groomish-slate/40"
                                />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {serviceItems.length === 0 && (
                  <div className="bg-white/80 border border-dashed border-groomish-orange/40 rounded-3xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-groomish-orangeLight text-groomish-orange flex items-center justify-center shrink-0">
                        <Scissors className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-heading font-bold text-sm text-groomish-slate">
                          No salon treatments in your cart yet
                        </h3>
                        <p className="text-xs text-groomish-slate/60">
                          Add a haircut, facial, beard trim or spa treatment to your appointment
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleOpenAddServiceModal}
                      className="btn-primary text-xs px-4 py-2 font-bold whitespace-nowrap self-start sm:self-auto"
                    >
                      + Add Service
                    </button>
                  </div>
                )}

                {/* SECTION 2: RETAIL PRODUCTS */}
                {productItems.length > 0 && (
                  <div className="bg-white rounded-3xl p-6 border border-groomish-slate/10 shadow-soft space-y-4">
                    <div className="flex items-center justify-between border-b border-groomish-slate/10 pb-3">
                      <div className="flex items-center gap-2">
                        <Package className="w-4 h-4 text-groomish-orange" />
                        <h2 className="font-heading font-extrabold text-sm sm:text-base text-groomish-slate">
                          Retail Products & In-Store Pickup ({productItems.length})
                        </h2>
                      </div>
                      <span className="text-[11px] font-bold text-groomish-green bg-groomish-greenLight px-2 py-0.5 rounded-full">
                        In-Store Pickup Available
                      </span>
                    </div>

                    <div className="divide-y divide-groomish-slate/10">
                      {productItems.map((item) => {
                        const unavailableInfo = unavailableItemsMap[item.id];
                        return (
                          <div
                            key={item.id}
                            className={`py-4 first:pt-0 last:pb-0 space-y-3 rounded-2xl transition ${unavailableInfo ? "bg-red-50/70 p-3 border border-red-200" : ""
                              }`}
                          >
                            <div className="flex items-start gap-4 justify-between">
                              <div className="flex items-start gap-3.5 min-w-0">
                                <div className="w-16 h-16 rounded-2xl bg-groomish-cream overflow-hidden border border-groomish-slate/10 p-1 flex items-center justify-center shrink-0">
                                  <img
                                    src={getOptimizedImageUrl(
                                      item.productImage || "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=300&q=80",
                                      { width: 200 }
                                    )}
                                    alt={item.productName}
                                    loading="lazy"
                                    decoding="async"
                                    className="max-h-full max-w-full object-contain"
                                  />
                                </div>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-groomish-cream text-groomish-slate">
                                      {item.productBrand || "Groomish Pro"}
                                    </span>
                                    {item.productCategory && (
                                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-groomish-orangeLight text-groomish-orange">
                                        {item.productCategory}
                                      </span>
                                    )}
                                    {item.productVolume && (
                                      <span className="text-[10px] text-groomish-slate/60 font-mono">
                                        {item.productVolume}
                                      </span>
                                    )}
                                    {unavailableInfo && (
                                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-red-100 text-groomish-crimson border border-red-200">
                                        {unavailableInfo.reason}
                                      </span>
                                    )}
                                  </div>
                                  <h3 className={`font-heading font-bold text-sm text-groomish-slate mt-1 truncate ${unavailableInfo ? "line-through text-groomish-crimson" : ""}`}>
                                    {item.productName}
                                  </h3>
                                  <div className="flex items-center gap-1.5 text-[11px] text-groomish-slate/60 mt-0.5">
                                    <Store className="w-3 h-3 text-groomish-orange" />
                                    <span>Collect at front desk or receive during service</span>
                                  </div>
                                </div>
                              </div>

                              {/* Price */}
                              <div className="text-right shrink-0">
                                <span className={`text-base font-extrabold block ${unavailableInfo ? "text-groomish-crimson text-xs" : "text-groomish-slate"}`}>
                                  {unavailableInfo ? "Unavailable" : `₹${item.totalPrice}`}
                                </span>
                                {item.productMrp && item.productMrp > item.unitPrice && !unavailableInfo && (
                                  <span className="text-[11px] text-groomish-slate/40 line-through block">
                                    ₹{item.productMrp * item.quantity}
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Controls Bar */}
                            <div className="flex items-center justify-between gap-3 pt-2">
                              {/* Quantity Controls */}
                              <div className="flex items-center gap-2">
                                <span className="text-[11px] font-semibold text-groomish-slate/60">Qty:</span>
                                <div className="flex items-center border border-groomish-slate/20 rounded-full bg-groomish-cream p-0.5">
                                  <button
                                    type="button"
                                    onClick={() => handleQuantityDelta(item, -1)}
                                    className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-white text-groomish-slate transition"
                                  >
                                    <Minus className="w-3 h-3" />
                                  </button>
                                  <span className={`w-7 text-center text-xs font-extrabold ${unavailableInfo ? "text-groomish-crimson" : "text-groomish-slate"}`}>
                                    {unavailableInfo ? "0" : item.quantity}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => handleQuantityDelta(item, 1)}
                                    className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-white text-groomish-slate transition"
                                  >
                                    <Plus className="w-3 h-3" />
                                  </button>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => removeItem(item.id, item.productName)}
                                  className="p-1.5 rounded-full hover:bg-groomish-crimson/10 text-groomish-slate/40 hover:text-groomish-crimson transition ml-1"
                                  title="Remove product"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>

                              <span className="text-[11px] font-bold text-groomish-slate flex items-center gap-1">
                                <GroomCoinIcon className="w-3.5 h-3.5" />
                                <span>+{calculateCoins(item.totalPrice)} Groom Coins</span>
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Continue Shopping Footer */}
                <div className="flex items-center justify-between text-xs pt-2">
                  <Link
                    to="/services"
                    className="text-groomish-orange hover:underline font-bold flex items-center gap-1"
                  >
                    <span>+ Add more salon treatments</span>
                  </Link>
                  <Link
                    to="/products"
                    className="text-groomish-slate hover:text-groomish-orange font-bold flex items-center gap-1"
                  >
                    <span>+ Add retail products</span>
                  </Link>
                </div>
              </div>

              {/* RIGHT COLUMN: ORDER SUMMARY & PROCEED TO CHECKOUT */}
              <div className="lg:col-span-4 lg:sticky lg:top-24 space-y-5">
                <div className="bg-white rounded-3xl p-6 border border-groomish-slate/10 shadow-card space-y-5">
                  <h3 className="font-heading font-extrabold text-base text-groomish-slate border-b border-groomish-slate/10 pb-3">
                    Order Summary
                  </h3>

                  <div className="space-y-3 text-xs text-groomish-slate">
                    <div className="flex items-center justify-between">
                      <span className="text-groomish-slate/70">
                        Subtotal {totalSavings > 0 ? "(Total MRP)" : ""}
                      </span>
                      <span className="font-bold">₹{totalMrp > totalAmount ? totalMrp : totalAmount}</span>
                    </div>

                    {totalSavings > 0 && (
                      <div className="flex items-center justify-between text-groomish-green font-bold">
                        <span className="flex items-center gap-1">
                          <Tag className="w-3.5 h-3.5" />
                          <span>Discount on MRP</span>
                        </span>
                        <span>- ₹{totalSavings}</span>
                      </div>
                    )}

                    {servicesCount > 0 && (
                      <div className="flex items-center justify-between text-groomish-slate/60 text-[11px] pt-1">
                        <span>Salon Services ({servicesCount})</span>
                        <span>₹{cart?.servicesSubtotal || 0}</span>
                      </div>
                    )}

                    {productsCount > 0 && (
                      <div className="flex items-center justify-between text-groomish-slate/60 text-[11px]">
                        <span>Retail Products ({productsCount})</span>
                        <span>₹{cart?.productsSubtotal || 0}</span>
                      </div>
                    )}

                    {totalDuration > 0 && (
                      <div className="flex items-center justify-between text-groomish-slate/60 text-[11px]">
                        <span>Treatment Duration</span>
                        <span>{totalDuration} mins</span>
                      </div>
                    )}

                    <div className="pt-3 border-t border-groomish-slate/10 flex items-baseline justify-between">
                      <span className="font-heading font-extrabold text-base text-groomish-slate">
                        Cart Total
                      </span>
                      <div className="text-right">
                        <span className="text-2xl font-extrabold text-groomish-slate">
                          ₹{totalAmount}
                        </span>
                        <span className="text-[10px] text-groomish-slate/50 block">
                          Taxes included
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Loyalty Points Pill */}
                  <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200/80 flex items-center gap-2.5">
                    <GroomCoinIcon className="w-5 h-5 shrink-0" />
                    <div>
                      <span className="text-xs font-bold text-groomish-slate block">
                        Earn {estimatedPoints} Groom Coins
                      </span>
                      <span className="text-[10px] text-groomish-slate/70">
                        Credited directly to Groom Coin wallet upon appointment completion.
                      </span>
                    </div>
                  </div>

                  {/* Proceed to Checkout CTA */}
                  <button
                    type="button"
                    disabled={checkingBranch || Object.keys(unavailableItemsMap).length > 0}
                    onClick={() => navigate("/checkout")}
                    className="btn-auth w-full py-3.5 text-xs sm:text-sm flex items-center justify-center gap-2 shadow-glowOrange disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {checkingBranch ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Checking Branch Stock...
                      </span>
                    ) : Object.keys(unavailableItemsMap).length > 0 ? (
                      <span>Resolve Unavailable Items</span>
                    ) : (
                      <>
                        <span>Proceed to Checkout</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>

                  {/* Trust badges */}
                  <div className="space-y-2 pt-2 border-t border-groomish-slate/10 text-[11px] text-groomish-slate/60">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-groomish-green shrink-0" />
                      <span>Persistent DB storage — items won't be lost</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Tag className="w-3.5 h-3.5 text-groomish-orange shrink-0" />
                      <span>Apply coupons & vouchers on checkout</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-3.5 h-3.5 text-groomish-blue shrink-0" />
                      <span>Autoclave sanitized tools & certified stylists</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* ---------------- ADD SERVICE MODAL ---------------- */}
      <ModalWrapper
        open={addServiceModalOpen}
        onClose={() => setAddServiceModalOpen(false)}
        maxWidth="max-w-xl"
      >
        <div className="space-y-4">
          <div className="border-b border-groomish-slate/10 pb-3 flex items-start justify-between">
            <div>
              <h3 className="text-lg font-heading font-bold text-groomish-slate flex items-center gap-2">
                <Scissors className="w-5 h-5 text-groomish-orange" />
                <span>Add Salon Service to Cart</span>
              </h3>
              <p className="text-xs text-groomish-slate/60 mt-0.5">
                Browse signature treatments and add them to your appointment
              </p>
            </div>
            <button
              onClick={() => setAddServiceModalOpen(false)}
              className="p-1.5 rounded-xl text-groomish-slate/40 hover:text-groomish-slate hover:bg-groomish-cream transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Search bar with clear button */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-groomish-slate/40" />
            <input
              type="text"
              placeholder="Search salon services by name or category..."
              value={serviceSearchQuery}
              onChange={(e) => setServiceSearchQuery(e.target.value)}
              className="w-full pl-10 pr-9 py-2.5 text-xs rounded-xl bg-groomish-cream/70 border border-groomish-slate/15 text-groomish-slate placeholder:text-groomish-slate/40 focus:outline-none focus:border-groomish-orange focus:bg-white transition"
            />
            {serviceSearchQuery && (
              <button
                type="button"
                onClick={() => setServiceSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-groomish-slate/40 hover:text-groomish-slate p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Category Filter Pills */}
          {serviceCategories.length > 2 && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {serviceCategories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedServiceCategory(cat)}
                  className={`text-[11px] font-bold px-3 py-1 rounded-full whitespace-nowrap transition ${selectedServiceCategory === cat
                      ? "bg-groomish-orange text-white shadow-soft"
                      : "bg-groomish-cream hover:bg-groomish-slate/10 text-groomish-slate/70"
                    }`}
                >
                  {cat === "ALL" ? "All Services" : cat}
                </button>
              ))}
            </div>
          )}

          {/* Service options list */}
          <div className="max-h-80 overflow-y-auto space-y-2 pr-1">
            {serviceLoading ? (
              <div className="py-10 text-center text-xs text-groomish-slate/50">
                <RefreshCw className="w-5 h-5 animate-spin text-groomish-orange mx-auto mb-2" />
                Loading salon services...
              </div>
            ) : filteredServices.length > 0 ? (
              filteredServices.map((srv) => {
                const activeSub =
                  selectedSubServiceByServiceId[srv.id] ||
                  (srv.subServices && srv.subServices.length > 0 ? srv.subServices[0] : null);
                const displayPrice = activeSub ? activeSub.price : srv.price;
                const displayDuration = activeSub ? activeSub.durationMinutes : (srv.durationMinutes || 30);
                const inCartItem = serviceItems.find(
                  (i) => i.serviceId === srv.id && (!activeSub || i.subServiceName === activeSub.name)
                );
                const isAdding = addingServiceId === srv.id;

                return (
                  <div
                    key={srv.id}
                    className="p-3 rounded-2xl border border-groomish-slate/10 hover:border-groomish-orange/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition hover:bg-groomish-cream/30 bg-white"
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="w-12 h-12 rounded-xl bg-groomish-cream overflow-hidden border border-groomish-slate/10 shrink-0 mt-0.5">
                        <img
                          src={
                            srv.image ||
                            "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=200&q=80"
                          }
                          alt={srv.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h4 className="text-xs font-bold text-groomish-slate truncate">
                            {srv.name}
                          </h4>
                          {inCartItem && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-groomish-greenLight text-groomish-green">
                              In Cart ({inCartItem.quantity})
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-groomish-slate/50 mt-0.5">
                          {displayDuration} mins • {srv.categoryName || "Salon Care"}
                        </p>

                        {/* Sub-Service Option Selector */}
                        {srv.subServices && srv.subServices.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {srv.subServices.map((sub) => {
                              const isSelected = (activeSub?.name || srv.subServices[0]?.name) === sub.name;
                              return (
                                <button
                                  key={sub.id || sub.name}
                                  type="button"
                                  onClick={() =>
                                    setSelectedSubServiceByServiceId((prev) => ({
                                      ...prev,
                                      [srv.id]: sub,
                                    }))
                                  }
                                  className={`px-2 py-0.5 rounded-md text-[10px] font-semibold transition ${isSelected
                                      ? "bg-groomish-orange text-white"
                                      : "bg-groomish-cream text-groomish-slate hover:bg-groomish-orangeLight hover:text-groomish-orange"
                                    }`}
                                >
                                  {sub.name} (₹{sub.price})
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-groomish-slate/10">
                      <div className="text-right">
                        <span className="text-xs font-extrabold text-groomish-slate block">
                          ₹{displayPrice}
                        </span>
                        {srv.mrp && srv.mrp > displayPrice && (
                          <span className="text-[10px] text-groomish-slate/40 line-through">
                            ₹{srv.mrp}
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => handleAddServiceToCart(srv)}
                        disabled={isAdding}
                        className="btn-primary text-xs px-3.5 py-1.5 font-bold shadow-soft flex items-center gap-1"
                      >
                        {isAdding ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <>
                            <Plus className="w-3.5 h-3.5" />
                            <span>{inCartItem ? "Add Again" : "Add to Cart"}</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8">
                <Scissors className="w-8 h-8 text-groomish-slate/20 mx-auto mb-2" />
                <p className="text-xs font-bold text-groomish-slate/70">
                  {serviceSearchQuery.trim() || selectedServiceCategory !== "ALL"
                    ? "No services matched your search"
                    : "No salon services available."}
                </p>
                {(serviceSearchQuery.trim() || selectedServiceCategory !== "ALL") && (
                  <button
                    onClick={() => {
                      setServiceSearchQuery("");
                      setSelectedServiceCategory("ALL");
                    }}
                    className="mt-2 text-xs text-groomish-orange font-bold hover:underline"
                  >
                    Clear Search Filters
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="flex justify-end pt-2 border-t border-groomish-slate/10">
            <button
              type="button"
              onClick={() => setAddServiceModalOpen(false)}
              className="btn-secondary text-xs px-4 py-2 font-bold"
            >
              Done
            </button>
          </div>
        </div>
      </ModalWrapper>

      <Footer />
    </div>
  );
}
