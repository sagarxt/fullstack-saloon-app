import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import { policyFaqApi } from "../../api/policyFaq";
import {
  HelpCircle,
  Search,
  ChevronDown,
  ChevronUp,
  Sparkles,
  MessageCircle,
  Phone,
  Mail,
  ShieldCheck,
  Calendar,
  CreditCard,
  Gift,
  Scissors,
  CheckCircle2,
  RefreshCw,
} from "lucide-react";

export default function QAPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [openItems, setOpenItems] = useState({});

  useEffect(() => {
    fetchQA();
  }, []);

  const fetchQA = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await policyFaqApi.getPublicItems("QA");
      const data = res.data || [];
      setItems(data);
      // Open the first 2 items by default for great UX
      if (data.length > 0) {
        setOpenItems({
          [data[0].id]: true,
          ...(data[1] ? { [data[1].id]: true } : {}),
        });
      }
    } catch (err) {
      console.error(err);
      setError("Failed to load Q&A at this moment. Please check back shortly.");
    } finally {
      setLoading(false);
    }
  };

  const toggleItem = (id) => {
    setOpenItems((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Extract unique categories
  const categories = ["ALL", ...new Set(items.map((i) => i.category || "GENERAL"))];

  // Filter items
  const filteredItems = items.filter((item) => {
    const matchCategory = selectedCategory === "ALL" || item.category === selectedCategory;
    const query = searchQuery.toLowerCase().trim();
    const matchQuery =
      !query ||
      item.heading?.toLowerCase().includes(query) ||
      item.description?.toLowerCase().includes(query) ||
      item.category?.toLowerCase().includes(query);
    return matchCategory && matchQuery;
  });

  const getCategoryIcon = (category) => {
    switch (category?.toUpperCase()) {
      case "BOOKINGS":
        return <Calendar className="w-3.5 h-3.5" />;
      case "PAYMENT":
      case "PAYMENTS":
        return <CreditCard className="w-3.5 h-3.5" />;
      case "LOYALTY":
      case "REWARDS":
        return <Gift className="w-3.5 h-3.5" />;
      case "SERVICES":
        return <Scissors className="w-3.5 h-3.5" />;
      default:
        return <HelpCircle className="w-3.5 h-3.5" />;
    }
  };

  return (
    <div className="min-h-screen bg-groomish-cream flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-8 space-y-6">
        {/* Breadcrumb Navigation */}
        <div className="flex items-center gap-2 text-xs text-groomish-slate/60">
          <Link to="/" className="hover:text-groomish-orange transition-colors">
            Home
          </Link>
          <span>/</span>
          <span className="text-groomish-slate font-bold">Frequently Asked Questions</span>
        </div>

        {/* Hero Header */}
        <div className="bg-gradient-to-r from-groomish-slate via-groomish-slateLight to-groomish-slate text-white rounded-2xl p-6 sm:p-8 shadow-card relative overflow-hidden">
          <div className="absolute top-0 right-0 -mt-8 -mr-8 w-48 h-48 bg-groomish-orange/15 rounded-full blur-2xl pointer-events-none" />
          <div className="relative z-10 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-groomish-orange/20 border border-groomish-orange/30 text-groomish-orange text-xs font-bold uppercase tracking-wider mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              Help & Answers Center
            </div>
            <h1 className="text-2xl sm:text-3xl font-heading font-extrabold tracking-tight">
              Questions & Answers (Q&A)
            </h1>
            <p className="text-sm text-gray-300 mt-2 leading-relaxed">
              Find fast answers to common questions about salon bookings, stylist services, GroomCoin rewards, cancellations, and billing.
            </p>

            {/* Quick Search Input */}
            <div className="mt-5 relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by keywords (e.g., booking, cancellation, coins)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/10 text-white placeholder-gray-400 border border-white/20 focus:outline-none focus:ring-2 focus:ring-groomish-orange text-xs sm:text-sm backdrop-blur-md transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-white px-1.5 py-0.5 rounded"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Category Pills */}
        {categories.length > 1 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all border ${
                  selectedCategory === cat
                    ? "bg-groomish-orange text-white border-groomish-orange shadow-sm font-bold"
                    : "bg-white text-groomish-slate/80 border-groomish-slate/15 hover:border-groomish-orange/40 hover:bg-groomish-orange/5"
                }`}
              >
                {cat === "ALL" ? "All Questions" : cat}
              </button>
            ))}
          </div>
        )}

        {/* Q&A Accordion List */}
        {loading ? (
          <div className="bg-white rounded-2xl p-10 text-center border border-groomish-slate/10 shadow-card">
            <RefreshCw className="w-7 h-7 text-groomish-orange animate-spin mx-auto mb-3" />
            <p className="text-xs sm:text-sm text-groomish-slate/70 font-medium">Loading questions and answers...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl p-5 text-center text-xs sm:text-sm font-medium">
            {error}
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="bg-white rounded-2xl p-10 text-center border border-groomish-slate/10 shadow-card space-y-2">
            <HelpCircle className="w-10 h-10 text-groomish-slate/30 mx-auto" />
            <h3 className="text-sm font-bold text-groomish-slate">No Questions Found</h3>
            <p className="text-xs text-groomish-slate/60 max-w-sm mx-auto">
              {searchQuery
                ? `We couldn't find any questions matching "${searchQuery}". Try a different keyword.`
                : "No questions currently available in this category."}
            </p>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="mt-3 inline-block px-4 py-1.5 rounded-lg text-xs font-semibold bg-groomish-orange/10 text-groomish-orange hover:bg-groomish-orange/20 transition-colors"
              >
                Reset Search
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredItems.map((item) => {
              const isOpen = !!openItems[item.id];
              return (
                <div
                  key={item.id}
                  className="bg-white rounded-xl border border-groomish-slate/10 overflow-hidden shadow-card transition-all"
                >
                  <button
                    onClick={() => toggleItem(item.id)}
                    className="w-full text-left p-4 sm:p-5 flex items-start justify-between gap-4 hover:bg-groomish-cream/40 transition-colors focus-visible:outline-2 focus-visible:outline-groomish-orange"
                    aria-expanded={isOpen}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-7 h-7 rounded-lg bg-groomish-orange/10 text-groomish-orange flex items-center justify-center shrink-0 mt-0.5">
                        {getCategoryIcon(item.category)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-groomish-orange/90 bg-groomish-orange/10 px-2 py-0.5 rounded-full">
                            {item.category}
                          </span>
                        </div>
                        <h3 className="text-xs sm:text-sm font-heading font-bold text-groomish-slate leading-snug">
                          {item.heading}
                        </h3>
                      </div>
                    </div>
                    <div className="w-6 h-6 rounded-full bg-groomish-slate/5 flex items-center justify-center shrink-0 text-groomish-slate/60">
                      {isOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </div>
                  </button>

                  {isOpen && (
                    <div className="px-4 pb-4 sm:px-5 sm:pb-5 pt-1 text-xs sm:text-sm text-groomish-slate/80 leading-relaxed border-t border-groomish-slate/5 bg-groomish-cream/20">
                      <div className="whitespace-pre-line pl-10">{item.description}</div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Quick Contact & Assistance Footer Banner */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-groomish-slate/10 shadow-card flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-groomish-green/15 text-groomish-green flex items-center justify-center shrink-0">
              <MessageCircle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-groomish-slate">
                Still have a question?
              </h4>
              <p className="text-xs text-groomish-slate/60 mt-0.5">
                Our salon concierge team is available to help daily 9:00 AM – 9:00 PM.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <a
              href="tel:+919000080000"
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-groomish-slate text-white hover:bg-groomish-slateLight transition-colors"
            >
              <Phone className="w-3.5 h-3.5 text-groomish-orange" />
              Call Support
            </a>
            <a
              href="mailto:support@groomishnow.com"
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-groomish-orange text-white hover:bg-groomish-coral transition-colors shadow-glowOrange"
            >
              <Mail className="w-3.5 h-3.5" />
              Email Concierge
            </a>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
