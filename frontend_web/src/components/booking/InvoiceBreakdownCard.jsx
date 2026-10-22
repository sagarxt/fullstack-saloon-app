import React, { useMemo } from "react";
import { CreditCard, Tag, AlertCircle, CheckCircle2, Clock } from "lucide-react";
import { useGroomCoin } from "../../context/GroomCoinContext";
import GroomCoinIcon from "../common/GroomCoinIcon";

export function calculateInvoiceBreakdown(booking) {
  if (!booking) return null;

  // Services MRP sum
  const items = booking.items || booking.bookingItems || [];
  const servicesMrp = items.reduce((sum, item) => {
    const price = Number(item.servicePriceSnapshot ?? item.price ?? item.service?.price ?? 0);
    const rawMrp = Number(item.subServiceMrp ?? item.mrp ?? item.serviceMrp ?? item.service?.mrp ?? price);
    const mrp = Math.max(rawMrp, price);
    return sum + mrp;
  }, 0);

  // Products MRP sum
  const products = booking.products || booking.bookingProducts || [];
  const productsMrp = products.reduce((sum, prod) => {
    const price = Number(prod.unitPriceSnapshot ?? prod.unitPrice ?? 0);
    const rawMrp = Number(prod.mrp ?? prod.productMrp ?? price);
    const mrp = Math.max(rawMrp, price);
    const qty = Number(prod.quantity ?? 1);
    return sum + (mrp * qty);
  }, 0);

  const calculatedTotalMrp = servicesMrp + productsMrp;
  const baseAmount = Number(booking.totalAmount ?? 0);
  const subtotal = calculatedTotalMrp > baseAmount ? calculatedTotalMrp : baseAmount;
  const mrpDiscount = Math.max(0, subtotal - baseAmount);

  // Coupon or Voucher discount
  const paid = Number(booking.pricePaid ?? baseAmount);
  const codeDiscount = Math.max(0, baseAmount - paid);

  const couponCode = booking.couponApplied || booking.couponCode;
  const isVoucher = Boolean(
    couponCode &&
    (couponCode.toUpperCase().includes("VOUCH") ||
     couponCode.toUpperCase().includes("VIP"))
  );

  return {
    subtotal,
    mrpDiscount,
    couponOrVoucherCode: couponCode,
    isVoucher,
    codeDiscount,
    finalPayable: paid,
  };
}

export default function InvoiceBreakdownCard({
  booking,
  className = "",
  title = "Invoice Breakdown",
  children,
}) {
  const { calculateCoins: calcCoinsContext } = useGroomCoin?.() || {};

  const calculateCoins = (amount) => {
    if (typeof calcCoinsContext === "function") {
      return calcCoinsContext(amount);
    }
    const val = Number(amount) || 0;
    return Math.max(1, Math.round(val / 100));
  };

  const invoiceBreakdown = useMemo(() => calculateInvoiceBreakdown(booking), [booking]);

  if (!booking) return null;

  const paymentMethodLabel = (() => {
    const m = (booking.paymentMethod || "").toUpperCase();
    if (m === "ONLINE" || m === "RAZORPAY") return "Online Payment";
    if (m === "CASH") return "Pay at Salon";
    if (m === "UPI") return "Online (UPI)";
    if (m === "CARD") return "Online (Card)";
    return booking.paymentMethod || "Online Payment";
  })();

  const isCompleted = booking.status === "COMPLETED" || booking.paymentStatus === "COMPLETED";
  const isCancelled = booking.status === "CANCELLED" || booking.paymentStatus === "CANCELLED";

  return (
    <div className={`card-groomish p-4 sm:p-5 space-y-3 bg-white ${className}`}>
      <h2 className="text-base font-heading font-bold text-groomish-slate flex items-center gap-2 border-b border-groomish-slate/10 pb-2.5">
        <CreditCard className="w-4 h-4 text-groomish-orange" />
        <span>{title}</span>
      </h2>

      <div className="space-y-2 text-xs text-groomish-slate/80">
        {/* Subtotal (Sum of MRP) */}
        <div className="flex justify-between py-1">
          <span>Subtotal</span>
          <span className="font-semibold text-groomish-slate">
            ₹{invoiceBreakdown?.subtotal ?? booking.totalAmount ?? 0}
          </span>
        </div>

        {/* Discount on MRP */}
        {invoiceBreakdown?.mrpDiscount > 0 && (
          <div className="flex justify-between py-1 text-groomish-green font-semibold">
            <span className="flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5" />
              <span>Discount on MRP</span>
            </span>
            <span>-₹{invoiceBreakdown.mrpDiscount}</span>
          </div>
        )}

        {/* Coupon Applied */}
        {invoiceBreakdown?.couponOrVoucherCode && !invoiceBreakdown.isVoucher && (
          <div className="flex justify-between py-1 text-groomish-green font-semibold">
            <span className="flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5" />
              <span>Coupon Applied ({invoiceBreakdown.couponOrVoucherCode})</span>
            </span>
            <span>-₹{invoiceBreakdown.codeDiscount}</span>
          </div>
        )}

        {/* Voucher Applied */}
        {invoiceBreakdown?.couponOrVoucherCode && invoiceBreakdown.isVoucher && (
          <div className="flex justify-between py-1 text-groomish-green font-semibold">
            <span className="flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5" />
              <span>Voucher Applied ({invoiceBreakdown.couponOrVoucherCode})</span>
            </span>
            <span>-₹{invoiceBreakdown.codeDiscount}</span>
          </div>
        )}

        {/* Salon Hygiene & Taxes */}
        <div className="flex justify-between py-1">
          <span className="text-groomish-slate/70">Salon Hygiene & Taxes</span>
          <span className="text-groomish-green font-bold text-[11px]">FREE</span>
        </div>

        {/* Divider before Final Payable */}
        <div className="border-t border-dashed border-groomish-slate/20 pt-2.5 flex justify-between text-base font-heading font-extrabold text-groomish-slate">
          <span>Final Payable</span>
          <span className="text-groomish-orange font-black text-lg">
            ₹{booking.pricePaid ?? booking.totalAmount ?? 0}
          </span>
        </div>

        {/* Payment Method */}
        <div className="flex justify-between items-center py-1 pt-1.5 border-t border-groomish-slate/10">
          <span className="text-groomish-slate/70">Payment Method</span>
          <span className="font-bold text-groomish-slate">{paymentMethodLabel}</span>
        </div>

        {/* Payment Status */}
        <div className="flex justify-between items-center py-1">
          <span className="text-groomish-slate/70">Payment Status</span>
          <div>
            {isCancelled ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>Cancelled • No Payment Received</span>
              </span>
            ) : isCompleted ? (
              booking.paymentMethod === "CASH" ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-groomish-greenLight text-groomish-green border border-groomish-green/30">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Paid at Salon</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-groomish-greenLight text-groomish-green border border-groomish-green/30">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>
                    Paid Online ({booking.paymentMethod === "ONLINE" ? "Razorpay" : booking.paymentMethod || "Razorpay"})
                  </span>
                </span>
              )
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                <Clock className="w-3.5 h-3.5" />
                <span>
                  {booking.paymentMethod === "ONLINE"
                    ? "Payment Pending (Online)"
                    : "Payment Pending (Pay at Salon)"}
                </span>
              </span>
            )}
          </div>
        </div>

        {/* Invoice Ref */}
        {booking.invoiceNumber && !isCancelled && (
          <div className="flex justify-between items-center py-1 text-[11px] text-groomish-slate/60">
            <span>Invoice Ref</span>
            <span className="font-mono font-bold text-groomish-slate/80">{booking.invoiceNumber}</span>
          </div>
        )}
      </div>

      {/* Optional Children Actions (e.g. Pay Online, Finalize & Bill) */}
      {children}

      {/* Groom Coins Section */}
      {isCancelled ? (
        <div className="p-2.5 bg-rose-50 rounded-lg border border-rose-200 flex items-center gap-2 text-xs text-rose-800">
          <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
          <span>
            <strong>Groom Coins Cancelled:</strong> 0 Groom Coins credited (appointment was cancelled).
          </span>
        </div>
      ) : isCompleted ? (
        <div className="p-2.5 bg-groomish-greenLight/60 rounded-lg border border-groomish-green/30 flex items-center gap-2 text-xs text-groomish-slate">
          <GroomCoinIcon className="w-3.5 h-3.5 shrink-0" />
          <span>
            ✓ <strong>Confirmed:</strong> Client earned{" "}
            <strong className="font-bold text-groomish-green">
              +{booking.expectedRewardPoints ?? calculateCoins(booking.pricePaid ?? booking.totalAmount)} Groom Coins
            </strong>{" "}
            on this completed appointment!
          </span>
        </div>
      ) : (
        <div className="p-2.5 bg-amber-50 rounded-lg border border-amber-300/60 flex items-center gap-2 text-xs text-amber-900">
          <GroomCoinIcon className="w-3.5 h-3.5 shrink-0" />
          <span>
            ⏳{" "}
            <strong className="font-bold text-amber-700">
              +{booking.expectedRewardPoints ?? calculateCoins(booking.pricePaid ?? booking.totalAmount)} Pending Groom Coins.
            </strong>{" "}
            Confirmed upon appointment completion.
          </span>
        </div>
      )}
    </div>
  );
}
