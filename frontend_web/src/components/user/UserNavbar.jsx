import { Link, useNavigate } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "../../auth/AuthContext";

export default function UserNavbar() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-50 bg-white border-b shadow-sm">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">

        {/* Logo */}
        <Link to="/customer/home" className="text-xl font-semibold">
          Loyalty<span className="text-indigo-600">App</span>
        </Link>

        {/* Nav */}
        <nav className="flex items-center gap-6 text-sm">
          <button onClick={() => navigate("/customer/bookings")} className="hover:text-indigo-600">
            Bookings
          </button>
          <button onClick={() => navigate("/customer/rewards")} className="hover:text-indigo-600">
            Rewards
          </button>
          <button onClick={() => navigate("/customer/profile")} className="hover:text-indigo-600">
            Profile
          </button>

          <button
            onClick={logout}
            className="px-3 py-1.5 rounded-md bg-red-500 text-white text-xs hover:bg-red-600"
          >
            Logout
          </button>
        </nav>
      </div>
    </header>
  );
}
