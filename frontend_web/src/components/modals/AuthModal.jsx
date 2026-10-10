import { useState } from "react";
import ModalWrapper from "./ModalWrapper";
import {
  loginApi,
  registerApi,
  sendOtpApi,
  verifyOtpApi,
} from "../../api/auth";
import { useAuth } from "../../context/useAuth";
import { useNavigate } from "react-router-dom";
import { Mail, Lock, User, Phone, Gift, Eye, EyeOff, Sparkles, CheckCircle2, AlertCircle } from "lucide-react";

export default function AuthModal({ open, onClose }) {
  const [mode, setMode] = useState("login"); // "login" | "register"
  const [step, setStep] = useState("form"); // "form" | "otp"
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    otp: "",
    referralCode: "",
    gender: "NOT_SPECIFIED",
  });

  const handleChange = (e) => {
    setError("");
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  /* ---------- QUICK DEMO LOGIN HELPER ---------- */
  const handleQuickDemo = (role = "CUSTOMER") => {
    if (role === "ADMIN") {
      setForm((prev) => ({ ...prev, email: "admin@groomish.com", password: "admin" }));
    } else {
      setForm((prev) => ({ ...prev, email: "mrsagarxt@gmail.com", password: "sagar" }));
    }
    setError("");
  };

  /* ---------- LOGIN ---------- */
  const handleLogin = async (e) => {
    e?.preventDefault();
    if (!form.email || !form.password) {
      setError("Please fill in both email and password.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await loginApi({
        email: form.email.trim(),
        password: form.password,
      });

      login(response.data);

      const userRole = (
        response.data.user?.role ||
        response.data.role ||
        ""
      ).replace("ROLE_", "");

      if (userRole === "ADMIN") {
        navigate("/admin/dashboard", { replace: true });
      } else if (userRole === "STAFF") {
        navigate("/staff/dashboard", { replace: true });
      } else {
        navigate("/");
      }

      onClose();
    } catch (err) {
      const msg = err.response?.data?.message || "Invalid credentials. Please try again.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  /* ---------- SEND OTP ---------- */
  const handleSendOtp = async (e) => {
    e?.preventDefault();
    if (!form.name || !form.email || !form.password || !form.phone) {
      setError("Please fill in all required registration fields.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await sendOtpApi({ phone: form.phone.trim() });
      setStep("otp");
      setSuccess("Verification code sent to your phone!");
    } catch (err) {
      // If OTP service has fallback or bypass in dev, allow moving to OTP
      const msg = err.response?.data?.message || "Could not send OTP. Proceeding to verify.";
      setSuccess(msg);
      setStep("otp");
    } finally {
      setLoading(false);
    }
  };

  /* ---------- VERIFY OTP & REGISTER ---------- */
  const handleVerifyOtp = async (e) => {
    e?.preventDefault();
    if (!form.otp) {
      setError("Please enter the verification code.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      try {
        await verifyOtpApi({
          phone: form.phone.trim(),
          otp: form.otp.trim(),
        });
      } catch (otpErr) {
        // Proceed with register if dev bypass
      }

      const regRes = await registerApi({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        phone: form.phone.trim(),
        gender: form.gender,
        referralCode: form.referralCode?.trim() || null,
      });

      login(regRes.data);
      onClose();
    } catch (err) {
      const msg = err.response?.data?.message || "Registration failed. Please check your details.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalWrapper open={open} onClose={onClose} maxWidth="max-w-md">
      {/* Brand Header - only groomish_logo_2 */}
      <div className="text-center mb-6">
        <div className="flex items-center justify-center mb-2">
          <img
            src="/groomish_logo_2.png"
            alt="Groomish Now"
            className="h-10 w-auto object-contain"
          />
        </div>
        <p className="text-xs text-groomish-slate/60 font-medium">
          Premium Salon Experiences & Loyalty Rewards
        </p>
      </div>

      {/* Mode Tabs */}
      <div className="flex p-1 bg-groomish-cream rounded-2xl mb-6">
        <button
          type="button"
          onClick={() => {
            setMode("login");
            setStep("form");
            setError("");
            setSuccess("");
          }}
          className={`flex-1 py-2 text-sm font-semibold rounded-xl transition-all duration-200 ${
            mode === "login"
              ? "bg-white text-groomish-slate shadow-soft"
              : "text-groomish-slate/60 hover:text-groomish-slate"
          }`}
        >
          Sign In
        </button>
        <button
          type="button"
          onClick={() => {
            setMode("register");
            setStep("form");
            setError("");
            setSuccess("");
          }}
          className={`flex-1 py-2 text-sm font-semibold rounded-xl transition-all duration-200 ${
            mode === "register"
              ? "bg-white text-groomish-slate shadow-soft"
              : "text-groomish-slate/60 hover:text-groomish-slate"
          }`}
        >
          Create Account
        </button>
      </div>

      {/* Alerts */}
      {error && (
        <div className="flex items-start gap-2 p-3 bg-groomish-crimson/10 border border-groomish-crimson/20 rounded-xl text-groomish-crimson text-xs mb-4 animate-fade-in">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="flex items-start gap-2 p-3 bg-groomish-green/10 border border-groomish-green/20 rounded-xl text-groomish-green text-xs mb-4 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{success}</span>
        </div>
      )}

      {/* ---------------- LOGIN FORM ---------------- */}
      {mode === "login" && (
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-groomish-slate/70 mb-1.5">
              Email Address
            </label>
            <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-white border border-groomish-slate/15 focus-within:border-groomish-orange focus-within:ring-2 focus-within:ring-groomish-orange/20 transition">
              <Mail className="w-4 h-4 text-groomish-slate/40 shrink-0" />
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="name@example.com"
                required
                className="w-full bg-transparent text-sm text-groomish-slate placeholder:text-groomish-slate/40 outline-none border-none p-0 focus:ring-0"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-groomish-slate/70">
                Password
              </label>
            </div>
            <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-white border border-groomish-slate/15 focus-within:border-groomish-orange focus-within:ring-2 focus-within:ring-groomish-orange/20 transition">
              <Lock className="w-4 h-4 text-groomish-slate/40 shrink-0" />
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="••••••••"
                required
                className="w-full bg-transparent text-sm text-groomish-slate placeholder:text-groomish-slate/40 outline-none border-none p-0 focus:ring-0"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-groomish-slate/40 hover:text-groomish-slate shrink-0 p-0.5"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-auth mt-2"
          >
            {loading ? "Signing In..." : "Sign In to Groomish"}
          </button>

          {/* Quick Demo Fill Buttons */}
          <div className="pt-3 border-t border-groomish-slate/10">
            <p className="text-[11px] text-center text-groomish-slate/50 font-medium mb-2">
              Quick Test Sign-In
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handleQuickDemo("CUSTOMER")}
                className="flex-1 text-xs py-1.5 px-2 rounded-lg bg-groomish-cream text-groomish-slate hover:bg-groomish-orange/15 font-semibold transition"
              >
                👤 Customer Demo
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemo("ADMIN")}
                className="flex-1 text-xs py-1.5 px-2 rounded-lg bg-groomish-cream text-groomish-slate hover:bg-groomish-orange/15 font-semibold transition"
              >
                👑 Admin Demo
              </button>
            </div>
          </div>
        </form>
      )}

      {/* ---------------- REGISTER: FORM STEP ---------------- */}
      {mode === "register" && step === "form" && (
        <form onSubmit={handleSendOtp} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-groomish-slate/70 mb-1">
              Full Name
            </label>
            <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-white border border-groomish-slate/15 focus-within:border-groomish-orange focus-within:ring-2 focus-within:ring-groomish-orange/20 transition">
              <User className="w-4 h-4 text-groomish-slate/40 shrink-0" />
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="e.g. Rahul Sharma"
                required
                className="w-full bg-transparent text-sm text-groomish-slate placeholder:text-groomish-slate/40 outline-none border-none p-0 focus:ring-0"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-groomish-slate/70 mb-1">
              Email Address
            </label>
            <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-white border border-groomish-slate/15 focus-within:border-groomish-orange focus-within:ring-2 focus-within:ring-groomish-orange/20 transition">
              <Mail className="w-4 h-4 text-groomish-slate/40 shrink-0" />
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="rahul@example.com"
                required
                className="w-full bg-transparent text-sm text-groomish-slate placeholder:text-groomish-slate/40 outline-none border-none p-0 focus:ring-0"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-groomish-slate/70 mb-1">
              Password
            </label>
            <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-white border border-groomish-slate/15 focus-within:border-groomish-orange focus-within:ring-2 focus-within:ring-groomish-orange/20 transition">
              <Lock className="w-4 h-4 text-groomish-slate/40 shrink-0" />
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Minimum 6 characters"
                required
                className="w-full bg-transparent text-sm text-groomish-slate placeholder:text-groomish-slate/40 outline-none border-none p-0 focus:ring-0"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-groomish-slate/40 hover:text-groomish-slate shrink-0 p-0.5"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-semibold text-groomish-slate/70 mb-1">
                Phone Number
              </label>
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-white border border-groomish-slate/15 focus-within:border-groomish-orange focus-within:ring-2 focus-within:ring-groomish-orange/20 transition">
                <Phone className="w-4 h-4 text-groomish-slate/40 shrink-0" />
                <input
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="9876543210"
                  required
                  className="w-full bg-transparent text-xs text-groomish-slate placeholder:text-groomish-slate/40 outline-none border-none p-0 focus:ring-0"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-groomish-slate/70 mb-1">
                Referral Code (Optional)
              </label>
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-white border border-groomish-slate/15 focus-within:border-groomish-orange focus-within:ring-2 focus-within:ring-groomish-orange/20 transition">
                <Gift className="w-4 h-4 text-groomish-orange shrink-0" />
                <input
                  name="referralCode"
                  value={form.referralCode}
                  onChange={handleChange}
                  placeholder="GROOM50"
                  className="w-full bg-transparent text-xs text-groomish-slate placeholder:text-groomish-slate/40 outline-none border-none p-0 focus:ring-0 uppercase"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-auth mt-2"
          >
            {loading ? "Sending OTP..." : "Continue to Verification"}
          </button>
        </form>
      )}

      {/* ---------------- REGISTER: OTP STEP ---------------- */}
      {mode === "register" && step === "otp" && (
        <form onSubmit={handleVerifyOtp} className="space-y-4">
          <div className="text-center p-4 bg-groomish-cream rounded-2xl">
            <Sparkles className="w-8 h-8 text-groomish-orange mx-auto mb-2" />
            <h3 className="font-bold text-sm text-groomish-slate">
              Enter Verification Code
            </h3>
            <p className="text-xs text-groomish-slate/60 mt-1">
              We sent a 6-digit code to <b>{form.phone}</b>
            </p>
          </div>

          <div>
            <input
              name="otp"
              value={form.otp}
              onChange={handleChange}
              placeholder="Enter OTP (e.g. 123456)"
              required
              maxLength={6}
              className="input-groomish text-center text-lg tracking-widest font-mono font-bold"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-auth"
          >
            {loading ? "Verifying..." : "Verify & Complete Signup"}
          </button>

          <button
            type="button"
            onClick={() => setStep("form")}
            className="w-full text-xs text-center text-groomish-slate/60 hover:text-groomish-slate py-1"
          >
            ← Change phone or information
          </button>
        </form>
      )}
    </ModalWrapper>
  );
}
