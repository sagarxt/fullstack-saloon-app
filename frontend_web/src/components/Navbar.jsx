import { useState, useContext } from "react";
import { Link } from "react-router-dom";
import { AuthContext } from "../auth/AuthContext";

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const { user, logout } = useContext(AuthContext);

  return (
    <nav className="w-full bg-white/10 backdrop-blur-xl shadow-lg border-b border-white/20 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">

        <Link to="/" className="text-white text-2xl font-bold tracking-wide">
          LoyaltyApp
        </Link>

        <ul className="hidden md:flex items-center gap-6">
          <li><a href="#services" className="text-white/80 hover:text-white">Services</a></li>
          <li><a href="#reviews" className="text-white/80 hover:text-white">Reviews</a></li>
          <li><a href="#gallery" className="text-white/80 hover:text-white">Gallery</a></li>
          <li><a href="#contact" className="text-white/80 hover:text-white">Contact</a></li>

          {!user ? (
            <>
              <Link to="/login" className="bg-white text-indigo-700 px-4 py-2 rounded-xl font-semibold">Login</Link>
              <Link to="/register" className="bg-indigo-600 text-white px-4 py-2 rounded-xl font-semibold">Register</Link>
            </>
          ) : (
            <button onClick={logout} className="bg-red-500 text-white px-4 py-2 rounded-xl font-semibold">
              Logout
            </button>
          )}
        </ul>

        <button onClick={() => setOpen(!open)} className="md:hidden text-white text-3xl">
          ☰
        </button>
      </div>

      {open && (
        <div className="md:hidden bg-white/10 backdrop-blur-lg border-t border-white/20 p-4 space-y-4">
          <a href="#services" className="block text-white/90">Services</a>
          <a href="#reviews" className="block text-white/90">Reviews</a>
          <a href="#gallery" className="block text-white/90">Gallery</a>
          <a href="#contact" className="block text-white/90">Contact</a>

          {!user ? (
            <>
              <Link to="/login" className="block bg-white text-indigo-700 px-4 py-2 rounded-xl font-semibold text-center">Login</Link>
              <Link to="/register" className="block bg-indigo-600 text-white px-4 py-2 rounded-xl font-semibold text-center">Register</Link>
            </>
          ) : (
            <button onClick={logout} className="block w-full bg-red-500 text-white px-4 py-2 rounded-xl font-semibold text-center">
              Logout
            </button>
          )}
        </div>
      )}
    </nav>
  );
}
