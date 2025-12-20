// src/components/landing/Navbar.jsx
import React, { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import AuthModal from "../modals/AuthModal";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const openAuth = () => setAuthOpen(true);
  const closeAuth = () => setAuthOpen(false);

  return (
    <>
      <nav
        className={`fixed w-full z-40 transition-all duration-300 ${
          scrolled
            ? "bg-luxe-black/90 backdrop-blur border-b border-luxe-gold/20 py-2"
            : "bg-transparent py-4"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex-shrink-0 flex items-center cursor-pointer">
              <span className="text-2xl font-bold text-luxe-gold tracking-[0.25em] font-serif">
                LUXE
                <span className="text-white tracking-normal ml-1">SALON</span>
              </span>
            </div>

            {/* Desktop Menu */}
            <div className="hidden md:flex space-x-8 items-center">
              <a
                href="#home"
                className="text-luxe-gray-light/80 hover:text-luxe-gold text-sm font-medium uppercase tracking-wide transition"
              >
                Home
              </a>
              <a
                href="#categories"
                className="text-luxe-gray-light/80 hover:text-luxe-gold text-sm font-medium uppercase tracking-wide transition"
              >
                Services
              </a>
              <a
                href="#loyalty"
                className="text-luxe-gray-light/80 hover:text-luxe-gold text-sm font-medium uppercase tracking-wide transition"
              >
                Rewards
              </a>
              <a
                href="#reviews"
                className="text-luxe-gray-light/80 hover:text-luxe-gold text-sm font-medium uppercase tracking-wide transition"
              >
                Reviews
              </a>
              <button
                onClick={openAuth}
                className="bg-luxe-gold text-luxe-black px-6 py-2 rounded-full text-sm font-semibold hover:bg-luxe-gold-soft transition shadow-gold"
              >
                Login / Sign Up
              </button>
            </div>

            {/* Mobile Button */}
            <div className="md:hidden flex items-center">
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="text-luxe-gray-light focus:outline-none"
              >
                {isOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="md:hidden bg-luxe-black/95 backdrop-blur absolute w-full shadow-xl border-t border-luxe-gold/20">
            <div className="px-4 pt-2 pb-6 space-y-2">
              <a
                href="#home"
                onClick={() => setIsOpen(false)}
                className="block px-3 py-2 text-luxe-gray-light hover:bg-luxe-gray-dark/60 rounded-md"
              >
                Home
              </a>
              <a
                href="#categories"
                onClick={() => setIsOpen(false)}
                className="block px-3 py-2 text-luxe-gray-light hover:bg-luxe-gray-dark/60 rounded-md"
              >
                Services
              </a>
              <a
                href="#loyalty"
                onClick={() => setIsOpen(false)}
                className="block px-3 py-2 text-luxe-gray-light hover:bg-luxe-gray-dark/60 rounded-md"
              >
                Rewards
              </a>
              <a
                href="#reviews"
                onClick={() => setIsOpen(false)}
                className="block px-3 py-2 text-luxe-gray-light hover:bg-luxe-gray-dark/60 rounded-md"
              >
                Reviews
              </a>
              <button
                onClick={() => {
                  setIsOpen(false);
                  openAuth();
                }}
                className="w-full mt-4 bg-luxe-gold text-luxe-black px-6 py-3 rounded-md font-bold hover:bg-luxe-gold-soft transition shadow-gold"
              >
                Login / Sign Up
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* Auth Modal */}
      <AuthModal open={authOpen} onClose={closeAuth} />
    </>
  );
};

export default Navbar;
