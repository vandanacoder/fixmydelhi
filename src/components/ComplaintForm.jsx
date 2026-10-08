import React, { useState, useEffect } from "react";
import {
  DELHI_AREAS,
  DEPARTMENTS,
  TEST_EMAIL,
  WEBHOOK_URL,
  CONFIDENCE_THRESHOLD,
} from "../config";
import { buildComplaintText, buildComplaintTextHindi } from "../utils/complaint";
import { saveReport, findDuplicateReport } from "../utils/storage";
import { useToast } from "../utils/useToast";
import {
  Send,
  Copy,
  MapPin,
  Building2,
  Mail,
  Lock,
  LocateFixed,
  MessageCircle,
  FlaskConical,
} from "lucide-react";

function formatDateTime(date) {
  return date.toLocaleString("en-IN", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "Asia/Kolkata",
  });
}

export default function ComplaintForm({ label, aiLabel, finalLabel, confidence, onReportSaved }) {
  // Prefer finalLabel (user-corrected) → label → fallback
  const activeLabel = finalLabel || label;

  const [areaIdx, setAreaIdx] = useState(0);
  const [landmark, setLandmark] = useState("");
  const [lang, setLang] = useState("en"); // "en" | "hi"
  const [complaintText, setComplaintText] = useState("");
  const [webhookStatus, setWebhookStatus] = useState(null);
  const [geoState, setGeoState] = useState("idle"); // idle | loading | ok | error
  const [exactCoords, setExactCoords] = useState(null); // [lat, lng] from browser
  const [dupDialogOpen, setDupDialogOpen] = useState(false);
  const [pendingReport, setPendingReport] = useState(null);
  const { toasts, showToast } = useToast();

  // "Other" (non-road) and "Normal road" are not reportable
  const isActionable =
    activeLabel &&
    activeLabel !== "Normal road" &&
    activeLabel !== "Other" &&
    confidence >= CONFIDENCE_THRESHOLD;

  const area = DELHI_AREAS[areaIdx];
  const areaName = area[0];
  const dept = DEPARTMENTS[activeLabel] || {};
  const now = new Date();

  // Rebuild complaint text whenever inputs change
  useEffect(() => {
    if (!isActionable) return;
    const args = {
      label: activeLabel,
      areaName,
      landmark: landmark.trim(),
      confidence,
      dateTime: formatDateTime(now),
    };
    setComplaintText(
      lang === "hi" ? buildComplaintTextHindi(args) : buildComplaintText(args)
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeLabel, areaIdx, landmark, confidence, isActionable, lang]);

  if (!activeLabel) return null;
  if (activeLabel === "Normal road") return null;
  if (!isActionable) return null;

  // ── Geolocation ──────────────────────────────
  const handleGeolocate = () => {
    if (!navigator.geolocation) {
      setGeoState("error");
      return;
    }
    setGeoState("loading");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setExactCoords([pos.coords.latitude, pos.coords.longitude]);
        setGeoState("ok");
        showToast("Location acquired", "ok");
      },
      () => {
        setGeoState("error");
        showToast("Location access denied — using area dropdown", "");
      },
      { timeout: 10000 }
    );
  };

  // ── WhatsApp share ───────────────────────────
  const handleWhatsApp = () => {
    const msg = encodeURIComponent(
      `*FixMyDelhi Report*\n\n` + complaintText.slice(0, 1000)
    );
    window.open(`https://wa.me/?text=${msg}`, "_blank", "noopener");
  };

  // ── Copy ─────────────────────────────────────
  const handleCopy = () => {
    navigator.clipboard.writeText(complaintText).then(() => {
      showToast("Complaint copied to clipboard", "ok");
    });
  };

  // ── Mailto — always to TEST_EMAIL only ───────
  const buildMailto = () => {
    const subject = encodeURIComponent(
      `[FixMyDelhi Demo] Civic Issue: ${activeLabel} at ${areaName}, Delhi`
    );
    const body = encodeURIComponent(complaintText);
    return `mailto:${TEST_EMAIL}?subject=${subject}&body=${body}`;
  };

  // ── Webhook ──────────────────────────────────
  const postWebhook = async (reportData) => {
    if (!WEBHOOK_URL) return;
    setWebhookStatus("sending");
    try {
      await fetch(WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(reportData),
      });
      setWebhookStatus("ok");
      showToast("Webhook delivered", "ok");
    } catch {
      setWebhookStatus("fail");
      showToast("Webhook delivery failed", "error");
    }
  };

  // ── Build report object ──────────────────────
  const buildReport = () => {
    const followUpDate = new Date(now);
    followUpDate.setDate(followUpDate.getDate() + 7);
    const coords = exactCoords || [area[1], area[2]];
    return {
      id: Date.now().toString(),
      label:      activeLabel,
      aiLabel:    aiLabel    || activeLabel,
      finalLabel: finalLabel || activeLabel,
      areaName,
      areaCoords: coords,
      landmark: landmark.trim(),
      confidence,
      dateTime: now.toISOString(),
      followUpDate: followUpDate.toISOString(),
      status: "Open",
      complaintText,
      dept: dept.name || "",
      deptEmail: dept.email || "",
    };
  };

  // ── Commit save + mailto ─────────────────────
  const commitSend = (report) => {
    saveReport(report);
    if (onReportSaved) onReportSaved(report);
    showToast("Report saved!", "ok");
    window.location.href = buildMailto();
    postWebhook(report);
  };

  // ── Demo send (with duplicate check) ─────────
  const handleSend = () => {
    const report = buildReport();
    const dup = findDuplicateReport(activeLabel, areaName);
    if (dup) {
      setPendingReport(report);
      setDupDialogOpen(true);
    } else {
      commitSend(report);
    }
  };

  return (
    <>
      {/* Toast container */}
      <div className="toast-container">
        {toasts.map((t) => (
          <div key={t.id} className={`toast ${t.type} ${t.exiting ? "toast-exit" : ""}`}>
            {t.message}
          </div>
        ))}
      </div>

      {/* Duplicate-report dialog */}
      {dupDialogOpen && (
        <div className="dup-overlay">
          <div className="dup-dialog">
            <div className="dup-dialog-title">A similar report already exists</div>
            <p className="dup-dialog-body">
              A <strong>{activeLabel}</strong> report for <strong>{areaName}</strong> was filed
              within the last 7 days. Save a new one anyway?
            </p>
            <div className="dup-dialog-btns">
              <button
                className="btn btn-ghost"
                onClick={() => { setDupDialogOpen(false); setPendingReport(null); }}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={() => {
                  setDupDialogOpen(false);
                  commitSend(pendingReport);
                  setPendingReport(null);
                }}
              >
                Save anyway
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="complaint-card">
        {/* Demo mode badge */}
        <div className="demo-badge">
          <FlaskConical size={12} />
          Demo mode
        </div>

        {/* Email-preview header */}
        <div className="complaint-card-header">
          <Mail size={14} />
          <span><span className="to-label">To: </span>{TEST_EMAIL}</span>
          <span style={{ marginLeft: "auto", opacity: 0.5 }}>Draft</span>
        </div>

        <div className="complaint-card-body">
          {/* Lang toggle */}
          <div className="lang-toggle">
            <button
              className={`lang-btn${lang === "en" ? " active" : ""}`}
              onClick={() => setLang("en")}
            >
              EN
            </button>
            <button
              className={`lang-btn${lang === "hi" ? " active" : ""}`}
              onClick={() => setLang("hi")}
            >
              हिं
            </button>
          </div>

          {/* Geolocation */}
          <div className="geo-row">
            <button
              className="btn btn-secondary"
              style={{ padding: "7px 14px", fontSize: "13px" }}
              onClick={handleGeolocate}
              disabled={geoState === "loading"}
            >
              <LocateFixed size={13} />
              {geoState === "loading" ? "Locating…" : "Use my location"}
            </button>
            {geoState === "ok" && (
              <span className="geo-status ok">
                <MapPin size={11} /> GPS acquired
              </span>
            )}
            {geoState === "error" && (
              <span className="geo-status error">Using area dropdown</span>
            )}
          </div>

          {/* Area dropdown (always shown; GPS overrides coords but keeps label for complaint text) */}
          <div className="form-row">
            <label className="form-label" htmlFor="area-select">
              <MapPin size={11} style={{ verticalAlign: "middle", marginRight: 4 }} />
              Delhi area
            </label>
            <select
              id="area-select"
              value={areaIdx}
              onChange={(e) => { setAreaIdx(Number(e.target.value)); setExactCoords(null); setGeoState("idle"); }}
              className="select"
            >
              {DELHI_AREAS.map(([name], i) => (
                <option key={name} value={i}>{name}</option>
              ))}
            </select>
          </div>

          <div className="form-row">
            <label className="form-label" htmlFor="landmark">
              Landmark / extra info (optional)
            </label>
            <input
              id="landmark"
              type="text"
              placeholder="e.g. near metro gate 2"
              value={landmark}
              onChange={(e) => setLandmark(e.target.value)}
              className="text-input"
            />
          </div>

          <div className="dept-row">
            <Building2 size={14} style={{ flexShrink: 0, marginTop: 2 }} />
            <div>
              <strong>{dept.name}</strong>
              <br />{dept.email}
            </div>
          </div>

          <div className="form-row">
            <label className="form-label">Complaint text</label>
            <textarea
              className="complaint-textarea"
              value={complaintText}
              onChange={(e) => setComplaintText(e.target.value)}
              rows={14}
            />
          </div>

          {/* Demo disclaimer note */}
          <div className="demo-note">
            Demo only. Nothing is sent to any real authority. Complaints go only to the
            developer&apos;s own inbox.
          </div>

          <div className="btn-row">
            <button className="btn btn-ghost" onClick={handleCopy}>
              <Copy size={14} /> Copy
            </button>
            <button
              className="btn btn-secondary"
              onClick={handleWhatsApp}
              title="Share on WhatsApp"
            >
              <MessageCircle size={14} /> WhatsApp
            </button>
            <button className="btn btn-primary" onClick={handleSend}>
              <Send size={14} /> Demo send
            </button>
          </div>

          <div className="privacy-note">
            <Lock size={12} style={{ flexShrink: 0, marginTop: 2 }} />
            The photo is <strong style={{ color: "var(--text)" }}>never stored or uploaded</strong>.
            Complaints go only to the developer&apos;s own inbox.
          </div>
        </div>
      </div>
    </>
  );
}
