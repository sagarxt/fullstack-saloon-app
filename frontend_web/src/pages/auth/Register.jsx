import { useContext, useState, useRef } from "react";
import { AuthContext } from "../../auth/AuthContext";
import Navbar from "../../components/Navbar";
import { useToast } from "../../components/Toast";
import CustomSelect from "../../components/common/CustomSelect";
import { verifyReferralApi } from "../../api/auth";
import { AlertCircle, CheckCircle2, Gift, Loader2, RotateCcw } from "lucide-react";

export default function Register() {
  const { register } = useContext(AuthContext);
  const { showToast } = useToast();

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    referralCode: "",
    countryCode: "+91",
  });

  // Validation errors
  const [errors, setErrors] = useState({
    name: false,
    email: false,
    phone: false,
    password: false,
  });

  const [referralStatus, setReferralStatus] = useState({
    checking: false,
    valid: null,
    message: "",
    referrerName: "",
  });
  const [referralError, setReferralError] = useState("");
  const referralInputRef = useRef(null);

  const [shake, setShake] = useState(false);
  const [loading, setLoading] = useState(false);

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
        return true;
      } else {
        setReferralStatus({ checking: false, valid: false, message: "Invalid Referral Code", referrerName: "" });
        setReferralError("Invalid Referral Code");
        return false;
      }
    } catch (err) {
      setReferralStatus({ checking: false, valid: false, message: "Invalid Referral Code", referrerName: "" });
      setReferralError("Invalid Referral Code");
      return false;
    }
  };

  /* ---------- RETRY / EDIT REFERRAL CODE ---------- */
  const handleRetryReferral = () => {
    setReferralError("");
    setTimeout(() => {
      referralInputRef.current?.focus();
    }, 100);
  };

  /* ---------- SIGN UP WITHOUT REFERRAL CODE ---------- */
  const handleSignupWithoutReferral = async () => {
    const updatedForm = { ...form, referralCode: "" };
    setForm(updatedForm);
    setReferralError("");
    setReferralStatus({ checking: false, valid: null, message: "", referrerName: "" });
    await executeRegistration(updatedForm, "");
  };

  const executeRegistration = async (formData, refCodeToUse) => {
    const completePhone = formData.countryCode + " " + formData.phone;
    setLoading(true);
    try {
      await register({
        name: formData.name,
        email: formData.email,
        phone: completePhone,
        password: formData.password,
        referralCode: refCodeToUse !== undefined ? (refCodeToUse ? refCodeToUse.trim() : null) : (formData.referralCode?.trim() || null),
      });
    } catch (err) {
      const msg = err?.response?.data?.message || err?.response?.data?.error || "Registration failed";
      if (msg.toLowerCase().includes("referral")) {
        setReferralError("Invalid Referral Code");
      }
      showToast(msg, "error");
      setShake(true);
      setTimeout(() => setShake(false), 400);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();

    // Validation check
    const newErrors = {
      name: !form.name,
      email: !form.email,
      phone: !form.phone,
      password: !form.password,
    };

    setErrors(newErrors);

    if (!form.name || !form.email || !form.phone || !form.password) {
      showToast("All fields are required.", "warning");
      setShake(true);
      setTimeout(() => setShake(false), 400);
      return;
    }

    // Referral code verification check
    if (form.referralCode?.trim()) {
      const isValid = await checkReferral(form.referralCode.trim());
      if (!isValid) {
        showToast("Invalid Referral Code", "error");
        setShake(true);
        setTimeout(() => setShake(false), 400);
        return;
      }
    }

    await executeRegistration(form);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-600 via-purple-700 to-indigo-600">
      <Navbar />

      <div className="flex items-center justify-center px-4 py-16">
        <div
          className={`w-full max-w-md bg-white/20 backdrop-blur-xl p-10 rounded-3xl shadow-2xl border border-white/30 ${shake ? "animate-shake" : ""
            }`}
        >
          <h1 className="text-white text-3xl font-semibold text-center mb-2">
            Create Account
          </h1>
          <p className="text-white/70 text-center mb-8">
            Join our loyalty program
          </p>

          <form onSubmit={handleRegister} className="space-y-4">
            {/* Full Name */}
            <input
              type="text"
              placeholder="Full Name"
              className={`
                w-full p-3 rounded-xl bg-white/30 placeholder-white/70 text-white outline-none
                border 
                ${errors.name ? "border-red-400" : "border-white/40"}
              `}
              onChange={(e) => {
                setForm({ ...form, name: e.target.value });
                setErrors((prev) => ({ ...prev, name: false }));
              }}
            />

            {/* Email */}
            <input
              type="email"
              placeholder="Email"
              className={`
                w-full p-3 rounded-xl bg-white/30 placeholder-white/70 text-white outline-none
                border 
                ${errors.email ? "border-red-400" : "border-white/40"}
              `}
              onChange={(e) => {
                setForm({ ...form, email: e.target.value });
                setErrors((prev) => ({ ...prev, email: false }));
              }}
            />

            {/* Phone with Country Code */}
            <div className="flex gap-3">
              {/* Country Code */}
              <CustomSelect
                value={form.countryCode}
                onChange={(e) =>
                  setForm({ ...form, countryCode: e.value || e.target.value })
                }
                options={[
                  { value: "+91", label: "IN +91" },
                  { value: "+1", label: "US +1" },
                  { value: "+44", label: "GB +44" },
                  { value: "+61", label: "AU +61" },
                  { value: "+81", label: "JP +81" },
                ]}
                containerClassName="w-32 shrink-0"
                className="!bg-white/30 !text-white !border-white/40 !p-3 !rounded-xl"
              />


              {/* Phone Input */}
              <input
                type="text"
                placeholder="Phone Number"
                className={`
                  w-full p-3 rounded-xl bg-white/30 placeholder-white/70 text-white outline-none
                  border 
                  ${errors.phone ? "border-red-400" : "border-white/40"}
                `}
                onChange={(e) => {
                  setForm({ ...form, phone: e.target.value });
                  setErrors((prev) => ({ ...prev, phone: false }));
                }}
              />
            </div>

            {/* Password */}
            <input
              type="password"
              placeholder="Password"
              className={`
                w-full p-3 rounded-xl bg-white/30 placeholder-white/70 text-white outline-none
                border 
                ${errors.password ? "border-red-400" : "border-white/40"}
              `}
              onChange={(e) => {
                setForm({ ...form, password: e.target.value });
                setErrors((prev) => ({ ...prev, password: false }));
              }}
            />

            {/* Referral Code */}
            <div>
              <div className="flex items-center justify-between mb-1 px-1">
                <span className="text-white/80 text-xs font-medium">Referral Code (Optional)</span>
                {referralStatus.checking && (
                  <span className="text-white/70 text-[11px] flex items-center gap-1">
                    <Loader2 className="w-3 h-3 animate-spin" /> Verifying...
                  </span>
                )}
              </div>
              <div
                className={`
                  flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/30 text-white outline-none
                  border transition
                  ${referralError ? "border-red-400 bg-red-500/20" : referralStatus.valid ? "border-emerald-400 bg-emerald-500/20" : "border-white/40"}
                `}
              >
                <Gift className="w-4 h-4 text-white/70 shrink-0" />
                <input
                  ref={referralInputRef}
                  type="text"
                  placeholder="Invite Code (e.g. SAG8K2)"
                  value={form.referralCode}
                  className="w-full bg-transparent placeholder-white/70 text-white outline-none uppercase font-mono tracking-wider py-1.5 text-sm"
                  onChange={(e) => {
                    setForm({ ...form, referralCode: e.target.value });
                    setReferralError("");
                    setReferralStatus({ checking: false, valid: null, message: "", referrerName: "" });
                  }}
                  onBlur={() => {
                    if (form.referralCode?.trim()) checkReferral(form.referralCode.trim());
                  }}
                />
                {form.referralCode?.trim() && !referralStatus.checking && !referralError && !referralStatus.valid && (
                  <button
                    type="button"
                    onClick={() => checkReferral(form.referralCode.trim())}
                    className="text-xs font-semibold bg-white/30 hover:bg-white/40 text-white px-2 py-1 rounded-lg transition"
                  >
                    Verify
                  </button>
                )}
                {referralStatus.valid && (
                  <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0" />
                )}
              </div>
            </div>

            {/* Valid Referral Badge */}
            {referralStatus.valid && !referralError && (
              <div className="flex items-center gap-2 px-3 py-2 bg-emerald-500/20 border border-emerald-400/40 rounded-xl text-emerald-100 text-xs animate-fade-in">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
                <span>
                  Referral code applied! Referred by <strong>{referralStatus.referrerName}</strong>
                </span>
              </div>
            )}

            {/* Invalid Referral Option Card */}
            {referralError && (
              <div className="p-4 bg-red-950/40 border border-red-400/60 rounded-2xl space-y-2.5 animate-fade-in text-white shadow-lg backdrop-blur-md">
                <div className="flex items-center gap-2 text-red-200 text-xs font-bold">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                  <span>Invalid Referral Code</span>
                </div>
                <p className="text-[11px] text-red-200/90 leading-relaxed">
                  The referral code &ldquo;{form.referralCode}&rdquo; could not be found. Please check the code or continue registration without it.
                </p>
                <div className="flex flex-col sm:flex-row gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleRetryReferral}
                    className="flex-1 py-2 px-3 text-xs font-semibold rounded-xl bg-white/20 hover:bg-white/30 text-white border border-white/30 transition text-center flex items-center justify-center gap-1.5"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Retry / Edit Code
                  </button>
                  <button
                    type="button"
                    onClick={handleSignupWithoutReferral}
                    className="flex-1 py-2 px-3 text-xs font-semibold rounded-xl bg-white text-pink-700 hover:bg-white/90 transition text-center shadow-md font-bold"
                  >
                    Sign up without code
                  </button>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 mt-4 bg-white text-pink-700 font-semibold rounded-xl hover:bg-gray-100 transition disabled:opacity-60"
            >
              {loading ? "Registering..." : "Register"}
            </button>
          </form>

          <p className="text-center text-white/80 mt-6">
            Already have an account?
            <a
              href={
                new URLSearchParams(window.location.search).get("redirect")
                  ? `/login?redirect=${encodeURIComponent(
                      new URLSearchParams(window.location.search).get("redirect")
                    )}`
                  : "/login"
              }
              className="ml-1 text-white underline font-semibold"
            >
              Login
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
