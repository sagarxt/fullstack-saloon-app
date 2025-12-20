import React, { useState } from "react";
import {
  loginApi,
  registerApi,
  sendOtpApi,
  verifyOtpApi,
} from "../../api/auth";

export default function AuthModal({ open, onClose }) {
  const [mode, setMode] = useState("login");
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [loading, setLoading] = useState(false);

  // STACKED TOASTS
  const [toasts, setToasts] = useState([]);

  const addToast = (message) => {
    const id = Date.now();
    const toast = { id, message };
    setToasts((prev) => [...prev, toast]);

    setTimeout(() => {
      removeToast(id);
    }, 3000);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    otp: "",
  });

  if (!open) return null;

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // --------------------------------
  // LOGIN
  // --------------------------------
  const handleLogin = async () => {
    try {
      const res = await loginApi({
        email: form.email,
        password: form.password,
      });

      const token = res.data.token;
			const role = res.data.user.role;

      localStorage.setItem("token", token);
      localStorage.setItem("role", role);

      addToast("Login successful!");

      if (role === "ROLE_ADMIN") window.location.href = "/admin/dashboard";
      else if (role === "ROLE_STAFF") window.location.href = "/staff/dashboard";
      else window.location.href = "/customer/home";
    } catch (err) {
      addToast(err.response?.data?.message || "Invalid login");
    }
  };

  // --------------------------------
  // SEND OTP
  // --------------------------------
  const handleSendOtp = async () => {
    if (!form.email) {
      addToast("Enter email to send OTP");
      return;
    }

    try {
      setLoading(true);
      await sendOtpApi({ email: form.email });

      addToast("OTP sent to email");
      setOtpSent(true);
    } catch (err) {
      addToast(err.response?.data?.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  // --------------------------------
  // VERIFY OTP → AUTO REGISTER
  // --------------------------------
  const handleVerifyOtp = async () => {
    try {
      setLoading(true);

      await verifyOtpApi({ email: form.email, otp: form.otp });
      addToast("OTP verified!");

      const regRes = await registerApi({
        name: form.name,
        email: form.email,
        phone: form.phone,
        password: form.password,
      });

      const loginRes = await loginApi({
        email: form.email,
        password: form.password,
      });

      localStorage.setItem("token", loginRes.data.token);

      addToast("Account created successfully!");

      setTimeout(() => {
        window.location.href = "/customer/home";
      }, 800);
    } catch (err) {
      addToast(err.response?.data?.message || "OTP verification failed");
    } finally {
      setLoading(false);
    }
  };

  // =============================
  //  UI
  // =============================
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">

      {/* 🔥 TOAST CONTAINER */}
      <div className="fixed top-6 right-6 flex flex-col gap-3 z-[9999]">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="
              bg-luxe-gold text-luxe-black px-4 py-2 rounded-md shadow-lg 
              font-semibold text-sm animate-slideFade
            "
          >
            {t.message}
          </div>
        ))}
      </div>

      {/* ========================== */}
      {/* MODAL CARD */}
      {/* ========================== */}
      <div className="bg-white rounded-xl p-6 w-full max-w-md relative shadow-xl border border-luxe-gold/40">

        <button
          className="absolute right-4 top-4 text-gray-400 hover:text-black"
          onClick={onClose}
        >
          ✕
        </button>

        <h2 className="text-2xl font-bold text-center mb-6 text-luxe-black font-serif">
          {mode === "login" ? "Welcome Back" : "Create Account"}
        </h2>

        {/* ===================== */}
        {/* LOGIN */}
        {/* ===================== */}
        {mode === "login" && (
          <div className="space-y-4">
            <input
              name="email"
              placeholder="Email"
              type="email"
              className="w-full bg-white text-luxe-black border border-luxe-gray-light px-3 py-2 rounded-md placeholder:text-luxe-gray-medium focus:ring-2 focus:ring-luxe-gold"
              onChange={handleChange}
            />

            <input
              name="password"
              type="password"
              placeholder="Password"
              className="w-full bg-white text-luxe-black border border-luxe-gray-light px-3 py-2 rounded-md placeholder:text-luxe-gray-medium focus:ring-2 focus:ring-luxe-gold"
              onChange={handleChange}
            />

            <button
              onClick={handleLogin}
              disabled={loading}
              className="w-full bg-luxe-gold text-luxe-black py-3 rounded-full font-semibold hover:bg-luxe-gold-soft transition"
            >
              {loading ? "Please wait..." : "Login"}
            </button>

            <p className="text-center text-sm text-luxe-gray-medium">
              New user?{" "}
              <span
                className="text-luxe-gold cursor-pointer"
                onClick={() => setMode("register")}
              >
                Create account
              </span>
            </p>
          </div>
        )}

        {/* ===================== */}
        {/* REGISTER */}
        {/* ===================== */}
        {mode === "register" && (
          <div className="space-y-4">

            {!otpSent && (
              <>
                <input name="name" placeholder="Full Name"
                  onChange={handleChange}
                  className="input-auth" />

                <input name="email" placeholder="Email"
                  onChange={handleChange}
                  className="input-auth" />

                <input name="phone" placeholder="Phone"
                  onChange={handleChange}
                  className="input-auth" />

                <input name="password" type="password" placeholder="Password"
                  onChange={handleChange}
                  className="input-auth" />

                <button
                  onClick={handleSendOtp}
                  disabled={loading}
                  className="btn-auth"
                >
                  {loading ? "Sending OTP..." : "Send Verification Code"}
                </button>
              </>
            )}

            {otpSent && !otpVerified && (
              <>
                <input
                  name="otp"
                  maxLength={6}
                  placeholder="Enter OTP"
                  onChange={handleChange}
                  className="w-full border px-3 py-2 rounded-md text-center tracking-widest text-xl"
                />

                <button
                  onClick={handleVerifyOtp}
                  disabled={loading}
                  className="btn-auth"
                >
                  {loading ? "Verifying..." : "Verify OTP & Register"}
                </button>
              </>
            )}

            <p className="text-center text-sm text-luxe-gray-medium">
              Already have an account?{" "}
              <span
                className="text-luxe-gold cursor-pointer"
                onClick={() => setMode("login")}
              >
                Login
              </span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
