import React from "react";
import { Layers, ShieldCheck, AlertTriangle, Info } from "lucide-react";
import { MODEL_CARD } from "../config";

export default function AboutPage() {
  return (
    <div className="page-content">
      <h1 className="page-title">About &amp; Model Card</h1>
      <p className="page-subtitle">
        What this app uses, how the AI was trained, and what it cannot do.
      </p>

      {/* Model overview */}
      <div className="about-section">
        <div className="about-section-title">
          <Info size={15} /> Model overview
        </div>
        <table className="about-table">
          <tbody>
            <tr><td>Architecture</td><td>{MODEL_CARD.architecture}</td></tr>
            <tr><td>Classes</td><td>{MODEL_CARD.classes.length} (see below)</td></tr>
            <tr><td>Total training images</td><td>{MODEL_CARD.totalImages}</td></tr>
            <tr><td>Overall test accuracy</td><td>{MODEL_CARD.overallAccuracy}</td></tr>
            <tr><td>Input</td><td>224 × 224 px, greyscale (converted on-device)</td></tr>
            <tr><td>Confidence threshold</td><td>70% — below this the app asks for a clearer photo</td></tr>
          </tbody>
        </table>
      </div>

      {/* Per-class details */}
      <div className="about-section">
        <div className="about-section-title">
          <Layers size={15} /> Classes &amp; training data
        </div>
        <div className="model-class-grid">
          {MODEL_CARD.classes.map((c) => (
            <div
              key={c.name}
              className="model-class-card"
              style={{ borderColor: `color-mix(in srgb, ${c.color} 30%, transparent)` }}
            >
              <div className="model-class-name" style={{ color: c.color }}>
                {c.name}
              </div>
              <div className="model-class-meta">
                {c.description}
                <br />
                Training images: <strong style={{ color: "var(--text)" }}>{c.trainingImages}</strong>
                <br />
                Test accuracy: <strong style={{ color: "var(--text)" }}>{c.testAccuracy}</strong>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Limitations */}
      <div className="about-section">
        <div className="about-section-title">
          <AlertTriangle size={15} /> Limitations
        </div>
        <ul style={{ paddingLeft: 18, fontSize: 13, color: "var(--muted)", lineHeight: 2 }}>
          <li>Trained on a small dataset — accuracy drops in unusual lighting or angles.</li>
          <li>Greyscale conversion removes colour cues; performance may differ from colour models.</li>
          <li>Not validated for night-time or heavily blurred photos.</li>
          <li>The model cannot detect multiple issues in one photo.</li>
          <li>Confidence scores are not calibrated probabilities.</li>
          <li>"Other" catches non-road scenes but may misfire on atypical road photos.</li>
          <li>This is a prototype — do not rely on it for safety-critical decisions.</li>
          <li>Prototype. Department names and emails are fake.</li>
        </ul>
      </div>

      {/* Privacy */}
      <div className="about-section">
        <div className="about-section-title">
          <ShieldCheck size={15} /> Privacy
        </div>
        <p style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.8 }}>
          Your photo is <strong style={{ color: "var(--text)" }}>processed entirely in the browser</strong>.
          It is never uploaded to any server, never stored in localStorage, and is discarded as soon
          as the prediction is complete. Only the complaint text and metadata (issue type, location,
          timestamp) are saved — and only locally on your device.
          <br /><br />
          Complaints sent via the "Send" button open your own email client (mailto) and are addressed
          only to the configured test inbox. No data is transmitted by this app itself.
        </p>
      </div>
    </div>
  );
}
