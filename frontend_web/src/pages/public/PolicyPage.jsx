import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import { policyFaqApi } from "../../api/policyFaq";
import {
  ShieldCheck,
  ShoppingBag,
  CreditCard,
  CalendarX,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  RefreshCw,
  Clock,
  FileText,
} from "lucide-react";

export default function PolicyPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("ALL");

  useEffect(() => {
    fetchPolicies();
  }, []);

  const fetchPolicies = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await policyFaqApi.getPublicItems("POLICY");
      setItems(res.data || []);
    } catch (err) {
      console.error(err);
      setError("Failed to load salon policies. Please try again shortly.");
    } finally {
      setLoading(false);
    }
  };

  const getPolicyIcon = (category) => {
    switch (category?.toUpperCase()) {
      case "ORDER":
        return <ShoppingBag className="w-4 h-4 text-groomish-blue" />;
      case "PAYMENT":
        return <CreditCard className="w-4 h-4 text-groomish-green" />;
      case "CANCELLATION":
        return <CalendarX className="w-4 h-4 text-groomish-orange" />;
      case "REFUND":
        return <RotateCcw className="w-4 h-4 text-groomish-gold" />;
      default:
        return <FileText className="w-4 h-4 text-groomish-slate" />;
    }
  };

  const categories = [
    { id: "ALL", label: "All Policies" },
    { id: "ORDER", label: "Order & Booking" },
    { id: "PAYMENT", label: "Payment & Billing" },
    { id: "CANCELLATION", label: "Cancellation & Reschedule" },
    { id: "REFUND", label: "Refund & GroomCoins" },
  ];

  const filteredItems = items.filter((item) => {
    if (activeTab === "ALL") return true;
    return item.category?.toUpperCase() === activeTab;
  });

  return (
    <div className="min-h-screen bg-groomish-cream flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-8 space-y-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-groomish-slate/60">
          <Link to="/" className="hover:text-groomish-orange transition-colors">
            Home
          </Link>
          <span>/</span>
          <span className="text-groomish-slate font-bold">Policies & Terms</span>
        </div>

        {/* Hero Header */}
        <div className="bg-gradient-to-r from-groomish-slate via-groomish-slateLight to-groomish-slate text-white rounded-2xl p-6 sm:p-8 shadow-card relative overflow-hidden">
          <div className="absolute top-0 right-0 -mt-8 -mr-8 w-48 h-48 bg-groomish-gold/15 rounded-full blur-2xl pointer-events-none" />
          <div className="relative z-10 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-groomish-gold text-xs font-bold uppercase tracking-wider mb-3">
              <ShieldCheck className="w-3.5 h-3.5" />
              Customer Trust & Transparency
            </div>
            <h1 className="text-2xl sm:text-3xl font-heading font-extrabold tracking-tight">
              Salon Policies & Terms
            </h1>
            <p className="text-sm text-gray-300 mt-2 leading-relaxed">
              Transparent guidelines covering appointment orders, payment methods, free cancellation windows, and instant refund processing.
            </p>
          </div>
        </div>

        {/* Category Navigation Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none border-b border-groomish-slate/10">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveTab(cat.id)}
              className={`px-4 py-2 text-xs font-bold whitespace-nowrap transition-all border-b-2 -mb-px ${
                activeTab === cat.id
                  ? "border-groomish-orange text-groomish-orange"
                  : "border-transparent text-groomish-slate/60 hover:text-groomish-slate"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Policy Content Sections */}
        {loading ? (
          <div className="bg-white rounded-2xl p-10 text-center border border-groomish-slate/10 shadow-card">
            <RefreshCw className="w-7 h-7 text-groomish-orange animate-spin mx-auto mb-3" />
            <p className="text-xs sm:text-sm text-groomish-slate/70 font-medium">Loading salon policies...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl p-5 text-center text-xs sm:text-sm font-medium">
            {error}
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="bg-white rounded-2xl p-10 text-center border border-groomish-slate/10 shadow-card space-y-2">
            <ShieldCheck className="w-10 h-10 text-groomish-slate/30 mx-auto" />
            <h3 className="text-sm font-bold text-groomish-slate">No Policies in this Section</h3>
            <p className="text-xs text-groomish-slate/60 max-w-sm mx-auto">
              Please choose "All Policies" or check back shortly.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredItems.map((policy, index) => (
              <section
                key={policy.id}
                id={policy.category?.toLowerCase()}
                className="bg-white rounded-xl border border-groomish-slate/10 p-5 sm:p-6 shadow-card space-y-3 transition-all hover:border-groomish-orange/20"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-groomish-cream flex items-center justify-center shrink-0 border border-groomish-slate/10">
                      {getPolicyIcon(policy.category)}
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-groomish-orange bg-groomish-orange/10 px-2 py-0.5 rounded-full">
                        {policy.category} POLICY
                      </span>
                      <h2 className="text-sm sm:text-base font-heading font-extrabold text-groomish-slate mt-1">
                        {policy.heading}
                      </h2>
                    </div>
                  </div>
                  <span className="text-[11px] font-mono font-bold text-groomish-slate/40 shrink-0">
                    #{index + 1}
                  </span>
                </div>

                <div className="text-xs sm:text-sm text-groomish-slate/80 leading-relaxed whitespace-pre-line pt-1 border-t border-groomish-slate/5">
                  {policy.description}
                </div>
              </section>
            ))}
          </div>
        )}

        {/* Commitment Banner */}
        <div className="bg-gradient-to-r from-groomish-orange/10 via-groomish-gold/10 to-groomish-coral/10 border border-groomish-orange/20 rounded-2xl p-5 sm:p-6 flex items-start gap-3.5">
          <div className="w-8 h-8 rounded-xl bg-groomish-orange/20 text-groomish-orange flex items-center justify-center shrink-0 mt-0.5">
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="space-y-1">
            <h4 className="text-xs sm:text-sm font-bold text-groomish-slate">
              Our 100% Satisfaction Guarantee
            </h4>
            <p className="text-xs text-groomish-slate/70 leading-relaxed">
              At Groomish Now, your grooming experience is backed by our customer-first policy. If you ever have a question or need assistance with an appointment or refund, please reach out directly to our support desk or salon branch manager.
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
