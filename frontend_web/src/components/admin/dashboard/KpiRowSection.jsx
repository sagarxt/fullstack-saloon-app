import React from "react";
import {
  TrendingUp,
  Calendar,
  DollarSign,
  Users,
  CreditCard,
  Coins,
  Sparkles,
  Scissors,
  ShoppingBag,
  Percent,
  CheckCircle2,
  XCircle,
  AlertTriangle,
} from "lucide-react";

export default function KpiRowSection({ kpi }) {
  if (!kpi) return null;

  const totalRev = kpi.totalRevenue || 0;
  const servRev = kpi.servicesRevenue || 0;
  const prodRev = kpi.productsRevenue || 0;
  const servShare = totalRev > 0 ? Math.round((servRev / totalRev) * 100) : 0;
  const prodShare = totalRev > 0 ? 100 - servShare : 0;

  const totalBookings = kpi.totalBookings || 0;
  const completed = kpi.completedBookings || 0;
  const cancelled = kpi.cancelledBookings || 0;
  const noShow = kpi.noShowBookings || 0;
  const noShowRate = kpi.noShowRate || 0;
  const completionRate = kpi.completionRate || 0;

  const atv = kpi.averageTicketValue || 0;

  const newCust = kpi.newCustomers || 0;
  const returningCust = kpi.returningCustomers || 0;
  const returningRate = kpi.returningCustomerRate || 0;

  const onlineRev = kpi.onlinePaymentsRevenue || 0;
  const salonRev = kpi.payAtSalonRevenue || 0;
  const onlineShare = kpi.onlineSharePercent || 0;
  const salonShare = kpi.payAtSalonSharePercent || 0;

  const coinsIssued = kpi.groomCoinsIssued || 0;
  const coinsRedeemed = kpi.groomCoinsRedeemed || 0;
  const coinRedemptionRate = kpi.groomCoinsRedemptionRate || 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-heading font-extrabold text-groomish-slate uppercase tracking-wider flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-groomish-orange animate-pulse" />
            Core KPI Overview
          </h2>
          <p className="text-xs text-groomish-slate/60">
            Real-time business health, booking efficiency, customer loyalty, and checkout split.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* 1. TOTAL REVENUE (Services vs Products Split) */}
        <div className="bg-white rounded-3xl p-5 border border-groomish-slate/10 shadow-soft hover:shadow-md transition group">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-groomish-slate/50 uppercase tracking-wider">
              Total Revenue
            </span>
            <div className="w-9 h-9 rounded-2xl bg-groomish-orangeLight text-groomish-orange flex items-center justify-center group-hover:scale-105 transition">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-heading font-extrabold text-groomish-slate">
            ₹{totalRev.toLocaleString()}
          </div>
          {/* Services vs Products Split */}
          <div className="mt-3 pt-3 border-t border-groomish-slate/5">
            <div className="flex items-center justify-between text-[11px] mb-1.5 font-medium">
              <span className="flex items-center gap-1 text-groomish-slate/70">
                <Scissors className="w-3 h-3 text-groomish-orange" />
                Services: <strong className="text-groomish-slate font-bold">₹{servRev.toLocaleString()}</strong> ({servShare}%)
              </span>
              <span className="flex items-center gap-1 text-groomish-slate/70">
                <ShoppingBag className="w-3 h-3 text-groomish-blue" />
                Products: <strong className="text-groomish-slate font-bold">₹{prodRev.toLocaleString()}</strong> ({prodShare}%)
              </span>
            </div>
            {/* Visual Split Bar */}
            <div className="h-2 w-full bg-groomish-cream rounded-full overflow-hidden flex">
              <div
                style={{ width: `${servShare}%` }}
                className="bg-groomish-orange transition-all duration-500 rounded-l-full"
                title={`Services: ₹${servRev.toLocaleString()} (${servShare}%)`}
              />
              <div
                style={{ width: `${prodShare}%` }}
                className="bg-groomish-blue transition-all duration-500 rounded-r-full"
                title={`Products: ₹${prodRev.toLocaleString()} (${prodShare}%)`}
              />
            </div>
          </div>
        </div>

        {/* 2. BOOKINGS & NO-SHOW RATE */}
        <div className="bg-white rounded-3xl p-5 border border-groomish-slate/10 shadow-soft hover:shadow-md transition group">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-groomish-slate/50 uppercase tracking-wider">
              Bookings & Completion
            </span>
            <div className="w-9 h-9 rounded-2xl bg-groomish-blueLight text-groomish-blue flex items-center justify-center group-hover:scale-105 transition">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-heading font-extrabold text-groomish-slate">
              {totalBookings.toLocaleString()}
            </span>
            <span className="text-xs font-semibold text-groomish-slate/50">total</span>
            <span className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full bg-groomish-greenLight text-groomish-green">
              {completionRate}% Completed
            </span>
          </div>

          <div className="mt-3 pt-3 border-t border-groomish-slate/5 grid grid-cols-3 gap-2 text-center">
            <div className="bg-groomish-greenLight/40 rounded-xl p-1.5">
              <span className="text-[10px] text-groomish-slate/60 block font-medium">Completed</span>
              <span className="text-xs font-bold text-groomish-green font-mono">{completed}</span>
            </div>
            <div className="bg-groomish-crimsonLight/40 rounded-xl p-1.5">
              <span className="text-[10px] text-groomish-slate/60 block font-medium">Cancelled</span>
              <span className="text-xs font-bold text-groomish-crimson font-mono">{cancelled}</span>
            </div>
            <div className="bg-groomish-goldLight/70 rounded-xl p-1.5">
              <span className="text-[10px] text-groomish-slate/60 block font-medium">No-Show</span>
              <span className="text-xs font-bold text-groomish-orangeDark font-mono">
                {noShow} <span className="text-[9px]">({noShowRate}%)</span>
              </span>
            </div>
          </div>
        </div>

        {/* 3. AVERAGE TICKET VALUE (ATV) */}
        <div className="bg-white rounded-3xl p-5 border border-groomish-slate/10 shadow-soft hover:shadow-md transition group">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-groomish-slate/50 uppercase tracking-wider">
              Average Ticket Value (ATV)
            </span>
            <div className="w-9 h-9 rounded-2xl bg-groomish-goldLight text-groomish-orange flex items-center justify-center group-hover:scale-105 transition">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-heading font-extrabold text-groomish-slate">
            ₹{atv.toLocaleString()}
          </div>
          <p className="text-[11px] text-groomish-slate/60 mt-1">
            Average realization per completed appointment
          </p>
          <div className="mt-3 pt-3 border-t border-groomish-slate/5 flex items-center justify-between text-[11px]">
            <span className="text-groomish-slate/70">Spend efficiency</span>
            <span className="font-bold text-groomish-green bg-groomish-greenLight px-2 py-0.5 rounded-full text-[10px]">
              Healthy Basket
            </span>
          </div>
        </div>

        {/* 4. NEW VS RETURNING CUSTOMERS */}
        <div className="bg-white rounded-3xl p-5 border border-groomish-slate/10 shadow-soft hover:shadow-md transition group">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-groomish-slate/50 uppercase tracking-wider">
              New vs Returning Clients
            </span>
            <div className="w-9 h-9 rounded-2xl bg-groomish-greenLight text-groomish-green flex items-center justify-center group-hover:scale-105 transition">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <div className="text-2xl font-heading font-extrabold text-groomish-slate">
              {(newCust + returningCust).toLocaleString()}
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-groomish-blueLight text-groomish-blue">
              {returningRate}% Returning Rate
            </span>
          </div>
          <div className="mt-3 pt-3 border-t border-groomish-slate/5">
            <div className="flex items-center justify-between text-[11px] mb-1.5 font-medium">
              <span className="text-groomish-slate/70">
                New: <strong className="text-groomish-slate font-bold">{newCust}</strong>
              </span>
              <span className="text-groomish-slate/70">
                Returning: <strong className="text-groomish-green font-bold">{returningCust}</strong>
              </span>
            </div>
            <div className="h-2 w-full bg-groomish-cream rounded-full overflow-hidden flex">
              <div
                style={{
                  width: `${(newCust + returningCust) > 0 ? (newCust / (newCust + returningCust)) * 100 : 50}%`,
                }}
                className="bg-groomish-slateLight transition-all duration-500 rounded-l-full"
                title={`New: ${newCust}`}
              />
              <div
                style={{
                  width: `${(newCust + returningCust) > 0 ? (returningCust / (newCust + returningCust)) * 100 : 50}%`,
                }}
                className="bg-groomish-green transition-all duration-500 rounded-r-full"
                title={`Returning: ${returningCust}`}
              />
            </div>
          </div>
        </div>

        {/* 5. ONLINE VS PAY-AT-SALON SHARE */}
        <div className="bg-white rounded-3xl p-5 border border-groomish-slate/10 shadow-soft hover:shadow-md transition group">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-groomish-slate/50 uppercase tracking-wider">
              Online vs Salon Pay Share
            </span>
            <div className="w-9 h-9 rounded-2xl bg-groomish-coralLight text-groomish-coral flex items-center justify-center group-hover:scale-105 transition">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <div className="text-2xl font-heading font-extrabold text-groomish-slate">
              {onlineShare}% <span className="text-xs font-semibold text-groomish-slate/50">Online</span>
            </div>
            <span className="text-xs font-bold text-groomish-slate/70">
              {salonShare}% Salon
            </span>
          </div>
          <div className="mt-3 pt-3 border-t border-groomish-slate/5">
            <div className="flex items-center justify-between text-[11px] mb-1.5 font-medium">
              <span className="text-groomish-slate/70">
                Online: <strong className="text-groomish-slate font-bold">₹{onlineRev.toLocaleString()}</strong> ({kpi.onlineCount || 0})
              </span>
              <span className="text-groomish-slate/70">
                Salon: <strong className="text-groomish-slate font-bold">₹{salonRev.toLocaleString()}</strong> ({kpi.payAtSalonCount || 0})
              </span>
            </div>
            <div className="h-2 w-full bg-groomish-cream rounded-full overflow-hidden flex">
              <div
                style={{ width: `${onlineShare}%` }}
                className="bg-groomish-blue transition-all duration-500 rounded-l-full"
                title={`Online: ₹${onlineRev.toLocaleString()} (${onlineShare}%)`}
              />
              <div
                style={{ width: `${salonShare}%` }}
                className="bg-groomish-goldDark transition-all duration-500 rounded-r-full"
                title={`Pay-at-Salon: ₹${salonRev.toLocaleString()} (${salonShare}%)`}
              />
            </div>
          </div>
        </div>

        {/* 6. GROOM COINS ISSUED VS REDEEMED */}
        <div className="bg-white rounded-3xl p-5 border border-groomish-slate/10 shadow-soft hover:shadow-md transition group">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-groomish-slate/50 uppercase tracking-wider">
              Groom Coins (Loyalty)
            </span>
            <div className="w-9 h-9 rounded-2xl bg-groomish-goldLight text-groomish-goldDark flex items-center justify-center group-hover:scale-105 transition">
              <Coins className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <div className="text-2xl font-heading font-extrabold text-groomish-slate font-mono">
              {coinsIssued.toLocaleString()} <span className="text-xs font-sans font-semibold text-groomish-slate/50">Issued</span>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-groomish-goldLight text-groomish-orangeDark">
              {coinRedemptionRate}% Burn Rate
            </span>
          </div>
          <div className="mt-3 pt-3 border-t border-groomish-slate/5">
            <div className="flex items-center justify-between text-[11px] mb-1.5 font-medium">
              <span className="text-groomish-slate/70">
                Redeemed: <strong className="text-groomish-orange font-bold font-mono">{coinsRedeemed.toLocaleString()}</strong>
              </span>
              <span className="text-groomish-slate/70">
                Outstanding: <strong className="text-groomish-slate font-bold font-mono">{Math.max(0, coinsIssued - coinsRedeemed).toLocaleString()}</strong>
              </span>
            </div>
            <div className="h-2 w-full bg-groomish-cream rounded-full overflow-hidden flex">
              <div
                style={{ width: `${Math.min(100, coinRedemptionRate)}%` }}
                className="bg-groomish-goldDark transition-all duration-500 rounded-full"
                title={`Coins Burn Rate: ${coinRedemptionRate}%`}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
