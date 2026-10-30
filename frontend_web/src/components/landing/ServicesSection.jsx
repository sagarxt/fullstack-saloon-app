import { useState, useMemo } from "react";
import { Clock, Sparkles, Search, Scissors, ArrowRight, Star, ShoppingCart, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { extractList, getServicePriceRange, getServiceDurationRange } from "../../utils/dataHelper";
import { getOptimizedImageUrl } from "../../utils/imageHelper";
import { useGroomCoin } from "../../context/GroomCoinContext";
import GroomCoinIcon from "../common/GroomCoinIcon";

export default function ServicesSection({
  services = [],
  categories = [],
  onBook,
}) {
  const navigate = useNavigate();
  const { calculateCoins } = useGroomCoin();
  const [searchTerm, setSearchTerm] = useState("");
  const [genderFilter, setGenderFilter] = useState("ALL");

  const categoryList = extractList(categories);
  const serviceList = extractList(services);

  const categoryMap = useMemo(() => {
    const map = {};
    categoryList.forEach((c) => {
      map[c.id] = c.name;
    });
    return map;
  }, [categoryList]);

  const filteredServices = useMemo(() => {
    return serviceList.filter((srv) => {
      // Gender filter
      if (genderFilter !== "ALL") {
        if (srv.gender && srv.gender !== genderFilter && srv.gender !== "UNISEX") {
          return false;
        }
      }
      // Search
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const nameMatch = srv.name?.toLowerCase().includes(term);
        const descMatch = srv.description?.toLowerCase().includes(term);
        return nameMatch || descMatch;
      }
      return true;
    });
  }, [services, genderFilter, searchTerm]);

  // Limit to 3-4 rows (12 items max on 4-column desktop grid)
  const displayedServices = filteredServices.slice(0, 12);

  const defaultServiceImages = {
    MALE: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=600&q=80",
    FEMALE: "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=600&q=80",
    UNISEX: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=600&q=80",
  };

  return (
    <section id="services" className="bg-groomish-cream py-8 sm:py-14 border-t border-groomish-slate/10 w-full max-w-full overflow-x-hidden">
      <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 w-full max-w-full min-w-0">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 sm:gap-6 mb-5 sm:mb-8">
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-groomish-orangeLight text-groomish-orange mb-2 sm:mb-3">
              <Scissors className="w-3.5 h-3.5" />
              Featured Treatments
            </span>
            <h2 className="text-2xl sm:text-4xl font-heading font-extrabold text-groomish-slate">
              Our Signature Services
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-groomish-slateLight">
              Click any treatment to view full service details, customer ratings, and book your visit.
            </p>
          </div>

          {/* Search & Direct Link to Dedicated Services Page */}
          <div className="flex flex-col sm:flex-row items-center gap-2.5 sm:gap-3 w-full md:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-groomish-slateLight" />
              <input
                type="text"
                placeholder="Search treatments..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-full bg-white text-groomish-slate text-xs border border-groomish-slate/15 focus:border-groomish-orange outline-none transition"
              />
            </div>

            <button
              onClick={() => navigate("/services")}
              className="btn-secondary text-xs px-4 py-2 shrink-0 flex items-center gap-1.5 w-full sm:w-auto justify-center"
            >
              <span>Full Services Menu</span>
              <ArrowRight className="w-3.5 h-3.5 text-groomish-orange" />
            </button>
          </div>
        </div>

        {/* Filters Bar: Gender Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5 pb-3 border-b border-groomish-slate/10">
          <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1 max-w-full">
            {["ALL", "MALE", "FEMALE", "UNISEX"].map((g) => (
              <button
                key={g}
                onClick={() => setGenderFilter(g)}
                className={`px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-full text-xs font-bold transition whitespace-nowrap ${
                  genderFilter === g
                    ? "bg-groomish-slate text-white shadow-sm"
                    : "bg-white text-groomish-slate border border-groomish-slate/10 hover:border-groomish-slate/30"
                }`}
              >
                {g === "ALL" ? "All Services" : g.charAt(0) + g.slice(1).toLowerCase()}
              </button>
            ))}
          </div>

          <div className="text-xs text-groomish-slateLight">
            Showing <span className="font-bold text-groomish-slate">{displayedServices.length}</span> featured services
          </div>
        </div>

        {/* Services Grid (Limited to 3-4 lines) */}
        {displayedServices.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-groomish-slate/10 max-w-md mx-auto p-8 shadow-soft">
            <Scissors className="w-10 h-10 text-groomish-slateLight mx-auto mb-3" />
            <h3 className="font-heading font-bold text-lg text-groomish-slate">
              {serviceList.length === 0 ? "No Salon Services Available" : "No Services Found"}
            </h3>
            <p className="text-xs text-groomish-slateLight mt-1 mb-4">
              {serviceList.length === 0
                ? "Salon treatments and therapies will appear here once published by salon administration."
                : "Try adjusting your search query or gender filter."}
            </p>
            {serviceList.length > 0 && (
              <button
                onClick={() => {
                  setSearchTerm("");
                  setGenderFilter("ALL");
                }}
                className="btn-secondary text-xs px-4 py-2"
              >
                Reset Filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {displayedServices.map((service) => {
              const catName = categoryMap[service.categoryId] || service.categoryName || "Grooming";
              const imgSrc =
                service.image ||
                defaultServiceImages[service.gender] ||
                defaultServiceImages.UNISEX;
              const coinsEarned = calculateCoins(service.price, service.rewards);

              return (
                <div
                  key={service.id}
                  className="card-groomish overflow-hidden flex flex-col group hover:-translate-y-1 transition duration-300"
                >
                  <div className="flex-1 flex flex-col">
                    {/* Image & Badges (Clickable directly to dedicated service page) */}
                    <div
                      onClick={() => navigate(`/services/${service.id}`)}
                      className="relative w-full aspect-[4/3] overflow-hidden bg-groomish-slate/10 cursor-pointer shrink-0"
                    >
                      <img
                        src={getOptimizedImageUrl(imgSrc, { width: 600 })}
                        alt={service.name}
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-groomish-slateDark/60 via-transparent to-transparent" />

                      {/* Gender Badge */}
                      <span className="absolute top-3 left-3 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white/90 text-groomish-slate shadow-sm backdrop-blur-sm">
                        {service.gender || "UNISEX"}
                      </span>

                      {/* Duration */}
                      <span className="absolute bottom-3 left-3 flex items-center gap-1 text-[11px] font-semibold text-white bg-black/40 backdrop-blur-sm px-2.5 py-0.5 rounded-full">
                        <Clock className="w-3 h-3 text-groomish-gold" />
                        {service.subServices && service.subServices.length > 0
                          ? getServiceDurationRange(service)
                          : `${service.durationMinutes} mins`}
                      </span>
                    </div>

                    {/* Content Details */}
                    <div className="p-4 sm:p-5 pb-3 flex-1 flex flex-col justify-between">
                      <div className="space-y-1.5">
                        <div className="text-[11px] font-bold text-groomish-orange uppercase tracking-wider">
                          {catName}
                        </div>

                        <h3
                          onClick={() => navigate(`/services/${service.id}`)}
                          className="font-heading font-bold text-base text-groomish-slate leading-snug group-hover:text-groomish-orange transition-colors cursor-pointer line-clamp-1"
                        >
                          {service.name}
                        </h3>

                        <p className="text-xs text-groomish-slateLight line-clamp-2 leading-relaxed">
                          {service.description || "Signature grooming experience delivered by certified specialists."}
                        </p>
                      </div>

                      {/* Groom Coins Pill */}
                      <div className="pt-2">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-300 text-amber-900 text-[10px] font-bold">
                          <GroomCoinIcon className="w-3.5 h-3.5" />
                          <span>Earn +{coinsEarned} Groom Coins</span>
                          {service.rewards > 0 && (
                            <span className="bg-amber-200 text-amber-900 px-1 py-0.2 rounded font-extrabold text-[9px]">
                              +{service.rewards} Extra!
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Pricing & Booking CTA */}
                  <div className="p-4 sm:p-5 pt-3 border-t border-groomish-slate/10 flex items-center justify-between gap-2 mt-auto">
                    <div className="min-w-0 pr-1">
                      <div className="text-base sm:text-[17px] font-extrabold text-groomish-slate leading-tight whitespace-nowrap">
                        {service.subServices && service.subServices.length > 0
                          ? getServicePriceRange(service)
                          : `₹${service.price}`}
                      </div>
                      {(!service.subServices || service.subServices.length === 0) && service.mrp > service.price && (
                        <div className="text-[11px] text-groomish-slateLight line-through">
                          ₹{service.mrp}
                        </div>
                      )}
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (service.subServices && service.subServices.length > 1) {
                          navigate(`/services/${service.id}`);
                        } else {
                          onBook(service);
                        }
                      }}
                      className="btn-primary text-xs px-3 py-2 shadow-sm group-hover:shadow-glowOrange flex items-center gap-1.5 shrink-0 whitespace-nowrap"
                    >
                      {service.subServices && service.subServices.length > 1 ? (
                        <>
                          <Eye className="w-3.5 h-3.5" />
                          <span>Options</span>
                        </>
                      ) : (
                        <>
                          <ShoppingCart className="w-3.5 h-3.5" />
                          <span>Add Service</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Bottom CTA to View All Services */}
        {serviceList.length > 0 && (
          <div className="mt-12 text-center">
            <button
              onClick={() => navigate("/services")}
              className="btn-primary text-sm px-8 py-3.5 shadow-glowOrange inline-flex items-center gap-2"
            >
              <span>Explore All {serviceList.length} Salon Treatments</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
