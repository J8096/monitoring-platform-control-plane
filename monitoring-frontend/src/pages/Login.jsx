import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";


export default function Login() {
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
      await api.post("/auth/login", { email, password });
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-[1.1fr_1fr] bg-slate-50">
      {/* LEFT ENTERPRISE PANEL */}
      <div className="relative hidden lg:flex flex-col justify-between overflow-hidden bg-slate-950 px-16 py-14 text-slate-100">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-950 to-black opacity-90" />
        <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-slate-800/20 blur-3xl" />

        <div className="relative z-10">
          <div className="text-xs uppercase tracking-widest text-slate-400">
            Organization Platform
          </div>

          {/* LOGO + BRAND */}
          <div className="mt-4 flex items-center gap-3">
            <div className="relative flex h-9 w-9 items-center justify-center rounded-lg bg-slate-800 ring-1 ring-slate-700">
              <div className="h-4 w-4 rounded-sm bg-slate-400/80" />
            </div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Monitoring Platform
            </h1>
          </div>

          <p className="mt-6 max-w-md text-[15px] leading-relaxed text-slate-400">
            Centralized observability, agent orchestration, and real-time
            infrastructure insights designed for production environments.
          </p>

          <div className="my-12 h-px w-24 bg-slate-700" />

          <ul className="space-y-3 text-sm text-slate-300">
            <li>• Secure agent connectivity</li>
            <li>• Real-time health & metrics</li>
            <li>• Role-based access control</li>
            <li>• Enterprise authentication</li>
          </ul>
        </div>

        <div className="relative z-10 text-xs text-slate-500">
          © {new Date().getFullYear()} Monitoring Platform · All rights reserved
        </div>
      </div>

      {/* RIGHT AUTH PANEL */}
      <div className="flex items-center justify-center px-6">
        <form
          onSubmit={handleSubmit}
          className="w-full max-w-md rounded-xl border border-slate-200 bg-white px-12 py-14 transition-all duration-200 hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)]"
        >
          <div className="mb-12">
            <div className="text-xs uppercase tracking-widest text-slate-400">
              Secure access
            </div>
            <h2 className="mt-2 text-[26px] font-semibold tracking-tight text-slate-900">
              Sign in
            </h2>
            <p className="mt-2 text-[15px] leading-relaxed text-slate-500">
              Authenticate to access your organization dashboard
            </p>
          </div>

          {error && (
            <div className="mb-6 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="mb-7">
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Organization email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-md border border-slate-300 bg-slate-50 px-4 py-3 text-sm focus:bg-white focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
            />
          </div>

          <div className="mb-10">
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full rounded-md border border-slate-300 bg-slate-50 px-4 py-3 text-sm focus:bg-white focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-gradient-to-b from-slate-900 to-slate-800 py-3 text-sm font-medium text-white transition hover:from-slate-800 hover:to-slate-700 disabled:opacity-70"
          >
            {loading ? "Authenticating…" : "Sign in"}
          </button>

          <p className="mt-5 text-center text-xs text-slate-500">
            Protected by HTTP-only cookies · SSO & MFA supported
          </p>

          {/* ENTERPRISE-CORRECT CTA */}
          <div className="mt-10 text-center text-sm text-slate-500">
            New to the platform?{" "}
            <button
              type="button"
              onClick={() => navigate("/request-access")}
              className="font-medium text-slate-900 hover:underline"
            >
              Request access
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
