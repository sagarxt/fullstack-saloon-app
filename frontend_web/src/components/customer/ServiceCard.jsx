// src/components/customer/ServiceCard.jsx
import { Link } from "react-router-dom";

export default function ServiceCard({ service }){
  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border">
      <h4 className="font-semibold">{service.name}</h4>
      <p className="text-sm text-muted my-2 truncate">{service.description}</p>
      <div className="flex items-center justify-between mt-3">
        <div className="text-lg font-bold">₹ {service.price}</div>
        <Link to={`/customer/book/${service.id}`} className="bg-indigo-600 text-white px-3 py-1 rounded-md">Book</Link>
      </div>
    </div>
  );
}
