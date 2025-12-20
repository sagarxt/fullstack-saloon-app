// src/components/landing/Services.jsx
import React from "react";
import { ArrowRight, Plus } from "lucide-react";

const Services = ({ services = [], loading }) => {
  if (loading) {
    return (
      <section className="py-20 bg-luxe-gray-light text-center">
        <p className="text-luxe-gold text-lg">Loading services...</p>
      </section>
    );
  }

  if (!loading && services.length === 0) {
    return (
      <section className="py-20 bg-luxe-gray-light text-center">
        <h2 className="text-3xl font-serif text-luxe-black mb-4">
          Top Trending Services
        </h2>
        <p className="text-luxe-gray-medium">
          Services coming soon. Please check back later.
        </p>
      </section>
    );
  }

  return (
    <section className="py-20 bg-luxe-gray-light">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-10">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-luxe-black font-serif">
              Top Trending Services
            </h2>
            <p className="text-luxe-gray-medium mt-2 text-sm md:text-base">
              Most loved treatments this month by Luxe members.
            </p>
          </div>
          <a
            href="#"
            className="hidden md:inline-flex items-center text-luxe-black font-semibold text-sm border-b border-transparent hover:border-luxe-gold/70 hover:text-luxe-gold transition"
          >
            View Full Menu <ArrowRight className="ml-2 w-4 h-4" />
          </a>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service) => (
            <div
              key={service.id}
              className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-goldSoft transition duration-300 border border-luxe-gray-light"
            >
              <div className="h-48 overflow-hidden relative">
                <img
                  src={service.image}
                  alt={service.name}
                  className="w-full h-full object-cover"
                />
                {service.durationMinutes && (
                  <div className="absolute top-3 right-3 bg-luxe-black/80 text-luxe-gold px-2 py-1 rounded text-xs font-semibold">
                    {service.durationMinutes} min
                  </div>
                )}
              </div>
              <div className="p-6">
                <div className="text-xs text-luxe-gold font-bold uppercase tracking-widest mb-1">
                  {service.categoryName || service.category || "Service"}
                </div>
                <h3 className="text-lg font-bold text-luxe-black mb-2 font-serif">
                  {service.name}
                </h3>
                {service.description && (
                  <p className="text-sm text-luxe-gray-medium line-clamp-2">
                    {service.description}
                  </p>
                )}
                <div className="flex justify-between items-center mt-4">
                  <div className="flex flex-col">
                    {service.mrp && service.mrp > service.price && (
                      <span className="text-luxe-gray-medium text-xs line-through">
                        ₹{service.mrp}
                      </span>
                    )}
                    <span className="text-2xl font-bold text-luxe-black">
                      ₹{service.price}
                    </span>
                  </div>
                  <button className="bg-luxe-black text-white p-3 rounded-full hover:bg-luxe-gold hover:text-luxe-black transition shadow-goldSoft">
                    <Plus size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-10 text-center md:hidden">
          <button className="text-luxe-black font-semibold">
            View Full Menu
          </button>
        </div>
      </div>
    </section>
  );
};

export default Services;
