import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import { MapPin, FileText, Map, X, AlertTriangle, BarChart2, Info, Download } from "lucide-react";
import { useInstallPrompt } from "../utils/useInstallPrompt";

export default function Layout({ children }) {
  const [noticeDismissed, setNoticeDismissed] = useState(false);
  const installPrompt = useInstallPrompt();

  return (
    <div className="app-shell">
      {/* Dismissible notice banner */}
      {!noticeDismissed && (
        <div className="notice-banner">
          <AlertTriangle size={13} />
          <span className="notice-text">
            Prototype — avoid faces and number plates. Complaints go only to the test inbox.
          </span>
          <button
            className="notice-dismiss"
            onClick={() => setNoticeDismissed(true)}
            aria-label="Dismiss notice"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Glass nav bar (desktop) */}
      <nav className="nav-bar">
        <NavLink to="/" className="nav-brand">
          <span className="nav-brand-icon">
            <MapPin size={15} strokeWidth={2.5} />
          </span>
          FixMyDelhi
        </NavLink>

        <div className="nav-links">
          <NavLink to="/" end className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
            <MapPin size={15} /> Home
          </NavLink>
          <NavLink to="/reports" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
            <FileText size={15} /> Reports
          </NavLink>
          <NavLink to="/map" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
            <Map size={15} /> Map
          </NavLink>
          <NavLink to="/stats" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
            <BarChart2 size={15} /> Stats
          </NavLink>
          <NavLink to="/about" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
            <Info size={15} /> About
          </NavLink>
          {installPrompt && (
            <button className="install-btn" onClick={installPrompt} title="Install FixMyDelhi app">
              <Download size={14} /> Install app
            </button>
          )}
        </div>
      </nav>

      <main className="main-content">{children}</main>

      {/* Bottom tab bar (mobile) — 5 items */}
      <nav className="tab-bar">
        <NavLink to="/" end className={({ isActive }) => isActive ? "tab-item active" : "tab-item"}>
          <MapPin /> Home
        </NavLink>
        <NavLink to="/reports" className={({ isActive }) => isActive ? "tab-item active" : "tab-item"}>
          <FileText /> Reports
        </NavLink>
        <NavLink to="/map" className={({ isActive }) => isActive ? "tab-item active" : "tab-item"}>
          <Map /> Map
        </NavLink>
        <NavLink to="/stats" className={({ isActive }) => isActive ? "tab-item active" : "tab-item"}>
          <BarChart2 /> Stats
        </NavLink>
        <NavLink to="/about" className={({ isActive }) => isActive ? "tab-item active" : "tab-item"}>
          <Info /> About
        </NavLink>
      </nav>

      <footer className="app-footer">
        FixMyDelhi Prototype — all data stays on your device.
      </footer>
    </div>
  );
}
