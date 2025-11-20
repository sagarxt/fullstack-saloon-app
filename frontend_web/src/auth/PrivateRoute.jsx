import { useContext } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { AuthContext } from "./AuthContext";

export default function PrivateRoute({ roles }) {
  const { token } = useContext(AuthContext);

  console.log("👉 PrivateRoute running", roles);
  console.log("👉 Token:", token);

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  const decoded = JSON.parse(atob(token.split(".")[1]));

  if (roles && !roles.includes(decoded.role)) {
    return <Navigate to="/" replace />;
  }

  // Render the child route
  return <Outlet />;
}
