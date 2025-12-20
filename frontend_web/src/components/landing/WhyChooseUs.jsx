import React from "react";
import { Award, Crown, Ticket, Scissors, CheckCircle } from "lucide-react";

const WhyChooseUs = () => {
  return (
    <section
      id="loyalty"
      className="py-20 bg-luxe-black text-white relative overflow-hidden"
    >
      {/* Decorative glows */}
      <div className="absolute top-0 left-0 w-64 h-64 bg-luxe-gold/20 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-luxe-gold/10 rounded-full blur-3xl translate-x-1/3 translate-y-1/3" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold mb-6 font-serif">
              Why Choose{" "}
              <span className="text-luxe-gold">Luxe Salon?</span>
            </h2>
            <div className="space-y-8 text-sm md:text-base">
              <div className="flex">
                <div className="bg-luxe-gold/15 p-3 rounded-lg h-fit mr-4 text-luxe-gold">
                  <Award size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-1">
                    Professional Artists & Stylists
                  </h3>
                  <p className="text-luxe-gray-light/80">
                    Work with certified stylists and therapists who understand
                    modern trends, classic looks, and personal comfort.
                  </p>
                </div>
              </div>
              <div className="flex">
                <div className="bg-luxe-gold/15 p-3 rounded-lg h-fit mr-4 text-luxe-gold">
                  <Crown size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-1">
                    Tiered Loyalty Program
                  </h3>
                  <p className="text-luxe-gray-light/80">
                    Earn points and progress from{" "}
                    <span className="font-semibold text-luxe-gray-light">
                      Silver
                    </span>{" "}
                    to{" "}
                    <span className="font-semibold text-luxe-gold">
                      Gold
                    </span>{" "}
                    to{" "}
                    <span className="font-semibold text-indigo-300">
                      Platinum
                    </span>{" "}
                    for premium perks and complimentary services.
                  </p>
                </div>
              </div>
              <div className="flex">
                <div className="bg-luxe-gold/15 p-3 rounded-lg h-fit mr-4 text-luxe-gold">
                  <Ticket size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-1">
                    Personalized Offers & Vouchers
                  </h3>
                  <p className="text-luxe-gray-light/80">
                    Enjoy curated offers like{" "}
                    <span className="bg-luxe-gray-dark border border-luxe-gold/30 px-2 py-0.5 rounded font-mono text-xs text-luxe-gold">
                    WELCOME BONUS
                    </span>{" "}
                    for new guests, exclusive{" "}
                    <span className="bg-luxe-gray-dark border border-luxe-gold/30 px-2 py-0.5 rounded font-mono text-xs text-luxe-gold">
                    BIRTHDAY
                    </span>{" "}
                     surprises and more.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Loyalty Card Visual */}
          <div className="relative">
            <div className="bg-gradient-to-br from-luxe-gray-dark to-black border border-luxe-gold/30 p-8 rounded-2xl shadow-gold relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10 text-luxe-gold">
                <Scissors size={120} />
              </div>
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h4 className="text-luxe-gray-light/70 text-xs uppercase tracking-[0.3em]">
                    Membership
                  </h4>
                  <h3 className="text-2xl md:text-3xl font-bold text-luxe-gold font-serif">
                    GOLD TIER
                  </h3>
                </div>
                <Crown className="text-luxe-gold" size={32} />
              </div>
              <div className="mb-6">
                <p className="text-luxe-gray-light/70 text-xs uppercase tracking-[0.2em] mb-1">
                  Current Balance
                </p>
                <div className="text-3xl md:text-4xl font-mono font-bold">
                  2,450 PTS
                </div>
              </div>
              <div className="w-full bg-luxe-gray-dark h-2 rounded-full overflow-hidden">
                <div className="bg-luxe-gold h-full w-3/4" />
              </div>
              <div className="mt-2 text-[10px] text-luxe-gray-light/70 flex justify-between">
                <span>Silver</span>
                <span className="text-luxe-gold">Gold</span>
                <span>Platinum</span>
              </div>
            </div>
            {/* Floating Badge */}
            {/* <div className="absolute -bottom-6 -left-6 bg-white text-luxe-black p-4 rounded-xl shadow-lg flex items-center gap-3">
              <div className="bg-emerald-100 p-2 rounded-full text-emerald-600">
                <CheckCircle size={22} />
              </div>
              <div>
                <div className="font-bold text-xs">Hygiene Verified</div>
                <div className="text-[10px] text-luxe-gray-medium">
                  100% Safe & Sanitized
                </div>
              </div>
            </div> */}
          </div>
        </div>
      </div>
    </section>
  );
};

export default WhyChooseUs;
