import { Link } from "react-router-dom";
import { ArrowDownLeft, ArrowUpRight, Gift, Sparkles, ExternalLink, Ticket, Scissors } from "lucide-react";

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
    <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 hover:bg-groomish-cream/40 transition gap-3">
      <div className="flex items-start gap-3">
        <div
          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
            isCredit
              ? "bg-groomish-greenLight text-groomish-green"
              : "bg-groomish-crimsonLight text-groomish-crimson"
          }`}
        >
          {isCredit ? (
            <ArrowDownLeft className="w-4 h-4" />
          ) : (
            <ArrowUpRight className="w-4 h-4" />
          )}
        </div>

        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-bold text-xs text-groomish-slate">
              {item.reason ? item.reason.replaceAll("_", " ") : "Points Activity"}
            </span>

            {/* Tracked Order / Booking ID */}
            {item.bookingCode && (
              <Link
                to={`/customer/bookings/${item.bookingId || item.relatedId}`}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-groomish-orange/15 text-groomish-orange hover:bg-groomish-orange/25 transition border border-groomish-orange/20"
                title="View full booking invoice"
              >
                <span>Order: {item.bookingCode}</span>
                <ExternalLink className="w-2.5 h-2.5" />
              </Link>
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

          {/* Service Name & Bill Amount details */}
          {(item.serviceName || item.orderAmount !== undefined || item.note) && (
            <div className="flex flex-wrap items-center gap-2 text-[11px] text-groomish-slateLight">
              {item.serviceName && (
                <span className="flex items-center gap-1 text-groomish-slate font-medium">
                  <Scissors className="w-3 h-3 text-groomish-orange shrink-0" />
                  <span className="line-clamp-1">{item.serviceName}</span>
                </span>
              )}

              {item.orderAmount !== undefined && item.orderAmount !== null && (
                <span className="font-bold text-groomish-slate">
                  • Bill: ₹{Number(item.orderAmount).toLocaleString()}
                </span>
              )}

              {item.note && !item.serviceName && (
                <span>• {item.note}</span>
              )}
            </div>
          )}

          <p className="text-[10px] text-groomish-slate/40">
            {formattedDate}
            {!item.bookingCode && !item.voucherCode && item.relatedId && ` • Ref: ${item.relatedId.slice(0, 8)}`}
          </p>
        </div>
      </div>

      <div
        className={`font-extrabold text-sm flex items-center sm:justify-end gap-1 shrink-0 ${
          isCredit ? "text-groomish-green" : "text-groomish-crimson"
        }`}
      >
        <span>
          {isCredit ? "+" : ""}
          {amount}
        </span>
        <span className="text-[11px] font-semibold text-groomish-slate/60">
          pts
        </span>
      </div>
    </div>
  );
}
