// src/pages/admin/CustomerDetail.jsx
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import AdminLayout from "./AdminLayout";
import axiosClient from "../../api/axiosClient";
import { useToast } from "../../components/Toast";

export default function CustomerDetail() {
  const { id } = useParams();
  const { showToast } = useToast();

  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadCustomerDetail();
  }, [id]);

  const loadCustomerDetail = async () => {
    setLoading(true);
    try {
      const res = await axiosClient.get(`/admin/customers/${id}`);
      setCustomer(res.data);
    } catch (err) {
      showToast("Failed to load customer details", "error");
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="text-center py-20 text-gray-600">Loading...</div>
      </AdminLayout>
    );
  }

  if (!customer) {
    return (
      <AdminLayout>
        <div className="text-center py-20 text-gray-600">
          Customer not found
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <h2 className="text-2xl font-semibold mb-4">
        Customer Details
      </h2>

      {/* TOP CARD */}
      <div className="bg-white shadow p-6 rounded-xl mb-6">
        <h3 className="text-xl font-semibold">{customer.name}</h3>
        <p className="text-gray-600">{customer.email}</p>
        <p className="text-gray-600">{customer.phone}</p>

        <div className="mt-4 flex gap-10 text-sm">
          <p>
            <b>Total Bookings:</b> {customer.totalBookings}
          </p>
          <p>
            <b>Total Spent:</b> ₹{customer.totalSpent.toFixed(2)}
          </p>
          <p>
            <b>Member Since:</b>{" "}
            {customer.createdAt?.replace("T", " ").slice(0, 16)}
          </p>
        </div>
      </div>

      {/* BOOKING HISTORY */}
      <h3 className="text-lg font-semibold mb-3">Booking History</h3>

      {customer.bookings.length === 0 ? (
        <div className="text-center py-10 text-gray-500">
          No bookings found
        </div>
      ) : (
        <div className="space-y-4">
          {customer.bookings.map((b) => (
            <div
              key={b.id}
              className="bg-white p-4 rounded-xl shadow border flex flex-col gap-1"
            >
              <p className="text-sm">
                <b>Booking:</b> #{b.id.slice(0, 8)}
              </p>

              <p className="text-sm">
                <b>Service ID:</b> {b.serviceId}
              </p>

              <p className="text-sm">
                <b>Scheduled At:</b>{" "}
                {b.scheduledAt?.replace("T", " ").slice(0, 16)}
              </p>

              <p className="text-sm">
                <b>Price Paid:</b> ₹{b.pricePaid}
              </p>

              <p className="text-sm">
                <b>Status:</b>{" "}
                <span
                  className={`px-2 py-1 rounded text-white ${
                    b.status === "COMPLETED"
                      ? "bg-green-600"
                      : b.status === "CONFIRMED"
                      ? "bg-blue-600"
                      : b.status === "CANCELLED"
                      ? "bg-red-600"
                      : "bg-gray-500"
                  }`}
                >
                  {b.status}
                </span>
              </p>

              {b.note && (
                <p className="text-sm">
                  <b>Note:</b> {b.note}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </AdminLayout>
  );
}
