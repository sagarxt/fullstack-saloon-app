import CategoryPage from "../../pages/admin/CategoryPage";

export default function CategoryCard({ item, onEdit, onDelete }) {
  return (
    <div className="border rounded-lg p-4 bg-white shadow hover:shadow-gold transition">
      <img
        src={item.image}
        className="h-32 w-full object-cover rounded-md mb-3"
      />
      <h3 className="font-semibold text-lg text-luxe-black">{item.name}</h3>

      <div className="flex justify-between mt-3">
        <button
          className="text-luxe-gold font-semibold"
          onClick={() => onEdit(item)}
        >
          Edit
        </button>

        <button
          className="text-red-500 font-semibold"
          onClick={() => onDelete(item.id)}
        >
          Delete
        </button>
      </div>
    </div>
  );
}
