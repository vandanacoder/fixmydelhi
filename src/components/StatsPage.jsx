import React, { useEffect, useState } from "react";
import { loadReports } from "../utils/storage";
import { ISSUE_COLORS, ISSUE_LABELS } from "../config";

const STATUS_COLORS = {
  "Open":        "#FF5A5F",
  "Followed up": "#FFB020",
  "Resolved":    "#34D399",
};

// Stats only counts the 4 civic-issue classes — "Other" is excluded.
const ALL_ISSUES   = ISSUE_LABELS; // ["Garbage dump","Normal road","Pothole","Waterlogging"]
const ALL_STATUSES = ["Open", "Followed up", "Resolved"];

function Bar({ value, max, color }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="stats-bar-track">
      <div className="stats-bar-fill" style={{ width: `${pct}%`, background: color }} />
    </div>
  );
}

export default function StatsPage() {
  const [reports, setReports] = useState([]);

  useEffect(() => {
    setReports(loadReports());
  }, []);

  const total    = reports.length;
  const resolved = reports.filter((r) => r.status === "Resolved").length;
  const resolvedPct = total > 0 ? Math.round((resolved / total) * 100) : 0;
  const open     = reports.filter((r) => r.status === "Open").length;
  const followed = reports.filter((r) => r.status === "Followed up").length;

  // AI correction tracking — only reports where user changed the AI's class
  const correctionMap = {}; // "aiLabel → finalLabel" => count
  let correctionCount = 0;
  reports.forEach((r) => {
    const ai    = r.aiLabel;
    const final = r.finalLabel;
    if (ai && final && ai !== final) {
      correctionCount++;
      const key = `${ai} → ${final}`;
      correctionMap[key] = (correctionMap[key] || 0) + 1;
    }
  });
  const correctionEntries = Object.entries(correctionMap).sort((a, b) => b[1] - a[1]);

  // Counts by issue type (use finalLabel if present, else label)
  const byIssue = {};
  ALL_ISSUES.forEach((k) => (byIssue[k] = 0));
  reports.forEach((r) => {
    const key = r.finalLabel || r.label;
    if (key in byIssue) byIssue[key]++;
  });
  const maxIssue = Math.max(...Object.values(byIssue), 1);

  // Counts by status
  const byStatus = { Open: open, "Followed up": followed, Resolved: resolved };

  return (
    <div className="page-content">
      <h1 className="page-title">Statistics</h1>
      <p className="page-subtitle">All reports saved on this device.</p>

      {/* Top stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{total}</div>
          <div className="stat-label">Total reports</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{open}</div>
          <div className="stat-label">Open</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{followed}</div>
          <div className="stat-label">Followed up</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{resolvedPct}%</div>
          <div className="stat-label">Resolved</div>
        </div>
      </div>

      {/* By issue type */}
      <div className="stats-section-title">By issue type</div>
      <div className="stats-bar-list">
        {ALL_ISSUES.map((issue) => (
          <div key={issue} className="stats-bar-row">
            <span className="stats-bar-label">{issue}</span>
            <Bar value={byIssue[issue]} max={maxIssue} color={ISSUE_COLORS[issue]} />
            <span className="stats-bar-num">{byIssue[issue]}</span>
          </div>
        ))}
      </div>

      {/* By status */}
      <div className="stats-section-title">By status</div>
      <div className="stats-bar-list">
        {ALL_STATUSES.map((s) => (
          <div key={s} className="stats-bar-row">
            <span className="stats-bar-label">{s}</span>
            <Bar value={byStatus[s]} max={total || 1} color={STATUS_COLORS[s]} />
            <span className="stats-bar-num">{byStatus[s]}</span>
          </div>
        ))}
      </div>

      {/* AI Corrections */}
      <div className="stats-section-title">AI corrections</div>
      <div className="stat-card" style={{ marginBottom: 12 }}>
        <div className="stat-value">{correctionCount}</div>
        <div className="stat-label">Times you changed the AI&apos;s label</div>
      </div>
      {correctionEntries.length > 0 ? (
        <div className="stats-bar-list">
          {correctionEntries.map(([pair, count]) => (
            <div key={pair} className="stats-bar-row">
              <span className="stats-bar-label">{pair}</span>
              <Bar value={count} max={correctionCount} color="var(--c-other)" />
              <span className="stats-bar-num">{count}</span>
            </div>
          ))}
        </div>
      ) : (
        <p className="muted" style={{ fontSize: 13, marginBottom: 16 }}>
          No corrections yet — the AI got everything right (or no reports filed).
        </p>
      )}

      {total === 0 && (
        <p className="muted" style={{ marginTop: 20 }}>
          No reports yet — file one from the Home page.
        </p>
      )}
    </div>
  );
}
