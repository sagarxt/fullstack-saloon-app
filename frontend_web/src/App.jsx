import { Routes, Route } from "react-router-dom";
import LandingPage from "./pages/landing/LandingPage";
import AdminDashboard from "./pages/admin/AdminDashboard";
import StaffDashboard from "./pages/staff/StaffDashboard";
import CustomerDashboard from "./pages/customer/CustomerDashboard";

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />

      {/* Dashboards */}
      <Route path="/admin/dashboard" element={<AdminDashboard />} />
      <Route path="/staff/dashboard" element={<StaffDashboard />} />
      <Route path="/customer/home" element={<CustomerDashboard />} />
    </Routes>
  );
}

export default App;
