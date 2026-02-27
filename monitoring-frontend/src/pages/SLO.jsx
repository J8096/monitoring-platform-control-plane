import { useEffect, useState, useMemo } from "react";
import api from "../api/api";
import MetricChart from "../components/MetricChart";

/* ============================================================
   SLO PAGE — ENTERPRISE REDESIGN
   Aesthetic: Mission-control telemetry — precision dark glass
   Fonts: Outfit (UI) + Geist Mono (data/numbers)
   All original logic + imports preserved exactly
============================================================ */

const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&family=Geist+Mono:wght@300;400;500;600&display=swap');

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

:root {
  --bg:       #050811;
  --bg2:      #080d18;
  --surface:  #0c1322;
  --surface2: #111827;
  --surface3: #182033;
  --border:   #1c2b42;
  --border2:  #243449;
  --text:     #e8edf7;
  --text2:    #7a90b4;
  --text3:    #3d5070;
  --blue:     #3b82f6;
  --cyan:     #06b6d4;
  --green:    #10b981;
  --green2:   #059669;
  --amber:    #f59e0b;
  --red:      #ef4444;
  --font:     'Outfit', sans-serif;
  --mono:     'Geist Mono', monospace;
}

.slo-root {
  font-family: var(--font);
  color: var(--text);
  background: var(--bg);
  min-height: 100%;
  padding: 32px 40px 56px;
  max-width: 1400px;
  margin: 0 auto;
}

/* ── PAGE HEADER ── */
.slo-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  margin-bottom: 32px;
  animation: fadeUp 0.3s ease both;
}
.slo-header-left {}
.slo-breadcrumb {
  display: flex; align-items: center; gap: 6px;
  font-size: 11px; color: var(--text3);
  font-family: var(--mono); letter-spacing: 0.04em; margin-bottom: 8px;
}
.slo-breadcrumb-cur { color: var(--cyan); }
.slo-title {
  font-size: 26px; font-weight: 700; letter-spacing: -0.6px;
  color: var(--text); line-height: 1; margin-bottom: 6px;
}
.slo-subtitle { font-size: 13px; color: var(--text2); font-weight: 300; }

.slo-header-right {
  display: flex; align-items: center; gap: 10px;
}
.slo-mock-badge {
  display: flex; align-items: center; gap: 6px;
  font-family: var(--mono); font-size: 11px; color: var(--amber);
  background: rgba(245,158,11,0.08); border: 1px solid rgba(245,158,11,0.2);
  padding: 5px 12px; border-radius: 20px;
}
.slo-mock-dot { width: 5px; height: 5px; border-radius: 50%; background: var(--amber); animation: blink 2s infinite; }
@keyframes blink { 0%,100% { opacity:1; } 50% { opacity:.3; } }

.slo-refresh-time {
  font-family: var(--mono); font-size: 11px; color: var(--text3);
  background: var(--surface); border: 1px solid var(--border);
  padding: 5px 12px; border-radius: 20px;
}

@keyframes fadeUp { from { opacity:0; transform: translateY(8px); } to { opacity:1; transform: none; } }

/* ── TOP STRIP: HERO + KPI CARDS ── */
.slo-top-strip {
  display: grid;
  grid-template-columns: 320px 1fr;
  gap: 20px;
  margin-bottom: 24px;
  animation: fadeUp 0.35s ease both;
  animation-delay: 0.05s;
}

/* ── SLO HERO CARD ── */
.slo-hero {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 28px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 20px;
  position: relative;
  overflow: hidden;
}
.slo-hero::before {
  content: '';
  position: absolute; inset: 0; border-radius: inherit;
  background: radial-gradient(ellipse at 50% 0%, rgba(6,182,212,0.07) 0%, transparent 65%);
  pointer-events: none;
}

.slo-ring-wrap {
  position: relative;
  width: 160px; height: 160px;
}
.slo-ring-svg { transform: rotate(-90deg); }
.slo-ring-track { fill: none; stroke: var(--surface3); stroke-width: 10; }
.slo-ring-fill {
  fill: none;
  stroke-width: 10;
  stroke-linecap: round;
  transition: stroke-dashoffset 1.2s cubic-bezier(.4,0,.2,1);
}
.slo-ring-fill.green  { stroke: var(--green); filter: drop-shadow(0 0 6px rgba(16,185,129,0.5)); }
.slo-ring-fill.amber  { stroke: var(--amber); filter: drop-shadow(0 0 6px rgba(245,158,11,0.5)); }
.slo-ring-fill.red    { stroke: var(--red);   filter: drop-shadow(0 0 6px rgba(239,68,68,0.5));   }

.slo-ring-center {
  position: absolute; inset: 0;
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  gap: 2px;
}
.slo-ring-pct {
  font-family: var(--mono); font-size: 28px; font-weight: 600;
  letter-spacing: -1px; line-height: 1;
}
.slo-ring-pct.green { color: var(--green); }
.slo-ring-pct.amber { color: var(--amber); }
.slo-ring-pct.red   { color: var(--red); }
.slo-ring-label { font-size: 11px; color: var(--text3); font-family: var(--mono); letter-spacing: 0.04em; }

.slo-hero-target {
  display: flex; flex-direction: column; align-items: center; gap: 4px;
}
.slo-hero-target-label { font-size: 11px; color: var(--text3); font-family: var(--mono); letter-spacing: 0.06em; text-transform: uppercase; }
.slo-hero-target-val {
  font-family: var(--mono); font-size: 18px; font-weight: 600;
  color: var(--cyan); letter-spacing: -0.5px;
}

.slo-hero-status {
  display: flex; align-items: center; gap: 8px;
  padding: 6px 16px; border-radius: 20px;
  font-size: 12px; font-weight: 600; font-family: var(--mono);
  letter-spacing: 0.04em; border: 1px solid transparent;
}
.slo-status-green { background: rgba(16,185,129,0.1); border-color: rgba(16,185,129,0.25); color: var(--green); }
.slo-status-amber { background: rgba(245,158,11,0.1); border-color: rgba(245,158,11,0.25); color: var(--amber); }
.slo-status-red   { background: rgba(239,68,68,0.1);  border-color: rgba(239,68,68,0.25);  color: var(--red); }
.slo-status-dot { width: 6px; height: 6px; border-radius: 50%; background: currentColor; animation: blink 2s infinite; }

/* ── KPI CARDS GRID ── */
.slo-kpi-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  grid-template-rows: repeat(2, 1fr);
  gap: 16px;
}

.slo-kpi {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 14px;
  padding: 20px 22px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 12px;
  position: relative;
  overflow: hidden;
  transition: border-color 0.2s;
  animation: fadeUp 0.3s ease both;
}
.slo-kpi::after {
  content: '';
  position: absolute; top: 0; left: 0; right: 0; height: 2px;
  border-radius: 14px 14px 0 0;
  opacity: 0.6;
}
.slo-kpi.kpi-target::after  { background: var(--cyan); }
.slo-kpi.kpi-24h::after     { background: var(--green); }
.slo-kpi.kpi-7d::after      { background: var(--blue); }
.slo-kpi.kpi-budget::after  { background: var(--amber); }

.slo-kpi-top {
  display: flex; align-items: center; justify-content: space-between;
}
.slo-kpi-icon {
  width: 32px; height: 32px; border-radius: 8px;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.slo-kpi-icon.cyan   { background: rgba(6,182,212,0.12); color: var(--cyan); }
.slo-kpi-icon.green  { background: rgba(16,185,129,0.12); color: var(--green); }
.slo-kpi-icon.blue   { background: rgba(59,130,246,0.12); color: var(--blue); }
.slo-kpi-icon.amber  { background: rgba(245,158,11,0.12); color: var(--amber); }

.slo-kpi-label {
  font-size: 11px; color: var(--text2); font-weight: 500;
  letter-spacing: 0.02em; line-height: 1;
}
.slo-kpi-val {
  font-family: var(--mono); font-size: 28px; font-weight: 600;
  letter-spacing: -1px; line-height: 1;
  color: var(--text);
}
.slo-kpi-val.cyan  { color: var(--cyan); }
.slo-kpi-val.green { color: var(--green); }
.slo-kpi-val.blue  { color: var(--blue); }
.slo-kpi-val.amber { color: var(--amber); }

.slo-kpi-sub {
  font-size: 11px; color: var(--text3);
  font-family: var(--mono); margin-top: -4px;
}

/* ── SECTION LABEL ── */
.slo-section-label {
  display: flex; align-items: center; gap: 10px;
  font-size: 10px; font-weight: 700; color: var(--text3);
  letter-spacing: 0.1em; text-transform: uppercase;
  margin-bottom: 14px; margin-top: 8px;
}
.slo-section-label::after {
  content: ''; flex: 1; height: 1px; background: var(--border);
}

/* ── UPTIME TIMELINE BAR ── */
.slo-timeline-wrap {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 14px;
  padding: 22px 24px;
  margin-bottom: 20px;
  animation: fadeUp 0.35s ease both;
  animation-delay: 0.1s;
}
.slo-timeline-header {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 16px;
}
.slo-timeline-title { font-size: 13px; font-weight: 600; color: var(--text); }
.slo-timeline-avg {
  font-family: var(--mono); font-size: 12px; color: var(--text2);
}
.slo-timeline-avg strong { color: var(--green); }

.slo-bar-track {
  display: flex; gap: 2px; height: 36px; border-radius: 8px; overflow: hidden;
  margin-bottom: 8px;
}
.slo-bar-seg {
  flex: 1; border-radius: 2px; min-width: 3px;
  cursor: pointer; transition: filter 0.15s, transform 0.15s;
  position: relative;
}
.slo-bar-seg:hover { filter: brightness(1.25); transform: scaleY(1.08); }
.slo-bar-seg.seg-green  { background: var(--green); }
.slo-bar-seg.seg-amber  { background: var(--amber); }
.slo-bar-seg.seg-red    { background: var(--red); }
.slo-bar-seg.seg-faded  { background: var(--surface3); }

.slo-bar-labels {
  display: flex; justify-content: space-between;
  font-family: var(--mono); font-size: 10px; color: var(--text3);
}

/* ── LEGEND ── */
.slo-legend {
  display: flex; align-items: center; gap: 16px; margin-top: 12px;
}
.slo-legend-item {
  display: flex; align-items: center; gap: 5px;
  font-size: 11px; color: var(--text2); font-family: var(--mono);
}
.slo-legend-dot { width: 8px; height: 8px; border-radius: 2px; }

/* ── CHART PANELS ── */
.slo-charts-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  animation: fadeUp 0.4s ease both;
  animation-delay: 0.15s;
}

.slo-chart-panel {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 14px;
  padding: 22px 24px;
  transition: border-color 0.2s;
}
.slo-chart-panel:hover { border-color: var(--border2); }

.slo-chart-header {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 6px;
}
.slo-chart-title { font-size: 13px; font-weight: 600; color: var(--text); }
.slo-chart-meta {
  font-family: var(--mono); font-size: 11px; color: var(--text3);
  background: var(--surface3); border: 1px solid var(--border);
  padding: 2px 8px; border-radius: 5px;
}
.slo-chart-sub { font-size: 12px; color: var(--text3); margin-bottom: 16px; font-family: var(--mono); }

/* ── ERROR BUDGET BAR ── */
.slo-budget-section {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 14px;
  padding: 22px 24px;
  margin-bottom: 20px;
  animation: fadeUp 0.38s ease both;
  animation-delay: 0.12s;
}
.slo-budget-header {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 16px;
}
.slo-budget-title { font-size: 13px; font-weight: 600; color: var(--text); }
.slo-budget-pct-label {
  font-family: var(--mono); font-size: 12px;
}
.slo-budget-track {
  height: 10px; background: var(--surface3); border-radius: 5px; overflow: hidden; margin-bottom: 8px;
}
.slo-budget-fill {
  height: 100%; border-radius: 5px;
  transition: width 1s cubic-bezier(.4,0,.2,1);
}
.slo-budget-fill.fill-green { background: linear-gradient(90deg, var(--green2), var(--green)); box-shadow: 0 0 12px rgba(16,185,129,0.4); }
.slo-budget-fill.fill-amber { background: linear-gradient(90deg, #d97706, var(--amber)); box-shadow: 0 0 12px rgba(245,158,11,0.4); }
.slo-budget-fill.fill-red   { background: linear-gradient(90deg, #b91c1c, var(--red));   box-shadow: 0 0 12px rgba(239,68,68,0.4);   }
.slo-budget-meta {
  display: flex; justify-content: space-between;
  font-family: var(--mono); font-size: 11px; color: var(--text3);
}

/* ── LOADING / ERROR ── */
.slo-loading {
  display: flex; align-items: center; gap: 12px;
  padding: 60px 40px; color: var(--text2); font-size: 13px;
  font-family: var(--font);
}
.slo-spinner {
  width: 18px; height: 18px;
  border: 2px solid var(--border2);
  border-top-color: var(--cyan);
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

.slo-error {
  padding: 40px; text-align: center;
  color: var(--red); font-size: 13px;
  background: rgba(239,68,68,0.05);
  border: 1px solid rgba(239,68,68,0.15);
  border-radius: 12px; margin: 20px;
  font-family: var(--mono);
}

/* ── RESPONSIVE ── */
@media (max-width: 1100px) {
  .slo-root { padding: 24px 20px 40px; }
  .slo-top-strip { grid-template-columns: 1fr; }
  .slo-kpi-grid { grid-template-columns: repeat(4, 1fr); }
  .slo-charts-grid { grid-template-columns: 1fr; }
}
@media (max-width: 720px) {
  .slo-kpi-grid { grid-template-columns: repeat(2, 1fr); }
}
`;

/* ══════════════════════════════════════════════════════════
   MAIN EXPORT — all original state + logic preserved
══════════════════════════════════════════════════════════ */
export default function SLO() {
  /* original state */
  const [uptime24h, setUptime24h] = useState([]);
  const [uptime7d, setUptime7d] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshTime, setRefreshTime] = useState(new Date());

  /* original fetch logic */
  useEffect(() => {
    let alive = true;

    async function fetchSLO() {
      try {
        const [res24h, res7d] = await Promise.all([
          api.get("/slo/uptime/24h"),
          api.get("/slo/uptime/7d"),
        ]);
        if (!alive) return;
        setUptime24h(Array.isArray(res24h.data) ? res24h.data : []);
        setUptime7d(Array.isArray(res7d.data) ? res7d.data : []);
        setRefreshTime(new Date());
      } catch {
        alive && setError("Failed to load SLO data");
      } finally {
        alive && setLoading(false);
      }
    }

    fetchSLO();
    return () => { alive = false; };
  }, []);

  /* original derived values */
  const uptimeSummary = useMemo(() => {
    const latest24h = uptime24h.at(-1)?.uptime ?? null;
    const latest7d  = uptime7d.at(-1)?.uptime ?? null;
    const target = 99.9;
    return {
      target,
      last24h:   latest24h,
      last7d:    latest7d,
      budget24h: latest24h != null ? Math.max(0, target - latest24h) : null,
      budget7d:  latest7d  != null ? Math.max(0, target - latest7d)  : null,
    };
  }, [uptime24h, uptime7d]);

  /* ── loading state ── */
  if (loading) {
    return (
      <>
        <style>{STYLES}</style>
        <div className="slo-loading">
          <div className="slo-spinner" />
          Loading SLO metrics…
        </div>
      </>
    );
  }

  /* ── error state ── */
  if (error) {
    return (
      <>
        <style>{STYLES}</style>
        <div className="slo-error">{error}</div>
      </>
    );
  }

  /* ── derived display values ── */
  const uptime7dVal  = uptimeSummary.last7d  ?? 0;
  const uptime24hVal = uptimeSummary.last24h ?? 0;
  const target       = uptimeSummary.target;

  /* ring gauge based on 7d uptime */
  const ringColor =
    uptime7dVal >= 99.9 ? "green" :
    uptime7dVal >= 99.0 ? "amber" : "red";

  const statusLabel =
    uptime7dVal >= 99.9 ? "MEETING SLO" :
    uptime7dVal >= 99.0 ? "AT RISK"     : "BREACHED";

  /* error budget consumed (%) — based on 7d */
  const errorBudgetTotal    = 100 - target;            // 0.1%
  const errorBudgetConsumed = Math.max(0, target - uptime7dVal);
  const budgetUsedPct       = errorBudgetTotal > 0
    ? Math.min(100, (errorBudgetConsumed / errorBudgetTotal) * 100)
    : 0;
  const budgetFillClass     =
    budgetUsedPct < 50 ? "fill-green" :
    budgetUsedPct < 85 ? "fill-amber" : "fill-red";

  /* segment timeline from 24h data (sample every Nth point for bar) */
  const BAR_SEGS = 60;
  const segData = (() => {
    if (!uptime24h.length) return [];
    const step = Math.max(1, Math.floor(uptime24h.length / BAR_SEGS));
    const sampled = [];
    for (let i = 0; i < uptime24h.length && sampled.length < BAR_SEGS; i += step) {
      sampled.push(uptime24h[i]);
    }
    return sampled;
  })();

  const avg24h = uptime24h.length
    ? (uptime24h.reduce((s, p) => s + p.uptime, 0) / uptime24h.length).toFixed(3)
    : null;

  const avg7d = uptime7d.length
    ? (uptime7d.reduce((s, p) => s + p.uptime, 0) / uptime7d.length).toFixed(3)
    : null;

  /* ring SVG math */
  const R = 65;
  const CIRC = 2 * Math.PI * R;
  const ringPct  = uptime7dVal / 100;
  const dashOffset = CIRC - ringPct * CIRC;

  const timeStr = refreshTime.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });

  return (
    <>
      <style>{STYLES}</style>
      <div className="slo-root">

        {/* ── HEADER ── */}
        <header className="slo-header">
          <div className="slo-header-left">
            <div className="slo-breadcrumb">
              <span>Reliability</span>
              <ChevronRight />
              <span className="slo-breadcrumb-cur">SLO</span>
            </div>
            <h1 className="slo-title">Service Level Objectives</h1>
            <p className="slo-subtitle">Reliability targets · Error budget tracking · Uptime telemetry</p>
          </div>
          <div className="slo-header-right">
            <div className="slo-mock-badge">
              <span className="slo-mock-dot" />
              Mock data
            </div>
            <div className="slo-refresh-time">Updated {timeStr}</div>
          </div>
        </header>

        {/* ── TOP STRIP ── */}
        <div className="slo-top-strip">

          {/* Hero ring card */}
          <div className="slo-hero">
            <div className="slo-ring-wrap">
              <svg
                className="slo-ring-svg"
                width="160" height="160"
                viewBox="0 0 160 160"
              >
                <circle className="slo-ring-track" cx="80" cy="80" r={R} />
                <circle
                  className={`slo-ring-fill ${ringColor}`}
                  cx="80" cy="80" r={R}
                  strokeDasharray={CIRC}
                  strokeDashoffset={dashOffset}
                />
              </svg>
              <div className="slo-ring-center">
                <span className={`slo-ring-pct ${ringColor}`}>
                  {uptime7dVal.toFixed(2)}
                  <span style={{ fontSize: 14 }}>%</span>
                </span>
                <span className="slo-ring-label">7-DAY UPTIME</span>
              </div>
            </div>

            <div className="slo-hero-target">
              <span className="slo-hero-target-label">SLO Target</span>
              <span className="slo-hero-target-val">{target}%</span>
            </div>

            <span className={`slo-hero-status slo-status-${ringColor}`}>
              <span className="slo-status-dot" />
              {statusLabel}
            </span>
          </div>

          {/* KPI cards 2x2 */}
          <div className="slo-kpi-grid">
            <KpiCard
              cls="kpi-target"
              icon={<TargetIcon />}
              iconCls="cyan"
              label="SLO Target"
              value={`${target}%`}
              valueCls="cyan"
              sub="99.9% availability threshold"
              delay="0.08s"
            />
            <KpiCard
              cls="kpi-24h"
              icon={<ClockIcon />}
              iconCls="green"
              label="Uptime — 24h"
              value={uptime24hVal.toFixed(3) + "%"}
              valueCls="green"
              sub={avg24h ? `Avg ${avg24h}% over 24 hours` : "—"}
              delay="0.11s"
            />
            <KpiCard
              cls="kpi-7d"
              icon={<CalendarIcon />}
              iconCls="blue"
              label="Uptime — 7d"
              value={uptime7dVal.toFixed(3) + "%"}
              valueCls="blue"
              sub={avg7d ? `Avg ${avg7d}% over 7 days` : "—"}
              delay="0.14s"
            />
            <KpiCard
              cls="kpi-budget"
              icon={<BudgetIcon />}
              iconCls="amber"
              label="Budget Consumed"
              value={budgetUsedPct.toFixed(1) + "%"}
              valueCls={budgetUsedPct > 85 ? "red-val" : "amber"}
              sub={`${errorBudgetConsumed.toFixed(4)}% of ${errorBudgetTotal}% budget`}
              delay="0.17s"
            />
          </div>
        </div>

        {/* ── ERROR BUDGET BAR ── */}
        <div className="slo-budget-section">
          <div className="slo-budget-header">
            <span className="slo-budget-title">Error Budget Consumption — 7 Days</span>
            <span className="slo-budget-pct-label" style={{ color: budgetUsedPct > 85 ? "var(--red)" : budgetUsedPct > 50 ? "var(--amber)" : "var(--green)" }}>
              {budgetUsedPct.toFixed(1)}% consumed
            </span>
          </div>
          <div className="slo-budget-track">
            <div
              className={`slo-budget-fill ${budgetFillClass}`}
              style={{ width: `${budgetUsedPct}%` }}
            />
          </div>
          <div className="slo-budget-meta">
            <span>0% consumed</span>
            <span>Remaining: {(100 - budgetUsedPct).toFixed(1)}%</span>
            <span>100% exhausted</span>
          </div>
        </div>

        {/* ── UPTIME SEGMENT TIMELINE ── */}
        <div className="slo-timeline-wrap">
          <div className="slo-timeline-header">
            <span className="slo-timeline-title">Uptime Timeline — Last 24 Hours</span>
            {avg24h && (
              <span className="slo-timeline-avg">
                Average: <strong>{avg24h}%</strong>
              </span>
            )}
          </div>

          <div className="slo-bar-track">
            {segData.map((pt, i) => {
              const cls =
                pt.uptime >= 99.9 ? "seg-green" :
                pt.uptime >= 99.0 ? "seg-amber" : "seg-red";
              return (
                <div
                  key={i}
                  className={`slo-bar-seg ${cls}`}
                  title={`${pt.uptime.toFixed(3)}% @ ${new Date(pt.timestamp).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false })}`}
                />
              );
            })}
            {segData.length === 0 &&
              Array.from({ length: BAR_SEGS }, (_, i) => (
                <div key={i} className="slo-bar-seg seg-faded" />
              ))
            }
          </div>

          <div className="slo-bar-labels">
            <span>24h ago</span>
            <span>12h ago</span>
            <span>Now</span>
          </div>

          <div className="slo-legend">
            <div className="slo-legend-item">
              <span className="slo-legend-dot" style={{ background: "var(--green)" }} />
              <span>≥99.9% Healthy</span>
            </div>
            <div className="slo-legend-item">
              <span className="slo-legend-dot" style={{ background: "var(--amber)" }} />
              <span>99.0–99.9% At risk</span>
            </div>
            <div className="slo-legend-item">
              <span className="slo-legend-dot" style={{ background: "var(--red)" }} />
              <span>&lt;99.0% Breached</span>
            </div>
          </div>
        </div>

        {/* ── SECTION LABEL ── */}
        <div className="slo-section-label"><span>Uptime Charts</span></div>

        {/* ── METRIC CHARTS ── */}
        <div className="slo-charts-grid">
          <div className="slo-chart-panel">
            <div className="slo-chart-header">
              <span className="slo-chart-title">Platform Uptime</span>
              <span className="slo-chart-meta">Last 24 Hours</span>
            </div>
            <div className="slo-chart-sub">{uptime24h.length} data points · 5-min intervals</div>
            <MetricChart dataKey="uptime" data={uptime24h} />
          </div>

          <div className="slo-chart-panel">
            <div className="slo-chart-header">
              <span className="slo-chart-title">Platform Uptime</span>
              <span className="slo-chart-meta">Last 7 Days</span>
            </div>
            <div className="slo-chart-sub">{uptime7d.length} data points · 60-min intervals</div>
            <MetricChart dataKey="uptime" data={uptime7d} />
          </div>
        </div>

      </div>
    </>
  );
}

/* ══════════════════════════════════════════════════════════
   KPI CARD
══════════════════════════════════════════════════════════ */
function KpiCard({ cls, icon, iconCls, label, value, valueCls, sub, delay }) {
  return (
    <div className={`slo-kpi ${cls}`} style={{ animationDelay: delay }}>
      <div className="slo-kpi-top">
        <div className={`slo-kpi-icon ${iconCls}`}>{icon}</div>
        <span className="slo-kpi-label">{label}</span>
      </div>
      <div>
        <div className={`slo-kpi-val ${valueCls || ""}`}>{value}</div>
        <div className="slo-kpi-sub">{sub}</div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   ICONS
══════════════════════════════════════════════════════════ */
const ChevronRight = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="9 18 15 12 9 6"/>
  </svg>
);
const TargetIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>
  </svg>
);
const ClockIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <circle cx="12" cy="12" r="10"/>
    <polyline points="12 6 12 12 16 14"/>
  </svg>
);
const CalendarIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <rect x="3" y="4" width="18" height="18" rx="2"/>
    <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
    <line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
);
const BudgetIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
  </svg>
);
