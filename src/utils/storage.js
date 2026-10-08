// ──────────────────────────────────────────────
// localStorage helpers for reports
// ──────────────────────────────────────────────
const KEY = "fixmydelhi_reports";

export function loadReports() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}

export function saveReport(report) {
  const reports = loadReports();
  reports.unshift(report); // newest first
  localStorage.setItem(KEY, JSON.stringify(reports));
  return reports;
}

// Returns the first existing report with the same label+area from the last 7 days, or null.
export function findDuplicateReport(label, areaName) {
  const reports = loadReports();
  const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
  return (
    reports.find((r) => {
      const ts = new Date(r.dateTime).getTime();
      return (
        (r.finalLabel || r.label) === label &&
        r.areaName === areaName &&
        ts >= cutoff
      );
    }) || null
  );
}

export function updateReportStatus(id, status) {
  const reports = loadReports();
  const idx = reports.findIndex((r) => r.id === id);
  if (idx !== -1) {
    reports[idx].status = status;
    localStorage.setItem(KEY, JSON.stringify(reports));
  }
  return reports;
}
