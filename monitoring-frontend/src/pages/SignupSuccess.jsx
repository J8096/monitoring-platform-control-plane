import { Link } from "react-router-dom";

export default function SignupSuccess() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-6">
      <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white px-10 py-12 text-center">
        <h1 className="text-xl font-semibold text-slate-900">
          Account created
        </h1>
        <p className="mt-3 text-sm text-slate-500">
          Your account has been created and may require administrator approval
          before you can sign in.
        </p>

        <Link
          to="/login"
          className="mt-8 inline-block rounded-md bg-slate-900 px-6 py-2.5 text-sm font-medium text-white hover:bg-slate-800"
        >
          Go to sign in
        </Link>
      </div>
    </div>
  );
}
