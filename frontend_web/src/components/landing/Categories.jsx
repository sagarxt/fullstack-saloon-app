// src/components/landing/Categories.jsx
import React from "react";
import { Scissors } from "lucide-react";

const Categories = ({ categories = [], loading }) => {
  if (loading) {
    return (
      <section id="categories" className="py-20 bg-luxe-black text-center">
        <p className="text-luxe-gold text-lg">Loading categories...</p>
      </section>
    );
  }

  if (!loading && categories.length === 0) {
    return (
      <section id="categories" className="py-20 bg-luxe-black text-center">
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 font-serif">
          Our Categories
        </h2>
        <p className="text-luxe-gray-light/70">
          Categories coming soon. Stay tuned!
        </p>
      </section>
    );
  }

  return (
    <section id="categories" className="py-20 bg-luxe-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 font-serif">
            Signature Categories
          </h2>
          <p className="text-luxe-gray-light/70 text-sm md:text-base">
            Curated grooming and wellness experiences tailored for you.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {categories.map((cat) => (
            <div
              key={cat.id}
              className="group relative overflow-hidden rounded-2xl border border-luxe-gold/15 bg-gradient-to-b from-luxe-gray-dark to-black shadow-goldSoft cursor-pointer h-80"
            >
              <img
                src={cat.image}
                alt={cat.name}
                className="w-full h-full object-cover absolute inset-0 opacity-70 group-hover:scale-110 transition duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />
              <div className="absolute bottom-0 left-0 p-6 text-white">
                <div className="mb-3 inline-flex items-center justify-center bg-luxe-gold/15 text-luxe-gold rounded-full p-2">
                  <Scissors size={22} />
                </div>
                <h3 className="text-xl font-bold font-serif">{cat.name}</h3>
                {cat.description && (
                  <p className="text-xs text-luxe-gray-light/80 mt-1 line-clamp-2">
                    {cat.description}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Categories;
