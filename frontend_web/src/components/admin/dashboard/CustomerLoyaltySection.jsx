import React from "react";
import {
  Users,
  Award,
  Crown,
  Repeat,
  Calendar,
  Share2,
  TrendingUp,
  Sparkles,
  Phone,
  Mail,
  UserCheck,
} from "lucide-react";

export default function CustomerLoyaltySection({ customerLoyalty }) {
  if (!customerLoyalty) return null;

  const cohorts = customerLoyalty.cohorts || [];
  const tierMovements = customerLoyalty.tierMovements || [];
  const repeatRate = customerLoyalty.repeatVisitRate || 0;
  const avgDays = customerLoyalty.averageDaysBetweenVisits || 0;
  const repeatBookings = customerLoyalty.totalRepeatBookings || 0;

  const retention = customerLoyalty.retention || {
    rebookedWithin30Days: 0,
    rebooked30DaysRate: 0,
    rebookedWithin60Days: 0,
    rebooked60DaysRate: 0,
    rebookedWithin90Days: 0,
    rebooked90DaysRate: 0,
  };

  const topCustomers = customerLoyalty.topCustomers || [];
  const referrals = customerLoyalty.referralStats || {
    totalReferrers: 0,
    totalReferredUsers: 0,
    completedReferralBookings: 0,
    referralConversionRate: 0,
    referralBonusCoinsAwarded: 0,
  };

  const getTierBadgeClass = (tier) => {
    switch (tier) {
      case "DIAMOND":
        return "bg-cyan-100 text-cyan-800 border-cyan-300";
      case "PLATINUM":
        return "bg-purple-100 text-purple-800 border-purple-300";
      case "GOLD":
        return "bg-amber-100 text-amber-800 border-amber-300";
      case "SILVER":
        return "bg-slate-200 text-slate-700 border-slate-300";
      default:
        return "bg-groomish-cream text-groomish-slate border-groomish-slate/20";
    }
  };

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-heading font-extrabold text-groomish-slate uppercase tracking-wider flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-groomish-goldDark" />
            Customers, Retention & Loyalty Intelligence
          </h2>
          <p className="text-xs text-groomish-slate/60">
            Membership tier distribution, visit cadence, rebooking retention, and VIP customer ledger.
          </p>
        </div>
      </div>

      {/* 1. TIER COHORTS & RETENTION ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* MEMBERSHIP TIER COHORTS & TIER MOVEMENT */}
        <div className="bg-white rounded-3xl p-6 border border-groomish-slate/10 shadow-soft space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-heading font-bold text-sm text-groomish-slate flex items-center gap-2">
                <Crown className="w-4 h-4 text-groomish-goldDark" />
                Loyalty Tier Cohort Distribution
              </h3>
              <p className="text-xs text-groomish-slate/50">
                Client breakdown across Groomish loyalty progression tiers.
              </p>
            </div>
          </div>

          {/* Tier Distribution Bars */}
          <div className="space-y-3 pt-1">
            {cohorts.map((c) => (
              <div key={c.tier} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 font-bold text-groomish-slate">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: c.colorHex || "#FA7B47" }}
                    />
                    <span>{c.tier}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-groomish-slate/60 text-[11px]">{c.count} members</span>
                    <span className="font-mono font-bold text-groomish-slate text-xs">{c.percentage}%</span>
                  </div>
                </div>
                <div className="h-2 w-full bg-groomish-cream rounded-full overflow-hidden">
                  <div
                    style={{
                      width: `${c.percentage}%`,
                      backgroundColor: c.colorHex || "#FA7B47",
                    }}
                    className="h-full rounded-full transition-all duration-500"
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Tier Movement Sub-section */}
          <div className="pt-3 border-t border-groomish-slate/10">
            <h4 className="text-xs font-bold text-groomish-slate mb-2 flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-groomish-green" />
              <span>Tier Upgrades in Selected Period</span>
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {tierMovements.map((tm) => (
                <div key={tm.tier} className="bg-groomish-cream/40 rounded-xl p-2.5 border border-groomish-slate/5 text-center">
                  <span className="text-[10px] text-groomish-slate/60 font-medium block">{tm.tier}</span>
                  <div className="text-sm font-mono font-extrabold text-groomish-green mt-0.5">
                    +{tm.upgradedInPeriod}
                  </div>
                  <span className="text-[9px] text-groomish-slate/50 font-mono block">
                    {tm.upgradeRate}% upgrade
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* REPEAT VISIT RATE & RETENTION (30 / 60 / 90 DAYS) */}
        <div className="bg-white rounded-3xl p-6 border border-groomish-slate/10 shadow-soft space-y-4">
          <div>
            <h3 className="font-heading font-bold text-sm text-groomish-slate flex items-center gap-2">
              <Repeat className="w-4 h-4 text-groomish-blue" />
              Customer Retention & Rebooking Cohorts
            </h3>
            <p className="text-xs text-groomish-slate/50">
              Frequency of repeat salon visits and time elapsed between appointments.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-groomish-blueLight/50 rounded-2xl p-4 border border-groomish-blue/10">
              <span className="text-xs text-groomish-slate/70 font-semibold block">Repeat Visit Rate</span>
              <div className="text-2xl font-mono font-extrabold text-groomish-blue mt-1">
                {repeatRate}%
              </div>
              <span className="text-[10px] text-groomish-slate/50 mt-1 block">
                {repeatBookings} recurring bookings
              </span>
            </div>

            <div className="bg-groomish-goldLight/60 rounded-2xl p-4 border border-groomish-gold/30">
              <span className="text-xs text-groomish-slate/70 font-semibold block">Visit Cadence</span>
              <div className="text-2xl font-mono font-extrabold text-groomish-orangeDark mt-1">
                {avgDays} <span className="text-xs font-sans font-semibold text-groomish-slate/60">days</span>
              </div>
              <span className="text-[10px] text-groomish-slate/50 mt-1 block">
                Average cycle between salon visits
              </span>
            </div>
          </div>

          {/* Retention Windows: 30 / 60 / 90 Days */}
          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-bold text-groomish-slate">Rebooking Retention Benchmarks</h4>

            {/* 30 Days */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-groomish-slate font-medium">Rebooked within 30 Days (Fast Return)</span>
                <span className="font-mono font-bold text-groomish-green">
                  {retention.rebooked30DaysRate}% ({retention.rebookedWithin30Days})
                </span>
              </div>
              <div className="h-2 w-full bg-groomish-cream rounded-full overflow-hidden">
                <div
                  style={{ width: `${retention.rebooked30DaysRate}%` }}
                  className="h-full bg-groomish-green rounded-full transition-all duration-500"
                />
              </div>
            </div>

            {/* 60 Days */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-groomish-slate font-medium">Rebooked within 60 Days (Regular)</span>
                <span className="font-mono font-bold text-groomish-blue">
                  {retention.rebooked60DaysRate}% ({retention.rebookedWithin60Days})
                </span>
              </div>
              <div className="h-2 w-full bg-groomish-cream rounded-full overflow-hidden">
                <div
                  style={{ width: `${retention.rebooked60DaysRate}%` }}
                  className="h-full bg-groomish-blue rounded-full transition-all duration-500"
                />
              </div>
            </div>

            {/* 90 Days */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-groomish-slate font-medium">Rebooked within 90 Days (Quarterly)</span>
                <span className="font-mono font-bold text-groomish-orange">
                  {retention.rebooked90DaysRate}% ({retention.rebookedWithin90Days})
                </span>
              </div>
              <div className="h-2 w-full bg-groomish-cream rounded-full overflow-hidden">
                <div
                  style={{ width: `${retention.rebooked90DaysRate}%` }}
                  className="h-full bg-groomish-orange rounded-full transition-all duration-500"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. REFERRAL CONVERSIONS CARD */}
      <div className="bg-gradient-to-r from-groomish-orangeLight/60 via-groomish-goldLight/40 to-groomish-cream rounded-3xl p-6 border border-groomish-orange/20 shadow-soft">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-xl bg-groomish-orange text-white flex items-center justify-center shadow-sm">
                <Share2 className="w-4 h-4" />
              </div>
              <h3 className="font-heading font-extrabold text-sm text-groomish-slate">
                Customer Referral & Viral Growth Funnel
              </h3>
            </div>
            <p className="text-xs text-groomish-slate/60">
              Word-of-mouth client acquisition and referral reward distribution.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-groomish-slate/70">Conversion Rate:</span>
            <span className="text-sm font-extrabold font-mono text-groomish-orange bg-white px-3 py-1 rounded-2xl border border-groomish-orange/20 shadow-sm">
              {referrals.referralConversionRate}%
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-3 border-t border-groomish-orange/15">
          <div className="bg-white/80 rounded-2xl p-3 border border-groomish-slate/5 text-center">
            <span className="text-[10px] font-bold text-groomish-slate/50 uppercase block">Active Referrers</span>
            <span className="text-lg font-mono font-extrabold text-groomish-slate">{referrals.totalReferrers}</span>
          </div>
          <div className="bg-white/80 rounded-2xl p-3 border border-groomish-slate/5 text-center">
            <span className="text-[10px] font-bold text-groomish-slate/50 uppercase block">Referred Signups</span>
            <span className="text-lg font-mono font-extrabold text-groomish-slate">{referrals.totalReferredUsers}</span>
          </div>
          <div className="bg-white/80 rounded-2xl p-3 border border-groomish-slate/5 text-center">
            <span className="text-[10px] font-bold text-groomish-slate/50 uppercase block">Completed Bookings</span>
            <span className="text-lg font-mono font-extrabold text-groomish-green">{referrals.completedReferralBookings}</span>
          </div>
          <div className="bg-white/80 rounded-2xl p-3 border border-groomish-slate/5 text-center">
            <span className="text-[10px] font-bold text-groomish-slate/50 uppercase block">Bonus Coins Given</span>
            <span className="text-lg font-mono font-extrabold text-groomish-orange">{referrals.referralBonusCoinsAwarded}</span>
          </div>
        </div>
      </div>

      {/* 3. TOP CUSTOMERS BY LIFETIME SPEND TABLE */}
      <div className="bg-white rounded-3xl p-6 border border-groomish-slate/10 shadow-soft space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-heading font-bold text-sm text-groomish-slate flex items-center gap-2">
              <Award className="w-4 h-4 text-groomish-orange" />
              Top 10 VIP Customers by Lifetime Spend
            </h3>
            <p className="text-xs text-groomish-slate/50">
              Highest-value salon clientele ranked by cumulative billing across all visits.
            </p>
          </div>
          <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-groomish-cream text-groomish-slate/70">
            VIP Tier Leaderboard
          </span>
        </div>

        {topCustomers.length === 0 ? (
          <div className="py-8 text-center text-xs text-groomish-slate/40">
            No customer spend records found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-groomish-cream/60 border-b border-groomish-slate/10 text-groomish-slate/60 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-2.5 px-4">Rank</th>
                  <th className="py-2.5 px-4">Client Name</th>
                  <th className="py-2.5 px-4 text-center">Tier</th>
                  <th className="py-2.5 px-4">Contact</th>
                  <th className="py-2.5 px-4 text-center">Completed Visits</th>
                  <th className="py-2.5 px-4">Last Visited</th>
                  <th className="py-2.5 px-4 text-right">Lifetime Spend</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-groomish-slate/5">
                {topCustomers.map((cust, idx) => (
                  <tr key={cust.userId || idx} className="hover:bg-groomish-cream/30 transition">
                    <td className="py-3 px-4 font-mono font-bold text-groomish-slate/60">
                      <span className={`w-5 h-5 rounded-full inline-flex items-center justify-center text-[10px] ${
                        idx === 0 ? "bg-amber-400 text-white font-extrabold" : idx === 1 ? "bg-slate-300 text-slate-800" : idx === 2 ? "bg-amber-700 text-white" : "bg-groomish-cream text-groomish-slate"
                      }`}>
                        #{idx + 1}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-bold text-groomish-slate">
                      {cust.name}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getTierBadgeClass(cust.tier)}`}>
                        {cust.tier}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-groomish-slate/70">
                      <div className="flex flex-col text-[11px]">
                        <span>{cust.phone || "—"}</span>
                        <span className="text-[10px] text-groomish-slate/50">{cust.email}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center font-mono font-bold text-groomish-slate">
                      {cust.totalBookings}
                    </td>
                    <td className="py-3 px-4 text-groomish-slate/70 font-mono text-[11px]">
                      {cust.lastVisited
                        ? new Date(cust.lastVisited).toLocaleDateString(undefined, {
                            dateStyle: "medium",
                          })
                        : "N/A"}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-extrabold text-groomish-orange text-sm">
                      ₹{(cust.lifetimeSpend || 0).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
