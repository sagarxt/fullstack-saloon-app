// src/pages/customer/ServiceDetail.jsx
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getService } from "../../api/customer";
import { useToast } from "../../components/Toast";

export default function ServiceDetail() {
  const { id } = useParams();
  const [service, setService] = useState(null);
  const { showToast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    load();
  }, [id]);

  const load = async () => {
    try {
      const res = await getService(id);
      setService(res.data);
    } catch {
      showToast("Failed to load", "error");
    }
  };

  if (!service) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6">
      <button onClick={() => navigate(-1)} className="mb-4 text-sm">← Back</button>
      <div className="bg-white p-6 rounded-xl shadow">
        <h2 className="text-2xl font-semibold">{service.name}</h2>
        <p className="text-gray-600 mt-2">{service.description}</p>
        <div className="mt-4">
          <p>MRP: ₹{service.mrp ?? "-"}</p>
          <p className="text-green-600 font-semibold">Price: ₹{service.price}</p>
          <p>Duration: {service.durationMinutes} min</p>
        </div>
        <div className="mt-6">
          <button onClick={() => navigate(`/customer/book/${service.id}`)} className="bg-green-600 text-white px-4 py-2 rounded-xl">Book Now</button>
        </div>
      </div>
    </div>
  );
}
