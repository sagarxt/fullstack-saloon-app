// src/components/admin/AdminTopbar.jsx
import { useContext } from "react";
import { AuthContext } from "../../auth/AuthContext";

export default function AdminTopbar() {
  const { logout, user } = useContext(AuthContext);

  return (
    <header className="w-full bg-white shadow px-6 py-3 flex justify-between items-center">

      <h1 className="text-xl font-semibold">Welcome, Admin</h1>

      <div className="flex items-center gap-4">
        <span className="text-gray-700">{user?.email}</span>

        <button
          onClick={logout}
          className="px-4 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600"
        >
          Logout
        </button>
      </div>

    </header>
  );
}
