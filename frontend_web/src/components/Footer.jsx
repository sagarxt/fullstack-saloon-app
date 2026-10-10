import { Sparkles, Phone, Mail, MapPin, Heart } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-groomish-slate text-white border-t border-groomish-slateLight/30 mt-28">
      <div className="max-w-7xl mx-auto px-6 py-16 grid grid-cols-1 md:grid-cols-4 gap-10">
        {/* Brand */}
        <div className="space-y-4 md:col-span-1">
          <div className="flex items-center gap-3">
            <img
              src="/groomisg_now_icon.png"
              alt="Groomish Now"
              className="h-10 w-10 object-contain rounded-xl bg-white p-1"
            />
            <img
              src="/groomish_now_name.png"
              alt="Groomish Now"
              className="h-6 w-auto brightness-0 invert object-contain"
            />
          </div>
          <p className="text-sm text-gray-300 leading-relaxed">
            Elevating your grooming lifestyle. Premium services, certified master stylists, and a rewarding VIP loyalty program.
          </p>
          <div className="flex items-center gap-2 text-xs font-semibold text-groomish-gold">
            <Sparkles className="w-4 h-4 fill-groomish-gold text-groomish-gold" />
            <span>Earn 25+ points on every salon visit</span>
          </div>
        </div>

        {/* Quick Links */}
        <div>
          <h4 className="text-white font-heading font-bold text-base mb-4 tracking-wide uppercase text-xs">
            Quick Navigation
          </h4>
          <ul className="space-y-2.5 text-sm text-gray-300">
            <li>
              <a href="#services" className="hover:text-groomish-orange transition">
                Explore Services
              </a>
            </li>
            <li>
              <a href="#categories" className="hover:text-groomish-orange transition">
                Browse Categories
              </a>
            </li>
            <li>
              <a href="#reviews" className="hover:text-groomish-orange transition">
                Client Testimonials
              </a>
            </li>
            <li>
              <a href="#rewards" className="hover:text-groomish-orange transition">
                Loyalty Tiers & Benefits
              </a>
            </li>
          </ul>
        </div>

        {/* Hours & Policy */}
        <div>
          <h4 className="text-white font-heading font-bold text-base mb-4 tracking-wide uppercase text-xs">
            Salon Hours
          </h4>
          <ul className="space-y-2 text-sm text-gray-300">
            <li className="flex justify-between">
              <span>Mon – Fri:</span>
              <span className="font-semibold text-white">9:00 AM – 9:00 PM</span>
            </li>
            <li className="flex justify-between">
              <span>Saturday:</span>
              <span className="font-semibold text-white">8:30 AM – 9:30 PM</span>
            </li>
            <li className="flex justify-between">
              <span>Sunday:</span>
              <span className="font-semibold text-white">10:00 AM – 8:00 PM</span>
            </li>
            <li className="pt-2 text-xs text-gray-400">
              *Walk-ins welcomed; reservations recommended.
            </li>
          </ul>
        </div>

        {/* Contact */}
        <div>
          <h4 className="text-white font-heading font-bold text-base mb-4 tracking-wide uppercase text-xs">
            Connect With Us
          </h4>
          <ul className="space-y-3 text-sm text-gray-300">
            <li className="flex items-center gap-2.5">
              <Phone className="w-4 h-4 text-groomish-orange" />
              <span>+91 90000 80000</span>
            </li>
            <li className="flex items-center gap-2.5">
              <Mail className="w-4 h-4 text-groomish-coral" />
              <span>support@groomishnow.com</span>
            </li>
            <li className="flex items-start gap-2.5">
              <MapPin className="w-4 h-4 text-groomish-gold shrink-0 mt-0.5" />
              <span>Suite 401, Groomish Avenue, Luxury Hub</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-groomish-slateLight/20 py-6 text-center text-xs text-gray-400 flex flex-col sm:flex-row items-center justify-between max-w-7xl mx-auto px-6 gap-3">
        <p>© {new Date().getFullYear()} Groomish Now. All rights reserved.</p>
        <p className="flex items-center gap-1">
          Crafted with <Heart className="w-3.5 h-3.5 text-groomish-crimson fill-groomish-crimson" /> for effortless style
        </p>
      </div>
    </footer>
  );
}
