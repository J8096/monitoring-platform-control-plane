import { useOutletContext } from "react-router-dom";
import AlertTable from "../components/AlertTable";

export default function DashboardHome() {
  const { activeAgent } = useOutletContext();

  return (
    <div className="min-h-full p-6 space-y-6">
      {/* ===== SYSTEM ALERTS ===== */}
      <section className="bg-slate-900/60 border border-slate-800 rounded-xl p-6">
        <h2 className="text-sm font-medium text-slate-300 mb-4">
          System Alerts
        </h2>

        <div className="text-slate-400 text-sm">
          No alerts to display
        </div>
      </section>

      {/* ===== METRICS GRID ===== */}
      <section className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <MetricCard
          title="CPU Usage"
          value={activeAgent ? "42%" : "—"}
        />
        <MetricCard
          title="Memory Usage"
          value={activeAgent ? "66%" : "—"}
        />
      </section>
    </div>
  );
}

function MetricCard({ title, value }) {
  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6">
      <p className="text-sm text-slate-400">{title}</p>
      <p className="mt-2 text-3xl font-semibold text-emerald-400">
        {value}
      </p>
    </div>
  );
}
