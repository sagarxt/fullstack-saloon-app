// src/components/landing/Reviews.jsx
import React from "react";
import { Star } from "lucide-react";

const Reviews = ({ reviews = [], loading }) => {
  if (loading) {
    return (
      <section id="reviews" className="py-20 bg-luxe-black text-center">
        <p className="text-luxe-gold">Loading reviews...</p>
      </section>
    );
  }

  if (!loading && reviews.length === 0) {
    return (
      <section id="reviews" className="py-20 bg-luxe-black text-center">
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 font-serif">
          Client Stories
        </h2>
        <p className="text-luxe-gray-light/70">
          Reviews coming soon. Be the first to share your Luxe experience.
        </p>
      </section>
    );
  }

  return (
    <section id="reviews" className="py-20 bg-luxe-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-10 font-serif">
          Client Stories
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          {reviews.map((review) => (
            <div
              key={review.id}
              className="bg-luxe-gray-dark/80 border border-luxe-gold/10 p-8 rounded-2xl relative shadow-goldSoft"
            >
              <div className="text-luxe-gold flex justify-center mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    size={18}
                    className={
                      i < (review.rating || 0)
                        ? "fill-current text-luxe-gold"
                        : "text-luxe-gray-medium"
                    }
                  />
                ))}
              </div>
              <p className="text-luxe-gray-light/80 italic mb-6 text-sm md:text-base">
                "{review.comment}"
              </p>
              <div className="font-bold text-white text-sm md:text-base">
                {review.userName || review.name || "Happy Client"}
              </div>
              {review.role && (
                <div className="text-[11px] text-luxe-gold uppercase tracking-[0.2em] mt-1">
                  {review.role}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Reviews;
