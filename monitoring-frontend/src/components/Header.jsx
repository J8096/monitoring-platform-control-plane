import { Activity, LogOut, User, Shield } from "lucide-react";

/**
 * ENTERPRISE HEADER — POLISHED & PROFESSIONAL
 *
 * ✔ Clean branding
 * ✔ Status indicators with icons
 * ✔ User profile with role
 * ✔ Logout action
 * ✔ Perfect spacing and alignment
 */

export default function Header({ user, loading, onLogout }) {
  return (
    <header className="h-14 border-b border-slate-800 bg-slate-900/95 backdrop-blur-sm">
      <div className="h-full px-6 flex items-center justify-between">
        {/* ================= LEFT: BRANDING ================= */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-sm font-semibold text-slate-100">
                Monitoring Platform
              </div>
              <div className="text-[10px] text-slate-500 uppercase tracking-wider">
                Infrastructure observability
              </div>
            </div>
          </div>
        </div>

        {/* ================= RIGHT: USER & STATUS ================= */}
        <div className="flex items-center gap-4">
          {/* LIVE STATUS */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/50 border border-slate-700">
            <div className="relative flex items-center justify-center">
              <span className="flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
            </div>
            <span className="text-xs font-medium text-emerald-400">Live</span>
          </div>

          {/* ENV BADGE */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-800 border border-slate-700">
            <Shield className="w-3 h-3 text-slate-400" />
            <span className="text-[10px] font-bold tracking-wider text-slate-300">
              PROD
            </span>
          </div>

          {/* USER */}
          {!loading && user && (
            <div className="flex items-center gap-3 pl-3 border-l border-slate-700">
              <div className="text-right">
                <div className="text-xs font-medium text-slate-200">
                  {user.email || "Admin"}
                </div>
                <div className="text-[10px] text-slate-500 uppercase">
                  {user.role || "Admin"}
                </div>
              </div>

              <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center">
                <User className="w-4 h-4 text-slate-400" />
              </div>

              <button
                onClick={onLogout}
                className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-red-400 transition-all duration-200"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
