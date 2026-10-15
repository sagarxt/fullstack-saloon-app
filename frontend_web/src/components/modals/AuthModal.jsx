import { useState, useRef } from "react";
import ModalWrapper from "./ModalWrapper";
import {
  loginApi,
  registerApi,
  sendOtpApi,
  verifyOtpApi,
  verifyReferralApi,
  forgotPasswordApi,
  resetPasswordApi,
} from "../../api/auth";
import { useAuth } from "../../context/useAuth";
import { useNavigate } from "react-router-dom";
import { Mail, Lock, User, Phone, Gift, Eye, EyeOff, Sparkles, CheckCircle2, AlertCircle, Loader2, RotateCcw, KeyRound } from "lucide-react";

export default function AuthModal({ open, onClose, onSuccess }) {
  const [mode, setMode] = useState("login"); // "login" | "register" | "forgot"
  const [step, setStep] = useState("form"); // "form" | "otp"
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [referralStatus, setReferralStatus] = useState({
    checking: false,
    valid: null,
    message: "",
    referrerName: "",
  });
  const [referralError, setReferralError] = useState("");
  const referralInputRef = useRef(null);
  
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
    if (e.target.name === "referralCode") {
      setReferralError("");
      setReferralStatus({ checking: false, valid: null, message: "", referrerName: "" });
    }
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  /* ---------- REAL-TIME REFERRAL CHECK ---------- */
  const checkReferral = async (overrideCode) => {
    const rawCode = overrideCode !== undefined ? overrideCode : form.referralCode;
    const code = (rawCode || "").trim();
    if (!code) {
      setReferralStatus({ checking: false, valid: null, message: "", referrerName: "" });
      setReferralError("");
      return true;
    }

    setReferralStatus((prev) => ({ ...prev, checking: true }));
    try {
      const res = await verifyReferralApi(code);
      if (res.data?.valid) {
        setReferralStatus({
          checking: false,
          valid: true,
          message: res.data.message || `Valid referral from ${res.data.referrerName}`,
          referrerName: res.data.referrerName || "",
        });
        setReferralError("");
        if (error === "Invalid Referral Code") setError("");
        return true;
      } else {
        setReferralStatus({ checking: false, valid: false, message: "Invalid Referral Code", referrerName: "" });
        setReferralError("Invalid Referral Code");
        setError("Invalid Referral Code");
        return false;
      }
    } catch (err) {
      setReferralStatus({ checking: false, valid: false, message: "Invalid Referral Code", referrerName: "" });
      setReferralError("Invalid Referral Code");
      setError("Invalid Referral Code");
      return false;
    }
  };

  /* ---------- RETRY / EDIT REFERRAL CODE ---------- */
  const handleRetryReferral = () => {
    setReferralError("");
    if (error === "Invalid Referral Code") setError("");
    if (step !== "form") setStep("form");
    setTimeout(() => {
      referralInputRef.current?.focus();
    }, 100);
  };

  /* ---------- SIGN UP WITHOUT REFERRAL CODE ---------- */
  const handleSignupWithoutReferral = async () => {
    setForm((prev) => ({ ...prev, referralCode: "" }));
    setReferralError("");
    if (error === "Invalid Referral Code") setError("");
    setReferralStatus({ checking: false, valid: null, message: "", referrerName: "" });

    if (step === "otp") {
      // In OTP step, immediately complete registration with empty referral code
      await handleVerifyOtp(null, "");
    } else {
      // In form step, proceed to send OTP without referral code
      await handleSendOtp(null, true);
    }
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
      }
      // CUSTOMER remains on current page (e.g. products, services)
      onClose();
      onSuccess?.();
    } catch (err) {
      const msg = err.response?.data?.message || "Invalid credentials. Please try again.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  /* ---------- FORGOT PASSWORD: SEND OTP ---------- */
  const handleSendForgotOtp = async (e) => {
    e?.preventDefault();
    if (!form.email || !form.email.includes("@")) {
      setError("Please enter your registered email address.");
      return;
    }
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      await forgotPasswordApi(form.email.trim());
      setSuccess("A 6-digit OTP verification code has been sent to your registered email!");
      setStep("otp");
    } catch (err) {
      setError(err.response?.data?.message || "No registered account found with this email, or failed to send OTP.");
    } finally {
      setLoading(false);
    }
  };

  /* ---------- FORGOT PASSWORD: RESET PASSWORD ---------- */
  const handleResetPassword = async (e) => {
    e?.preventDefault();
    if (!form.otp || form.otp.trim().length < 4) {
      setError("Please enter the 6-digit OTP sent to your email.");
      return;
    }
    if (!newPassword || newPassword.length < 4) {
      setError("New password must be at least 4 characters long.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match. Please re-enter.");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");
    try {
      await resetPasswordApi({
        email: form.email.trim(),
        otp: form.otp.trim(),
        newPassword: newPassword.trim(),
      });
      setSuccess("Password reset successfully! Please sign in with your new password.");
      setForm((prev) => ({ ...prev, password: newPassword.trim(), otp: "" }));
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => {
        setMode("login");
        setStep("form");
        setSuccess("Password updated successfully! Sign in with your new password.");
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.message || "Invalid or expired OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  /* ---------- SEND OTP ---------- */
  const handleSendOtp = async (e, bypassReferral = false) => {
    e?.preventDefault();
    if (!form.name || !form.email || !form.password || !form.phone) {
      setError("Please fill in all required registration fields.");
      return;
    }

    setLoading(true);
    setError("");
    setReferralError("");

    // Referral verification check if provided
    const code = bypassReferral ? "" : form.referralCode?.trim();
    if (code) {
      const isValid = await checkReferral(code);
      if (!isValid) {
        setLoading(false);
        return;
      }
    }

    try {
      const otpRes = await sendOtpApi({ email: form.email.trim() });
      if (otpRes.data === "failed") {
        throw new Error("Unable to dispatch verification email. Please verify your email address.");
      }
      setStep("otp");
      setSuccess(`Verification code sent to ${form.email.trim()}`);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Could not send OTP to your email. Please try again.";
      setError(msg);
      return;
    } finally {
      setLoading(false);
    }
  };

  /* ---------- VERIFY OTP & REGISTER ---------- */
  const handleVerifyOtp = async (e, overrideCode = undefined) => {
    e?.preventDefault();
    if (!form.otp) {
      setError("Please enter the verification code.");
      return;
    }

    setLoading(true);
    setError("");
    setReferralError("");

    try {
      const verifyRes = await verifyOtpApi({
        email: form.email.trim(),
        otp: form.otp.trim(),
      });

      if (verifyRes.data !== "success") {
        setError("Invalid or expired OTP. Please check your email and try again.");
        setLoading(false);
        return;
      }

      const effectiveReferral = overrideCode !== undefined
        ? (overrideCode ? overrideCode.trim() : null)
        : (form.referralCode?.trim() || null);

      const regRes = await registerApi({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        phone: form.phone.trim(),
        gender: form.gender,
        referralCode: effectiveReferral,
      });

      let authPayload = null;
      if (regRes.data?.token) {
        authPayload = {
          token: regRes.data.token,
          user: regRes.data,
        };
      } else {
        // Fallback auto-login with credentials to acquire token
        const loginRes = await loginApi({
          email: form.email.trim(),
          password: form.password,
        });
        authPayload = loginRes.data;
      }

      login(authPayload);

      const role = (
        authPayload.user?.role ||
        authPayload.role ||
        ""
      ).replace("ROLE_", "");

      if (role === "ADMIN") {
        navigate("/admin/dashboard", { replace: true });
      } else if (role === "STAFF") {
        navigate("/staff/dashboard", { replace: true });
      }
      // CUSTOMER remains on the page they were browsing!
      onClose();
      onSuccess?.();
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.error || err.message || "Registration failed. Please check your details.";
      if (msg.toLowerCase().includes("referral")) {
        setReferralError("Invalid Referral Code");
      }
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
      {/* Header Tabs / Title */}
      {mode === "forgot" ? (
        <div className="flex items-center justify-between p-2.5 px-3 bg-groomish-cream rounded-2xl mb-5 border border-groomish-slate/10">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-groomish-orange/15 text-groomish-orange flex items-center justify-center">
              <KeyRound className="w-4 h-4" />
            </div>
            <div>
              <p className="font-heading font-bold text-xs text-groomish-slate">
                {step === "form" ? "Forgot Password" : "Set New Password"}
              </p>
              <p className="text-[10px] text-groomish-slate/60">
                {step === "form" ? "Verify with registered email" : "Enter OTP & new password"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setMode("login");
              setStep("form");
              setError("");
              setSuccess("");
            }}
            className="text-xs font-bold text-groomish-orange hover:underline px-2 py-1"
          >
            ← Sign In
          </button>
        </div>
      ) : (
        <div className="flex p-1 bg-groomish-cream rounded-2xl mb-5">
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
      )}

      {/* Alerts */}
      {error && !referralError && (
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
              <button
                type="button"
                onClick={() => {
                  setMode("forgot");
                  setStep("form");
                  setError("");
                  setSuccess("");
                }}
                className="text-xs font-semibold text-groomish-orange hover:underline"
              >
                Forgot Password?
              </button>
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
                aria-label="Toggle password visibility"
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
        </form>
      )}

      {/* ---------------- FORGOT PASSWORD: STEP 1 (EMAIL) ---------------- */}
      {mode === "forgot" && step === "form" && (
        <form onSubmit={handleSendForgotOtp} className="space-y-4">
          <div>
            <p className="text-xs text-groomish-slate/70 mb-3 leading-relaxed">
              Enter the email address registered with your Groomish account. We will send a 6-digit OTP code to verify your identity.
            </p>
            <label className="block text-xs font-semibold text-groomish-slate/70 mb-1.5">
              Registered Email Address
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
                autoFocus
                className="w-full bg-transparent text-sm text-groomish-slate placeholder:text-groomish-slate/40 outline-none border-none p-0 focus:ring-0"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-auth mt-2"
          >
            {loading ? "Sending OTP..." : "Send Reset OTP"}
          </button>
        </form>
      )}

      {/* ---------------- FORGOT PASSWORD: STEP 2 (OTP & NEW PASSWORD) ---------------- */}
      {mode === "forgot" && step === "otp" && (
        <form onSubmit={handleResetPassword} className="space-y-3.5">
          <div className="p-3 bg-groomish-orangeLight/60 rounded-xl border border-groomish-orange/20">
            <p className="text-xs text-groomish-slate/80">
              We sent a 6-digit OTP to <span className="font-bold text-groomish-slate">{form.email}</span>.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-groomish-slate/70 mb-1">
              6-Digit OTP Verification Code
            </label>
            <input
              type="text"
              name="otp"
              value={form.otp}
              onChange={handleChange}
              placeholder="123456"
              maxLength={6}
              required
              autoFocus
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-groomish-slate/15 focus:border-groomish-orange focus:ring-2 focus:ring-groomish-orange/20 outline-none text-center text-lg font-bold tracking-widest text-groomish-slate"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-groomish-slate/70 mb-1">
              New Password
            </label>
            <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-white border border-groomish-slate/15 focus-within:border-groomish-orange focus-within:ring-2 focus-within:ring-groomish-orange/20 transition">
              <Lock className="w-4 h-4 text-groomish-slate/40 shrink-0" />
              <input
                type={showNewPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 4 characters"
                required
                className="w-full bg-transparent text-sm text-groomish-slate placeholder:text-groomish-slate/40 outline-none border-none p-0 focus:ring-0"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="text-groomish-slate/40 hover:text-groomish-slate shrink-0 p-0.5"
                aria-label="Toggle password visibility"
              >
                {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-groomish-slate/70 mb-1">
              Confirm New Password
            </label>
            <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-white border border-groomish-slate/15 focus-within:border-groomish-orange focus-within:ring-2 focus-within:ring-groomish-orange/20 transition">
              <Lock className="w-4 h-4 text-groomish-slate/40 shrink-0" />
              <input
                type={showNewPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                required
                className="w-full bg-transparent text-sm text-groomish-slate placeholder:text-groomish-slate/40 outline-none border-none p-0 focus:ring-0"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-auth mt-2"
          >
            {loading ? "Resetting Password..." : "Reset Password & Sign In"}
          </button>

          <div className="flex items-center justify-between pt-1 text-xs">
            <button
              type="button"
              onClick={handleSendForgotOtp}
              disabled={loading}
              className="text-groomish-orange hover:underline font-semibold"
            >
              Resend OTP
            </button>
            <button
              type="button"
              onClick={() => {
                setStep("form");
                setError("");
              }}
              className="text-groomish-slate/60 hover:text-groomish-slate"
            >
              ← Change email
            </button>
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
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-groomish-slate/70">
                  Referral Code (Optional)
                </label>
                {referralStatus.checking && (
                  <span className="text-[10px] text-groomish-orange flex items-center gap-1 font-medium">
                    <Loader2 className="w-2.5 h-2.5 animate-spin" /> Verifying...
                  </span>
                )}
              </div>
              <div
                className={`flex items-center gap-2 px-3 py-2.5 rounded-xl bg-white border transition ${
                  referralError
                    ? "border-rose-400 ring-2 ring-rose-200"
                    : referralStatus.valid
                    ? "border-emerald-400 ring-2 ring-emerald-100"
                    : "border-groomish-slate/15 focus-within:border-groomish-orange focus-within:ring-2 focus-within:ring-groomish-orange/20"
                }`}
              >
                <Gift className="w-4 h-4 text-groomish-orange shrink-0" />
                <input
                  ref={referralInputRef}
                  name="referralCode"
                  value={form.referralCode}
                  onChange={handleChange}
                  onBlur={() => {
                    if (form.referralCode?.trim()) checkReferral(form.referralCode.trim());
                  }}
                  placeholder="e.g. SAG8K2"
                  className="w-full bg-transparent text-xs text-groomish-slate placeholder:text-groomish-slate/40 outline-none border-none p-0 focus:ring-0 uppercase font-mono font-medium tracking-wide"
                />
                {form.referralCode?.trim() && !referralStatus.checking && !referralError && !referralStatus.valid && (
                  <button
                    type="button"
                    onClick={() => checkReferral(form.referralCode.trim())}
                    className="text-[11px] font-semibold text-groomish-orange hover:text-groomish-orange/80 shrink-0 px-2 py-0.5 rounded-md bg-groomish-orange/10 transition"
                  >
                    Verify
                  </button>
                )}
                {referralStatus.valid && (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                )}
              </div>
            </div>
          </div>

          {/* Valid Referral Banner */}
          {referralStatus.valid && !referralError && (
            <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs animate-fade-in">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>
                Referral code applied! Referred by <strong>{referralStatus.referrerName}</strong>
              </span>
            </div>
          )}

          {/* Invalid Referral Code Option Card */}
          {referralError && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl space-y-2.5 animate-fade-in shadow-xs">
              <div className="flex items-center gap-2 text-rose-700 text-xs font-bold">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>Invalid Referral Code</span>
              </div>
              <p className="text-[11px] text-rose-600 leading-relaxed">
                The code &ldquo;{form.referralCode}&rdquo; is not a valid referral code. Please verify the code or proceed with registration without one.
              </p>
              <div className="flex flex-col sm:flex-row gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleRetryReferral}
                  className="flex-1 py-1.5 px-3 text-xs font-semibold rounded-xl bg-white border border-rose-200 text-rose-700 hover:bg-rose-100/60 transition shadow-xs text-center flex items-center justify-center gap-1.5"
                >
                  <RotateCcw className="w-3 h-3" />
                  Retry / Edit Code
                </button>
                <button
                  type="button"
                  onClick={handleSignupWithoutReferral}
                  className="flex-1 py-1.5 px-3 text-xs font-semibold rounded-xl bg-rose-600 hover:bg-rose-700 text-white transition shadow-xs text-center"
                >
                  Sign up without referral code
                </button>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-auth mt-2"
          >
            {loading ? "Sending Code..." : "Continue to Email Verification"}
          </button>
        </form>
      )}

      {/* ---------------- REGISTER: OTP STEP ---------------- */}
      {mode === "register" && step === "otp" && (
        <form onSubmit={handleVerifyOtp} className="space-y-4">
          <div className="text-center p-4 bg-groomish-cream rounded-2xl">
            <Mail className="w-8 h-8 text-groomish-orange mx-auto mb-2" />
            <h3 className="font-bold text-sm text-groomish-slate">
              Verify Your Email Address
            </h3>
            <p className="text-xs text-groomish-slate/60 mt-1">
              We sent a 6-digit verification code to <b className="text-groomish-slate font-semibold">{form.email}</b>
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

          <div className="flex items-center justify-between text-xs px-1">
            <span className="text-groomish-slate/60">Didn&apos;t receive the email?</span>
            <button
              type="button"
              disabled={loading}
              onClick={() => handleSendOtp(null, true)}
              className="text-groomish-orange font-semibold hover:underline disabled:opacity-50"
            >
              Resend code
            </button>
          </div>

          {/* Invalid Referral Code Option Card in OTP step */}
          {referralError && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl space-y-2.5 animate-fade-in shadow-xs">
              <div className="flex items-center gap-2 text-rose-700 text-xs font-bold">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>Invalid Referral Code</span>
              </div>
              <p className="text-[11px] text-rose-600 leading-relaxed">
                Could not complete registration because &ldquo;{form.referralCode}&rdquo; is not a valid referral code.
              </p>
              <div className="flex flex-col sm:flex-row gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleRetryReferral}
                  className="flex-1 py-1.5 px-3 text-xs font-semibold rounded-xl bg-white border border-rose-200 text-rose-700 hover:bg-rose-100/60 transition shadow-xs text-center flex items-center justify-center gap-1.5"
                >
                  <RotateCcw className="w-3 h-3" />
                  Edit Referral Code
                </button>
                <button
                  type="button"
                  onClick={handleSignupWithoutReferral}
                  className="flex-1 py-1.5 px-3 text-xs font-semibold rounded-xl bg-rose-600 hover:bg-rose-700 text-white transition shadow-xs text-center"
                >
                  Sign up without referral code
                </button>
              </div>
            </div>
          )}

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
            ← Change email or account information
          </button>
        </form>
      )}
    </ModalWrapper>
  );
}
