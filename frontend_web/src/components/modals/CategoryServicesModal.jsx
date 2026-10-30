import { useEffect, useState } from "react";
import ModalWrapper from "./ModalWrapper";
import { getServicesByCategoryApi } from "../../api/service";
import { extractList } from "../../utils/dataHelper";

export default function CategoryServicesModal({
  open,
  onClose,
  category,
}) {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!category || !open) return;

    const loadServices = async () => {
      setLoading(true);
      try {
        const res = await getServicesByCategoryApi(category.id);
        setServices(extractList(res.data));
      } catch (err) {
        console.error(err);
        setServices([]);
      } finally {
        setLoading(false);
      }
    };

    loadServices();
  }, [category, open]);

  if (!category) return null;

  return (
    <ModalWrapper open={open} onClose={onClose}>
      <h2 className="text-xl font-serif text-luxe-gold mb-4">
        Services – {category.name}
      </h2>

      {loading && (
        <p className="text-sm text-luxe-gray-light">Loading...</p>
      )}

      {!loading && services.length === 0 && (
        <p className="text-sm text-luxe-gray-light">
          No services found for this category.
        </p>
      )}

      <div className="space-y-4 max-h-[60vh] overflow-y-auto">
        {services.map((srv) => (
          <div
            key={srv.id}
            className="border rounded-lg p-3 flex gap-4"
          >
            <img
              src={srv.image}
              alt={srv.name}
              className="w-20 aspect-[4/3] rounded object-cover shrink-0"
            />

            <div className="flex-1">
              <h3 className="font-semibold">{srv.name}</h3>
              <p className="text-sm text-gray-500 line-clamp-2">
                {srv.description}
              </p>

              <div className="text-xs mt-1 space-y-1">
                <p>Gender : {srv.gender}</p>
                <p>Duration : {srv.durationMinutes} mins</p>
                <p>
                  Price : ₹{srv.price}{" "}
                  <span className="line-through text-gray-400 ml-1">
                    ₹{srv.mrp}
                  </span>
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </ModalWrapper>
  );
}
