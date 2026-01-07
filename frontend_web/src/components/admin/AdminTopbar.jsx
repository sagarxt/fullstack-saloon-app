import { useContext } from "react";
import { Menu } from "lucide-react";
import { AuthContext } from "../../auth/AuthContext";

export default function AdminTopbar({ onMenuClick }) {
  const { user, logout } = useContext(AuthContext);

  return (
    <header className="h-16 bg-black/80 border-b border-luxe-gold/20 backdrop-blur flex items-center justify-between px-4 md:px-8">

      {/* Left */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="md:hidden text-luxe-gold"
        >
          <Menu />
        </button>

        <div>
          <h2 className="text-lg font-serif font-semibold">
            Admin Panel
          </h2>
          <p className="text-xs text-luxe-gray-medium">
            Manage your salon
          </p>
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-4">
        <span className="text-sm text-luxe-gray-light hidden sm:block">
          {user?.email}
        </span>

        <div className="w-9 h-9 rounded-full bg-luxe-gold/20 border border-luxe-gold/40 flex items-center justify-center text-xs font-semibold">
          AD
        </div>

        <button
          onClick={logout}
          className="text-xs px-3 py-1 rounded-full bg-red-500/20 text-red-400 hover:bg-red-500/30"
        >
          Logout
        </button>
      </div>

    </header>
  );
}
