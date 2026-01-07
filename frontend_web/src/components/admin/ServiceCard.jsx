import { Edit2, Trash2 } from "lucide-react";

export default function ServiceCard({ item, onEdit, onDelete }) {
  return (
    <div className="bg-white border rounded-lg shadow-sm hover:shadow-md transition overflow-hidden">

      {/* {item.image && ( */}
        <img
          src={item.image || "https://res.cloudinary.com/dfdnljcyt/image/upload/v1767424595/salon_app/qjd0qo8qshkncwie1e9u.png"}
          alt={item.name}
          className="h-40 w-full object-cover"
        />
      {/* )} */}

      <div className="p-4 space-y-2">
        <h3 className="font-semibold text-gray-900">{item.name}</h3>

        <p className="text-xs text-gray-500">
          Category: {item.categoryName}
        </p>

        <p className="text-sm text-gray-600 line-clamp-2">
          {item.description}
        </p>

        <div className="flex justify-between items-center pt-2 text-sm">
          <span className="font-medium text-gray-900">
            ₹{item.price}{" "}
            <span className="line-through text-gray-400 ml-1">
              ₹{item.mrp}
            </span>
          </span>

          <span className="text-xs px-2 py-1 rounded-full bg-gray-100">
            {item.gender}
          </span>
        </div>

        <div className="flex justify-between items-center pt-3">
          <span className="text-xs text-gray-500">
            ⏱ {item.durationMinutes} min
          </span>

          <div className="flex gap-2">
            <button
              onClick={onEdit}
              className="p-2 rounded-md border hover:bg-gray-100"
            >
              <Edit2 size={16} />
            </button>
            <button
              onClick={onDelete}
              className="p-2 rounded-md border hover:bg-red-50 text-red-500"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
