import { useState, useEffect } from "react";
import { storeApi } from "../../api/store";
import { uploadImageApi } from "../../api/upload";
import ModalWrapper from "../../components/modals/ModalWrapper";
import CloudinaryMultiImageUploader from "../../components/common/CloudinaryMultiImageUploader";
import BranchCatalogModal from "../../components/modals/BranchCatalogModal";
import CustomTimePicker from "../../components/common/CustomTimePicker";
import { showConfirm, showAlert } from "../../context/ConfirmContext";
import { forceDeleteStoreApi } from "../../api/maintenance";
import { getOptimizedImageUrl } from "../../utils/imageHelper";
import {
  MapPin,
  Plus,
  Search,
  Edit2,
  Trash2,
  Power,
  RefreshCw,
  ExternalLink,
  Clock,
  Phone,
  Mail,
  Navigation,
  Upload,
  AlertCircle,
  CheckCircle2,
  Store,
  Image as ImageIcon,
  Package,
} from "lucide-react";

const INITIAL_FORM = {
  name: "",
  code: "",
  address: "",
  city: "",
  state: "",
  pincode: "",
  phone: "",
  email: "",
  logo: "",
  latitude: "",
  longitude: "",
  openingTime: "",
  closingTime: "",
  image: "",
  images: [],
  active: true,
};

export default function StoresPage() {
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingStore, setEditingStore] = useState(null);
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [detectingGps, setDetectingGps] = useState(false);
  const [formError, setFormError] = useState("");
  const [toastMsg, setToastMsg] = useState("");
  const [catalogStore, setCatalogStore] = useState(null);

  const loadStores = async () => {
    setLoading(true);
    try {
      const res = await storeApi.getAdminStores();
      setStores(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Failed to load stores:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStores();
  }, []);

  const showNotification = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 3500);
  };

  const handleOpenAdd = () => {
    setEditingStore(null);
    setFormData(INITIAL_FORM);
    setFormError("");
    setModalOpen(true);
  };

  const handleOpenEdit = (store) => {
    setEditingStore(store);
    const storeImages = Array.isArray(store.images) && store.images.length > 0
      ? store.images
      : store.image ? [store.image] : [];

    setFormData({
      name: store.name || "",
      code: store.code || "",
      address: store.address || "",
      city: store.city || "Bengaluru",
      state: store.state || "Karnataka",
      pincode: store.pincode || "",
      phone: store.phone || "",
      email: store.email || "",
      logo: store.logo || "",
      latitude: store.latitude !== null ? String(store.latitude) : "",
      longitude: store.longitude !== null ? String(store.longitude) : "",
      openingTime: store.openingTime || "09:00",
      closingTime: store.closingTime || "21:30",
      image: storeImages[0] || store.image || "",
      images: storeImages,
      active: store.active !== false,
    });
    setFormError("");
    setModalOpen(true);
  };

  const handleDetectCurrentLocation = () => {
    if (!navigator.geolocation) {
      setFormError("Geolocation is not supported by your browser.");
      return;
    }
    setDetectingGps(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setFormData((prev) => ({
          ...prev,
          latitude: pos.coords.latitude.toFixed(6),
          longitude: pos.coords.longitude.toFixed(6),
        }));
        setDetectingGps(false);
      },
      (err) => {
        setFormError("Failed to fetch GPS coordinates: " + err.message);
        setDetectingGps(false);
      },
      { timeout: 8000, enableHighAccuracy: true }
    );
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingLogo(true);
    setFormError("");
    try {
      const res = await uploadImageApi(file, "groomishnow/stores/logos");
      if (res?.url) {
        setFormData((prev) => ({
          ...prev,
          logo: res.url,
        }));
      }
    } catch (err) {
      setFormError("Failed to upload branch logo: " + (err.response?.data?.message || err.message));
    } finally {
      setUploadingLogo(false);
      e.target.value = "";
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const res = await uploadImageApi(file, "groomishnow/stores");
      if (res?.url) {
        setFormData((prev) => {
          const updatedImages = [...(prev.images || []), res.url];
          return {
            ...prev,
            image: updatedImages[0] || res.url,
            images: updatedImages,
          };
        });
      }
    } catch (err) {
      setFormError("Failed to upload image. Please try again.");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.code.trim() || !formData.address.trim()) {
      setFormError("Store Name, Branch Code, and Address are required.");
      return;
    }

    setSaving(true);
    setFormError("");

    const imgList = Array.isArray(formData.images) && formData.images.length > 0
      ? formData.images
      : formData.image ? [formData.image] : [];

    const payload = {
      ...formData,
      logo: formData.logo || "",
      image: imgList[0] || formData.image || "",
      images: imgList,
      latitude: formData.latitude ? parseFloat(formData.latitude) : null,
      longitude: formData.longitude ? parseFloat(formData.longitude) : null,
    };

    try {
      if (editingStore) {
        await storeApi.updateStore(editingStore.id, payload);
        showNotification(`Branch "${formData.name}" updated successfully.`);
      } else {
        await storeApi.createStore(payload);
        showNotification(`New branch "${formData.name}" created successfully.`);
      }
      setModalOpen(false);
      loadStores();
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to save store.";
      setFormError(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (store) => {
    try {
      await storeApi.toggleStore(store.id);
      showNotification(`Store status updated for "${store.name}".`);
      loadStores();
    } catch (err) {
      await showAlert({
        title: "Action Failed",
        message: "Failed to toggle status: " + (err.response?.data?.message || err.message),
        variant: "danger",
      });
    }
  };

  const handleDelete = async (store) => {
    const ok = await showConfirm({
      title: "Force Delete Salon Branch",
      message: `Are you sure you want to FORCE DELETE branch "${store.name}"?\nThis permanently removes the branch and clears branch inventories, catalogs, and assignments.`,
      confirmText: "Force Delete Branch",
      variant: "danger",
    });
    if (!ok) return;

    try {
      await forceDeleteStoreApi(store.id);
      showNotification(`Branch "${store.name}" permanently deleted.`);
      loadStores();
    } catch (err) {
      await showAlert({
        title: "Deletion Failed",
        message: "Failed to force delete store: " + (err.response?.data?.message || err.message),
        variant: "danger",
      });
    }
  };

  const filteredStores = stores.filter((s) => {
    const q = search.toLowerCase();
    return (
      s.name?.toLowerCase().includes(q) ||
      s.code?.toLowerCase().includes(q) ||
      s.city?.toLowerCase().includes(q) ||
      s.address?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="p-6 sm:p-8 space-y-6">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed top-6 right-6 z-50 bg-groomish-slate text-white px-4 py-2.5 rounded-2xl shadow-xl flex items-center gap-2 text-xs font-bold animate-in fade-in slide-in-from-top-2 border border-groomish-orange/30">
          <CheckCircle2 className="w-4 h-4 text-groomish-orange" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-heading font-extrabold text-groomish-slate">
              Salon Stores & Locations
            </h1>
            <span className="text-xs font-bold bg-groomish-orangeLight text-groomish-orange px-2.5 py-0.5 rounded-full">
              {stores.length} Branches
            </span>
          </div>
          <p className="text-xs text-groomish-slate/60 mt-1">
            Manage multi-store locations, GPS coordinates for proximity recommendations, and staff station assignments.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadStores}
            className="p-2.5 bg-white border border-groomish-slate/15 text-groomish-slate rounded-2xl hover:bg-groomish-cream transition"
            title="Refresh stores"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-groomish-orange" : ""}`} />
          </button>

          <button
            onClick={handleOpenAdd}
            className="btn-primary text-xs px-4 py-2.5 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Branch</span>
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex items-center gap-3 bg-white p-2 rounded-2xl border border-groomish-slate/10 shadow-soft max-w-md">
        <Search className="w-4 h-4 text-groomish-slate/40 ml-2" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by branch name, code, or area..."
          className="w-full text-xs bg-transparent focus:outline-none text-groomish-slate"
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            className="text-xs text-groomish-slate/40 hover:text-groomish-slate px-2"
          >
            Clear
          </button>
        )}
      </div>

      {/* Stores Grid / Cards */}
      {loading ? (
        <div className="py-20 text-center">
          <div className="w-10 h-10 border-4 border-groomish-orange border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-groomish-slate/60 font-medium">Loading salon branches...</p>
        </div>
      ) : filteredStores.length === 0 ? (
        <div className="bg-white rounded-3xl border border-groomish-slate/10 p-12 text-center max-w-md mx-auto shadow-soft">
          <Store className="w-12 h-12 text-groomish-slate/30 mx-auto mb-3" />
          <h3 className="font-heading font-bold text-base text-groomish-slate">
            No Branches Found
          </h3>
          <p className="text-xs text-groomish-slate/50 mt-1 mb-4">
            {search ? `No branches match "${search}".` : "Add your first salon branch location."}
          </p>
          <button onClick={handleOpenAdd} className="btn-primary text-xs px-5 py-2 mx-auto">
            Add Store
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStores.map((store) => (
            <div
              key={store.id}
              className={`bg-white rounded-3xl border transition-all duration-200 overflow-hidden shadow-soft flex flex-col justify-between ${
                store.active
                  ? "border-groomish-slate/10 hover:border-groomish-orange/40 hover:shadow-xl"
                  : "border-groomish-slate/10 opacity-70 bg-gray-50/70"
              }`}
            >
              <div>
                {/* Photo Header */}
                <div className="h-44 w-full relative bg-groomish-slate/10 overflow-hidden">
                  {store.image ? (
                    <img
                      src={getOptimizedImageUrl(store.image, { width: 600 })}
                      alt={store.name}
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-groomish-slate/40 gap-1">
                      <Store className="w-8 h-8" />
                      <span className="text-[10px]">No Photo Uploaded</span>
                    </div>
                  )}

                  <div className="absolute top-3 left-3 flex items-center gap-1.5">
                    <span className="font-mono text-[10px] font-extrabold bg-groomish-slate/90 backdrop-blur-md text-white px-2 py-0.5 rounded-lg shadow-sm">
                      {store.code}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm ${
                        store.active
                          ? "bg-groomish-green text-white"
                          : "bg-groomish-slate/70 text-white"
                      }`}
                    >
                      {store.active ? "ACTIVE" : "INACTIVE"}
                    </span>
                  </div>

                  {store.logo && (
                    <div className="absolute top-3 right-3 w-10 h-10 rounded-2xl bg-white/95 backdrop-blur-md p-1 shadow-md border border-white/60 overflow-hidden flex items-center justify-center">
                      <img
                        src={getOptimizedImageUrl(store.logo, { width: 120 })}
                        alt={`${store.name} Logo`}
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-contain rounded-xl"
                      />
                    </div>
                  )}

                  {store.images && store.images.length > 0 && (
                    <div className="absolute bottom-3 left-3 bg-groomish-slate/85 backdrop-blur-md text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                      <ImageIcon className="w-3 h-3 text-groomish-gold" />
                      <span>{store.images.length} {store.images.length === 1 ? "Photo" : "Photos"}</span>
                    </div>
                  )}

                  {store.latitude && store.longitude && (
                    <a
                      href={`https://www.google.com/maps?q=${store.latitude},${store.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="absolute bottom-3 right-3 bg-white/90 backdrop-blur-md text-groomish-slate text-[10px] font-bold px-2.5 py-1 rounded-full shadow-sm hover:bg-white flex items-center gap-1 transition"
                    >
                      <Navigation className="w-3 h-3 text-groomish-orange" />
                      <span>View Map</span>
                    </a>
                  )}
                </div>

                {/* Body Details */}
                <div className="p-5 space-y-3">
                  <div>
                    <h3 className="text-base font-heading font-extrabold text-groomish-slate">
                      {store.name}
                    </h3>
                    <p className="text-xs text-groomish-slate/70 mt-1 flex items-start gap-1.5 leading-relaxed">
                      <MapPin className="w-3.5 h-3.5 text-groomish-orange shrink-0 mt-0.5" />
                      <span>
                        {store.address}, {store.city}, {store.state} - {store.pincode}
                      </span>
                    </p>
                  </div>

                  <div className="pt-2 border-t border-groomish-slate/10 space-y-1.5 text-xs text-groomish-slate/70">
                    {store.openingTime && store.closingTime && (
                      <div className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-groomish-slate/40" />
                        <span>Hours: {store.openingTime} - {store.closingTime}</span>
                      </div>
                    )}

                    {store.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-groomish-slate/40" />
                        <span>{store.phone}</span>
                      </div>
                    )}

                    {store.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="w-3.5 h-3.5 text-groomish-slate/40" />
                        <span className="truncate">{store.email}</span>
                      </div>
                    )}

                    {store.latitude && store.longitude && (
                      <div className="text-[11px] font-mono text-groomish-slate/50">
                        GPS: {store.latitude.toFixed(4)}, {store.longitude.toFixed(4)}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="p-4 bg-groomish-cream/40 border-t border-groomish-slate/10 flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    onClick={() => handleToggle(store)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
                      store.active
                        ? "bg-groomish-slate/10 text-groomish-slate hover:bg-groomish-slate/20"
                        : "bg-groomish-green/15 text-groomish-green hover:bg-groomish-green/25"
                    }`}
                    title={store.active ? "Deactivate store" : "Activate store"}
                  >
                    <Power className="w-3.5 h-3.5" />
                    <span>{store.active ? "Deactivate" : "Activate"}</span>
                  </button>

                  <button
                    onClick={() => handleDelete(store)}
                    className="px-2.5 py-1.5 text-xs font-bold rounded-xl bg-red-600 text-white hover:bg-red-700 transition flex items-center gap-1 shadow-xs"
                    title="Force Delete branch permanently"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Force Delete</span>
                  </button>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setCatalogStore(store)}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 bg-groomish-orange/15 text-groomish-orange hover:bg-groomish-orange/25 transition shadow-xs"
                    title="Manage services availability and product inventory for this branch"
                  >
                    <Package className="w-3.5 h-3.5" />
                    <span>Services & Stock</span>
                  </button>

                  <button
                    onClick={() => handleOpenEdit(store)}
                    className="p-2 text-groomish-slate hover:bg-groomish-slate/10 rounded-xl transition"
                    title="Edit branch details"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ADD / EDIT MODAL */}
      <ModalWrapper
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        maxWidth="max-w-2xl"
      >
        <div className="space-y-5">
          <div className="border-b border-groomish-slate/10 pb-3">
            <h2 className="text-xl font-heading font-extrabold text-groomish-slate flex items-center gap-2">
              <Store className="w-5 h-5 text-groomish-orange" />
              <span>{editingStore ? "Edit Salon Branch" : "Add New Salon Branch"}</span>
            </h2>
            <p className="text-xs text-groomish-slate/60 mt-0.5">
              Enter branch details, address, working hours, and coordinates for geolocation proximity.
            </p>
          </div>

          {formError && (
            <div className="p-3 bg-groomish-crimson/10 text-groomish-crimson text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-groomish-slate mb-1">
                  Branch Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Groomish Indiranagar Flagship"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-groomish-slate/20 focus:border-groomish-orange focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-groomish-slate mb-1">
                  Branch Code (Unique) *
                </label>
                <input
                  type="text"
                  required
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  placeholder="e.g. IND-01"
                  className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-groomish-slate/20 focus:border-groomish-orange focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-groomish-slate mb-1">
                Full Street Address *
              </label>
              <textarea
                required
                rows={2}
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="100 Feet Rd, 12th Main, HAL 2nd Stage..."
                className="w-full px-3 py-2 text-xs rounded-xl border border-groomish-slate/20 focus:border-groomish-orange focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-groomish-slate mb-1">
                  City
                </label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-groomish-slate/20 focus:border-groomish-orange focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-groomish-slate mb-1">
                  State
                </label>
                <input
                  type="text"
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-groomish-slate/20 focus:border-groomish-orange focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-groomish-slate mb-1">
                  Pincode
                </label>
                <input
                  type="text"
                  value={formData.pincode}
                  onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                  placeholder="560038"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-groomish-slate/20 focus:border-groomish-orange focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-groomish-slate mb-1">
                  Contact Phone
                </label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+91 80 4123 4567"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-groomish-slate/20 focus:border-groomish-orange focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-groomish-slate mb-1">
                  Branch Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="indiranagar@groomish.com"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-groomish-slate/20 focus:border-groomish-orange focus:outline-none"
                />
              </div>
            </div>

            {/* Geolocation Section */}
            <div className="p-3.5 bg-groomish-cream/70 rounded-2xl border border-groomish-slate/15 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Navigation className="w-4 h-4 text-groomish-orange" />
                  <span className="text-xs font-bold text-groomish-slate">
                    GPS Coordinates (For Nearest Store Engine)
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleDetectCurrentLocation}
                  disabled={detectingGps}
                  className="text-[11px] font-bold text-groomish-orange hover:text-groomish-orange/80 bg-white border border-groomish-orange/30 px-2.5 py-1 rounded-xl transition flex items-center gap-1 shadow-sm disabled:opacity-50"
                >
                  <Navigation className={`w-3 h-3 ${detectingGps ? "animate-spin" : ""}`} />
                  <span>{detectingGps ? "Detecting..." : "Detect Device GPS"}</span>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-groomish-slate/70 mb-1">
                    Latitude
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={formData.latitude}
                    onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                    placeholder="12.971891"
                    className="w-full px-3 py-1.5 text-xs rounded-xl border border-groomish-slate/20 bg-white focus:border-groomish-orange focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-groomish-slate/70 mb-1">
                    Longitude
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={formData.longitude}
                    onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                    placeholder="77.641151"
                    className="w-full px-3 py-1.5 text-xs rounded-xl border border-groomish-slate/20 bg-white focus:border-groomish-orange focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Hours */}
            <div className="grid grid-cols-2 gap-4">
              <CustomTimePicker
                label="Opening Time"
                value={formData.openingTime}
                onChange={(e, val) => {
                  const v = typeof e === "string" ? e : (val || e?.target?.value || "");
                  setFormData((prev) => ({ ...prev, openingTime: v }));
                }}
              />

              <CustomTimePicker
                label="Closing Time"
                value={formData.closingTime}
                onChange={(e, val) => {
                  const v = typeof e === "string" ? e : (val || e?.target?.value || "");
                  setFormData((prev) => ({ ...prev, closingTime: v }));
                }}
              />
            </div>

            {/* Branch Logo Section */}
            <div className="p-4 bg-groomish-cream/40 rounded-2xl border border-groomish-slate/15 space-y-2.5">
              <div className="flex items-center justify-between">
                <div>
                  <label className="block text-xs font-bold text-groomish-slate">
                    Branch Logo
                  </label>
                  <p className="text-[11px] text-groomish-slate/60">
                    Upload a high-resolution logo or emblem for this salon branch.
                  </p>
                </div>
                {formData.logo && (
                  <button
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, logo: "" }))}
                    className="text-[11px] text-red-500 hover:text-red-700 font-bold flex items-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Remove Logo</span>
                  </button>
                )}
              </div>

              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-white border-2 border-dashed border-groomish-slate/20 flex items-center justify-center overflow-hidden shrink-0 shadow-sm relative group">
                  {formData.logo ? (
                    <img
                      src={formData.logo}
                      alt="Branch Logo"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Store className="w-7 h-7 text-groomish-slate/30" />
                  )}
                  {uploadingLogo && (
                    <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                      <RefreshCw className="w-5 h-5 animate-spin text-groomish-orange" />
                    </div>
                  )}
                </div>

                <div className="flex-1">
                  <label className="inline-flex items-center gap-2 px-3.5 py-2 bg-white border border-groomish-slate/20 rounded-xl text-xs font-bold text-groomish-slate hover:bg-groomish-orangeLight hover:border-groomish-orange hover:text-groomish-orange transition cursor-pointer shadow-sm">
                    <Upload className="w-3.5 h-3.5 text-groomish-orange" />
                    <span>{uploadingLogo ? "Uploading Logo..." : formData.logo ? "Change Branch Logo" : "Upload Branch Logo"}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      disabled={uploadingLogo}
                      className="hidden"
                    />
                  </label>
                  <p className="text-[10px] text-groomish-slate/50 mt-1">
                    PNG, JPG, SVG or WEBP (Square 1:1 recommended)
                  </p>
                </div>
              </div>
            </div>

            {/* Branch Photos & Gallery (1 to 10 photos) */}
            <CloudinaryMultiImageUploader
              value={formData.images || (formData.image ? [formData.image] : [])}
              onChange={(urls) =>
                setFormData((prev) => ({
                  ...prev,
                  images: urls,
                  image: urls[0] || "",
                }))
              }
              maxImages={10}
              folder="groomishnow/stores"
              label="Branch Photos & Gallery (1 to 10 Photos)"
              entityName={formData.name || formData.city || "branch"}
            />

            {/* Active Toggle */}
            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="storeActive"
                checked={formData.active}
                onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                className="rounded border-gray-300 text-groomish-orange focus:ring-groomish-orange w-4 h-4"
              />
              <label htmlFor="storeActive" className="text-xs font-bold text-groomish-slate cursor-pointer">
                Branch is Active and Open for Bookings
              </label>
            </div>

            {/* Modal Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-groomish-slate/10">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="btn-secondary text-xs px-4 py-2"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving || uploadingImage}
                className="btn-primary text-xs px-5 py-2 flex items-center gap-2"
              >
                <span>{saving ? "Saving..." : editingStore ? "Save Changes" : "Create Branch"}</span>
              </button>
            </div>
          </form>
        </div>
      </ModalWrapper>
      {/* BRANCH CATALOG MODAL */}
      <BranchCatalogModal
        open={Boolean(catalogStore)}
        onClose={() => setCatalogStore(null)}
        store={catalogStore}
      />
    </div>
  );
}
