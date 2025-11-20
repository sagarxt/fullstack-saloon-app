// src/pages/admin/CustomersAdmin.jsx
import { useEffect, useState } from "react";
import AdminLayout from "./AdminLayout";
import { adminGetCustomers } from "../../api/admin";
import axiosClient from "../../api/axiosClient";
import { useToast } from "../../components/Toast";
import { useNavigate } from "react-router-dom";

export default function CustomersAdmin() {
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [customers, setCustomers] = useState([]);
  const [keyword, setKeyword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async (kw = "") => {
    setLoading(true);
    try {
      const url = kw ? `/admin/customers/search?keyword=${kw}` : `/admin/customers`;
      const res = await axiosClient.get(url);

      setCustomers(res.data);
    } catch (err) {
      showToast("Failed to load customers", "error");
    }
    setLoading(false);
  };

  const handleSearch = (value) => {
    setKeyword(value);
  };

  const applySearch = () => loadCustomers(keyword);

  const resetSearch = () => {
    setKeyword("");
    loadCustomers();
  };

  return (
    <AdminLayout>
      <h2 className="text-2xl font-semibold mb-4">Manage Customers</h2>

      {/* SEARCH BAR */}
      <div className="bg-white shadow p-4 rounded-xl mb-6 flex flex-wrap gap-3 items-center">
        <input
          type="text"
          placeholder="Search by name, email, phone"
          value={keyword}
          onChange={(e) => handleSearch(e.target.value)}
          className="border p-2 rounded-xl w-72"
        />

        <button
          onClick={applySearch}
          className="bg-indigo-600 text-white px-4 py-2 rounded-xl"
        >
          Search
        </button>

        <button
          onClick={resetSearch}
          className="bg-gray-200 px-4 py-2 rounded-xl"
        >
          Reset
        </button>
      </div>

      {/* LOADING */}
      {loading && (
        <div className="text-center py-10 text-gray-600">Loading customers...</div>
      )}

      {/* NO CUSTOMERS */}
      {!loading && customers.length === 0 && (
        <div className="text-center py-20 text-gray-500 text-lg">
          No customers found
        </div>
      )}

      {/* CUSTOMER LIST */}
      {!loading && customers.length > 0 && (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {customers.map((c) => (
            <div key={c.id} className="bg-white shadow p-4 rounded-xl border">
              <h3 className="text-lg font-semibold">{c.name}</h3>
              <p className="text-gray-600 text-sm">{c.email}</p>
              <p className="text-gray-600 text-sm">{c.phone}</p>

              <div className="mt-3 text-sm">
                <p>Total Bookings: <b>{c.totalBookings}</b></p>
                <p>Total Spent: <b>₹{c.totalSpent.toFixed(2)}</b></p>
              </div>

              <div className="flex justify-end mt-4">
                <button
                  onClick={() => navigate(`/admin/customers/${c.id}`)}
                  className="px-3 py-1 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  View
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminLayout>
  );
}
