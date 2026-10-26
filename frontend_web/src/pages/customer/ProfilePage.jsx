import { useEffect, useState } from "react";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import CustomSelect from "../../components/common/CustomSelect";
import { getMyProfile, updateMyProfile, changePassword, getReferralCode } from "../../api/customer";
import {
  User,
  Mail,
  Phone,
  Gift,
  Lock,
  Copy,
  Check,
  Crown,
  Sparkles,
  Share2,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
} from "lucide-react";

export default function ProfilePage() {
  const [form, setForm] = useState({
    name: "",
    phone: "",
    gender: "NOT_SPECIFIED",
  });

  const [email, setEmail] = useState("");
  const [membershipTier, setMembershipTier] = useState("SILVER");
  const [loyaltyPoints, setLoyaltyPoints] = useState(0);
  const [referralCode, setReferralCode] = useState("");

  const [pwForm, setPwForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showPw, setShowPw] = useState(false);

  const [loading, setLoading] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [alert, setAlert] = useState({ type: "", message: "" });
  const [pwAlert, setPwAlert] = useState({ type: "", message: "" });

  /* ---------------- LOAD PROFILE ---------------- */
  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const res = await getMyProfile();
      const u = res.data;

      setForm({
        name: u.name || "",
        phone: u.phone || "",
        gender: u.gender || "NOT_SPECIFIED",
      });

      setEmail(u.email || "");
      setMembershipTier(u.membershipTier || "SILVER");
      setLoyaltyPoints(u.loyaltyPoints || 0);

      if (u.referralCode) {
        setReferralCode(u.referralCode);
      } else {
        try {
          const refRes = await getReferralCode();
          if (refRes.data?.referralCode) {
            setReferralCode(refRes.data.referralCode);
          }
        } catch (_) { }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handlePwChange = (e) =>
    setPwForm({ ...pwForm, [e.target.name]: e.target.value });

  /* ---------------- UPDATE PROFILE ---------------- */
  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setAlert({ type: "", message: "" });

    try {
      await updateMyProfile(form);
      setAlert({
        type: "success",
        message: "Profile details updated successfully!",
      });
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to update profile";
      setAlert({ type: "error", message: msg });
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- CHANGE PASSWORD ---------------- */
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      setPwAlert({ type: "error", message: "New passwords do not match." });
      return;
    }
    if (pwForm.newPassword.length < 6) {
      setPwAlert({ type: "error", message: "Password must be at least 6 characters." });
      return;
    }

    setPwLoading(true);
    setPwAlert({ type: "", message: "" });

    try {
      await changePassword({
        currentPassword: pwForm.currentPassword,
        newPassword: pwForm.newPassword,
      });
      setPwAlert({
        type: "success",
        message: "Password changed successfully! A confirmation email was sent.",
      });
      setPwForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to change password. Verify your current password.";
      setPwAlert({ type: "error", message: msg });
    } finally {
      setPwLoading(false);
    }
  };

  /* ---------------- COPY REFERRAL CODE ---------------- */
  const handleCopyReferral = () => {
    if (!referralCode) return;
    navigator.clipboard.writeText(referralCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareText = encodeURIComponent(
    `Use my Groomish Now invite code ${referralCode} to sign up and get bonus Groom Coins on your first luxury salon visit! https://groomishnow.com`
  );

  return (
    <div className="min-h-screen bg-groomish-cream flex flex-col font-sans w-full max-w-full overflow-x-clip">
      <Navbar />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Header */}
        {/* <div className="mb-8">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-groomish-orange mb-1">
            <User className="w-4 h-4" />
            <span>Account Center</span>
          </div>
          <h1 className="text-3xl font-heading font-extrabold text-groomish-slate">
            My Profile
          </h1>
          <p className="text-sm text-groomish-slate/60 mt-1">
            Manage your personal details, referral bonuses, and security credentials.
          </p>
        </div> */}

        {/* PROFILE HEADER HERO */}
        <div className="bg-white rounded-3xl border border-groomish-slate/10 p-6 shadow-soft mb-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4 text-center sm:text-left">
            <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-groomish-orange to-groomish-coral flex items-center justify-center text-white font-extrabold text-2xl shadow-glowOrange">
              {form.name ? form.name.charAt(0).toUpperCase() : "G"}
            </div>
            <div>
              <h2 className="font-heading font-bold text-xl text-groomish-slate">
                {form.name || "Groomish Member"}
              </h2>
              <p className="text-xs text-groomish-slate/60 flex items-center justify-center sm:justify-start gap-1.5 mt-0.5">
                <Mail className="w-3.5 h-3.5" />
                {email}
              </p>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-3">
            <div className="bg-groomish-cream px-4 py-2 rounded-2xl border border-groomish-slate/10 text-center">
              <span className="text-[10px] font-bold uppercase tracking-wider text-groomish-slate/50 block">
                VIP Tier
              </span>
              <span className="text-xs font-extrabold text-groomish-orange flex items-center justify-center gap-1">
                <Crown className="w-3.5 h-3.5 text-groomish-gold" />
                {membershipTier}
              </span>
            </div>

            <div className="bg-groomish-cream px-4 py-2 rounded-2xl border border-groomish-slate/10 text-center">
              <span className="text-[10px] font-bold uppercase tracking-wider text-groomish-slate/50 block">
                Points
              </span>
              <span className="text-xs font-extrabold text-groomish-slate flex items-center justify-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-groomish-gold" />
                {loyaltyPoints} pts
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* LEFT 2 COLUMNS: PERSONAL INFO & SECURITY */}
          <div className="md:col-span-2 space-y-8">
            {/* PERSONAL INFO CARD */}
            <div className="bg-white rounded-3xl border border-groomish-slate/10 p-6 sm:p-8 shadow-soft">
              <h3 className="font-heading font-bold text-lg text-groomish-slate mb-4">
                Personal Information
              </h3>

              {alert.message && (
                <div
                  className={`p-3 rounded-xl mb-4 flex items-center gap-2 text-xs font-semibold ${alert.type === "success"
                    ? "bg-groomish-green/10 text-groomish-green"
                    : "bg-groomish-crimson/10 text-groomish-crimson"
                    }`}
                >
                  {alert.type === "success" ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0" />
                  )}
                  <span>{alert.message}</span>
                </div>
              )}

              <form onSubmit={handleUpdate} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-groomish-slate/70 mb-1.5">
                    Full Name
                  </label>
                  <input
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    className="input-groomish"
                    placeholder="Your Full Name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-groomish-slate/70 mb-1.5">
                    Email Address (Account ID)
                  </label>
                  <input
                    value={email}
                    disabled
                    className="input-groomish bg-gray-50 text-groomish-slate/50 cursor-not-allowed"
                  />
                  <p className="text-[10px] text-groomish-slate/40 mt-1">
                    Email cannot be changed directly for account security.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-groomish-slate/70 mb-1.5">
                      Phone Number
                    </label>
                    <input
                      name="phone"
                      value={form.phone}
                      onChange={handleChange}
                      className="input-groomish"
                      placeholder="Phone number"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-groomish-slate/70 mb-1.5">
                      Gender Preference
                    </label>
                    <CustomSelect
                      name="gender"
                      value={form.gender}
                      onChange={handleChange}
                      options={[
                        { value: "MALE", label: "Male" },
                        { value: "FEMALE", label: "Female" },
                        { value: "NOT_SPECIFIED", label: "Prefer not to say" },
                      ]}
                    />
                  </div>
                </div>

                <div className="flex justify-center pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary text-xs px-8 py-2.5"
                  >
                    {loading ? "Saving Changes..." : "Save Profile Details"}
                  </button>
                </div>
              </form>
            </div>

            {/* SECURITY & PASSWORD CARD */}
            <div className="bg-white rounded-3xl border border-groomish-slate/10 p-6 sm:p-8 shadow-soft">
              <h3 className="font-heading font-bold text-lg text-groomish-slate mb-1">
                Security & Password
              </h3>
              <p className="text-xs text-groomish-slate/50 mb-4">
                Update your account password. An email alert is triggered whenever a change occurs.
              </p>

              {pwAlert.message && (
                <div
                  className={`p-3 rounded-xl mb-4 flex items-center gap-2 text-xs font-semibold ${pwAlert.type === "success"
                    ? "bg-groomish-green/10 text-groomish-green"
                    : "bg-groomish-crimson/10 text-groomish-crimson"
                    }`}
                >
                  {pwAlert.type === "success" ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0" />
                  )}
                  <span>{pwAlert.message}</span>
                </div>
              )}

              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-groomish-slate/70 mb-1.5">
                    Current Password
                  </label>
                  <input
                    type={showPw ? "text" : "password"}
                    name="currentPassword"
                    value={pwForm.currentPassword}
                    onChange={handlePwChange}
                    required
                    className="input-groomish"
                    placeholder="Enter current password"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-groomish-slate/70 mb-1.5">
                      New Password
                    </label>
                    <input
                      type={showPw ? "text" : "password"}
                      name="newPassword"
                      value={pwForm.newPassword}
                      onChange={handlePwChange}
                      required
                      className="input-groomish"
                      placeholder="Minimum 6 chars"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-groomish-slate/70 mb-1.5">
                      Confirm New Password
                    </label>
                    <input
                      type={showPw ? "text" : "password"}
                      name="confirmPassword"
                      value={pwForm.confirmPassword}
                      onChange={handlePwChange}
                      required
                      className="input-groomish"
                      placeholder="Repeat new password"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <button
                    type="button"
                    onClick={() => setShowPw(!showPw)}
                    className="text-xs text-groomish-slate/60 hover:text-groomish-slate flex items-center gap-1.5"
                  >
                    {showPw ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    <span>{showPw ? "Hide passwords" : "Show passwords"}</span>
                  </button>

                  <button
                    type="submit"
                    disabled={pwLoading}
                    className="btn-secondary text-xs px-5 py-2"
                  >
                    {pwLoading ? "Updating..." : "Change Password"}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* RIGHT 1 COLUMN: REFERRAL PROGRAM CARD */}
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-groomish-orange to-groomish-coral text-white rounded-3xl p-6 shadow-glowOrange">
              <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center mb-4">
                <Gift className="w-5 h-5 text-white" />
              </div>

              <h3 className="font-heading font-bold text-lg leading-snug">
                Invite Friends, Earn 10 Groom Coins!
              </h3>
              <p className="text-xs text-white/80 mt-1 leading-relaxed">
                Share your unique code. Whenever a friend signs up using your code, you will receive 10 bonus Groom Coins credited directly to your account.
              </p>

              {/* Code Box */}
              <div className="bg-white/15 backdrop-blur-md border border-white/25 rounded-2xl p-4 my-5 text-center">
                <span className="text-[10px] uppercase font-bold text-white/70 block mb-1">
                  Your Referral Code
                </span>
                <span className="font-mono text-2xl font-extrabold tracking-widest text-groomish-gold">
                  {referralCode || "..."}
                </span>
              </div>

              <div className="space-y-2">
                <button
                  type="button"
                  onClick={handleCopyReferral}
                  className="w-full py-2.5 px-4 rounded-xl bg-white text-groomish-slate hover:bg-groomish-cream font-bold text-xs transition flex items-center justify-center gap-2 shadow-soft active:scale-95"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 text-groomish-green" />
                      <span>Copied to Clipboard!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Copy Referral Code</span>
                    </>
                  )}
                </button>

                <a
                  href={`https://api.whatsapp.com/send?text=${shareText}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 px-4 rounded-xl bg-white/20 hover:bg-white/30 text-white font-bold text-xs transition flex items-center justify-center gap-2"
                >
                  <Share2 className="w-4 h-4" />
                  <span>Share via WhatsApp</span>
                </a>
              </div>
            </div>

            {/* Quick Support Card */}
            <div className="bg-white rounded-3xl border border-groomish-slate/10 p-6 shadow-soft text-xs text-groomish-slate/70 space-y-2">
              <h4 className="font-heading font-bold text-sm text-groomish-slate">
                Need Salon Assistance?
              </h4>
              <p>
                Our concierge team is available 9:00 AM – 9:00 PM to help you reschedule or arrange custom bridal/grooming packages.
              </p>
              <p className="font-semibold text-groomish-orange pt-1">
                📞 +91 98765 43210 • support@groomishnow.com
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
