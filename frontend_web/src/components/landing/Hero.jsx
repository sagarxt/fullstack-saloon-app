// src/components/landing/Hero.jsx
import React from "react";
import { ArrowRight } from "lucide-react";

const Hero = ({ banners = [], loading }) => {
  const primaryBanner = banners.length > 0 ? banners[0] : null;

  const bgImage =
    primaryBanner?.image ||
    "https://images.unsplash.com/photo-1560066984-138dadb4c035?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80";

  const badgeText =
    primaryBanner?.title || "NEW CUSTOMERS GET 10% OFF";

  return (
    <section
      id="home"
      className="relative h-screen flex items-center justify-center bg-luxe-black"
    >
      <div className="absolute inset-0 z-0">
        <img
          src={bgImage}
          alt="Salon Interior"
          className="w-full h-full object-cover opacity-70"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/85 to-black/95" />
      </div>

      <div className="relative z-10 text-center text-white px-4 max-w-4xl mx-auto">
        <div className="mb-6 flex justify-center">
          <span className="bg-luxe-gold text-luxe-black text-xs font-bold px-4 py-1.5 rounded-full tracking-[0.3em] uppercase shadow-gold">
            {badgeText}
          </span>
        </div>
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight font-serif">
          Experience{" "}
          <span className="text-luxe-gold">Luxe</span> Beauty & Grooming
        </h1>
        <p className="text-base md:text-lg text-luxe-gray-light/80 mb-10 max-w-2xl mx-auto font-light">
          Premium hair, skin, and spa services with a seamless booking and
          loyalty experience. Earn rewards on every visit and unlock exclusive
          tiers.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button className="bg-luxe-gold hover:bg-luxe-gold-soft text-luxe-black px-8 py-3 rounded-full text-sm md:text-base font-semibold transition shadow-gold flex items-center justify-center gap-2">
            Book Appointment <ArrowRight size={18} />
          </button>
          <button className="bg-transparent border border-luxe-gold/70 hover:bg-luxe-gold hover:text-luxe-black text-white px-8 py-3 rounded-full text-sm md:text-base font-semibold transition">
            View Services
          </button>
        </div>
      </div>
    </section>
  );
};

export default Hero;
