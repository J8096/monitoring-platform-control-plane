export default function TimeRangeSelector({ value, onChange }) {
  const ranges = ["5m", "1h", "24h"];

  return (
    <div className="flex gap-1 rounded bg-slate-900 p-1">
      {ranges.map((r) => (
        <button
          key={r}
          onClick={() => onChange(r)}
          className={`
            px-3 py-1 text-xs rounded
            ${value === r
              ? "bg-slate-700 text-white"
              : "text-slate-400 hover:bg-slate-800"}
          `}
        >
          {r}
        </button>
      ))}
    </div>
  );
}
