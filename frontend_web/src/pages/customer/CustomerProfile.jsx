import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import UserNavbar from "../../components/user/UserNavbar";
import { getMyProfile, updateMyProfile } from "../../api/customer";
import ChangePasswordModal from "../../components/user/ChangePasswordModal";

export default function CustomerProfile() {
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [edit, setEdit] = useState(false);
  const [openPwd, setOpenPwd] = useState(false);

  const [form, setForm] = useState({
    name: "",
    dob: "",
    gender: "",
    phone: "",
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const res = await getMyProfile();
      setProfile(res.data);
      setForm({
        name: res.data.name || "",
        dob: res.data.dob || "",
        gender: res.data.gender || "",
        phone: res.data.phone || "",
      });
    } catch {
      alert("Failed to load profile");
    }
  };

  const handleSave = async () => {
    try {
      await updateMyProfile(form);
      alert("Profile updated");
      setEdit(false);
      loadProfile();
    } catch {
      alert("Update failed");
    }
  };

  if (!profile) return <div className="p-6">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <UserNavbar />

      <main className="max-w-3xl mx-auto p-6 space-y-6">
        {/* Back */}
        <button
          onClick={() => navigate(-1)}
          className="text-sm text-gray-600 hover:text-black"
        >
          ← Back
        </button>

        <div className="bg-white rounded-xl shadow p-6 space-y-6">
          <h1 className="text-xl font-semibold">My Profile</h1>

          {/* Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            {/* Name */}
            <div>
              <label className="text-gray-500">Name</label>
              {edit ? (
                <input
                  value={form.name}
                  onChange={(e) =>
                    setForm({ ...form, name: e.target.value })
                  }
                  className="input"
                />
              ) : (
                <div className="font-medium">{profile.name}</div>
              )}
            </div>

            {/* dob */}
            <div>
              <label className="text-gray-500">DOB</label>
              {edit ? (
                <input
                  type="date"
                  value={form.dob}
                  onChange={(e) =>
                    setForm({ ...form, dob: e.target.value })
                  }
                  className="input"
                />
              ) : (
                <div className="font-medium">{profile.dob}</div>
              )}
            </div>

            {/* Gender */}
            <div>
              <label className="text-gray-500">Gender</label>
              {edit ? (
                <select
                  value={form.gender}
                  onChange={(e) =>
                    setForm({ ...form, gender: e.target.value })
                  }
                  className="input"
                >
                  <option value="">Select</option>
                  <option>MALE</option>
                  <option>FEMALE</option>
                  <option>UNISEX</option>
                </select>
              ) : (
                <div className="font-medium">{profile.gender}</div>
              )}
            </div>

            {/* phone */}
            <div>
              <label className="text-gray-500">phone</label>
              {edit ? (
                <input
                  value={form.phone}
                  onChange={(e) =>
                    setForm({ ...form, phone: e.target.value })
                  }
                  className="input"
                />
              ) : (
                <div className="font-medium">{profile.phone}</div>
              )}
            </div>

            {/* Email (readonly) */}
            <div className="sm:col-span-2">
              <label className="text-gray-500">Email</label>
              <div className="font-medium">{profile.email}</div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-between items-center pt-4 border-t">
            <button
              onClick={() => setOpenPwd(true)}
              className="text-sm text-indigo-600 hover:underline"
            >
              Change Password
            </button>

            <div className="flex gap-2">
              {edit ? (
                <>
                  <button
                    onClick={() => setEdit(false)}
                    className="px-4 py-2 border rounded-md"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                  >
                    Save Changes
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setEdit(true)}
                  className="px-4 py-2 bg-gray-900 text-white rounded-md hover:bg-black"
                >
                  Edit Profile
                </button>
              )}
            </div>
          </div>
        </div>
      </main>

      <ChangePasswordModal
        open={openPwd}
        onClose={() => setOpenPwd(false)}
      />
    </div>
  );
}
