import { useEffect, useState } from "react";
import AdminLayout from "./AdminLayout";
import {
  adminGetRewards,
  adminCreateReward,
  adminUpdateReward,
  adminDeleteReward,
} from "../../api/admin";
import { useToast } from "../../components/Toast";
import ConfirmDialog from "../../components/ConfirmDialog";

export default function RewardsAdmin() {
  const { showToast } = useToast();

  const [rewards, setRewards] = useState([]);
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const [showDeletePopup, setShowDeletePopup] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  const [form, setForm] = useState({
    title: "",
    description: "",
    pointsRequired: "",
    active: true,
  });

  // Load rewards
  useEffect(() => {
    loadRewards();
  }, []);

  const loadRewards = async () => {
    try {
      const res = await adminGetRewards();
      setRewards(res.data);
    } catch (err) {
      showToast("Failed to load rewards", "error");
    }
  };

  // Save handler
  const handleSave = async (e) => {
    e.preventDefault();

    const payload = {
      ...form,
      pointsRequired: parseInt(form.pointsRequired),
    };

    try {
      if (editing) {
        await adminUpdateReward(editing.id, payload);
        showToast("Reward updated", "success");
      } else {
        await adminCreateReward(payload);
        showToast("Reward created", "success");
      }

      setShowForm(false);
      setEditing(null);
      resetForm();
      loadRewards();
    } catch (err) {
      showToast("Error saving reward", "error");
    }
  };

  const resetForm = () => {
    setForm({
      title: "",
      description: "",
      pointsRequired: "",
      active: true,
    });
  };

  const startEdit = (reward) => {
    setEditing(reward);
    setForm({
      title: reward.title,
      description: reward.description,
      pointsRequired: reward.pointsRequired,
      active: reward.active,
    });
    setShowForm(true);
  };

  // Delete popup trigger
  const handleDeleteClick = (id) => {
    setDeleteId(id);
    setShowDeletePopup(true);
  };

  // Confirm delete
  const confirmDelete = async () => {
    try {
      await adminDeleteReward(deleteId);
      showToast("Reward deleted", "success");
      setShowDeletePopup(false);
      loadRewards();
    } catch (err) {
      showToast("Error deleting reward", "error");
    }
  };

  return (
    <AdminLayout>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold">Manage Rewards</h2>

        <button
          onClick={() => {
            resetForm();
            setEditing(null);
            setShowForm(true);
          }}
          className="bg-indigo-600 text-white px-4 py-2 rounded-xl hover:bg-indigo-700"
        >
          + Add Reward
        </button>
      </div>

      {/* FORM Popup */}
      {showForm && (
        <div className="bg-white rounded-xl p-6 shadow mb-8">
          <h3 className="text-lg font-semibold mb-4">
            {editing ? "Edit Reward" : "Add New Reward"}
          </h3>

          <form className="grid grid-cols-1 md:grid-cols-2 gap-4" onSubmit={handleSave}>
            <input
              type="text"
              placeholder="Reward Title"
              className="p-3 border rounded-xl"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
            />

            <input
              type="number"
              placeholder="Points Required"
              className="p-3 border rounded-xl"
              value={form.pointsRequired}
              onChange={(e) => setForm({ ...form, pointsRequired: e.target.value })}
              required
            />

            <textarea
              placeholder="Description"
              className="p-3 border rounded-xl col-span-1 md:col-span-2"
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              required
            />

            <div className="col-span-1 md:col-span-2 flex items-center gap-2 mt-2">
              <input
                type="checkbox"
                checked={form.active}
                onChange={(e) => setForm({ ...form, active: e.target.checked })}
              />
              <label className="text-gray-600">Active</label>
            </div>

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

      {/* REWARDS LIST */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {rewards.map((r) => (
          <div key={r.id} className="bg-white p-4 rounded-xl shadow border">
            <h4 className="text-lg font-bold">{r.title}</h4>

            <p className="text-sm text-gray-500 mt-1 line-clamp-2">
              {r.description}
            </p>

            <div className="mt-3">
              <p>
                Points:{" "}
                <span className="font-semibold text-indigo-600">
                  {r.pointsRequired}
                </span>
              </p>
              <p>
                Status:{" "}
                <span
                  className={`font-semibold ${
                    r.active ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {r.active ? "Active" : "Inactive"}
                </span>
              </p>
            </div>

            <div className="flex gap-3 mt-4">
              <button
                onClick={() => startEdit(r)}
                className="px-3 py-1 bg-yellow-500 text-white rounded-lg"
              >
                Edit
              </button>

              <button
                onClick={() => handleDeleteClick(r.id)}
                className="px-3 py-1 bg-red-500 text-white rounded-lg"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* DELETE CONFIRM POPUP */}
      {showDeletePopup && (
        <ConfirmDialog
          title="Delete Reward?"
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
