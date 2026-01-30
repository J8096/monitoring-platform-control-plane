import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api/api";

export default function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await api.post("/auth/signup", { email, password });

      // ✅ Model-2 correct behavior
      navigate("/signup-success");
    } catch (err) {
      setError(err.response?.data?.message || "Signup failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-6">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md rounded-xl border border-slate-200 bg-white px-10 py-12"
      >
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-xl font-semibold text-slate-900">
            Create account
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Your account may require administrator approval before you can sign in.
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Email */}
        <div className="mb-6">
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Work email
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@company.com"
            className="w-full rounded-md border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
          />
        </div>

        {/* Password */}
        <div className="mb-8">
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Password
          </label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full rounded-md border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
          />
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-slate-900 py-3 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {loading ? "Creating account…" : "Create account"}
        </button>

        {/* Footer */}
        <p className="mt-8 text-center text-sm text-slate-500">
          Already have an account?{" "}
          <Link
            to="/login"
            className="font-medium text-slate-900 hover:underline"
          >
            Sign in
          </Link>
        </p>
      </form>
    </div>
  );
}
