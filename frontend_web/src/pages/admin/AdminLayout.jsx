// src/pages/admin/AdminLayout.jsx
import AdminSidebar from "../../components/admin/AdminSidebar";
import AdminTopbar from "../../components/admin/AdminTopbar";

export default function AdminLayout({ children }) {
  return (
    <div className="flex min-h-screen bg-gray-100">

      {/* Sidebar */}
      <AdminSidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <AdminTopbar />

        {/* Page Content */}
        <div className="p-6">
          {children}
        </div>
      </div>

    </div>
  );
}
