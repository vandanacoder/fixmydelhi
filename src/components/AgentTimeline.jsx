import React, { useEffect, useState } from "react";
import { Check, Loader } from "lucide-react";

/**
 * AgentTimeline
 *
 * Props:
 *   phase: "idle" | "analysing" | "found" | "department" | "drafting" | "ready"
 *   label: string  (detected class, e.g. "Pothole")
 *   confidence: number (0–1)
 */

const STEPS = [
  { id: "analysing",  text: () => "Analysing photo" },
  {
    id: "found",
    text: (label, conf) =>
      label
        ? `Issue found: ${label} (${Math.round(conf * 100)}%)`
        : "Issue found",
  },
  { id: "department", text: () => "Picking department" },
  { id: "drafting",   text: () => "Drafting complaint" },
  { id: "ready",      text: () => "Ready to send" },
];

const PHASE_ORDER = ["analysing", "found", "department", "drafting", "ready"];

// Return "done" | "active" | "pending" for each step given current phase
function stepState(stepId, currentPhase) {
  if (currentPhase === "idle") return "pending";
  const stepIdx    = PHASE_ORDER.indexOf(stepId);
  const currentIdx = PHASE_ORDER.indexOf(currentPhase);
  if (stepIdx < currentIdx)  return "done";
  if (stepIdx === currentIdx) return "active";
  return "pending";
}

export default function AgentTimeline({ phase, label, confidence }) {
  // Animate steps in progressively — each new phase reveals on a short delay
  const [visiblePhase, setVisiblePhase] = useState(phase);

  useEffect(() => {
    // Immediately show the new phase (CSS transition handles the style change)
    setVisiblePhase(phase);
  }, [phase]);

  if (phase === "idle") return null;

  return (
    <div className="timeline">
      {STEPS.map((step) => {
        const state = stepState(step.id, visiblePhase);
        return (
          <div key={step.id} className={`timeline-step ${state}`}>
            <div className="timeline-dot">
              {state === "done"   && <Check size={12} strokeWidth={3} />}
              {state === "active" && <div className="timeline-pulse" />}
            </div>
            <div className="timeline-step-text">
              {step.text(label, confidence)}
              {state === "active" && step.id !== "ready" && (
                <Loader
                  size={11}
                  className="spin"
                  style={{ marginLeft: 6, display: "inline", verticalAlign: "middle" }}
                />
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
