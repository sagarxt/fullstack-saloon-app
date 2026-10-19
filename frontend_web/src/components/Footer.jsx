import { Sparkles, Phone, Mail, MapPin, Heart } from "lucide-react";
import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="bg-groomish-slate text-white border-t border-groomish-slateLight/30 mt-4 sm:mt-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
        {/* Brand */}
        <div className="flex flex-row md:flex-col items-center md:items-start gap-3.5 sm:gap-4 md:gap-2.5 pb-4 md:pb-0 border-b border-white/10 md:border-b-0">
          <div className="flex items-center shrink-0">
            <img
              src="https://res.cloudinary.com/dfdnljcyt/image/upload/v1792094666/groomish-logo-black-bg_et3gzt.png"
              alt="Groomish Now"
              className="h-10 sm:h-12 w-auto object-contain shrink-0"
            />
          </div>
          <p className="text-[11px] sm:text-xs text-gray-300 leading-relaxed max-w-xs flex-1">
            Elevating your grooming lifestyle. Premium services, certified master stylists, and a rewarding VIP loyalty program.
          </p>
        </div>

        {/* Quick Links */}
        <div>
          <h4 className="text-groomish-orange font-heading font-bold text-xs uppercase tracking-wider mb-2">
            Quick Navigation
          </h4>
          <ul className="space-y-1.5 text-xs text-gray-300">
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
              <Link to="/qa" className="hover:text-groomish-orange transition block py-0.5">
                Q&A / FAQs
              </Link>
            </li>
            <li>
              <Link to="/policy" className="hover:text-groomish-orange transition block py-0.5">
                Policies (Order, Payment & Refunds)
              </Link>
            </li>
            <li>
              <Link to="/customer/rewards" className="hover:text-groomish-orange transition block py-0.5">
                VIP Rewards & Perks
              </Link>
            </li>
          </ul>
        </div>

        {/* Contact */}
        <div>
          <h4 className="text-groomish-orange font-heading font-bold text-xs uppercase tracking-wider mb-2">
            Connect With Us
          </h4>
          <ul className="space-y-1.5 text-xs text-gray-300">
            <li>
              <a href="tel:+919000080000" className="flex items-center gap-2 hover:text-white transition group py-0.5">
                <div className="w-6 h-6 rounded-md bg-white/5 group-hover:bg-groomish-orange/20 flex items-center justify-center shrink-0 transition">
                  <Phone className="w-3 h-3 text-groomish-orange" />
                </div>
                <span>+91 90000 80000</span>
              </a>
            </li>
            <li>
              <a href="mailto:support@groomishnow.com" className="flex items-center gap-2 hover:text-white transition group py-0.5">
                <div className="w-6 h-6 rounded-md bg-white/5 group-hover:bg-groomish-coral/20 flex items-center justify-center shrink-0 transition">
                  <Mail className="w-3 h-3 text-groomish-coral" />
                </div>
                <span className="truncate">support@groomishnow.com</span>
              </a>
            </li>
            <li className="flex items-start gap-2 py-0.5">
              <div className="w-6 h-6 rounded-md bg-white/5 flex items-center justify-center shrink-0 mt-0.5">
                <MapPin className="w-3 h-3 text-groomish-gold" />
              </div>
              <span className="leading-snug">Suite 401, Groomish Avenue, Luxury Hub</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-groomish-slateLight/20 py-3 text-center text-[11px] text-gray-400 flex flex-col sm:flex-row items-center justify-between max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 gap-2">
        <p>© {new Date().getFullYear()} Groomish Now. All rights reserved.</p>
        <p className="flex items-center gap-1">
          Crafted with <Heart className="w-3 h-3 text-groomish-crimson fill-groomish-crimson inline" /> for effortless style
        </p>
      </div>
    </footer>
  );
}
