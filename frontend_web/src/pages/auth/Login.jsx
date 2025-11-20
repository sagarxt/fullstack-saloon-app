import { useContext, useState } from "react";
import { AuthContext } from "../../auth/AuthContext";
import Navbar from "../../components/Navbar";
import { useToast } from "../../components/Toast";

export default function Login() {
  const { login } = useContext(AuthContext);
  const { showToast } = useToast();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Field validation + shake
  const [errors, setErrors] = useState({
    email: false,
    password: false,
  });

  const [shake, setShake] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();

    // Validation
    const newErrors = {
      email: !email,
      password: !password,
    };

    setErrors(newErrors);

    if (!email || !password) {
      showToast("Please fill all required fields.", "warning");

      setShake(true);
      setTimeout(() => setShake(false), 400);
      return;
    }

    try {
      await login(email, password);
    } catch (err) {
      showToast(
        err?.response?.data?.error || "Invalid email or password",
        "error"
      );

      setShake(true);
      setTimeout(() => setShake(false), 400);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500">
      <Navbar />

      <div className="flex items-center justify-center px-4 py-16">
        <div
          className={`w-full max-w-md bg-white/20 backdrop-blur-xl p-10 rounded-3xl shadow-2xl border border-white/30 ${
            shake ? "animate-shake" : ""
          }`}
        >
          <h1 className="text-white text-3xl font-semibold text-center mb-2">
            Welcome Back
          </h1>

          <p className="text-white/70 text-center mb-8">Login to continue</p>

          <form onSubmit={handleLogin} className="space-y-4">
            {/* Email Input */}
            <input
              type="email"
              placeholder="Email"
              className={`
                w-full p-3 rounded-xl bg-white/30 placeholder-white/70 text-white outline-none 
                border 
                ${errors.email ? "border-red-400" : "border-white/40"} 
              `}
              onChange={(e) => {
                setEmail(e.target.value);
                setErrors((prev) => ({ ...prev, email: false }));
              }}
            />

            {/* Password Input */}
            <input
              type="password"
              placeholder="Password"
              className={`
                w-full p-3 rounded-xl bg-white/30 placeholder-white/70 text-white outline-none 
                border 
                ${errors.password ? "border-red-400" : "border-white/40"} 
              `}
              onChange={(e) => {
                setPassword(e.target.value);
                setErrors((prev) => ({ ...prev, password: false }));
              }}
            />

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full py-3 mt-4 bg-white text-indigo-700 font-semibold rounded-xl hover:bg-gray-100 transition"
            >
              Login
            </button>
          </form>

          {/* Register Link */}
          <p className="text-center text-white/80 mt-6">
            Don’t have an account?
            <a
              href="/register"
              className="ml-1 text-white underline font-semibold"
            >
              Register
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
