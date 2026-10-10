import { Routes, Route, Navigate } from "react-router-dom";
import LandingPage from "./pages/landing/LandingPage";
import PrivateRoute from "./auth/PrivateRoute";

// Public Pages
import PublicCategoriesPage from "./pages/public/CategoriesPage";
import CategoryDetailPage from "./pages/public/CategoryDetailPage";
import PublicServicesPage from "./pages/public/ServicesPage";
import ServiceDetailPage from "./pages/public/ServiceDetailPage";
import PublicProductsPage from "./pages/public/ProductsPage";

// Customer Pages
import MyBookingsPage from "./pages/customer/MyBookingsPage";
import RewardsPage from "./pages/customer/RewardsPage";
import ProfilePage from "./pages/customer/ProfilePage";

// Admin Pages
import AdminLayout from "./layouts/AdminLayout";
import DashboardPage from "./pages/admin/DashboardPage";
import BookingsPage from "./pages/admin/BookingsPage";
import CategoriesPage from "./pages/admin/CategoriesPage";
import ServicesPage from "./pages/admin/ServicesPage";
import ProductsPage from "./pages/admin/ProductsPage";
import CustomersPage from "./pages/admin/CustomersPage";
import StaffPage from "./pages/admin/StaffPage";
import CouponsPage from "./pages/admin/CouponsPage";
import PaymentsPage from "./pages/admin/PaymentsPage";
import ReviewsPage from "./pages/admin/ReviewsPage";

// Staff Pages
import StaffDashboard from "./pages/staff/StaffDashboard";

function App() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/categories" element={<PublicCategoriesPage />} />
      <Route path="/categories/:categoryId" element={<CategoryDetailPage />} />
      <Route path="/category/:categoryId" element={<CategoryDetailPage />} />
      <Route path="/services" element={<PublicServicesPage />} />
      <Route path="/services/:serviceId" element={<ServiceDetailPage />} />
      <Route path="/products" element={<PublicProductsPage />} />

      {/* Customer Protected Routes */}
      <Route element={<PrivateRoute roles={["CUSTOMER", "ADMIN", "STAFF"]} />}>
        <Route path="/customer/bookings" element={<MyBookingsPage />} />
        <Route path="/customer/rewards" element={<RewardsPage />} />
        <Route path="/customer/profile" element={<ProfilePage />} />
      </Route>

      {/* Staff Protected Routes */}
      <Route element={<PrivateRoute roles={["STAFF", "ADMIN"]} />}>
        <Route path="/staff/dashboard" element={<StaffDashboard />} />
      </Route>

      {/* Admin Portal Protected Routes */}
      <Route element={<PrivateRoute roles={["ADMIN"]} />}>
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="bookings" element={<BookingsPage />} />
          <Route path="categories" element={<CategoriesPage />} />
          <Route path="services" element={<ServicesPage />} />
          <Route path="products" element={<ProductsPage />} />
          <Route path="customers" element={<CustomersPage />} />
          <Route path="staffs" element={<StaffPage />} />
          <Route path="coupons" element={<CouponsPage />} />
          <Route path="payments" element={<PaymentsPage />} />
          <Route path="reviews" element={<ReviewsPage />} />
        </Route>
      </Route>

      {/* Catch-all redirect */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;