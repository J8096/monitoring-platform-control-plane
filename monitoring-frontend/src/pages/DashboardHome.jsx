import AlertTable from "../components/AlertTable";

export default function DashboardHome({ alerts, loading }) {
  return (
    <>
      <div className="px-4 py-2 text-xs uppercase text-slate-400 border-b border-slate-800">
        Alerts
      </div>
      <div className="p-4">
        {loading && alerts.length === 0 ? (
          <div className="text-sm text-slate-400">Loading…</div>
        ) : (
          <AlertTable alerts={alerts} />
        )}
      </div>
    </>
  );
}
