// src/pages/customer/ServicesList.jsx
import { useEffect, useState } from "react";
import { getServices } from "../../api/customer";
import { useNavigate } from "react-router-dom";
import { useToast } from "../../components/Toast";

export default function ServicesList() {
  const [services, setServices] = useState([]);
  const { showToast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      const res = await getServices();
      setServices(res.data);
    } catch (err) {
      showToast("Failed to load services", "error");
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold mb-4">Services</h2>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {services.map(s => (
          <div key={s.id} className="bg-white p-4 rounded-xl shadow">
            <h4 className="text-lg font-bold">{s.name}</h4>
            <p className="text-sm text-gray-500 mt-1 line-clamp-2">{s.description}</p>
            <div className="mt-3">
              <p>MRP: ₹{s.mrp ?? "-"}</p>
              <p className="text-green-600 font-semibold">Price: ₹{s.price}</p>
              <p>Duration: {s.durationMinutes} min</p>
            </div>
            <div className="flex justify-end mt-4">
              <button onClick={() => navigate(`/customer/service/${s.id}`)} className="bg-indigo-600 text-white px-3 py-1 rounded-lg">View</button>
              <button onClick={() => navigate(`/customer/book/${s.id}`)} className="ml-2 bg-green-600 text-white px-3 py-1 rounded-lg">Book</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
