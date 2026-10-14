import { Routes, Route, Navigate } from "react-router-dom";
import LandingPage from "./pages/landing/LandingPage";
import PrivateRoute from "./auth/PrivateRoute";

// Public Pages
import PublicCategoriesPage from "./pages/public/CategoriesPage";
import CategoryDetailPage from "./pages/public/CategoryDetailPage";
import PublicServicesPage from "./pages/public/ServicesPage";
import ServiceDetailPage from "./pages/public/ServiceDetailPage";
import PublicProductsPage from "./pages/public/ProductsPage";
import ProductDetailPage from "./pages/public/ProductDetailPage";

// Customer Pages
import MyBookingsPage from "./pages/customer/MyBookingsPage";
import BookingDetailPage from "./pages/customer/BookingDetailPage";
import RewardsPage from "./pages/customer/RewardsPage";
import MyVouchersPage from "./pages/customer/MyVouchersPage";
import ProfilePage from "./pages/customer/ProfilePage";
import CartPage from "./pages/customer/CartPage";
import CheckoutPage from "./pages/customer/CheckoutPage";

// Admin Pages
import AdminLayout from "./layouts/AdminLayout";
import DashboardPage from "./pages/admin/DashboardPage";
import StoresPage from "./pages/admin/StoresPage";
import BookingsPage from "./pages/admin/BookingsPage";
import AdminBookingDetailPage from "./pages/admin/AdminBookingDetailPage";
import CategoriesPage from "./pages/admin/CategoriesPage";
import ServicesPage from "./pages/admin/ServicesPage";
import ProductsPage from "./pages/admin/ProductsPage";
import CustomersPage from "./pages/admin/CustomersPage";
import StaffPage from "./pages/admin/StaffPage";
import CouponsPage from "./pages/admin/CouponsPage";
import PaymentsPage from "./pages/admin/PaymentsPage";
import ReviewsPage from "./pages/admin/ReviewsPage";
import AdminRewardsPage from "./pages/admin/RewardsPage";

// Staff Pages
import StaffDashboard from "./pages/staff/StaffDashboard";
import StaffBookingDetailPage from "./pages/staff/StaffBookingDetailPage";

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
      <Route path="/products/:productId" element={<ProductDetailPage />} />
      <Route path="/product/:productId" element={<ProductDetailPage />} />
      <Route path="/cart" element={<CartPage />} />

      {/* Customer Protected Routes (Only Authorized Customers) */}
      <Route element={<PrivateRoute roles={["CUSTOMER"]} />}>
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/customer/bookings" element={<MyBookingsPage />} />
        <Route path="/customer/bookings/:id" element={<BookingDetailPage />} />
        <Route path="/customer/rewards" element={<RewardsPage />} />
        <Route path="/customer/vouchers" element={<MyVouchersPage />} />
        <Route path="/customer/profile" element={<ProfilePage />} />
      </Route>

      {/* Staff Protected Routes */}
      <Route element={<PrivateRoute roles={["STAFF", "ADMIN"]} />}>
        <Route path="/staff/dashboard" element={<StaffDashboard />} />
        <Route path="/staff/bookings/:id" element={<StaffBookingDetailPage />} />
      </Route>

      {/* Admin Portal Protected Routes */}
      <Route element={<PrivateRoute roles={["ADMIN"]} />}>
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="stores" element={<StoresPage />} />
          <Route path="bookings" element={<BookingsPage />} />
          <Route path="bookings/:id" element={<AdminBookingDetailPage />} />
          <Route path="categories" element={<CategoriesPage />} />
          <Route path="services" element={<ServicesPage />} />
          <Route path="products" element={<ProductsPage />} />
          <Route path="customers" element={<CustomersPage />} />
          <Route path="staffs" element={<StaffPage />} />
          <Route path="coupons" element={<CouponsPage />} />
          <Route path="rewards" element={<AdminRewardsPage />} />
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