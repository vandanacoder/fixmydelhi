import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import { loadReports } from "../utils/storage";
import { ISSUE_LABELS, OTHER_LABEL, MAP_TILE_URL, MAP_TILE_ATTRIBUTION } from "../config";

// Inject Leaflet CSS only when the Map page is mounted, then remove on unmount.
// This keeps the stylesheet out of the initial page load.
const LEAFLET_CSS = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
function useLeafletCss() {
  useEffect(() => {
    if (document.querySelector(`link[href="${LEAFLET_CSS}"]`)) return;
    const link = document.createElement("link");
    link.rel  = "stylesheet";
    link.href = LEAFLET_CSS;
    document.head.appendChild(link);
    return () => {
      // Leave the tag in place if the user navigates back — it's already cached
      // and removing it causes a flash on re-visit. No cleanup needed.
    };
  }, []);
}

// Hex values — Leaflet CircleMarker pathOptions can't resolve CSS variables
const COLOR_HEX = {
  "Garbage dump": "#F2A900",
  "Pothole":      "#E4572E",
  "Waterlogging": "#2A9D8F",
  "Normal road":  "#6A994E",
};

const STATUS_LABELS = {
  "Open":        "Open",
  "Followed up": "Followed up",
  "Resolved":    "Resolved",
};

const DELHI_CENTER = [28.6139, 77.209];
const DEFAULT_ZOOM = 11;

function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", {
    dateStyle: "medium",
    timeZone: "Asia/Kolkata",
  });
}

export default function MapPage() {
  useLeafletCss();
  const [reports, setReports] = useState([]);

  useEffect(() => {
    // "Other" reports have no civic issue — exclude from map
    setReports(
      loadReports().filter(
        (r) => r.areaCoords && r.label !== OTHER_LABEL && r.finalLabel !== OTHER_LABEL
      )
    );
  }, []);

  return (
    <div className="page-content map-page-content">
      <h1 className="page-title">Reports Map</h1>

      {/* Legend — only the 4 civic-issue classes */}
      <div className="map-legend">
        {ISSUE_LABELS.map((label) => (
          <span key={label} className="legend-item">
            <span className="legend-dot" style={{ background: COLOR_HEX[label] }} />
            {label}
          </span>
        ))}
      </div>

      {reports.length === 0 && (
        <p className="muted" style={{ marginBottom: 12 }}>
          No reports yet. File a complaint first.
        </p>
      )}

      <div className="map-container">
        <MapContainer
          center={DELHI_CENTER}
          zoom={DEFAULT_ZOOM}
          style={{ height: "100%", width: "100%", minHeight: "70vh" }}
        >
          <TileLayer
            attribution={MAP_TILE_ATTRIBUTION}
            url={MAP_TILE_URL}
            maxZoom={19}
          />

          {reports.map((r) => {
            const label = r.finalLabel || r.label;
            const color = COLOR_HEX[label] || "#A8998C";
            return (
              <CircleMarker
                key={r.id}
                center={r.areaCoords}
                radius={9}
                pathOptions={{
                  fillColor:    color,
                  fillOpacity:  0.88,
                  color:        "#fff",
                  weight:       2,
                }}
              >
                <Popup>
                  <div className="popup-label">{label}</div>
                  <div className="popup-row">
                    📍 {r.areaName}{r.landmark ? `, ${r.landmark}` : ""}
                  </div>
                  <div className="popup-row">
                    🕒 {formatDate(r.dateTime)}
                  </div>
                  <div className="popup-row">
                    {STATUS_LABELS[r.status] || r.status}
                  </div>
                  <div className="popup-row" style={{ opacity: 0.65 }}>
                    {Math.round(r.confidence * 100)}% confidence
                  </div>
                </Popup>
              </CircleMarker>
            );
          })}
        </MapContainer>
      </div>
    </div>
  );
}
