import { useState, useEffect } from "react";
import { getStaffProfile, updateStaffProfile, changeStaffPassword } from "../../api/staff";
import { useAuth } from "../../context/useAuth";
import {
  User,
  Lock,
  Building2,
  MapPin,
  Phone,
  Mail,
  Clock,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Save,
  KeyRound,
  ExternalLink,
  Sparkles,
  Scissors,
  Package,
  Calendar,
} from "lucide-react";

export default function StaffProfileTab({ onNavigateTab }) {
  const { user, login } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Edit Profile Form State
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState("");
  const [profileError, setProfileError] = useState("");

  // Change Password Form State
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [passSaving, setPassSaving] = useState(false);
  const [passSuccess, setPassSuccess] = useState("");
  const [passError, setPassError] = useState("");

  const loadProfile = async () => {
    setLoading(true);
    try {
      const res = await getStaffProfile();
      setProfile(res.data);
      setName(res.data.name || "");
      setPhone(res.data.phone || "");
    } catch (err) {
      console.error("Failed to load staff profile:", err);
      // Fallback from auth user
      if (user) {
        setName(user.name || "");
        setPhone(user.phone || "");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setProfileError("");
    setProfileSuccess("");

    if (!name.trim()) {
      setProfileError("Full Name is required.");
      return;
    }

    setProfileSaving(true);
    try {
      const res = await updateStaffProfile({ name: name.trim(), phone: phone.trim() });
      setProfile(res.data);
      setProfileSuccess("Profile information updated successfully!");
      // Update local storage user if name changed
      if (user) {
        const updatedUser = { ...user, name: res.data.name, phone: res.data.phone };
        localStorage.setItem("user", JSON.stringify(updatedUser));
      }
      setTimeout(() => setProfileSuccess(""), 4000);
    } catch (err) {
      setProfileError(err.response?.data?.message || "Failed to update profile.");
    } finally {
      setProfileSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPassError("");
    setPassSuccess("");

    if (!currentPassword) {
      setPassError("Please enter your current password.");
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      setPassError("New password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPassError("New password and confirmation do not match.");
      return;
    }

    setPassSaving(true);
    try {
      await changeStaffPassword({ currentPassword, newPassword });
      setPassSuccess("Password changed successfully! Keep it confidential.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => setPassSuccess(""), 4000);
    } catch (err) {
      setPassError(err.response?.data?.message || "Failed to change password.");
    } finally {
      setPassSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-3xl p-12 text-center text-groomish-slate/50 border border-groomish-slate/10 shadow-soft">
        <div className="w-8 h-8 border-3 border-groomish-orange border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs font-semibold">Loading Stylist Profile & Branch Details...</p>
      </div>
    );
  }

  const store = profile?.storeId ? profile : null;

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Top Profile Header Banner */}
      <div className="bg-gradient-to-r from-groomish-slate via-groomish-slate to-[#2A3447] text-white rounded-3xl p-6 sm:p-8 shadow-soft relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-groomish-orange/15 to-transparent rounded-bl-full pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4 sm:gap-5">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-groomish-orange to-groomish-coral text-white font-heading font-extrabold text-2xl sm:text-3xl flex items-center justify-center shrink-0 shadow-glowOrange border-2 border-white/20">
              {profile?.name?.charAt(0) || user?.name?.charAt(0) || "S"}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-groomish-orange bg-groomish-orange/20 px-2.5 py-0.5 rounded-full">
                  Salon Stylist Specialist
                </span>
                {profile?.storeName && (
                  <span className="text-[10px] font-bold text-white/80 bg-white/10 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    <Building2 className="w-3 h-3 text-groomish-orange" />
                    {profile.storeName}
                  </span>
                )}
              </div>
              <h1 className="text-xl sm:text-2xl font-heading font-extrabold text-white">
                {profile?.name || user?.name || "Stylist Specialist"}
              </h1>
              <p className="text-xs text-white/60 font-mono mt-0.5">
                {profile?.email || user?.email}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-start md:self-center">
            {profile?.createdAt && (
              <div className="text-right text-[11px] text-white/60 font-mono hidden sm:block">
                <span>Joined: </span>
                <span className="text-white font-semibold">
                  {new Date(profile.createdAt).toLocaleDateString("en-IN", {
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Grid: Left Column (Profile & Password) / Right Column (Branch Details) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (7 cols): Profile Info & Password Security */}
        <div className="lg:col-span-7 space-y-6">
          {/* Edit Profile Form */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-groomish-slate/10 shadow-soft">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-base font-heading font-extrabold text-groomish-slate flex items-center gap-2">
                  <User className="w-4 h-4 text-groomish-orange" />
                  <span>Personal Stylist Information</span>
                </h2>
                <p className="text-xs text-groomish-slate/50 mt-0.5">
                  Update your displayed stylist name and direct salon contact number.
                </p>
              </div>
            </div>

            {profileSuccess && (
              <div className="mb-4 p-3 rounded-2xl bg-groomish-greenLight border border-groomish-green/20 text-groomish-green text-xs font-semibold flex items-center gap-2 animate-fade-in">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{profileSuccess}</span>
              </div>
            )}

            {profileError && (
              <div className="mb-4 p-3 rounded-2xl bg-red-50 border border-red-200 text-red-600 text-xs font-semibold flex items-center gap-2 animate-fade-in">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{profileError}</span>
              </div>
            )}

            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-groomish-slate/70 uppercase tracking-wider mb-1.5">
                  Full Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-groomish-slate/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    placeholder="Enter your full name"
                    className="w-full pl-10 pr-4 py-2.5 bg-groomish-cream/40 border border-groomish-slate/15 rounded-xl text-xs font-semibold text-groomish-slate focus:outline-none focus:border-groomish-orange focus:bg-white transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-groomish-slate/70 uppercase tracking-wider mb-1.5">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-groomish-slate/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Enter 10-digit mobile number"
                    className="w-full pl-10 pr-4 py-2.5 bg-groomish-cream/40 border border-groomish-slate/15 rounded-xl text-xs font-semibold text-groomish-slate focus:outline-none focus:border-groomish-orange focus:bg-white transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-groomish-slate/70 uppercase tracking-wider mb-1.5">
                  Login Email Address (Read-only)
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-groomish-slate/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={profile?.email || user?.email || ""}
                    disabled
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-100 border border-gray-200 rounded-xl text-xs font-semibold text-gray-500 cursor-not-allowed select-none"
                  />
                </div>
                <p className="text-[10px] text-groomish-slate/40 mt-1">
                  Official login email can only be changed by Salon Administrator.
                </p>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={profileSaving}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-groomish-orange to-groomish-coral text-white hover:opacity-95 transition shadow-glowOrange flex items-center gap-2 disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{profileSaving ? "Saving..." : "Save Profile Changes"}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Change Password Form */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-groomish-slate/10 shadow-soft">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-base font-heading font-extrabold text-groomish-slate flex items-center gap-2">
                  <Lock className="w-4 h-4 text-groomish-orange" />
                  <span>Security & Password</span>
                </h2>
                <p className="text-xs text-groomish-slate/50 mt-0.5">
                  Update your password to keep your stylist terminal secure.
                </p>
              </div>
            </div>

            {passSuccess && (
              <div className="mb-4 p-3 rounded-2xl bg-groomish-greenLight border border-groomish-green/20 text-groomish-green text-xs font-semibold flex items-center gap-2 animate-fade-in">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{passSuccess}</span>
              </div>
            )}

            {passError && (
              <div className="mb-4 p-3 rounded-2xl bg-red-50 border border-red-200 text-red-600 text-xs font-semibold flex items-center gap-2 animate-fade-in">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{passError}</span>
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-groomish-slate/70 uppercase tracking-wider mb-1.5">
                  Current Password
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-groomish-slate/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showCurrentPass ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                    placeholder="Enter current password"
                    className="w-full pl-10 pr-10 py-2.5 bg-groomish-cream/40 border border-groomish-slate/15 rounded-xl text-xs font-semibold text-groomish-slate focus:outline-none focus:border-groomish-orange focus:bg-white transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPass(!showCurrentPass)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-groomish-slate/40 hover:text-groomish-slate"
                  >
                    {showCurrentPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-groomish-slate/70 uppercase tracking-wider mb-1.5">
                  New Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-groomish-slate/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showNewPass ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    placeholder="At least 6 characters"
                    className="w-full pl-10 pr-10 py-2.5 bg-groomish-cream/40 border border-groomish-slate/15 rounded-xl text-xs font-semibold text-groomish-slate focus:outline-none focus:border-groomish-orange focus:bg-white transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPass(!showNewPass)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-groomish-slate/40 hover:text-groomish-slate"
                  >
                    {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-groomish-slate/70 uppercase tracking-wider mb-1.5">
                  Confirm New Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-groomish-slate/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showConfirmPass ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    placeholder="Re-enter new password"
                    className="w-full pl-10 pr-10 py-2.5 bg-groomish-cream/40 border border-groomish-slate/15 rounded-xl text-xs font-semibold text-groomish-slate focus:outline-none focus:border-groomish-orange focus:bg-white transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPass(!showConfirmPass)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-groomish-slate/40 hover:text-groomish-slate"
                  >
                    {showConfirmPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={passSaving}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-groomish-slate text-white hover:bg-groomish-slate/90 transition shadow-sm flex items-center gap-2 disabled:opacity-50"
                >
                  <KeyRound className="w-4 h-4 text-groomish-orange" />
                  <span>{passSaving ? "Updating Password..." : "Update Password"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Column (5 cols): Assigned Branch Details */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-groomish-slate/10 shadow-soft">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-base font-heading font-extrabold text-groomish-slate flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-groomish-orange" />
                  <span>Assigned Salon Branch</span>
                </h2>
                <p className="text-xs text-groomish-slate/50 mt-0.5">
                  Branch station where your appointments and services are hosted.
                </p>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-groomish-green bg-groomish-greenLight px-2.5 py-0.5 rounded-full">
                Active Branch
              </span>
            </div>

            {store ? (
              <div className="space-y-4">
                {/* Branch Hero Card */}
                <div className="p-4 rounded-2xl bg-gradient-to-br from-groomish-orange/10 via-white to-groomish-cream/80 border border-groomish-orange/20">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-heading font-extrabold text-base text-groomish-slate">
                      {store.storeName}
                    </h3>
                    {store.storeCode && (
                      <span className="text-[10px] font-mono font-bold bg-groomish-slate text-white px-2 py-0.5 rounded-md">
                        {store.storeCode}
                      </span>
                    )}
                  </div>
                  {store.storeAddress && (
                    <div className="flex items-start gap-2 text-xs text-groomish-slate/70 mt-1">
                      <MapPin className="w-3.5 h-3.5 text-groomish-orange shrink-0 mt-0.5" />
                      <span>
                        {store.storeAddress}
                        {store.storeCity ? `, ${store.storeCity}` : ""}
                        {store.storeState ? `, ${store.storeState}` : ""}
                        {store.storePincode ? ` - ${store.storePincode}` : ""}
                      </span>
                    </div>
                  )}
                </div>

                {/* Operating Details */}
                <div className="divide-y divide-groomish-slate/5 bg-groomish-cream/30 rounded-2xl p-4 border border-groomish-slate/10 space-y-3">
                  <div className="flex items-center justify-between pt-1 text-xs">
                    <span className="text-groomish-slate/50 flex items-center gap-1.5 font-semibold">
                      <Clock className="w-3.5 h-3.5 text-groomish-orange" />
                      Operating Hours:
                    </span>
                    <span className="font-bold text-groomish-slate font-mono">
                      {store.openingTime || "09:00 AM"} – {store.closingTime || "09:00 PM"}
                    </span>
                  </div>

                  {store.storePhone && (
                    <div className="flex items-center justify-between pt-3 text-xs">
                      <span className="text-groomish-slate/50 flex items-center gap-1.5 font-semibold">
                        <Phone className="w-3.5 h-3.5 text-groomish-orange" />
                        Branch Contact:
                      </span>
                      <span className="font-bold text-groomish-slate font-mono">
                        {store.storePhone}
                      </span>
                    </div>
                  )}

                  {store.storeEmail && (
                    <div className="flex items-center justify-between pt-3 text-xs">
                      <span className="text-groomish-slate/50 flex items-center gap-1.5 font-semibold">
                        <Mail className="w-3.5 h-3.5 text-groomish-orange" />
                        Branch Email:
                      </span>
                      <span className="font-bold text-groomish-slate font-mono truncate max-w-[200px]">
                        {store.storeEmail}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-3 text-xs">
                    <span className="text-groomish-slate/50 flex items-center gap-1.5 font-semibold">
                      <ShieldCheck className="w-3.5 h-3.5 text-groomish-orange" />
                      Branch Status:
                    </span>
                    <span className="font-bold text-groomish-green">
                      Operational & Active
                    </span>
                  </div>
                </div>

                {/* Branch Photos Gallery if available */}
                {store.storeImages && store.storeImages.length > 0 && (
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-groomish-slate/50 block mb-2">
                      Branch Facility Photos
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      {store.storeImages.slice(0, 4).map((imgUrl, i) => (
                        <img
                          key={i}
                          src={imgUrl}
                          alt={`${store.storeName} photo ${i + 1}`}
                          className="w-full h-24 object-cover rounded-xl border border-groomish-slate/10 shadow-xs"
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Quick Navigation Links */}
                {onNavigateTab && (
                  <div className="pt-2 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onNavigateTab("services")}
                      className="flex-1 py-2 px-3 rounded-xl bg-groomish-cream hover:bg-groomish-cream/80 text-groomish-slate text-xs font-bold flex items-center justify-center gap-1.5 transition border border-groomish-slate/10"
                    >
                      <Scissors className="w-3.5 h-3.5 text-groomish-orange" />
                      <span>Branch Services</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onNavigateTab("inventory")}
                      className="flex-1 py-2 px-3 rounded-xl bg-groomish-cream hover:bg-groomish-cream/80 text-groomish-slate text-xs font-bold flex items-center justify-center gap-1.5 transition border border-groomish-slate/10"
                    >
                      <Package className="w-3.5 h-3.5 text-groomish-orange" />
                      <span>Branch Stock</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-8 text-center text-groomish-slate/50 text-xs">
                No salon branch currently assigned. Please contact the administrator.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
