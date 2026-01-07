import { useState } from "react";
import { changePassword } from "../../api/customer";

export default function ChangePasswordModal({ open, onClose }) {
  const [form, setForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  if (!open) return null;

  const handleSubmit = async () => {
    if (form.newPassword !== form.confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    try {
      await changePassword(form);
      alert("Password changed successfully");
      onClose();
    } catch {
      alert("Failed to change password");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl w-full max-w-md p-6 space-y-4">
        <h2 className="text-lg font-semibold">Change Password</h2>

        <input
          type="password"
          placeholder="Current Password"
          className="input"
          value={form.currentPassword}
          onChange={(e) =>
            setForm({ ...form, currentPassword: e.target.value })
          }
        />

        <input
          type="password"
          placeholder="New Password"
          className="input"
          value={form.newPassword}
          onChange={(e) =>
            setForm({ ...form, newPassword: e.target.value })
          }
        />

        <input
          type="password"
          placeholder="Confirm New Password"
          className="input"
          value={form.confirmPassword}
          onChange={(e) =>
            setForm({ ...form, confirmPassword: e.target.value })
          }
        />

        <div className="flex justify-end gap-2 pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 border rounded-md"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            Update Password
          </button>
        </div>
      </div>
    </div>
  );
}
