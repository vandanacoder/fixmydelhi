import React, { useState, useEffect } from "react";
import { loadReports, updateReportStatus } from "../utils/storage";
import { useToast } from "../utils/useToast";
import { MapPin, Clock, Building2 } from "lucide-react";

const STATUSES = ["Open", "Followed up", "Resolved"];

const STATUS_COLORS = {
  "Open":        { bg: "rgba(255,90,95,0.15)",  text: "#FF5A5F",  border: "rgba(255,90,95,0.3)"  },
  "Followed up": { bg: "rgba(255,176,32,0.15)", text: "#FFB020",  border: "rgba(255,176,32,0.3)" },
  "Resolved":    { bg: "rgba(52,211,153,0.15)", text: "#34D399",  border: "rgba(52,211,153,0.3)" },
};

const ISSUE_STRIPE = {
  "Garbage dump": "var(--c-garbage)",
  "Pothole":      "var(--c-pothole)",
  "Waterlogging": "var(--c-water)",
  "Normal road":  "var(--c-normal)",
};

function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Kolkata",
  });
}

function daysUntil(iso) {
  if (!iso) return null;
  return Math.ceil((new Date(iso) - Date.now()) / (1000 * 60 * 60 * 24));
}

// Progress dots: 7 dots for 7-day follow-up window
function FollowupDots({ followUpDate, status }) {
  const created = followUpDate
    ? new Date(new Date(followUpDate).getTime() - 7 * 24 * 60 * 60 * 1000)
    : null;
  const days = daysUntil(followUpDate);
  const total = 7;
  // How many days have passed since creation
  const elapsed = created
    ? Math.min(total, Math.max(0, Math.ceil((Date.now() - created) / (1000 * 60 * 60 * 24))))
    : 0;
  const overdue = days !== null && days < 0;

  return (
    <div className="followup-row">
      <div className="followup-dots">
        {Array.from({ length: total }).map((_, i) => (
          <span
            key={i}
            className={`followup-dot${i < elapsed ? (overdue ? " overdue" : " filled") : ""}`}
          />
        ))}
      </div>
      <span style={{ fontSize: "11px" }}>
        {overdue
          ? `Follow-up overdue by ${Math.abs(days)} day${Math.abs(days) !== 1 ? "s" : ""}`
          : days === 0
          ? "Follow-up due today"
          : `Follow-up in ${days} day${days !== 1 ? "s" : ""}`}
      </span>
    </div>
  );
}

export default function ReportsPage() {
  const [reports, setReports] = useState([]);
  const { toasts, showToast } = useToast();

  useEffect(() => {
    setReports(loadReports());
  }, []);

  const handleStatusChange = (id, status) => {
    const updated = updateReportStatus(id, status);
    setReports([...updated]);
    showToast(`Status updated to "${status}"`, "ok");
  };

  return (
    <div className="page-content">
      {/* Toast container */}
      <div className="toast-container">
        {toasts.map((t) => (
          <div key={t.id} className={`toast ${t.type} ${t.exiting ? "toast-exit" : ""}`}>
            {t.message}
          </div>
        ))}
      </div>

      <h1 className="page-title">My Reports</h1>

      {reports.length === 0 ? (
        <p className="muted" style={{ marginTop: 12 }}>
          No reports yet. Go to Home to file one.
        </p>
      ) : (
        <>
          <p className="muted">
            {reports.length} report{reports.length !== 1 ? "s" : ""} saved on this device.
          </p>

          <div className="report-list">
            {reports.map((r) => {
              const sc = STATUS_COLORS[r.status] || STATUS_COLORS["Open"];
              return (
                <div key={r.id} className="report-card">
                  {/* Coloured left stripe */}
                  <div
                    className="report-stripe"
                    style={{ background: ISSUE_STRIPE[r.label] || "var(--muted)" }}
                  />

                  <div className="report-inner">
                    <div className="report-card-header">
                      <span className="report-label">{r.label}</span>
                      <span
                        className="status-pill"
                        style={{ background: sc.bg, color: sc.text, border: `1px solid ${sc.border}` }}
                      >
                        {r.status}
                      </span>
                    </div>

                    <div className="report-meta">
                      <span className="report-meta-item">
                        <MapPin size={12} />
                        {r.areaName}{r.landmark ? `, ${r.landmark}` : ""}
                      </span>
                      <span className="report-meta-item">
                        <Clock size={12} />
                        {formatDate(r.dateTime)}
                      </span>
                      <span className="report-meta-item">
                        <Building2 size={12} />
                        {r.dept}
                      </span>
                    </div>

                    {r.followUpDate && r.status !== "Resolved" && (
                      <FollowupDots followUpDate={r.followUpDate} status={r.status} />
                    )}

                    <div className="status-selector">
                      <span className="status-selector-label">Status:</span>
                      {STATUSES.map((s) => {
                        const c = STATUS_COLORS[s];
                        return (
                          <button
                            key={s}
                            className={`status-btn${r.status === s ? " active" : ""}`}
                            style={
                              r.status === s
                                ? { background: c.bg, color: c.text, borderColor: c.border }
                                : {}
                            }
                            onClick={() => handleStatusChange(r.id, s)}
                          >
                            {s}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
