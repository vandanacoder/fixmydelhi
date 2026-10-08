import React, { useState, lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Classifier from "./components/Classifier";
import ComplaintForm from "./components/ComplaintForm";

// Route-level code splitting — these chunks are loaded only when visited
const ReportsPage = lazy(() => import("./components/ReportsPage"));
const MapPage     = lazy(() => import("./components/MapPage"));
const StatsPage   = lazy(() => import("./components/StatsPage"));
const AboutPage   = lazy(() => import("./components/AboutPage"));

function PageFallback() {
  return (
    <div style={{ padding: "40px 24px", color: "var(--muted)", fontSize: 14 }}>
      Loading…
    </div>
  );
}

function HomePage() {
  const [result, setResult] = useState(null);

  const handleResult = (data) => {
    setResult(data); // null on reset
  };

  return (
    <div className="page-content">
      {/* Hero */}
      <div className="hero">
        <h1 className="hero-headline">See it. Snap it. Fix it.</h1>
        <p className="hero-sub">
          Photograph a pothole, garbage dump, or waterlogging. The AI
          classifies it and drafts a complaint to the right department.
        </p>
      </div>

      {/* Two-column on desktop */}
      <div className="home-cols">
        <div>
          <Classifier onResult={handleResult} />
        </div>

        <div>
          {result && (
            <ComplaintForm
              label={result.label}
              aiLabel={result.aiLabel}
              finalLabel={result.finalLabel}
              confidence={result.confidence}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Layout>
      <Suspense fallback={<PageFallback />}>
        <Routes>
          <Route path="/"        element={<HomePage />}  />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/map"     element={<MapPage />}   />
          <Route path="/stats"   element={<StatsPage />} />
          <Route path="/about"   element={<AboutPage />} />
        </Routes>
      </Suspense>
    </Layout>
  );
}
