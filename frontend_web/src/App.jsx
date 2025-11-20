import { Routes, Route } from "react-router-dom";
import './index.css'
import Landing from "./pages/Landing";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import PrivateRoute from "./auth/PrivateRoute";
import CustomerDashboard from "./pages/customer/CustomerDashboard";
import RewardsPage from "./pages/customer/RewardsPage";
import ServicesList from "./pages/customer/ServicesList";
import ServiceDetail from "./pages/customer/ServiceDetail";
import BookService from "./pages/customer/BookService";
import MyBookings from "./pages/customer/MyBookings";
import Profile from "./pages/customer/Profile";
import Referral from "./pages/customer/Referral";
import AdminDashboard from "./pages/admin/AdminDashboard";
import ServicesAdmin from "./pages/admin/ServicesAdmin";
import RewardsAdmin from "./pages/admin/RewardsAdmin";
import BookingsAdmin from "./pages/admin/BookingsAdmin";
import CustomersAdmin from "./pages/admin/CustomersAdmin";
import CustomerDetails from "./pages/admin/CustomerDetails";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route element={<PrivateRoute roles={["ROLE_CUSTOMER"]} />}>
        <Route path="/customer" element={<CustomerDashboard />} />
        <Route path="/customer/rewards" element={<RewardsPage />} />
        <Route path="/customer/services" element={<ServicesList />} />
        <Route path="/customer/service/:id" element={<ServiceDetail />} />
        <Route path="/customer/book/:serviceId" element={<BookService />} />
        <Route path="/customer/bookings" element={<MyBookings />} />   {/* ADD THIS */}
        <Route path="/customer/profile" element={<Profile />} />
        <Route path="/customer/referral" element={<Referral />} />
      </Route>


      <Route element={<PrivateRoute roles={["ROLE_ADMIN"]} />}>
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/services" element={<ServicesAdmin />} />
        <Route path="/admin/rewards" element={<RewardsAdmin />} />
        <Route path="/admin/bookings" element={<BookingsAdmin />} />
        <Route path="/admin/customers" element={<CustomersAdmin />} />
        <Route path="/admin/customers/:id" element={<CustomerDetails />} />
      </Route>
    </Routes>
  );
}

export default App;
