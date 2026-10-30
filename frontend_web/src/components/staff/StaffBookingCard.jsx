import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import GroomCoinIcon from "../common/GroomCoinIcon";
import CustomerProfileModal from "../modals/CustomerProfileModal";
import { getBranchNavigationUrl } from "../../utils/mapHelper";
import { groupBookingServices } from "../../utils/serviceMultiplierHelper";
import { useAuth } from "../../context/useAuth";
import {
  Calendar,
  Clock,
  CreditCard,
  ChevronRight,
  Scissors,
  MapPin,
  Navigation,
  Sparkles,
  User,
  ShoppingBag,
  CalendarClock,
  Check,
  CheckCircle2,
  UserCheck,
  X,
  AlertCircle,
  Crown,
} from "lucide-react";

export default function StaffBookingCard({
  booking,
  onOpenReschedule,
  onOpenBilling,
  onConfirm,
  onCheckIn,
  onComplete,
  onCancel,
  actionLoading = false,
  refresh,
}) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [profileModalOpen, setProfileModalOpen] = useState(false);

  const isOwnBranch =
    !user?.storeId ||
    !booking?.storeId ||
    String(user.storeId) === String(booking.storeId);

  const getStatusBadge = (status) => {
    switch (status) {
      case "CONFIRMED":
        return "bg-groomish-greenLight text-groomish-green border-groomish-green/30";
      case "COMPLETED":
        return "bg-groomish-blueLight text-groomish-blue border-groomish-blue/30";
      case "MODIFIED":
        return "bg-purple-100 text-purple-700 border-purple-200";
      case "CANCELLED":
        return "bg-groomish-crimsonLight text-groomish-crimson border-groomish-crimson/30";
      default:
        return "bg-amber-100 text-amber-800 border-amber-300";
    }
  };

  const rawServices = booking.items || booking.bookingItems || [];
  const groupedServices = groupBookingServices(rawServices);
  const rawProducts = booking.products || booking.bookingProducts || [];

  // Unified list: grouped services first, then products
  const unifiedItems = [
    ...groupedServices.map((g) => ({
      name: g.serviceName,
      quantity: g.quantity,
      type: "SERVICE",
    })),
    ...rawProducts.map((p) => ({
      name: p.productName || p.productNameSnapshot || p.product?.name || "Retail Product",
      quantity: p.quantity || 1,
      type: "PRODUCT",
    })),
  ];

  // Fallback if unifiedItems is empty but booking has serviceName
  if (unifiedItems.length === 0 && booking.serviceName) {
    unifiedItems.push({
      name: booking.serviceName,
      quantity: 1,
      type: "SERVICE",
    });
  }

  const firstItem = unifiedItems[0];
  const primaryName = firstItem?.name || "Salon Service";
  const primaryType = firstItem?.type || "SERVICE";
  const primaryQty = firstItem?.quantity || 1;

  // Additional items count (e.g. +1, +2)
  const additionalCount = unifiedItems.length > 1 ? unifiedItems.length - 1 : 0;

  const formattedDate = booking.scheduledAt
    ? new Date(booking.scheduledAt).toLocaleString(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "Date pending";

  const isTodayBooking = (() => {
    if (!booking.scheduledAt) return false;
    const d = new Date(booking.scheduledAt);
    const now = new Date();
    return (
      d.getFullYear() === now.getFullYear() &&
      d.getMonth() === now.getMonth() &&
      d.getDate() === now.getDate()
    );
  })();

  const isTodayActive =
    isTodayBooking &&
    (booking.status === "CONFIRMED" ||
      booking.status === "MODIFIED" ||
      booking.status === "PENDING");

  const rewardCoins =
    booking.expectedRewardPoints != null && booking.expectedRewardPoints > 0
      ? booking.expectedRewardPoints
      : Math.max(1, Math.round((booking.pricePaid ?? booking.totalAmount ?? 0) / 100));

  return (
    <>
      <div className="bg-white rounded-2xl border border-groomish-slate/10 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-soft hover:shadow-card transition">
        <div className="space-y-1.5 flex-1">
          {/* Status + Booking Code + User Profile shortcut */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <span
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${getStatusBadge(
                booking.status
              )}`}
            >
              {booking.status === "PENDING" ? "PENDING" : booking.status}
            </span>

            <Link
              to={`/staff/bookings/${booking.id}`}
              className="text-xs font-mono font-extrabold text-groomish-orange bg-groomish-orangeLight px-2 py-0.5 rounded-lg border border-groomish-orange/20 tracking-wider hover:bg-groomish-orange/20 transition"
              title="Click to view full appointment console"
            >
              {booking.bookingCode || (booking.id ? `GN-${booking.id.slice(0, 8).toUpperCase()}` : "GN-NEW")}
            </Link>

            {isTodayActive && (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500 text-white shadow-xs flex items-center gap-1 animate-pulse">
                <Sparkles className="w-3 h-3" />
                Today's Slot
              </span>
            )}

            {!isOwnBranch && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                View Only • Other Branch
              </span>
            )}

            {(booking.bookedBy || booking.userName) && (
              <span className="text-xs text-groomish-slate/70 font-semibold flex items-center gap-1">
                <span>•</span>
                {booking.userId ? (
                  <button
                    type="button"
                    onClick={() => setProfileModalOpen(true)}
                    className="hover:text-groomish-orange hover:underline underline-offset-2 transition text-groomish-slate font-bold inline-flex items-center gap-1 cursor-pointer"
                    title="Click to view client loyalty profile & booking history"
                  >
                    <User className="w-3 h-3 text-groomish-slate/40" />
                    <span>{booking.userName || booking.bookedBy}</span>
                  </button>
                ) : (
                  <span>{booking.userName || booking.bookedBy}</span>
                )}
              </span>
            )}
          </div>

          {/* Service / Product Heading with Multiplier and +1, +2 */}
          <h3 className="font-heading font-bold text-base text-groomish-slate flex items-center gap-2 flex-wrap">
            {primaryType === "PRODUCT" ? (
              <ShoppingBag className="w-4 h-4 text-groomish-orange shrink-0" />
            ) : (
              <Scissors className="w-4 h-4 text-groomish-orange shrink-0" />
            )}
            <span className="font-bold text-groomish-slate">{primaryName}</span>
            {primaryQty > 1 && (
              <span className="ml-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-extrabold bg-groomish-orange text-white">
                × {primaryQty}
              </span>
            )}
            {additionalCount > 0 && (
              <span className="text-xs font-bold text-groomish-orange bg-groomish-orangeLight border border-groomish-orange/20 px-2 py-0.5 rounded-full">
                +{additionalCount}
              </span>
            )}
          </h3>

          {/* Sub-row: Date, Branch location, Price, Coins */}
          <div className="flex items-center gap-4 text-xs text-groomish-slate/60 flex-wrap">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-groomish-slate/40" />
              {formattedDate}
            </span>

            {booking.storeName && (
              <a
                href={getBranchNavigationUrl(booking)}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="flex items-center gap-1.5 text-groomish-orange font-bold hover:underline"
                title="Click to view salon branch on Google Maps"
              >
                <MapPin className="w-3.5 h-3.5" />
                {booking.storeName}
                <Navigation className="w-3 h-3 text-groomish-orange/70" />
              </a>
            )}

            <span className="flex items-center gap-1.5 font-bold text-groomish-slate">
              <CreditCard className="w-3.5 h-3.5 text-groomish-slate/40" />
              ₹{booking.totalAmount != null && Number(booking.totalAmount) > 0 ? booking.totalAmount : (booking.pricePaid || 0)}
            </span>

            <span className="flex items-center gap-1 text-amber-700 font-bold bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full text-[11px]">
              <GroomCoinIcon className="w-3 h-3" />
              +{rewardCoins} Coins
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          {isOwnBranch && booking.status !== "CANCELLED" && booking.status !== "COMPLETED" && onOpenReschedule && (
            <button
              type="button"
              onClick={() => onOpenReschedule(booking)}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white text-groomish-slate border border-groomish-slate/15 hover:border-groomish-orange hover:text-groomish-orange font-bold text-xs transition shadow-soft cursor-pointer active:scale-95"
              title="Reschedule appointment date & time"
            >
              <CalendarClock className="w-3.5 h-3.5 text-groomish-orange" />
              <span>Reschedule</span>
            </button>
          )}

          {isOwnBranch && booking.status !== "CANCELLED" && onOpenBilling && (
            <button
              type="button"
              onClick={() => onOpenBilling(booking)}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-groomish-cream text-groomish-slate border border-groomish-slate/15 hover:border-groomish-orange hover:bg-groomish-orange/10 font-bold text-xs transition shadow-soft cursor-pointer active:scale-95"
              title="Add salon products & finalize bill"
            >
              <ShoppingBag className="w-3.5 h-3.5 text-groomish-orange" />
              <span>Bill & Products</span>
            </button>
          )}

          {/* CHECK IN: Confirmed -> Client Checkin */}
          {isOwnBranch && (booking.status === "CONFIRMED" || booking.status === "MODIFIED") && onCheckIn && (
            <button
              type="button"
              disabled={actionLoading}
              onClick={() => onCheckIn(booking.id)}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-sky-600 text-white font-bold text-xs hover:bg-sky-700 transition shadow-soft cursor-pointer active:scale-95"
              title="Check in client upon arrival at salon"
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Check In</span>
            </button>
          )}

          {/* COMPLETE & BILL: Checked In -> Complete and Bill */}
          {isOwnBranch && (booking.status === "CHECKED_IN" || booking.status === "IN_PROGRESS") && onComplete && (
            <button
              type="button"
              disabled={actionLoading}
              onClick={() => onComplete(booking.id)}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-groomish-blue text-white font-bold text-xs hover:bg-sky-600 transition shadow-soft cursor-pointer active:scale-95"
              title="Complete appointment and dispatch bill email"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Complete & Bill</span>
            </button>
          )}

          {isOwnBranch && booking.status === "PENDING" && (
            <>
              {onConfirm && (
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => onConfirm(booking.id)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-groomish-green text-white font-bold text-xs hover:bg-emerald-600 transition shadow-soft cursor-pointer active:scale-95"
                  title="Confirm appointment (payment verified at salon)"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Confirm</span>
                </button>
              )}
              {onCancel && (
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => onCancel(booking.id)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-groomish-crimsonLight text-groomish-crimson font-bold text-xs hover:bg-groomish-crimson hover:text-white transition cursor-pointer active:scale-95"
                  title="Cancel appointment"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Cancel</span>
                </button>
              )}
            </>
          )}

          <button
            type="button"
            onClick={() => navigate(`/staff/bookings/${booking.id}`)}
            className="btn-secondary text-xs px-3 py-1.5 inline-flex items-center gap-1 cursor-pointer active:scale-95"
            title="Click to view appointment details"
          >
            <span>Details</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Customer Profile Modal with Staff Endpoints */}
      {booking.userId && (
        <CustomerProfileModal
          customerId={booking.userId}
          initialData={{
            id: booking.userId,
            name: booking.userName || booking.bookedBy,
            email: booking.userEmail,
            phone: booking.userPhone,
          }}
          open={profileModalOpen}
          onClose={() => setProfileModalOpen(false)}
        />
      )}
    </>
  );
}
