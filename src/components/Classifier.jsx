import React, { useRef, useState, useEffect, useCallback } from "react";
import {
  Upload, Camera, RotateCcw, AlertTriangle, CheckCircle,
  Edit2, FlaskConical, Zap, ZapOff,
} from "lucide-react";
import {
  MODEL_URL, IMAGE_SIZE, CONFIDENCE_THRESHOLD,
  ISSUE_LABELS, ISSUE_COLORS, OTHER_LABEL,
} from "../config";
import AgentTimeline from "./AgentTimeline";

// ─────────────────────────────────────────────────────────
// Model bootstrap — lazy, on-demand only.
//
// loadCdnScripts()  — injects TF.js + TM image scripts once, returns a
//                     promise that resolves when both are available on window.
// bootstrapModel()  — loads + warm-ups the model; safe to call many times.
// preloadModel()    — lightweight trigger for hover/focus/touch on the
//                     drop-zone; starts the chain without blocking the caller.
// ─────────────────────────────────────────────────────────

let _modelPromise = null;       // resolves to model instance or null
let _resolvedModel = null;      // cached after warmup completes
let _modelStatus = "idle";      // "idle" | "loading" | "ready" | "error"
const _statusListeners = new Set(); // components subscribe for updates

function notifyStatus(s) {
  _modelStatus = s;
  _statusListeners.forEach((fn) => fn(s));
}

// Loose-match a raw label string returned by the model
// against our canonical class names.
function canonicalLabel(raw) {
  const l = (raw || "").toLowerCase();
  if (l.includes("pothole"))     return "Pothole";
  if (l.includes("garbage"))     return "Garbage dump";
  if (l.includes("water"))       return "Waterlogging";
  if (l.includes("normal"))      return "Normal road";
  if (l.includes("other"))       return OTHER_LABEL;
  return raw; // pass through anything unrecognised
}

// Inject a <script> tag and return a promise that resolves on load.
function loadScript(src) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) { resolve(); return; }
    const s = document.createElement("script");
    s.src = src;
    s.async = true;
    s.onload  = resolve;
    s.onerror = () => reject(new Error(`Failed to load: ${src}`));
    document.head.appendChild(s);
  });
}

let _scriptsPromise = null;
function loadCdnScripts() {
  if (_scriptsPromise) return _scriptsPromise;
  _scriptsPromise = loadScript(
    "https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@1.7.4/dist/tf.min.js"
  ).then(() =>
    loadScript(
      "https://cdn.jsdelivr.net/npm/@teachablemachine/image@0.8.4/dist/teachablemachine-image.min.js"
    )
  );
  return _scriptsPromise;
}

function bootstrapModel() {
  if (_modelPromise) return _modelPromise;
  notifyStatus("loading");
  _modelPromise = (async () => {
    try {
      await loadCdnScripts();
      if (!window.tmImage) throw new Error("tmImage not available after script load");

      const loaded = await window.tmImage.load(
        MODEL_URL + "model.json",
        MODEL_URL + "metadata.json"
      );

      // Warm-up: schedule one blank prediction via requestIdleCallback so it
      // doesn't compete with first-paint or user interaction.
      const runWarmup = async () => {
        const warmCanvas = document.createElement("canvas");
        warmCanvas.width  = IMAGE_SIZE;
        warmCanvas.height = IMAGE_SIZE;
        await loaded.predict(warmCanvas);
        _resolvedModel = loaded;
        notifyStatus("ready");
        console.log("[FixMyDelhi] Model ready ✓");
      };

      if (typeof requestIdleCallback !== "undefined") {
        requestIdleCallback(runWarmup, { timeout: 3000 });
      } else {
        setTimeout(runWarmup, 200); // Safari fallback
      }

      return loaded;
    } catch (err) {
      console.error("[FixMyDelhi] Model load error:", err);
      notifyStatus("error");
      _modelPromise = null; // allow retry
      return null;
    }
  })();
  return _modelPromise;
}

// Called on first hover/focus/touch of the drop-zone — starts the chain
// early but never blocks the UI (fire-and-forget).
function preloadModel() {
  if (_modelPromise) return; // already started
  bootstrapModel();
}

// ─────────────────────────────────────────────────────────
// Max dimension to resize large photos before predict/preview
// ─────────────────────────────────────────────────────────
const MAX_PHOTO_PX = 1024;

function resizeImageToCanvas(img, maxPx) {
  let w = img.naturalWidth  || img.width;
  let h = img.naturalHeight || img.height;
  if (w > maxPx || h > maxPx) {
    const scale = maxPx / Math.max(w, h);
    w = Math.round(w * scale);
    h = Math.round(h * scale);
  }
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  c.getContext("2d").drawImage(img, 0, 0, w, h);
  return c;
}

// ─────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────
function ModelChip({ status }) {
  if (status === "idle")  return null; // not started yet — no chip needed
  if (status === "ready") {
    return (
      <div className="model-ready-chip ready">
        <div className="chip-dot" /> Model ready
      </div>
    );
  }
  if (status === "error") {
    return (
      <div className="model-ready-chip error">
        <div className="chip-dot" /> Model failed to load
      </div>
    );
  }
  // "loading"
  return (
    <div className="model-ready-chip loading">
      <div className="chip-dot pulse" /> Loading model…
    </div>
  );
}

function ConfLevel({ pct }) {
  if (pct >= 90) return <span className="conf-level conf-level-high">HIGH</span>;
  if (pct >= 70) return <span className="conf-level conf-level-medium">MEDIUM</span>;
  return            <span className="conf-level conf-level-low">LOW</span>;
}

function ConfidenceRing({ pct, color }) {
  const r = 36, circ = 2 * Math.PI * r;
  const offset = circ * (1 - pct / 100);
  return (
    <svg className="ring-svg" width="88" height="88" viewBox="0 0 88 88">
      <circle className="ring-track" cx="44" cy="44" r={r} strokeWidth="7" />
      <circle
        className="ring-fill"
        cx="44" cy="44" r={r}
        strokeWidth="7"
        stroke={color}
        strokeDasharray={circ}
        strokeDashoffset={offset}
      />
    </svg>
  );
}

// Sample images expected in /public/samples/
const SAMPLES = [
  { label: "Pothole",      file: "pothole.jpg"  },
  { label: "Garbage dump", file: "garbage.jpg"  },
  { label: "Waterlogging", file: "water.jpg"    },
];

// ─────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────
export default function Classifier({ onResult }) {
  const [modelStatus, setModelStatus] = useState(_modelStatus);
  const [preview, setPreview] = useState(null);
  const [predictions, setPredictions] = useState([]);
  const [aiLabel, setAiLabel] = useState(null);
  const [finalLabel, setFinalLabel] = useState(null);
  const [topConf, setTopConf] = useState(0);
  const [predicting, setPredicting] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [sampleError, setSampleError] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [timelinePhase, setTimelinePhase] = useState("idle");

  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const grayscaleCanvasRef = useRef(null);

  // Subscribe to model status updates from the module-level bootstrapper
  useEffect(() => {
    setModelStatus(_modelStatus);
    const listener = (s) => setModelStatus(s);
    _statusListeners.add(listener);
    return () => _statusListeners.delete(listener);
  }, []);

  // ── Grayscale + predict ──────────────────────
  // Called exactly once per photo. Override just changes state, never re-runs this.
  const predictFromImage = useCallback(
    async (imgElement) => {
      setPredicting(true);
      setTimelinePhase("analysing");

      // ── 1. Resize to max 1024 px, then draw to 224×224 greyscale canvas ──
      const resized = resizeImageToCanvas(imgElement, MAX_PHOTO_PX);

      // Draw image then convert to grayscale via pixel loop (works on all browsers)
      const canvas = grayscaleCanvasRef.current;
      canvas.width = IMAGE_SIZE;
      canvas.height = IMAGE_SIZE;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(resized, 0, 0, IMAGE_SIZE, IMAGE_SIZE);
      const imageData = ctx.getImageData(0, 0, IMAGE_SIZE, IMAGE_SIZE);
      const d = imageData.data; // Uint8ClampedArray [R,G,B,A, R,G,B,A, ...]
      for (let i = 0; i < d.length; i += 4) {
        const gray = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
        d[i] = d[i + 1] = d[i + 2] = gray; // R = G = B = luminance
        // d[i + 3] (alpha) is left unchanged
      }
      ctx.putImageData(imageData, 0, 0);

      // ── 2. Wait for model ────────────────────
      const activeModel = _resolvedModel || (await bootstrapModel());
      if (!activeModel) {
        setPredicting(false);
        setTimelinePhase("idle");
        return;
      }

      // ── 3. Predict (timed) ───────────────────
      console.time("[FixMyDelhi] predict");
      const rawPreds = await activeModel.predict(canvas);
      console.timeEnd("[FixMyDelhi] predict");

      // Normalise class names with loose matching
      const preds = rawPreds.map((p) => ({
        ...p,
        className: canonicalLabel(p.className),
      }));
      const sorted = [...preds].sort((a, b) => b.probability - a.probability);
      setPredictions(sorted);

      const top = sorted[0];
      const topClass = top.className;
      const topProb  = top.probability;

      setAiLabel(topClass);
      setFinalLabel(topClass);
      setTopConf(topProb);

      // ── 4. Advance timeline — real steps, 100 ms animation delay only ──
      setTimelinePhase("found");
      await new Promise((r) => setTimeout(r, 100));
      setTimelinePhase("department");
      await new Promise((r) => setTimeout(r, 100));
      setTimelinePhase("drafting");
      await new Promise((r) => setTimeout(r, 100));
      setTimelinePhase("ready");
      setPredicting(false);

      if (onResult) {
        onResult({
          label:       topClass,
          aiLabel:     topClass,
          finalLabel:  topClass,
          confidence:  topProb,
          predictions: sorted,
        });
      }
    },
    [onResult]
  );

  // ── Resize + preview + predict for a file/blob URL ──
  const processUrl = useCallback(
    async (url, crossOrigin = false) => {
      setPredictions([]);
      setAiLabel(null);
      setFinalLabel(null);
      setTimelinePhase("idle");

      // Load the image, resize to max 1024 px, create a resized blob URL for preview
      const img = new Image();
      if (crossOrigin) img.crossOrigin = "anonymous";
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = url;
      });

      const resized = resizeImageToCanvas(img, MAX_PHOTO_PX);
      const previewUrl = resized.toDataURL("image/jpeg", 0.85);
      setPreview(previewUrl);

      await predictFromImage(img); // pass original (resizeImageToCanvas called inside)
    },
    [predictFromImage]
  );

  // ── File upload / drag-drop ──────────────────
  const processFile = useCallback(
    (file) => {
      if (!file || !file.type.startsWith("image/")) return;
      const url = URL.createObjectURL(file);
      processUrl(url);
    },
    [processUrl]
  );

  const handleFileChange = (e) => processFile(e.target.files[0]);
  const handleDragOver   = (e) => { e.preventDefault(); setDragOver(true); };
  const handleDragLeave  = () => setDragOver(false);
  const handleDrop       = (e) => {
    e.preventDefault(); setDragOver(false);
    processFile(e.dataTransfer.files[0]);
  };

  // ── Sample photos ────────────────────────────
  const loadSample = useCallback(
    async (filename) => {
      setSampleError(null);

      // Start (or continue) loading the model immediately — fire-and-forget is fine
      // here because predictFromImage already awaits bootstrapModel() internally.
      bootstrapModel();

      // Verify the image is reachable before handing off to processUrl.
      // Using fetch(HEAD) is lightest; fall back to Image load on any CORS quirk.
      const url = `/samples/${filename}`;
      try {
        await new Promise((resolve, reject) => {
          const img = new Image();
          img.crossOrigin = "anonymous";
          img.onload  = resolve;
          img.onerror = () => reject(new Error("image-load-failed"));
          img.src = url;
        });
      } catch {
        setSampleError(
          `Sample image "${filename}" could not be loaded. Add it to /public/samples/.`
        );
        return;
      }

      // Image is available — hand off to the normal pipeline.
      // processUrl will await the model internally via bootstrapModel().
      try {
        await processUrl(url, true);
      } catch {
        setSampleError("Something went wrong analysing the sample. Please try again.");
      }
    },
    [processUrl]
  );

  // ── Camera ───────────────────────────────────
  const openCamera = useCallback(async () => {
    setCameraError(null);
    setCameraOpen(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch {
      setCameraError("Camera access denied or unavailable.");
      setCameraOpen(false);
    }
  }, []);

  const closeCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setCameraOpen(false);
  }, []);

  const capturePhoto = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    const c = document.createElement("canvas");
    c.width = video.videoWidth; c.height = video.videoHeight;
    c.getContext("2d").drawImage(video, 0, 0);
    closeCamera();
    processUrl(c.toDataURL("image/jpeg"));
  }, [closeCamera, processUrl]);

  // ── Class override — never re-runs predict ───
  const handleOverride = (newLabel) => {
    setFinalLabel(newLabel);
    if (onResult) {
      onResult({
        label:      newLabel,
        aiLabel,
        finalLabel: newLabel,
        confidence: topConf,
        predictions,
      });
    }
  };

  // ── Reset ────────────────────────────────────
  const reset = () => {
    setPreview(null);
    setPredictions([]);
    setAiLabel(null);
    setFinalLabel(null);
    setTopConf(0);
    setTimelinePhase("idle");
    if (onResult) onResult(null);
  };

  const isOther        = finalLabel === OTHER_LABEL;
  const isLowConfidence = finalLabel && finalLabel !== "Normal road" && !isOther && topConf < CONFIDENCE_THRESHOLD;
  const topPct         = Math.round(topConf * 100);
  const modelBusy      = modelStatus === "loading"; // idle/ready/error all allow clicks

  return (
    <div className="classifier">
      {/* Hidden canvas for grayscale processing */}
      <canvas ref={grayscaleCanvasRef} style={{ display: "none" }} />

      {/* Model-ready chip */}
      <ModelChip status={modelStatus} />

      {/* Camera view */}
      {cameraOpen && (
        <div className="camera-overlay">
          <video ref={videoRef} autoPlay playsInline className="camera-video" />
          <div className="camera-controls">
            <button className="btn btn-primary" onClick={capturePhoto}>
              <Camera size={16} /> Capture
            </button>
            <button className="btn btn-secondary" onClick={closeCamera}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Drop zone */}
      {!preview && !cameraOpen && (
        <div
          className={`drop-zone${dragOver ? " drag-over" : ""}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={(e) => { bootstrapModel(); handleDrop(e); }}
          onClick={() => { bootstrapModel(); fileInputRef.current.click(); }}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === "Enter" && fileInputRef.current.click()}
          aria-label="Upload photo"
          // Preload on first hover / focus / touch — fire-and-forget
          onMouseEnter={preloadModel}
          onFocus={preloadModel}
          onTouchStart={preloadModel}
        >
          <div className="drop-zone-icon">
            <Upload size={32} strokeWidth={1.5} />
          </div>
          <div className="drop-zone-label">Drop a photo here</div>
          <div className="drop-zone-sub">PNG, JPG, WEBP — stays on your device</div>

          <div className="divider-or">or</div>

          <div className="btn-row" style={{ justifyContent: "center", marginBottom: 0 }}>
            <button
              className="btn btn-primary"
              disabled={modelBusy}
              onClick={(e) => { e.stopPropagation(); bootstrapModel(); fileInputRef.current.click(); }}
            >
              <Upload size={15} /> Upload photo
            </button>
            <button
              className="btn btn-secondary"
              disabled={modelBusy}
              onClick={(e) => { e.stopPropagation(); bootstrapModel(); openCamera(); }}
            >
              <Camera size={15} /> Take photo
            </button>
          </div>

          {/* Sample buttons */}
          <div style={{ marginTop: 16 }} onClick={(e) => e.stopPropagation()}>
            <div style={{ fontSize: "11px", color: "var(--muted)", marginBottom: 6, textAlign: "center" }}>
              Try a sample
            </div>
            <div className="sample-row" style={{ justifyContent: "center" }}>
              {SAMPLES.map((s) => (
                <button
                  key={s.file}
                  className="sample-btn"
                  disabled={modelBusy}
                  onClick={() => { bootstrapModel(); loadSample(s.file); }}
                >
                  <FlaskConical size={12} /> {s.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={handleFileChange}
      />

      {modelStatus === "error" && (
        <div className="result-banner result-warn">
          <AlertTriangle size={15} />
          Failed to load model. Check your internet connection and reload.
        </div>
      )}
      {cameraError && (
        <div className="result-banner result-warn">
          <AlertTriangle size={15} /> {cameraError}
        </div>
      )}
      {sampleError && (
        <div className="result-banner result-warn">
          <AlertTriangle size={15} /> {sampleError}
        </div>
      )}

      {/* Result card */}
      {preview && (
        <div className="result-card">
          <img src={preview} alt="Uploaded" className="result-photo" />

          <div className="result-body">
            {/* Agent timeline — driven by real step completion */}
            <AgentTimeline
              phase={timelinePhase}
              label={aiLabel}
              confidence={topConf}
            />

            {/* "Other" — not a road scene */}
            {isOther && !predicting && (
              <div className="result-banner result-warn">
                <AlertTriangle size={15} />
                This doesn't look like a road problem. Try another photo.
              </div>
            )}

            {/* Low confidence */}
            {isLowConfidence && !predicting && (
              <div className="result-banner result-warn">
                <AlertTriangle size={15} />
                Not sure — please take a clearer photo.
              </div>
            )}

            {/* Normal road */}
            {finalLabel === "Normal road" && !predicting && (
              <div className="result-banner result-ok">
                <CheckCircle size={15} /> No problem detected.
              </div>
            )}

            {/* Issue badge — only for the 4 civic classes */}
            {finalLabel && !predicting && !isOther && finalLabel !== "Normal road" && !isLowConfidence && (
              <div
                className="issue-badge"
                style={{
                  background: `color-mix(in srgb, ${ISSUE_COLORS[finalLabel]} 15%, transparent)`,
                  color: ISSUE_COLORS[finalLabel],
                  border: `1px solid color-mix(in srgb, ${ISSUE_COLORS[finalLabel]} 30%, transparent)`,
                }}
              >
                {finalLabel}
                {aiLabel && finalLabel !== aiLabel && (
                  <span style={{ fontSize: "11px", opacity: 0.7, marginLeft: 4 }}>
                    (AI: {aiLabel})
                  </span>
                )}
              </div>
            )}

            {/* Confidence ring — show for all non-Other results */}
            {finalLabel && !predicting && !isOther && (
              <div className="ring-wrap">
                <ConfidenceRing
                  pct={topPct}
                  color={ISSUE_COLORS[finalLabel] || "var(--c-other)"}
                />
                <div>
                  <div className="ring-label">
                    {topPct}%
                    <ConfLevel pct={topPct} />
                  </div>
                  <div className="ring-sub">AI confidence</div>
                </div>
              </div>
            )}

            {/* Confidence bars — show all labels returned by the model */}
            {predictions.length > 0 && !predicting && (
              <div className="conf-bars">
                {predictions.map(({ className: label, probability }) => {
                  const pct = Math.round(probability * 100);
                  return (
                    <div key={label} className="conf-bar-row">
                      <span className="conf-label">{label}</span>
                      <div className="conf-track">
                        <div
                          className="conf-fill"
                          style={{ width: `${pct}%`, background: ISSUE_COLORS[label] || "var(--c-other)" }}
                        />
                      </div>
                      <span className="conf-num">{pct}%</span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* "Wrong? Fix it" — only offer the 4 civic-issue classes */}
            {aiLabel && !predicting && !isOther && (
              <div className="override-row">
                <Edit2 size={12} style={{ color: "var(--muted)" }} />
                <span className="override-label">Wrong? Fix it:</span>
                <select
                  className="override-select"
                  value={finalLabel || aiLabel}
                  onChange={(e) => handleOverride(e.target.value)}
                >
                  {ISSUE_LABELS.map((l) => (
                    <option key={l} value={l}>{l}</option>
                  ))}
                </select>
                {finalLabel !== aiLabel && (
                  <span className="override-changed">Corrected</span>
                )}
              </div>
            )}

            {/* Reset */}
            {finalLabel && !predicting && (
              <div style={{ marginTop: "16px" }}>
                <button className="btn btn-secondary" onClick={reset}>
                  <RotateCcw size={14} /> Try another photo
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
