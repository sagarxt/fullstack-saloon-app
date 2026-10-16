import { useNavigate } from "react-router-dom";
import GroomCoinIcon from "../common/GroomCoinIcon";
import { getBranchNavigationUrl } from "../../utils/mapHelper";
import { groupBookingServices } from "../../utils/serviceMultiplierHelper";
import { Calendar, Clock, CreditCard, ChevronRight, Scissors, MapPin, Navigation, Sparkles } from "lucide-react";

export default function BookingCard({ booking, refresh }) {
  const navigate = useNavigate();

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

  const groupedServices = groupBookingServices(booking.items || []);
  const firstGroup = groupedServices[0];
  const firstItem = booking.items?.[0];

  const serviceName =
    firstGroup?.serviceName ||
    firstItem?.serviceName ||
    firstItem?.serviceNameSnapshot ||
    firstItem?.service?.name ||
    booking.serviceName ||
    (booking.products?.length > 0
      ? booking.products[0]?.productName || "Retail Product"
      : "Salon Service");

  const additionalCount = groupedServices.length > 1
    ? groupedServices.length - 1
    : (booking.items?.length > 1 ? booking.items.length - 1 : 0);

  // Format date
  const formattedDate = booking.scheduledAt ? new Date(booking.scheduledAt).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }) : "Date pending";

  const rewardCoins =
    booking.expectedRewardPoints != null && booking.expectedRewardPoints > 0
      ? booking.expectedRewardPoints
      : Math.floor((booking.pricePaid || 0) / 100);

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

  return (
    <div className="card-groomish p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all hover:border-groomish-orange/30">
      <div className="space-y-1.5 flex-1">
        <div className="flex items-center gap-2.5 flex-wrap">
          <span
            className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border uppercase tracking-wider ${getStatusBadge(
              booking.status
            )}`}
          >
            {booking.status}
          </span>
          <span className="text-xs font-mono font-extrabold text-groomish-orange bg-groomish-orangeLight px-2 py-0.5 rounded-lg border border-groomish-orange/20 tracking-wider">
            {booking.bookingCode || (booking.id ? `GN-${booking.id.slice(0, 8).toUpperCase()}` : "GN-NEW")}
          </span>
          {isTodayActive && (
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-amber-500 text-white shadow-sm flex items-center gap-1 animate-pulse">
              <Sparkles className="w-3 h-3" />
              Today's Slot
            </span>
          )}
        </div>

        <h3 className="font-heading font-bold text-base text-groomish-slate flex items-center gap-2">
          <Scissors className="w-4 h-4 text-groomish-orange shrink-0" />
          <span className="font-bold text-groomish-slate">{serviceName}</span>
          {/* <span>
            {firstGroup?.quantity > 1 && (
              <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] font-extrabold bg-groomish-orange text-white">
                × {firstGroup.quantity}
              </span>
            )}
          </span> */}
          {additionalCount > 0 && (
            <span className="text-xs font-normal text-groomish-slate/60">
              +{additionalCount} more
            </span>
          )}
        </h3>

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
              className="flex items-center gap-1 text-groomish-orange hover:text-groomish-coral font-semibold hover:underline"
              title="Navigate to Branch (Google Maps)"
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>{booking.storeName}</span>
              <Navigation className="w-2.5 h-2.5 ml-0.5" />
            </a>
          )}
          <span className="flex items-center gap-1.5 font-bold text-groomish-slate">
            <CreditCard className="w-3.5 h-3.5 text-groomish-slate/40" />
            ₹{booking.pricePaid}
          </span>
          {booking.status === "COMPLETED" ? (
            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-groomish-green bg-groomish-greenLight px-2 py-0.5 rounded-lg border border-groomish-green/20">
              <GroomCoinIcon className="w-3.5 h-3.5 shrink-0" />
              <span>{rewardCoins} Groom Coin Confirmed</span>
            </span>
          ) : booking.status === "CANCELLED" ? (
            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-groomish-slate/40 bg-gray-100 px-2 py-0.5 rounded-lg border border-gray-200">
              <GroomCoinIcon className="w-3.5 h-3.5 shrink-0 grayscale opacity-50" />
              <span>0 Groom Coin (Cancelled)</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-300">
              <GroomCoinIcon className="w-3.5 h-3.5 shrink-0" />
              <span>{rewardCoins} Groom Coin Pending</span>
            </span>
          )}
        </div>
      </div>

      {/* Action Button: Exclusively View Details */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={() => navigate(`/customer/bookings/${booking.id}`)}
          className="btn-primary text-xs px-4 py-2"
        >
          <span>View Details</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
