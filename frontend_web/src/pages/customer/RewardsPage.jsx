import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import {
  getRewardBalance,
  getRewardLedger,
  getAvailableRewards,
  redeemReward,
  getReferralCode,
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
  Clock,
  Ticket,
  Scissors,
  Copy,
  Check,
  Share2,
} from "lucide-react";
import GroomCoinIcon from "../../components/common/GroomCoinIcon";
import { useGroomCoin } from "../../context/GroomCoinContext";

export default function RewardsPage() {
  const [balance, setBalance] = useState(0);
  const [lifetimePoints, setLifetimePoints] = useState(0);
  const [pendingPoints, setPendingPoints] = useState(0);
  const [tier, setTier] = useState("SILVER");
  const [referralCode, setReferralCode] = useState("");
  const [copiedRef, setCopiedRef] = useState(false);
  const [ledger, setLedger] = useState([]);
  const [rewards, setRewards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [redeemLoading, setRedeemLoading] = useState(null);
  const [alert, setAlert] = useState({ type: "", message: "" });
  const { config: groomCoinConfig } = useGroomCoin();

  const loadData = async () => {
    setLoading(true);
    try {
      const [balRes, ledgerRes, rewRes] = await Promise.all([
        getRewardBalance(),
        getRewardLedger(),
        getAvailableRewards().catch(() => ({ data: [] })),
      ]);

      setBalance(balRes.data?.points || 0);
      setLifetimePoints(balRes.data?.lifetimePoints ?? balRes.data?.points ?? 0);
      setPendingPoints(balRes.data?.pendingPoints || 0);
      setTier(balRes.data?.tier || "SILVER");
      
      if (balRes.data?.referralCode) {
        setReferralCode(balRes.data.referralCode);
      } else {
        try {
          const refRes = await getReferralCode();
          if (refRes.data?.referralCode) {
            setReferralCode(refRes.data.referralCode);
          }
        } catch (_) {}
      }

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
        message: `You need ${cost} Groom Coins to redeem this reward. Current balance: ${balance} Groom Coins.`,
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
  const progressPercent = Math.min(100, Math.round((lifetimePoints / nextTier.target) * 100));

  const ledgerList = extractList(ledger);
  const rewardList = extractList(rewards);

  const handleCopyReferral = () => {
    if (!referralCode) return;
    navigator.clipboard.writeText(referralCode);
    setCopiedRef(true);
    setTimeout(() => setCopiedRef(false), 2000);
  };

  return (
    <div className="min-h-screen bg-groomish-cream flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-groomish-orange mb-1">
            <GroomCoinIcon className="w-4 h-4" />
            <span>Groomish Club Loyalty</span>
          </div>
          <h1 className="text-3xl font-heading font-extrabold text-groomish-slate">
            Groom Coins & VIP Status
          </h1>
          <p className="text-sm text-groomish-slate/60 mt-1">
            Earn 1 Groom Coin for every ₹{groomCoinConfig?.spendAmountPerCoin || 100} spent at Groomish Now. Unlock tier privileges and exclusive salon perks.
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
                <span>{tier} VIP Tier (Lifetime Status)</span>
              </div>

              <div>
                <p className="text-xs text-white/60 font-medium">Available Redeemable Balance</p>
                <div className="flex items-center gap-2 mt-1">
                  <GroomCoinIcon className="w-10 h-10 shrink-0" />
                  <span className="text-4xl sm:text-5xl font-extrabold tracking-tight text-groomish-gold">
                    {balance}
                  </span>
                  <span className="text-base text-white/70 font-semibold">Groom Coins</span>
                </div>
                
                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-white/70">
                  <span className="bg-white/10 px-2.5 py-0.5 rounded-full border border-white/10 flex items-center gap-1">
                    <GroomCoinIcon className="w-3.5 h-3.5" />
                    <span>Lifetime: <b className="text-white">{lifetimePoints} Coins</b></span>
                  </span>
                  {pendingPoints > 0 && (
                    <span className="bg-amber-400/20 text-amber-200 border border-amber-300/30 px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1">
                      <GroomCoinIcon className="w-3 h-3" />
                      <span>+{pendingPoints} Pending</span>
                    </span>
                  )}
                </div>
              </div>

              <p className="text-xs text-white/70 max-w-md leading-relaxed">
                {nextTier.next !== "MAX" ? (
                  <>
                    Earn <b>{Math.max(0, nextTier.target - lifetimePoints)} more lifetime Groom Coins</b> to ascend to{" "}
                    <span className="text-groomish-gold font-bold">{nextTier.next}</span>. Tiers never downgrade when coins are redeemed.
                  </>
                ) : (
                  "You have achieved Diamond Tier status! Enjoy maximum salon concierge privileges."
                )}
              </p>
            </div>

            {/* Tier Progress Box */}
            <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-5 min-w-[260px] space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="text-white/80 font-semibold">Lifetime Tier Progress</span>
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
            <p className="text-xs font-bold text-groomish-slate">1 Coin per ₹{groomCoinConfig?.spendAmountPerCoin || 100}</p>
            <p className="text-[11px] text-groomish-slate/50 mt-1">Standard online bookings & OTP receipts.</p>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-groomish-gold/30 shadow-soft bg-gradient-to-b from-groomish-goldLight/50 to-white">
            <span className="text-[10px] font-bold text-groomish-goldDark uppercase block mb-1">
              Gold (50 Coins)
            </span>
            <p className="text-xs font-bold text-groomish-slate">1.25x Groom Coins</p>
            <p className="text-[11px] text-groomish-slate/50 mt-1">Complimentary scalp analysis & priority slots.</p>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-groomish-blue/30 shadow-soft bg-gradient-to-b from-groomish-blueLight/50 to-white">
            <span className="text-[10px] font-bold text-groomish-blue uppercase block mb-1">
              Platinum (150 Coins)
            </span>
            <p className="text-xs font-bold text-groomish-slate">1.5x Groom Coins</p>
            <p className="text-[11px] text-groomish-slate/50 mt-1">Senior stylist preference & birthday gift.</p>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-groomish-coral/30 shadow-soft bg-gradient-to-b from-groomish-coralLight/50 to-white">
            <span className="text-[10px] font-bold text-groomish-coral uppercase block mb-1">
              Diamond (300 Coins)
            </span>
            <p className="text-xs font-bold text-groomish-slate">2.0x Groom Coins</p>
            <p className="text-[11px] text-groomish-slate/50 mt-1">Complimentary head massage & concierge.</p>
          </div>
        </div>

        {/* REFERRAL PROGRAM BANNER */}
        <div className="bg-gradient-to-br from-groomish-orange to-groomish-coral text-white rounded-3xl p-6 sm:p-7 shadow-glowOrange mb-8 relative overflow-hidden">
          <div className="absolute -right-10 -bottom-10 w-44 h-44 bg-white/10 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-lg">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-bold text-white border border-white/20">
                <Gift className="w-3.5 h-3.5" />
                <span>Refer & Earn</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-heading font-extrabold text-white leading-snug">
                Invite Friends, Earn 10 Groom Coins!
              </h2>
              <p className="text-xs sm:text-sm text-white/90 leading-relaxed">
                Share your unique referral code with friends. Whenever a friend signs up using your code, you will automatically receive <b className="text-groomish-gold">10 Groom Coins</b> credited directly to your account.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row md:flex-col lg:flex-row items-center gap-3 shrink-0">
              <div className="bg-white/15 backdrop-blur-md border border-white/25 rounded-2xl px-5 py-3 text-center w-full sm:w-auto">
                <span className="text-[10px] uppercase font-bold text-white/70 block">Your Referral Code</span>
                <span className="font-mono text-2xl font-extrabold tracking-widest text-groomish-gold">
                  {referralCode || "..."}
                </span>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={handleCopyReferral}
                  className="flex-1 sm:flex-initial py-3 px-4 rounded-xl bg-white text-groomish-slate hover:bg-groomish-cream font-bold text-xs transition flex items-center justify-center gap-2 shadow-soft active:scale-95"
                >
                  {copiedRef ? (
                    <>
                      <Check className="w-4 h-4 text-groomish-green" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Copy Code</span>
                    </>
                  )}
                </button>

                <a
                  href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
                    `Use my Groomish Now invite code ${referralCode} to sign up and get bonus Groom Coins on your first luxury salon visit! https://groomishnow.com`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-3 px-4 rounded-xl bg-white/20 hover:bg-white/30 text-white font-bold text-xs transition flex items-center justify-center gap-2"
                  title="Share via WhatsApp"
                >
                  <Share2 className="w-4 h-4" />
                  <span className="hidden sm:inline">Share</span>
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* REDEEMABLE REWARDS CATALOG */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <h2 className="text-xl font-heading font-bold text-groomish-slate">
                Redeem Rewards
              </h2>
              <p className="text-xs text-groomish-slate/60">
                Exchange your Groom Coins for vouchers and complimentary services.
              </p>
            </div>

            <Link
              to="/customer/vouchers"
              className="self-start sm:self-auto inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-groomish-slate text-white hover:bg-black transition shadow-sm group"
            >
              <Ticket className="w-4 h-4 text-groomish-orange transition-transform group-hover:rotate-12" />
              <span>My Redeemed Vouchers</span>
              <ArrowRight className="w-3.5 h-3.5 text-white/60 group-hover:translate-x-0.5 transition" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {rewardList.length > 0 ? (
              rewardList.map((r) => {
                const points = r.pointsRequired !== undefined && r.pointsRequired !== null ? r.pointsRequired : (r.costPoints || 0);
                const canAfford = balance >= points;

                return (
                  <div
                    key={r.id}
                    className="card-groomish p-5 flex flex-col justify-between hover:border-groomish-orange/40 transition group"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2 gap-2">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-groomish-orangeLight text-groomish-orange uppercase tracking-wide">
                          {r.discountPercent ? `${r.discountPercent}% OFF` : (r.type || "VOUCHER")}
                        </span>
                        
                        <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-200/80 shrink-0">
                          <GroomCoinIcon className="w-3.5 h-3.5" />
                          <span className="text-xs font-extrabold text-amber-900">
                            {points} Coins
                          </span>
                        </div>
                      </div>

                      <h3 className="font-heading font-bold text-sm text-groomish-slate group-hover:text-groomish-orange transition">
                        {r.title}
                      </h3>

                      {r.serviceName && (
                        <div className="my-2 flex items-center gap-1.5 text-[11px] font-bold text-groomish-orange bg-groomish-orange/10 px-2 py-1 rounded-lg border border-groomish-orange/20">
                          <Scissors className="w-3 h-3 shrink-0" />
                          <span className="truncate">Special for: {r.serviceName}</span>
                        </div>
                      )}

                      <p className="text-xs text-groomish-slate/60 mt-1 line-clamp-2">
                        {r.description || `Get ${r.title} applied on your next salon visit.`}
                      </p>

                      {r.validityDays && (
                        <p className="text-[10px] text-groomish-slate/50 mt-2 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-groomish-slate/40" />
                          <span>Valid for {r.validityDays} days after redemption</span>
                        </p>
                      )}
                    </div>

                    <button
                      type="button"
                      disabled={!canAfford || redeemLoading === r.id}
                      onClick={() => handleRedeem(r.id, points)}
                      className={`w-full mt-4 py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                        canAfford
                          ? "bg-groomish-orange text-white hover:bg-groomish-orangeDark shadow-glowOrange cursor-pointer"
                          : "bg-gray-100 text-gray-400 cursor-not-allowed"
                      }`}
                    >
                      {redeemLoading === r.id ? (
                        <>
                          <Clock className="w-3.5 h-3.5 animate-spin" />
                          <span>Redeeming...</span>
                        </>
                      ) : canAfford ? (
                        <>
                          <GroomCoinIcon className="w-3.5 h-3.5" />
                          <span>Redeem for {points} Coins</span>
                        </>
                      ) : (
                        `Need ${points - balance} more coins`
                      )}
                    </button>
                  </div>
                );
              })
            ) : (
              <div className="col-span-1 md:col-span-3 bg-white rounded-3xl p-10 text-center border border-groomish-slate/10 shadow-soft">
                <Gift className="w-10 h-10 text-groomish-slate/30 mx-auto mb-3" />
                <h3 className="font-heading font-bold text-base text-groomish-slate">
                  No Reward Vouchers Available
                </h3>
                <p className="text-xs text-groomish-slate/50 mt-1 max-w-sm mx-auto">
                  There are currently no active reward vouchers published in the catalog. Keep earning points on your visits — special discounts and free perks will be added here soon!
                </p>
              </div>
            )}
          </div>
        </div>

        {/* LEDGER / TRANSACTION HISTORY */}
        <div className="bg-white rounded-3xl border border-groomish-slate/10 shadow-soft overflow-hidden">
          <div className="p-5 border-b border-groomish-slate/10 flex items-center justify-between">
            <div>
              <h3 className="font-heading font-bold text-base text-groomish-slate">
                Groom Coins Ledger History
              </h3>
              <p className="text-xs text-groomish-slate/50">
                Transparent record of every Groom Coin earned and redeemed.
              </p>
            </div>
            <Award className="w-5 h-5 text-groomish-orange" />
          </div>

          {ledgerList.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-xs text-groomish-slate/50">
                No Groom Coins history recorded yet. Coins are automatically credited upon booking checkout!
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
