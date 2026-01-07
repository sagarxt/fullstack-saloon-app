import { useEffect, useState } from "react";
import {
  getAdminServices,
  createAdminService,
  updateAdminService,
  deleteAdminService,
  getAdminCategories,
} from "../../api/admin";
import ServiceFormModal from "../../components/admin/ServiceFormModal";
import ServiceCard from "../../components/admin/ServiceCard";
import { Plus } from "lucide-react";

export default function ServicesAdmin() {
  const [services, setServices] = useState([]);
  const [categories, setCategories] = useState([]);

  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [srvRes, catRes] = await Promise.all([
        getAdminServices(),
        getAdminCategories(),
      ]);

      setServices(srvRes.data?.content ?? []);
      setCategories(catRes.data?.content ?? []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSave = async (payload) => {
    const formData = new FormData();
    Object.entries(payload).forEach(([k, v]) => {
      if (v !== null && v !== undefined) formData.append(k, v);
    });

    if (editing) {
      await updateAdminService(editing.id, formData);
    } else {
      await createAdminService(formData);
    }

    setModalOpen(false);
    setEditing(null);
    loadData();
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this service?")) return;
    await deleteAdminService(id);
    loadData();
  };

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Services</h1>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-md"
        >
          <Plus size={16} /> Add Service
        </button>
      </div>

      {/* Grid */}
      {loading ? (
        <p className="text-sm text-gray-500">Loading services...</p>
      ) : services.length === 0 ? (
        <p className="text-sm text-gray-500">No services found</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {services.map((srv) => (
            <ServiceCard
              key={srv.id}
              item={srv}
              onEdit={() => {
                setEditing(srv);
                setModalOpen(true);
              }}
              onDelete={() => handleDelete(srv.id)}
            />
          ))}
        </div>
      )}

      {/* Modal */}
      <ServiceFormModal
        open={modalOpen}
        initial={editing}
        categories={categories}
        onClose={() => {
          setModalOpen(false);
          setEditing(null);
        }}
        onSave={handleSave}
      />
    </div>
  );
}
