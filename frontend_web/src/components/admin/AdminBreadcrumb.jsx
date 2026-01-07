import { useLocation, Link } from "react-router-dom";

export default function AdminBreadcrumb() {
  const location = useLocation();
  const parts = location.pathname.split("/").filter(Boolean).slice(1);

  return (
    <div className="text-xs text-luxe-gray-medium mb-4">
      <Link to="/admin/dashboard" className="hover:text-luxe-gold">
        Admin
      </Link>

      {parts.map((p, i) => (
        <span key={i}>
          {" / "}
          <span className="capitalize text-luxe-gray-light">
            {p.replace("-", " ")}
          </span>
        </span>
      ))}
    </div>
  );
}
