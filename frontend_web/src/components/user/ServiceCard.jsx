import { useNavigate } from "react-router-dom";

export default function ServiceCard({ service }) {
  const navigate = useNavigate();

  const genderColor = {
    MALE: "bg-blue-600",
    FEMALE: "bg-pink-600",
    UNISEX: "bg-purple-600"
  }[service.gender];

  return (
    <div className="bg-white border rounded-xl shadow-sm hover:shadow-md transition overflow-hidden">

      {/* IMAGE + GENDER BADGE */}
      <div className="relative">
        <img
          src={
            service.image ||
            "https://res.cloudinary.com/dfdnljcyt/image/upload/v1767424595/salon_app/qjd0qo8qshkncwie1e9u.png"
          }
          alt={service.name}
          className="h-40 w-full object-cover"
          loading="lazy"
        />

        {service.mrp && (
          <span className="absolute top-2 right-2 text-xs text-green-600 ml-2">
            {Math.round(((service.mrp - service.price) / service.mrp) * 100)}% OFF
          </span>
        )}

        {/* Gender Badge */}
        {service.gender && (
          <span className={`absolute bottom-2 left-2 ${genderColor} text-white text-xs px-3 py-1 rounded-full`}>
            {service.gender}
          </span>
        )}
      </div>

      {/* CONTENT */}
      <div className="p-4 space-y-2">
        <h3 className="font-semibold text-gray-900">
          {service.name}
        </h3>

        <p className="text-sm text-gray-600 line-clamp-2">
          {service.description}
        </p>

        {/* PRICE + META */}
        <div className="flex justify-between items-center pt-2">

          {/* Price */}
          <div>
            <span className="text-sm font-semibold text-gray-900">
              ₹{service.price}
            </span>

            {service.mrp && (
              <span className="ml-2 text-xs text-gray-400 line-through">
                ₹{service.mrp}
              </span>
            )}
          </div>

          {/* Duration + Rewards */}
          <div className="flex items-center gap-3 text-xs text-gray-600">
            {service.durationMinutes && (
              <span className="flex items-center gap-1">
                ⏱ {service.durationMinutes}m
              </span>
            )}
            {service.rewards && (
              <span className="flex items-center gap-1">
                ⭐ {service.rewards} pts
              </span>
            )}
          </div>
        </div>

        {/* CTA */}
        <button
          onClick={() => navigate(`/customer/book/${service.id}`)}
          className="mt-3 w-full bg-indigo-600 text-white py-2 rounded-md text-sm hover:bg-indigo-700 transition"
        >
          Book Now
        </button>
      </div>
    </div>
  );
}
