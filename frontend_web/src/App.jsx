import { Routes, Route } from "react-router-dom";

/* Public */
import LandingPage from "./pages/landing/LandingPage";

/* ADMIN */
import AdminLayout from "./pages/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import CategoryPage from "./pages/admin/CategoryPage";
import ServicesAdmin from "./pages/admin/ServicesAdmin";

/* STAFF */
import StaffDashboard from "./pages/staff/StaffDashboard";

/* CUSTOMER */
import CustomerDashboard from "./pages/customer/UserHome";
import BookingPage from "./pages/customer/BookingPage";
import ConfirmBooking from "./pages/customer/ConfirmBooking";
import ServiceDetail from "./pages/customer/ServiceDetail";
import MyBookings from "./pages/customer/MyBookings";
import BookingDetails from "./pages/customer/BookingDetails";
import CustomerProfile from "./pages/customer/CustomerProfile";

function App() {
  return (
    <Routes>
      {/* ================= PUBLIC ================= */}
      <Route path="/" element={<LandingPage />} />

      {/* ================= ADMIN ================= */}
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<AdminDashboard />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="categories" element={<CategoryPage />} />
        <Route path="services" element={<ServicesAdmin />} />
      </Route>

      {/* ================= STAFF ================= */}
      <Route path="/staff/dashboard" element={<StaffDashboard />} />

      {/* ================= CUSTOMER ================= */}
      <Route path="/customer">
        <Route path="home" element={<CustomerDashboard />} />
        <Route path="service/:id" element={<ServiceDetail />} />
        <Route path="book/:id" element={<BookingPage />} />
        <Route path="confirm-booking" element={<ConfirmBooking />} />
        <Route path="bookings" element={<MyBookings />} />
        <Route path="bookings/:id" element={<BookingDetails />} />
        <Route path="profile" element={<CustomerProfile />} />
        {/* <Route path="profile/change-password" element={<CustomerProfile />} /> */}
      </Route>
    </Routes>
  );
}

export default App;
