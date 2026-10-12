import { Sparkles, Phone, Mail, MapPin, Heart } from "lucide-react";
import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="bg-groomish-slate text-white border-t border-groomish-slateLight/30 mt-12 sm:mt-20 md:mt-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 md:py-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-10">
        {/* Brand */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <img
              src="/groomisg_now_icon.png"
              alt="Groomish Now"
              className="h-10 w-10 object-contain rounded-xl bg-white p-1 shrink-0"
            />
            <img
              src="/groomish_now_name.png"
              alt="Groomish Now"
              className="h-6 w-auto brightness-0 invert object-contain"
            />
          </div>
          <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
            Elevating your grooming lifestyle. Premium services, certified master stylists, and a rewarding VIP loyalty program.
          </p>
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-groomish-gold bg-white/5 px-3 py-1.5 rounded-full border border-groomish-gold/20">
            <Sparkles className="w-3.5 h-3.5 fill-groomish-gold text-groomish-gold shrink-0" />
            <span>Earn points on every salon visit</span>
          </div>
        </div>

        {/* Quick Links */}
        <div>
          <h4 className="text-groomish-orange font-heading font-bold text-xs uppercase tracking-wider mb-3 sm:mb-4">
            Quick Navigation
          </h4>
          <ul className="space-y-2 text-xs sm:text-sm text-gray-300">
            <li>
              <Link to="/services" className="hover:text-groomish-orange transition block py-0.5">
                Explore Services
              </Link>
            </li>
            <li>
              <Link to="/categories" className="hover:text-groomish-orange transition block py-0.5">
                Browse Categories
              </Link>
            </li>
            <li>
              <Link to="/products" className="hover:text-groomish-orange transition block py-0.5">
                Shop Grooming Products
              </Link>
            </li>
            <li>
              <Link to="/customer/rewards" className="hover:text-groomish-orange transition block py-0.5">
                VIP Rewards & Perks
              </Link>
            </li>
          </ul>
        </div>

        {/* Hours & Policy */}
        <div>
          <h4 className="text-groomish-orange font-heading font-bold text-xs uppercase tracking-wider mb-3 sm:mb-4">
            Salon Hours
          </h4>
          <ul className="space-y-2 text-xs sm:text-sm text-gray-300">
            <li className="flex justify-between items-center py-0.5 border-b border-white/5">
              <span>Mon – Fri:</span>
              <span className="font-semibold text-white">9:00 AM – 9:00 PM</span>
            </li>
            <li className="flex justify-between items-center py-0.5 border-b border-white/5">
              <span>Saturday:</span>
              <span className="font-semibold text-white">8:30 AM – 9:30 PM</span>
            </li>
            <li className="flex justify-between items-center py-0.5 border-b border-white/5">
              <span>Sunday:</span>
              <span className="font-semibold text-white">10:00 AM – 8:00 PM</span>
            </li>
            <li className="pt-1 text-[11px] text-gray-400">
              *Walk-ins welcomed; online booking recommended.
            </li>
          </ul>
        </div>

        {/* Contact */}
        <div>
          <h4 className="text-groomish-orange font-heading font-bold text-xs uppercase tracking-wider mb-3 sm:mb-4">
            Connect With Us
          </h4>
          <ul className="space-y-2.5 text-xs sm:text-sm text-gray-300">
            <li>
              <a href="tel:+919000080000" className="flex items-center gap-2.5 hover:text-white transition group py-0.5">
                <div className="w-7 h-7 rounded-lg bg-white/5 group-hover:bg-groomish-orange/20 flex items-center justify-center shrink-0 transition">
                  <Phone className="w-3.5 h-3.5 text-groomish-orange" />
                </div>
                <span>+91 90000 80000</span>
              </a>
            </li>
            <li>
              <a href="mailto:support@groomishnow.com" className="flex items-center gap-2.5 hover:text-white transition group py-0.5">
                <div className="w-7 h-7 rounded-lg bg-white/5 group-hover:bg-groomish-coral/20 flex items-center justify-center shrink-0 transition">
                  <Mail className="w-3.5 h-3.5 text-groomish-coral" />
                </div>
                <span className="truncate">support@groomishnow.com</span>
              </a>
            </li>
            <li className="flex items-start gap-2.5 py-0.5">
              <div className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center shrink-0 mt-0.5">
                <MapPin className="w-3.5 h-3.5 text-groomish-gold" />
              </div>
              <span className="leading-snug">Suite 401, Groomish Avenue, Luxury Hub</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-groomish-slateLight/20 py-5 text-center text-xs text-gray-400 flex flex-col sm:flex-row items-center justify-between max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 gap-3">
        <p>© {new Date().getFullYear()} Groomish Now. All rights reserved.</p>
        <p className="flex items-center gap-1">
          Crafted with <Heart className="w-3.5 h-3.5 text-groomish-crimson fill-groomish-crimson inline" /> for effortless style
        </p>
      </div>
    </footer>
  );
}
