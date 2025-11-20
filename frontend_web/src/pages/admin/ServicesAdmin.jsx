import { useEffect, useState } from "react";
import AdminLayout from "./AdminLayout";
import {
  adminGetServices,
  adminCreateService,
  adminUpdateService,
  adminDeleteService,
} from "../../api/admin";
import { useToast } from "../../components/Toast";
import ConfirmDialog from "../../components/ConfirmDialog";

export default function ServicesAdmin() {
  const { showToast } = useToast();

  const [services, setServices] = useState([]);
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [showDeletePopup, setShowDeletePopup] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  const [form, setForm] = useState({
    name: "",
    description: "",
    mrp: "",
    price: "",
    durationMinutes: "",
  });

  useEffect(() => {
    loadServices();
  }, []);

  const loadServices = async () => {
    try {
      const res = await adminGetServices();
      setServices(res.data);
    } catch (err) {
      console.error(err);
      showToast("Failed to load services", "error");
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();

    const payload = {
      ...form,
      mrp: parseFloat(form.mrp),
      price: parseFloat(form.price),
      durationMinutes: parseInt(form.durationMinutes),
    };

    try {
      if (editing) {
        await adminUpdateService(editing.id, payload);
        showToast("Service updated", "success");
      } else {
        await adminCreateService(payload);
        showToast("Service created", "success");
      }

      setShowForm(false);
      setEditing(null);
      resetForm();
      loadServices();
    } catch (err) {
      console.error(err);
      showToast("Error saving service", "error");
    }
  };

  const resetForm = () => {
    setForm({
      name: "",
      description: "",
      mrp: "",
      price: "",
      durationMinutes: "",
    });
  };

  const startEdit = (service) => {
    setEditing(service);
    setForm({
      name: service.name,
      description: service.description,
      mrp: service.mrp,
      price: service.price,
      durationMinutes: service.durationMinutes,
    });
    setShowForm(true);
  };

  const handleDeleteClick = (id) => {
    setDeleteId(id);
    setShowDeletePopup(true);
  };

  const confirmDelete = async () => {
    try {
      await adminDeleteService(deleteId);
      showToast("Service deleted", "success");
      setShowDeletePopup(false);
      loadServices();
    } catch (err) {
      showToast("Error deleting service", "error");
    }
  };

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold">Manage Services</h2>
        <button
          onClick={() => {
            resetForm();
            setEditing(null);
            setShowForm(true);
          }}
          className="bg-indigo-600 text-white px-4 py-2 rounded-xl hover:bg-indigo-700"
        >
          + Add Service
        </button>
      </div>

      {/* FORM POPUP */}
      {showForm && (
        <div className="bg-white rounded-xl p-6 shadow mb-8">
          <h3 className="text-lg font-semibold mb-4">
            {editing ? "Edit Service" : "Add New Service"}
          </h3>

          <form
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
            onSubmit={handleSave}
          >
            <input
              type="text"
              placeholder="Service Name"
              className="p-3 border rounded-xl"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />

            <input
              type="number"
              placeholder="MRP"
              className="p-3 border rounded-xl"
              value={form.mrp}
              onChange={(e) => setForm({ ...form, mrp: e.target.value })}
              required
            />

            <input
              type="number"
              placeholder="Offer Price"
              className="p-3 border rounded-xl"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              required
            />

            <input
              type="number"
              placeholder="Duration (minutes)"
              className="p-3 border rounded-xl"
              value={form.durationMinutes}
              onChange={(e) =>
                setForm({ ...form, durationMinutes: e.target.value })
              }
              required
            />

            <textarea
              placeholder="Description"
              className="p-3 border rounded-xl col-span-1 md:col-span-2"
              rows={3}
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              required
            />

            <div className="flex gap-3 mt-3">
              <button className="bg-indigo-600 text-white px-4 py-2 rounded-xl">
                {editing ? "Update" : "Save"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditing(null);
                }}
                className="px-4 py-2 border rounded-xl"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* SERVICES LIST */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {services.map((s) => (
          <div key={s.id} className="bg-white p-4 rounded-xl shadow border">
            <h4 className="text-lg font-bold">{s.name}</h4>
            <p className="text-sm text-gray-500 mt-1 line-clamp-2">
              {s.description}
            </p>

            <div className="mt-3">
              <p>
                MRP: <span className="font-semibold">₹{s.mrp}</span>
              </p>
              <p>
                Price:{" "}
                <span className="font-semibold text-green-600">
                  ₹{s.price}
                </span>
              </p>
              <p>Duration: {s.durationMinutes} min</p>
            </div>

            <div className="flex gap-3 mt-4">
              <button
                onClick={() => startEdit(s)}
                className="px-3 py-1 bg-yellow-500 text-white rounded-lg"
              >
                Edit
              </button>

              <button
                onClick={() => handleDeleteClick(s.id)}
                className="px-3 py-1 bg-red-500 text-white rounded-lg"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* DELETE POPUP */}
      {showDeletePopup && (
        <ConfirmDialog
          title="Delete Service?"
          message="This action cannot be undone."
          confirmText="Delete"
          cancelText="Cancel"
          onConfirm={confirmDelete}
          onCancel={() => setShowDeletePopup(false)}
        />
      )}
    </AdminLayout>
  );
}
