import { useEffect, useState } from "react";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import {
  getRewardBalance,
  getRewardLedger,
  getAvailableRewards,
  redeemReward,
} from "../../api/customer";
import RewardLedgerItem from "../../components/customer/RewardLedgerItem";
import { extractList } from "../../utils/dataHelper";
import {
  Gift,
  Sparkles,
  Crown,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ArrowRight,
  Flame,
  Award,
} from "lucide-react";

export default function RewardsPage() {
  const [balance, setBalance] = useState(0);
  const [tier, setTier] = useState("SILVER");
  const [ledger, setLedger] = useState([]);
  const [rewards, setRewards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [redeemLoading, setRedeemLoading] = useState(null);
  const [alert, setAlert] = useState({ type: "", message: "" });

  const loadData = async () => {
    setLoading(true);
    try {
      const [balRes, ledgerRes, rewRes] = await Promise.all([
        getRewardBalance(),
        getRewardLedger(),
        getAvailableRewards().catch(() => ({ data: [] })),
      ]);

      setBalance(balRes.data?.points || 0);
      setTier(balRes.data?.tier || "SILVER");
      setLedger(extractList(ledgerRes.data));
      setRewards(extractList(rewRes.data));
    } catch (err) {
      console.error(err);
      setLedger([]);
      setRewards([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRedeem = async (rewardId, cost) => {
    if (balance < cost) {
      setAlert({
        type: "error",
        message: `You need ${cost} points to redeem this reward. Current balance: ${balance} points.`,
      });
      return;
    }

    setRedeemLoading(rewardId);
    setAlert({ type: "", message: "" });

    try {
      await redeemReward(rewardId);
      setAlert({
        type: "success",
        message: "Reward redeemed successfully! Check your notifications & email for voucher details.",
      });
      loadData();
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to redeem reward. Please try again.";
      setAlert({ type: "error", message: msg });
    } finally {
      setRedeemLoading(null);
    }
  };

  // Next tier calculation
  const getNextTierInfo = () => {
    if (tier === "SILVER") return { next: "GOLD", target: 50, color: "text-groomish-gold" };
    if (tier === "GOLD") return { next: "PLATINUM", target: 150, color: "text-groomish-blue" };
    if (tier === "PLATINUM") return { next: "DIAMOND", target: 300, color: "text-groomish-coral" };
    return { next: "MAX", target: 500, color: "text-groomish-orange" };
  };

  const nextTier = getNextTierInfo();
  const progressPercent = Math.min(100, Math.round((balance / nextTier.target) * 100));

  const ledgerList = extractList(ledger);
  const rewardList = extractList(rewards);

  return (
    <div className="min-h-screen bg-groomish-cream flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-groomish-orange mb-1">
            <Gift className="w-4 h-4" />
            <span>Groomish Club Loyalty</span>
          </div>
          <h1 className="text-3xl font-heading font-extrabold text-groomish-slate">
            Rewards & VIP Status
          </h1>
          <p className="text-sm text-groomish-slate/60 mt-1">
            Earn 1 point for every ₹100 spent at Groomish Now. Unlock tier privileges and exclusive salon perks.
          </p>
        </div>

        {alert.message && (
          <div
            className={`p-4 rounded-2xl mb-6 flex items-center gap-3 text-xs font-semibold animate-fade-in ${
              alert.type === "success"
                ? "bg-groomish-green/10 border border-groomish-green/20 text-groomish-green"
                : "bg-groomish-crimson/10 border border-groomish-crimson/20 text-groomish-crimson"
            }`}
          >
            {alert.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            <span>{alert.message}</span>
          </div>
        )}

        {/* HERO VIP STATUS CARD */}
        <div className="relative overflow-hidden bg-gradient-to-br from-groomish-slate to-groomish-slateDark text-white rounded-3xl p-6 sm:p-8 shadow-card mb-8">
          {/* Subtle brand glow circles */}
          <div className="absolute -right-16 -top-16 w-60 h-60 bg-groomish-orange/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute right-32 -bottom-20 w-60 h-60 bg-groomish-gold/15 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-bold border border-white/10">
                <Crown className="w-3.5 h-3.5 text-groomish-gold" />
                <span>{tier} Member Tier</span>
              </div>

              <div>
                <p className="text-xs text-white/60 font-medium">Available Balance</p>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-4xl sm:text-5xl font-extrabold tracking-tight text-groomish-gold">
                    {balance}
                  </span>
                  <span className="text-base text-white/70 font-semibold">Points</span>
                </div>
              </div>

              <p className="text-xs text-white/70 max-w-md leading-relaxed">
                {nextTier.next !== "MAX" ? (
                  <>
                    Earn <b>{Math.max(0, nextTier.target - balance)} more points</b> to ascend to{" "}
                    <span className="text-groomish-gold font-bold">{nextTier.next}</span> and unlock VIP stylist selection and priority appointments.
                  </>
                ) : (
                  "You have achieved Diamond Tier status! Enjoy maximum salon concierge privileges."
                )}
              </p>
            </div>

            {/* Tier Progress Box */}
            <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-5 min-w-[260px] space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="text-white/80 font-semibold">Tier Progress</span>
                <span className="font-extrabold text-groomish-gold">{progressPercent}%</span>
              </div>

              {/* Progress bar */}
              <div className="h-2.5 bg-black/30 rounded-full overflow-hidden p-0.5">
                <div
                  className="h-full bg-gradient-to-r from-groomish-orange via-groomish-gold to-groomish-coral rounded-full transition-all duration-700"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              <div className="flex justify-between text-[11px] text-white/60">
                <span>{tier}</span>
                <span>{nextTier.next} ({nextTier.target} pts)</span>
              </div>
            </div>
          </div>
        </div>

        {/* TIER PERKS GRID */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-4 rounded-2xl border border-groomish-slate/10 shadow-soft">
            <span className="text-[10px] font-bold text-groomish-slate/50 uppercase block mb-1">
              Silver
            </span>
            <p className="text-xs font-bold text-groomish-slate">1 pt per ₹100</p>
            <p className="text-[11px] text-groomish-slate/50 mt-1">Standard online bookings & OTP receipts.</p>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-groomish-gold/30 shadow-soft bg-gradient-to-b from-groomish-goldLight/50 to-white">
            <span className="text-[10px] font-bold text-groomish-goldDark uppercase block mb-1">
              Gold (50 pts)
            </span>
            <p className="text-xs font-bold text-groomish-slate">1.25x Points</p>
            <p className="text-[11px] text-groomish-slate/50 mt-1">Complimentary scalp analysis & priority slots.</p>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-groomish-blue/30 shadow-soft bg-gradient-to-b from-groomish-blueLight/50 to-white">
            <span className="text-[10px] font-bold text-groomish-blue uppercase block mb-1">
              Platinum (150 pts)
            </span>
            <p className="text-xs font-bold text-groomish-slate">1.5x Points</p>
            <p className="text-[11px] text-groomish-slate/50 mt-1">Senior stylist preference & birthday gift.</p>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-groomish-coral/30 shadow-soft bg-gradient-to-b from-groomish-coralLight/50 to-white">
            <span className="text-[10px] font-bold text-groomish-coral uppercase block mb-1">
              Diamond (300 pts)
            </span>
            <p className="text-xs font-bold text-groomish-slate">2.0x Points</p>
            <p className="text-[11px] text-groomish-slate/50 mt-1">Complimentary head massage & concierge.</p>
          </div>
        </div>

        {/* REDEEMABLE REWARDS CATALOG */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-heading font-bold text-groomish-slate">
                Redeem Rewards
              </h2>
              <p className="text-xs text-groomish-slate/60">
                Exchange your Groomish loyalty points for vouchers and complimentary services.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {rewardList.length > 0 ? (
              rewardList.map((r) => {
                const canAfford = balance >= (r.costPoints || 0);

                return (
                  <div
                    key={r.id}
                    className="card-groomish p-5 flex flex-col justify-between hover:border-groomish-orange/40 transition"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-groomish-orangeLight text-groomish-orange uppercase">
                          {r.type || "VOUCHER"}
                        </span>
                        <span className="text-sm font-extrabold text-groomish-orange">
                          {r.costPoints} pts
                        </span>
                      </div>
                      <h3 className="font-heading font-bold text-sm text-groomish-slate">
                        {r.title}
                      </h3>
                      <p className="text-xs text-groomish-slate/60 mt-1">
                        {r.description || `Get ${r.title} applied on your next visit.`}
                      </p>
                    </div>

                    <button
                      type="button"
                      disabled={!canAfford || redeemLoading === r.id}
                      onClick={() => handleRedeem(r.id, r.costPoints)}
                      className={`w-full mt-4 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                        canAfford
                          ? "bg-groomish-orange text-white hover:bg-groomish-orangeDark shadow-glowOrange"
                          : "bg-gray-100 text-gray-400 cursor-not-allowed"
                      }`}
                    >
                      {redeemLoading === r.id ? (
                        "Redeeming..."
                      ) : canAfford ? (
                        <>
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Redeem for {r.costPoints} pts</span>
                        </>
                      ) : (
                        `Need ${(r.costPoints || 0) - balance} more pts`
                      )}
                    </button>
                  </div>
                );
              })
            ) : (
              // Default Fallback Reward Offers
              [
                { id: "def-1", title: "₹100 Off Any Haircut", cost: 20, desc: "Instant discount voucher applicable on all haircuts." },
                { id: "def-2", title: "Free Organic Beard Wash", cost: 35, desc: "Add-on complimentary beard conditioning wash." },
                { id: "def-3", title: "₹250 Luxury Facial Voucher", cost: 50, desc: "Save ₹250 on premium glow & bridal facials." },
              ].map((def) => {
                const canAfford = balance >= def.cost;

                return (
                  <div
                    key={def.id}
                    className="card-groomish p-5 flex flex-col justify-between hover:border-groomish-orange/40 transition"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-groomish-goldLight text-groomish-slate uppercase">
                          VIP VOUCHER
                        </span>
                        <span className="text-sm font-extrabold text-groomish-orange">
                          {def.cost} pts
                        </span>
                      </div>
                      <h3 className="font-heading font-bold text-sm text-groomish-slate">
                        {def.title}
                      </h3>
                      <p className="text-xs text-groomish-slate/60 mt-1">
                        {def.desc}
                      </p>
                    </div>

                    <button
                      type="button"
                      disabled={!canAfford}
                      onClick={() => handleRedeem(def.id, def.cost)}
                      className={`w-full mt-4 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                        canAfford
                          ? "bg-groomish-orange text-white hover:bg-groomish-orangeDark shadow-glowOrange"
                          : "bg-gray-100 text-gray-400 cursor-not-allowed"
                      }`}
                    >
                      {canAfford ? (
                        <>
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Redeem for {def.cost} pts</span>
                        </>
                      ) : (
                        `Need ${def.cost - balance} more pts`
                      )}
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* LEDGER / TRANSACTION HISTORY */}
        <div className="bg-white rounded-3xl border border-groomish-slate/10 shadow-soft overflow-hidden">
          <div className="p-5 border-b border-groomish-slate/10 flex items-center justify-between">
            <div>
              <h3 className="font-heading font-bold text-base text-groomish-slate">
                Points Ledger History
              </h3>
              <p className="text-xs text-groomish-slate/50">
                Transparent record of every point earned and redeemed.
              </p>
            </div>
            <Award className="w-5 h-5 text-groomish-orange" />
          </div>

          {ledgerList.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-xs text-groomish-slate/50">
                No points history recorded yet. Points are automatically credited upon booking checkout!
              </p>
            </div>
          ) : (
            <div className="divide-y divide-groomish-slate/10">
              {ledgerList.map((item) => (
                <RewardLedgerItem key={item.id} item={item} />
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
