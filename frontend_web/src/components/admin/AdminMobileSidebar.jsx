import { NavLink } from "react-router-dom";
import { X } from "lucide-react";

export default function AdminMobileSidebar({ open, onClose, menu }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm md:hidden">
      <aside className="absolute left-0 top-0 h-full w-64 bg-black border-r border-luxe-gold/20">

        <div className="flex items-center justify-between px-4 py-4 border-b border-luxe-gold/20">
          <h2 className="text-luxe-gold font-serif text-xl">Admin</h2>
          <button onClick={onClose}>
            <X className="text-white" />
          </button>
        </div>

        <nav className="px-4 py-6 space-y-1">
          {menu.map(({ label, path, icon: Icon }) => (
            <NavLink
              key={path}
              to={path}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg ${
                  isActive
                    ? "bg-luxe-gold/20 text-luxe-gold"
                    : "text-luxe-gray-light"
                }`
              }
            >
              <Icon className="w-4 h-4" />
              {label}
            </NavLink>
          ))}
        </nav>

      </aside>
    </div>
  );
}
