import React from "react";
import { MapPin, Phone, Mail, Map } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-luxe-black text-luxe-gray-light py-14 border-t border-luxe-gold/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-4 gap-12">
          {/* Brand */}
          <div>
            <span className="text-2xl font-bold text-luxe-gold tracking-[0.25em] mb-4 block font-serif">
              LUXE
              <span className="text-white tracking-normal ml-1">SALON</span>
            </span>
            <p className="text-luxe-gray-light/70 text-sm leading-relaxed">
              A luxury salon experience powered by smart booking, loyalty
              rewards and premium in-store service.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-[0.2em]">
              Quick Links
            </h4>
            <ul className="space-y-2 text-sm text-luxe-gray-light/80">
              <li>
                <a href="#" className="hover:text-luxe-gold transition">
                  Book Appointment
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-luxe-gold transition">
                  My Profile
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-luxe-gold transition">
                  Refer a Friend
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-luxe-gold transition">
                  Privacy Policy
                </a>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-[0.2em]">
              Contact
            </h4>
            <ul className="space-y-3 text-sm text-luxe-gray-light/80">
              <li className="flex items-start gap-3">
                <MapPin size={18} className="text-luxe-gold mt-1 shrink-0" />
                <span>
                  123 Fashion Avenue,
                  <br />
                  Downtown District, NY 10001
                </span>
              </li>
              <li className="flex items-center gap-3">
                <Phone size={18} className="text-luxe-gold shrink-0" />
                <span>+1 (555) 123-4567</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail size={18} className="text-luxe-gold shrink-0" />
                <span>hello@luxesalon.com</span>
              </li>
            </ul>
          </div>

          {/* Map Placeholder */}
          <div>
            <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-[0.2em]">
              Find Us
            </h4>
            <div className="w-full h-40 bg-luxe-gray-dark/80 rounded-lg flex items-center justify-center text-luxe-gray-light/70 border border-luxe-gold/10">
              <div className="text-center">
                <Map size={30} className="mx-auto mb-2 text-luxe-gold" />
                <span className="text-[11px] uppercase tracking-[0.2em]">
                  Google Map Integration
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-luxe-gray-dark mt-10 pt-6 text-center text-[11px] text-luxe-gray-light/60">
          &copy; {new Date().getFullYear()} Luxe Salon App. Built with React &
          Spring Boot.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
