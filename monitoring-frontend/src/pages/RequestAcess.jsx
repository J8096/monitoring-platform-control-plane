import { useNavigate, Link } from "react-router-dom";

export default function RequestAccess() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-6">
      <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white px-10 py-12 text-center">
        <h1 className="text-xl font-semibold text-slate-900">
          Access required
        </h1>

        <p className="mt-3 text-sm leading-relaxed text-slate-500">
          This platform is managed by organizations.  
          You can create an account, but access may require administrator approval.
        </p>

        <div className="mt-8 flex flex-col gap-3">
          {/* PRIMARY ACTION */}
          <Link
            to="/signup"
            className="rounded-md bg-slate-900 py-2.5 text-sm font-medium text-white hover:bg-slate-800"
          >
            Create account
          </Link>

          {/* SECONDARY ACTION */}
          <button
            onClick={() => navigate("/login")}
            className="text-sm font-medium text-slate-600 hover:underline"
          >
            Back to sign in
          </button>
        </div>
      </div>
    </div>
  );
}
