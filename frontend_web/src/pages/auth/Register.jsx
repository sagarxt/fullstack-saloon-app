import { useContext, useState } from "react";
import { AuthContext } from "../../auth/AuthContext";
import Navbar from "../../components/Navbar";
import { useToast } from "../../components/Toast";

export default function Register() {
  const { register } = useContext(AuthContext);
  const { showToast } = useToast();

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    countryCode: "+91",
  });

  // Validation errors
  const [errors, setErrors] = useState({
    name: false,
    email: false,
    phone: false,
    password: false,
  });

  const [shake, setShake] = useState(false);

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

    // Combine country code + phone
    const completePhone = form.countryCode + " " + form.phone;

    try {
      await register({
        ...form,
        phone: completePhone,
      });
    } catch (err) {
      showToast(
        err?.response?.data?.error || "Registration failed",
        "error"
      );

      setShake(true);
      setTimeout(() => setShake(false), 400);
    }
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
              <select
                className="
    w-32 p-3 rounded-xl
    bg-white/30 text-white
    border border-white/40 outline-none
    appearance-none
    focus:border-white
    cursor-pointer
  "
                value={form.countryCode}
                onChange={(e) =>
                  setForm({ ...form, countryCode: e.target.value })
                }
              >
                <option className="text-black" value="+91">IN +91</option>
                <option className="text-black" value="+1">US +1</option>
                <option className="text-black" value="+44">GB +44</option>
                <option className="text-black" value="+61">AU +61</option>
                <option className="text-black" value="+81">JP +81</option>
              </select>


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

            <button
              type="submit"
              className="w-full py-3 mt-4 bg-white text-pink-700 font-semibold rounded-xl hover:bg-gray-100 transition"
            >
              Register
            </button>
          </form>

          <p className="text-center text-white/80 mt-6">
            Already have an account?
            <a href="/login" className="ml-1 text-white underline font-semibold">
              Login
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
