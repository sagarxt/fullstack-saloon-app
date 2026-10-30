import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import ModalWrapper from "./ModalWrapper";
import CustomerProfileModal from "./CustomerProfileModal";
import { getBookingDetails, updateBookingDetails, updateBookingStatus } from "../../api/admin";
import {
  Calendar,
  Clock,
  CreditCard,
  User,
  MapPin,
  CheckCircle2,
  X,
  Check,
  AlertCircle,
  Copy,
  Scissors,
  ShoppingBag,
  Sparkles,
  RefreshCw,
  Save,
  Tag,
  ExternalLink,
} from "lucide-react";
import GroomCoinIcon from "../common/GroomCoinIcon";
import InvoiceBreakdownCard from "../booking/InvoiceBreakdownCard";
import { groupBookingServices } from "../../utils/serviceMultiplierHelper";

export default function BookingDetailsModal({
  open,
  onClose,
  bookingId,
  onUpdated,
}) {
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [copied, setCopied] = useState(false);
  const [customerProfileOpen, setCustomerProfileOpen] = useState(false);

  // Form edit fields
  const [editStatus, setEditStatus] = useState("PENDING");
  const [editDate, setEditDate] = useState("");
  const [editTime, setEditTime] = useState("");
  const [editNote, setEditNote] = useState("");
  const [editPaymentStatus, setEditPaymentStatus] = useState("PENDING");
  const [editPaymentMethod, setEditPaymentMethod] = useState("CASH");
  const [editPricePaid, setEditPricePaid] = useState(0);

  const loadDetails = async () => {
    if (!bookingId) return;
    setLoading(true);
    setError("");
    setSuccessMsg("");
    try {
      const res = await getBookingDetails(bookingId);
      const b = res.data;
      setBooking(b);
      setEditStatus(b.status || "PENDING");
      setEditNote(b.note || "");
      setEditPricePaid(b.pricePaid ?? b.totalAmount ?? 0);
      setEditPaymentMethod(b.paymentMethod || "CASH");
      setEditPaymentStatus(b.paymentStatus || "PENDING");

      if (b.scheduledAt) {
        const parts = b.scheduledAt.split("T");
        if (parts.length >= 2) {
          setEditDate(parts[0]);
          setEditTime(parts[1].slice(0, 5));
        } else {
          const d = new Date(b.scheduledAt);
          const y = d.getFullYear();
          const m = String(d.getMonth() + 1).padStart(2, "0");
          const day = String(d.getDate()).padStart(2, "0");
          const hh = String(d.getHours()).padStart(2, "0");
          const mm = String(d.getMinutes()).padStart(2, "0");
          setEditDate(`${y}-${m}-${day}`);
          setEditTime(`${hh}:${mm}`);
        }
      } else {
        setEditDate("");
        setEditTime("");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load booking details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && bookingId) {
      loadDetails();
    } else {
      setBooking(null);
    }
  }, [open, bookingId]);

  const handleCopyCode = () => {
    const code = booking?.bookingCode || booking?.id;
    if (code) {
      navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Quick Action: Approve / Reject / Complete
  const handleQuickStatusChange = async (newStatus) => {
    setSaving(true);
    setError("");
    setSuccessMsg("");
    try {
      await updateBookingStatus(bookingId, newStatus);
      setSuccessMsg(`Booking successfully updated to ${newStatus}!`);
      await loadDetails();
      onUpdated?.();
    } catch (err) {
      setError(err.response?.data?.message || `Failed to update status to ${newStatus}`);
    } finally {
      setSaving(false);
    }
  };

  // Full Save Changes: status, reschedule, payment method/status, notes
  const handleSaveChanges = async (e) => {
    e?.preventDefault?.();
    setSaving(true);
    setError("");
    setSuccessMsg("");

    try {
      const payload = {
        status: editStatus,
        note: editNote,
        pricePaid: Number(editPricePaid) || 0,
        paymentStatus: editPaymentStatus,
        paymentMethod: editPaymentMethod,
      };

      if (editDate && editTime) {
        payload.scheduledAt = `${editDate}T${editTime}:00`;
      }

      await updateBookingDetails(bookingId, payload);
      setSuccessMsg("Appointment changes saved successfully!");
      await loadDetails();
      onUpdated?.();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save booking changes.");
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  const getStatusBadge = (status) => {
    switch (status) {
      case "CONFIRMED":
        return "bg-groomish-greenLight text-groomish-green border-groomish-green/30";
      case "COMPLETED":
        return "bg-groomish-blueLight text-groomish-blue border-groomish-blue/30";
      case "CANCELLED":
        return "bg-groomish-crimsonLight text-groomish-crimson border-groomish-crimson/30";
      case "MODIFIED":
        return "bg-purple-100 text-purple-700 border-purple-200";
      default:
        return "bg-amber-100 text-amber-800 border-amber-300";
    }
  };

  const todayStr = (() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  })();

  return (
    <>
      <ModalWrapper open={open} onClose={onClose} maxWidth="max-w-2xl">
      {loading ? (
        <div className="py-12 text-center text-xs text-groomish-slate/60 flex items-center justify-center gap-2">
          <RefreshCw className="w-4 h-4 animate-spin text-groomish-orange" />
          <span>Loading appointment details...</span>
        </div>
      ) : !booking ? (
        <div className="py-8 text-center text-xs text-groomish-crimson">
          {error || "Could not retrieve appointment details."}
        </div>
      ) : (
        <div className="space-y-5 animate-fade-in text-groomish-slate">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-groomish-slate/10 pb-4">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-lg font-heading font-extrabold text-groomish-slate">
                  Booking Overview
                </span>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border uppercase tracking-wider ${getStatusBadge(
                    booking.status
                  )}`}
                >
                  {booking.status}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-1 text-xs">
                <span className="text-groomish-slate/60">Booking Code:</span>
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="font-mono font-bold text-groomish-orange bg-groomish-orangeLight px-2 py-0.5 rounded-lg border border-groomish-orange/30 hover:bg-groomish-orange/20 transition flex items-center gap-1.5"
                  title="Click to copy code"
                >
                  <span>{booking.bookingCode || booking.id}</span>
                  <Copy className="w-3 h-3" />
                </button>
                {copied && <span className="text-[10px] text-groomish-green font-bold">Copied!</span>}
                <Link
                  to={`/admin/bookings/${booking.id}`}
                  onClick={onClose}
                  className="inline-flex items-center gap-1 text-[11px] text-groomish-slate/60 hover:text-groomish-orange ml-2 font-medium transition"
                  title="Open dedicated admin booking page"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span>Open Full Page</span>
                </Link>
              </div>
            </div>

            {/* Quick Status Action Buttons */}
            <div className="flex items-center gap-2 flex-wrap">
              {booking.status === "PENDING" && (
                <>
                  <button
                    disabled={saving}
                    onClick={() => handleQuickStatusChange("CONFIRMED")}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-groomish-green text-white font-bold text-xs hover:bg-emerald-600 transition shadow-soft disabled:opacity-50"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Confirm Appointment</span>
                  </button>
                  <button
                    disabled={saving}
                    onClick={() => handleQuickStatusChange("CANCELLED")}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-groomish-crimson text-white font-bold text-xs hover:bg-rose-600 transition shadow-soft disabled:opacity-50"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Cancel</span>
                  </button>
                </>
              )}

              {(booking.status === "CONFIRMED" || booking.status === "MODIFIED") && (
                <>
                  <button
                    disabled={saving}
                    onClick={() => handleQuickStatusChange("COMPLETED")}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-groomish-blue text-white font-bold text-xs hover:bg-sky-600 transition shadow-soft disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Mark Completed</span>
                  </button>
                  <button
                    disabled={saving}
                    onClick={() => handleQuickStatusChange("CANCELLED")}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-groomish-crimson/30 text-groomish-crimson hover:bg-groomish-crimsonLight font-bold text-xs transition disabled:opacity-50"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Cancel</span>
                  </button>
                </>
              )}

              {booking.status === "COMPLETED" && (
                <span className="text-xs font-bold text-groomish-blue bg-groomish-blueLight px-3 py-1.5 rounded-xl border border-groomish-blue/20 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Service Completed</span>
                </span>
              )}
            </div>
          </div>

          {/* Feedback Alerts */}
          {error && (
            <div className="p-3 rounded-xl bg-groomish-crimson/10 text-groomish-crimson text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-xl bg-groomish-greenLight text-groomish-green text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Client & Salon Branch Info Card */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-2xl bg-groomish-cream/70 border border-groomish-slate/10 text-xs">
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-groomish-slate/50 block">
                Client Information
              </span>
              <div className="font-bold text-groomish-slate flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-groomish-orange shrink-0" />
                  {booking.userId ? (
                    <button
                      type="button"
                      onClick={() => setCustomerProfileOpen(true)}
                      className="hover:text-groomish-orange hover:underline underline-offset-2 transition text-groomish-slate font-bold text-left"
                      title="Click to view client profile, orders and Groom Coins"
                    >
                      {booking.userName || "Salon Customer"}
                    </button>
                  ) : (
                    <span>{booking.userName || "Salon Customer"}</span>
                  )}
                </div>
                {booking.userId && (
                  <button
                    type="button"
                    onClick={() => setCustomerProfileOpen(true)}
                    className="text-[10px] font-bold text-groomish-orange hover:text-groomish-orangeDark bg-groomish-orangeLight hover:bg-groomish-orange/20 px-2 py-0.5 rounded-full border border-groomish-orange/20 transition flex items-center gap-1"
                  >
                    <span>View Profile & Points</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </button>
                )}
              </div>
              {booking.userEmail && (
                <div className="text-groomish-slate/70">📧 {booking.userEmail}</div>
              )}
              {booking.userPhone && (
                <div className="text-groomish-slate/70">📞 {booking.userPhone}</div>
              )}
              {booking.bookedBy && (
                <div className="text-[11px] text-groomish-slate/50 font-medium pt-0.5">
                  Origin: {booking.bookedBy}
                </div>
              )}
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-groomish-slate/50 block">
                Salon Branch Location
              </span>
              <div className="font-bold text-groomish-slate flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-groomish-orange shrink-0" />
                <span>{booking.storeName || "Indiranagar Flagship"}</span>
              </div>
              {booking.storeAddress && (
                <div className="text-groomish-slate/70 text-[11px] leading-relaxed">
                  {booking.storeAddress}
                </div>
              )}
            </div>
          </div>

          {/* Booked Services List */}
          <div>
            <h4 className="text-xs font-bold text-groomish-slate/80 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Scissors className="w-3.5 h-3.5 text-groomish-orange" />
              <span>Booked Salon Services</span>
            </h4>
            <div className="divide-y divide-groomish-slate/10 border border-groomish-slate/10 rounded-xl overflow-hidden bg-white text-xs">
              {(() => {
                const serviceList = booking.items || booking.bookingItems || [];
                const productList = booking.products || booking.bookingProducts || [];
                const grouped = groupBookingServices(serviceList);
                if (grouped.length > 0) {
                  return grouped.map((grp, idx) => (
                    <div key={grp.key || idx} className="p-3 flex items-center justify-between gap-3">
                      <div>
                        <div className="font-bold text-groomish-slate flex items-center gap-1.5">
                          <span>{grp.serviceName}</span>
                          {grp.quantity > 1 && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-groomish-orangeLight text-groomish-orange">
                              × {grp.quantity}
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-groomish-slate/50">
                          {grp.totalDuration} mins • Status: {grp.status || booking.status || "CONFIRMED"}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-groomish-slate">
                          ₹{grp.totalPrice}
                        </div>
                        {grp.totalMrp && grp.totalMrp > grp.totalPrice && (
                          <div className="text-[10px] text-groomish-slate/40 line-through">
                            ₹{grp.totalMrp}
                          </div>
                        )}
                      </div>
                    </div>
                  ));
                }
                if (productList.length > 0) {
                  return (
                    <div className="p-3 text-center text-xs text-groomish-slate/60">
                      No salon services in this appointment (Retail products only)
                    </div>
                  );
                }
                return (
                  <div className="p-3 flex items-center justify-between">
                    <div className="font-bold text-groomish-slate">
                      {booking.serviceName || "Primary Salon Service"}
                    </div>
                    <div className="font-bold text-groomish-slate">
                      ₹{booking.totalAmount || 0}
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>

          {/* Attached Retail Store Products (if any) */}
          {booking.products && booking.products.length > 0 && (
            <div>
              <h4 className="text-xs font-bold text-groomish-slate/80 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <ShoppingBag className="w-3.5 h-3.5 text-groomish-blue" />
                <span>Attached Retail Products</span>
              </h4>
              <div className="divide-y divide-groomish-slate/10 border border-groomish-slate/10 rounded-xl overflow-hidden bg-white text-xs">
                {booking.products.map((bp) => (
                  <div key={bp.id} className="p-3 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-groomish-slate">{bp.productName}</div>
                      <div className="text-[11px] text-groomish-slate/50">
                        Qty: {bp.quantity}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-groomish-slate">₹{bp.totalPrice}</div>
                      {bp.mrp && Number(bp.mrp) > Number(bp.unitPrice) && (
                        <div className="text-[10px] text-groomish-slate/40 line-through">
                          ₹{Number(bp.mrp) * (bp.quantity || 1)}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Complete Invoice Breakdown matching Customer view */}
          <InvoiceBreakdownCard
            booking={booking}
            className="rounded-2xl border border-groomish-slate/10 p-4 shadow-xs"
          />

          {/* Admin Management & Update Controls Form */}
          <form onSubmit={handleSaveChanges} className="space-y-4 pt-3 border-t border-groomish-slate/10">
            <h4 className="text-xs font-bold text-groomish-slate uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-groomish-orange" />
              <span>Admin Appointment & Payment Controls</span>
            </h4>

            {/* Reschedule / Time Picker */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-groomish-cream/40 rounded-2xl border border-groomish-slate/10">
              <div>
                <label className="block text-xs font-bold text-groomish-slate/80 mb-1 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-groomish-orange" />
                  <span>Reschedule Date</span>
                </label>
                <input
                  type="date"
                  value={editDate}
                  min={todayStr}
                  onChange={(e) => setEditDate(e.target.value)}
                  className="input-groomish bg-white text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-groomish-slate/80 mb-1 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-groomish-orange" />
                  <span>Appointment Slot Time</span>
                </label>
                <input
                  type="time"
                  value={editTime}
                  onChange={(e) => setEditTime(e.target.value)}
                  className="input-groomish bg-white text-xs"
                />
              </div>
            </div>

            {/* Status & Payment Controls */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 bg-groomish-cream/40 rounded-2xl border border-groomish-slate/10 text-xs">
              <div>
                <label className="block font-bold text-groomish-slate/80 mb-1">
                  Appointment Status
                </label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  className="input-groomish bg-white text-xs cursor-pointer"
                >
                  <option value="CONFIRMED">CONFIRMED (Active Confirmed)</option>
                  <option value="COMPLETED">COMPLETED</option>
                  <option value="MODIFIED">MODIFIED (Rescheduled)</option>
                  <option value="CANCELLED">CANCELLED</option>
                  <option value="PENDING">PENDING (Online Payment Pending)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-groomish-slate/80 mb-1 flex items-center gap-1">
                  <CreditCard className="w-3.5 h-3.5 text-groomish-orange" />
                  <span>Payment Status</span>
                </label>
                <select
                  value={editPaymentStatus}
                  onChange={(e) => setEditPaymentStatus(e.target.value)}
                  className="input-groomish bg-white text-xs cursor-pointer"
                >
                  <option value="PENDING">PENDING</option>
                  <option value="SUCCESS">SUCCESS (Paid)</option>
                  <option value="CANCELLED">CANCELLED</option>
                  <option value="REFUNDED">REFUNDED</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-groomish-slate/80 mb-1">
                  Payment Method
                </label>
                <select
                  value={editPaymentMethod}
                  onChange={(e) => setEditPaymentMethod(e.target.value)}
                  className="input-groomish bg-white text-xs cursor-pointer"
                >
                  <option value="CASH">Pay at Salon (CASH)</option>
                  <option value="UPI">UPI / QR Code</option>
                  <option value="CARD">Credit / Debit Card</option>
                  <option value="NETBANKING">Net Banking</option>
                </select>
              </div>
            </div>

            {/* Pricing Summary & Editable Price Paid */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-groomish-cream/70 border border-groomish-slate/10 text-xs">
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <span className="text-groomish-slate/60">Gross Bill Amount:</span>
                  <span className="font-bold text-groomish-slate">₹{booking.totalAmount}</span>
                </div>
                {booking.expectedRewardPoints !== undefined && (
                  <div className="text-[11px] text-amber-600 font-bold flex items-center gap-1.5">
                    <GroomCoinIcon className="w-3.5 h-3.5" />
                    <span>
                      {booking.pointsConfirmed
                        ? `Groom Coins Credited: +${booking.expectedRewardPoints} coins`
                        : `Pending Groom Coins: ~${booking.expectedRewardPoints} coins`}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                <label className="font-bold text-groomish-slate/80 whitespace-nowrap">
                  Amount Received (₹):
                </label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={editPricePaid}
                  onChange={(e) => setEditPricePaid(e.target.value)}
                  className="w-28 input-groomish bg-white text-xs font-bold text-groomish-slate"
                />
              </div>
            </div>

            {/* Admin / Stylist Notes */}
            <div>
              <label className="block text-xs font-bold text-groomish-slate/80 mb-1 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-groomish-slate/40" />
                <span>Stylist Note / Special Client Instructions</span>
              </label>
              <textarea
                value={editNote}
                onChange={(e) => setEditNote(e.target.value)}
                rows={2}
                placeholder="E.g. requested master stylist Rajesh, skin sensitivity check done..."
                className="input-groomish bg-white text-xs"
              />
            </div>

            {/* Action Bar */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-groomish-slate/10">
              <button
                type="button"
                onClick={onClose}
                className="btn-secondary text-xs px-4 py-2"
              >
                Close
              </button>
              <button
                type="submit"
                disabled={saving}
                className="btn-primary text-xs px-5 py-2 flex items-center gap-1.5"
              >
                {saving ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    <span>Save Changes</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </ModalWrapper>

    {booking?.userId && (
      <CustomerProfileModal
        customerId={booking.userId}
        initialData={{
          id: booking.userId,
          name: booking.userName || booking.bookedBy,
          email: booking.userEmail,
          phone: booking.userPhone,
        }}
        open={customerProfileOpen}
        onClose={() => setCustomerProfileOpen(false)}
      />
    )}
    </>
  );
}
