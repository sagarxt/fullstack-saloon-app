export default function CategorySection({ categories, selected, onSelect }) {
  return (
    <section>
      <h2 className="text-lg font-semibold mb-3">
        Categories
      </h2>

      <div className="flex gap-3 overflow-x-auto pb-2">
        <button
          onClick={() => onSelect(null)}
          className={`px-4 py-2 rounded-full text-sm border ${
            selected === null
              ? "bg-indigo-600 text-white border-indigo-600"
              : "bg-white hover:bg-gray-100"
          }`}
        >
          All
        </button>

        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => onSelect(cat.id)}
            className={`px-4 py-2 rounded-full text-sm border whitespace-nowrap ${
              selected === cat.id
                ? "bg-indigo-600 text-white border-indigo-600"
                : "bg-white hover:bg-gray-100"
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>
    </section>
  );
}
