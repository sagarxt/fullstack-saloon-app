import { Link } from "react-router-dom";
import { ArrowDownLeft, ArrowUpRight, Gift, Sparkles, ExternalLink, Ticket, Scissors } from "lucide-react";
import GroomCoinIcon from "../common/GroomCoinIcon";

export default function RewardLedgerItem({ item }) {
  const amount = Number(item.changeAmount) || 0;
  const isCredit = amount > 0;

  const formattedDate = item.createdAt
    ? new Date(item.createdAt).toLocaleString(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "Recent";

  return (
    <div className="flex items-center justify-between p-3.5 sm:p-4 hover:bg-groomish-cream/40 transition gap-3">
      <div className="flex items-center gap-3 min-w-0">
        <div
          className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0 ${
            isCredit
              ? "bg-groomish-greenLight text-groomish-green"
              : "bg-groomish-crimsonLight text-groomish-crimson"
          }`}
        >
          {isCredit ? (
            <ArrowDownLeft className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
          ) : (
            <ArrowUpRight className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
          )}
        </div>

        <div className="min-w-0 space-y-0.5 sm:space-y-1">
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            <span className="font-bold text-xs sm:text-sm text-groomish-slate leading-tight">
              {item.reason ? item.reason.replaceAll("_", " ") : "Points Activity"}
            </span>

            {/* Tracked Order / Booking ID */}
            {item.bookingCode && (
              <Link
                to={`/customer/bookings/${item.bookingId || item.relatedId}`}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-extrabold bg-groomish-orange/15 text-groomish-orange hover:bg-groomish-orange/25 transition border border-groomish-orange/20"
                title="View full booking invoice"
              >
                <span>Order: {item.bookingCode}</span>
                <ExternalLink className="w-2.5 h-2.5" />
              </Link>
            )}

            {/* Referral Tag */}
            {item.reason === "REFERRAL_BONUS" && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-groomish-green/15 text-groomish-green border border-groomish-green/20">
                <Gift className="w-2.5 h-2.5" />
                <span>Friend Referral Reward</span>
              </span>
            )}

            {/* Tracked Voucher Code */}
            {item.voucherCode && (
              <Link
                to="/customer/vouchers"
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-groomish-goldLight text-groomish-goldDark hover:bg-groomish-goldLight/80 transition border border-groomish-gold/30"
                title="View redeemed voucher"
              >
                <Ticket className="w-2.5 h-2.5" />
                <span>Voucher: {item.voucherCode}</span>
              </Link>
            )}
          </div>

          {/* Referral note if applicable */}
          {item.note && item.reason === "REFERRAL_BONUS" && (
            <p className="text-[11px] text-groomish-slate/70 font-medium">
              {item.note}
            </p>
          )}

          <p className="text-[10px] sm:text-[11px] text-groomish-slate/40">
            {formattedDate}
            {!item.bookingCode && !item.voucherCode && item.relatedId && ` • Ref: ${item.relatedId.slice(0, 8)}`}
          </p>
        </div>
      </div>

      <div
        className={`font-extrabold text-xs sm:text-sm flex items-center justify-end gap-1 shrink-0 ${
          isCredit ? "text-groomish-green" : "text-groomish-crimson"
        }`}
      >
        <span>
          {isCredit ? "+" : ""}
          {amount}
        </span>
        <GroomCoinIcon className="w-3.5 h-3.5" />
        <span className="text-[10px] sm:text-[11px] font-semibold text-groomish-slate/60">
          Coins
        </span>
      </div>
    </div>
  );
}
