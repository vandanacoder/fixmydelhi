// ──────────────────────────────────────────────
// FixMyDelhi — central configuration
// ──────────────────────────────────────────────

export const MODEL_URL =
  "/model/";

// Developer's own demo inbox — all complaints go here only
export const TEST_EMAIL = "vandanasiso2004@gmail.com";

// Optional: POST complaint JSON here when set (leave empty string to skip)
export const WEBHOOK_URL = "";

// ── Map ───────────────────────────────────────
// Standard OpenStreetMap tile URL — change to any compatible tile server here.
export const MAP_TILE_URL = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
export const MAP_TILE_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

// ── Model ────────────────────────────────────
export const IMAGE_SIZE = 224;

// Labels are read dynamically from the model metadata at runtime.
// These are the 4 civic-issue classes (used for complaint routing,
// stats, map, and the "Wrong? Fix it" dropdown).
export const ISSUE_LABELS = [
  "Garbage dump",
  "Normal road",
  "Pothole",
  "Waterlogging",
];

// Canonical name for the "not a road scene" class.
// Matched loosely against whatever the model calls it.
export const OTHER_LABEL = "Other";

export const CONFIDENCE_THRESHOLD = 0.70; // 70 %

// ── Colours ──────────────────────────────────
// Used by map, stats bars, issue badges, confidence bars.
export const ISSUE_COLORS = {
  "Garbage dump": "var(--c-garbage)",
  "Normal road":  "var(--c-normal)",
  "Pothole":      "var(--c-pothole)",
  "Waterlogging": "var(--c-water)",
  "Other":        "var(--c-other)",
};

// ── Department routing ────────────────────────
// DEMO ONLY — names and emails are fake (.test domain is not a real TLD)
export const DEPARTMENTS = {
  "Pothole": {
    name: "Demo Roads Dept",
    email: "roads@demo.test",
  },
  "Garbage dump": {
    name: "Demo Sanitation Dept",
    email: "sanitation@demo.test",
  },
  "Waterlogging": {
    name: "Demo Drainage Dept",
    email: "drainage@demo.test",
  },
};

// ── Model card ────────────────────────────────
// Edit training counts and accuracy here; AboutPage reads this.
export const MODEL_CARD = {
  architecture: "Teachable Machine image model (MobileNet v2 backbone, TF.js 1.7.4)",
  overallAccuracy: "88%",
  totalImages:     "several hundred (approximate)",
  classes: [
    {
      name: "Pothole",
      color: "var(--c-pothole)",
      trainingImages: "about 100 to 250 (approximate)",
      testAccuracy:   "90%",
      description: "Road surface depressions caused by wear or water damage.",
    },
    {
      name: "Garbage dump",
      color: "var(--c-garbage)",
      trainingImages: "about 100 to 250 (approximate)",
      testAccuracy:   "75%",
      description: "Accumulated solid waste dumped on roads or open land.",
    },
    {
      name: "Waterlogging",
      color: "var(--c-water)",
      trainingImages: "about 100 to 250 (approximate)",
      testAccuracy:   "75%",
      description: "Standing water on roads after rain or drainage failure.",
    },
    {
      name: "Normal road",
      color: "var(--c-normal)",
      trainingImages: "about 100 to 250 (approximate)",
      testAccuracy:   "100%",
      description: "Road surface with no visible civic issue.",
    },
    {
      name: "Other",
      color: "var(--c-other)",
      trainingImages: "about 100 to 250 (approximate)",
      testAccuracy:   "100%",
      description: "Non-road photos: rooms, sky, objects, animals, etc.",
    },
  ],
};

// ── Delhi areas ───────────────────────────────
// [name, lat, lng]
export const DELHI_AREAS = [
  ["Connaught Place",     28.6315, 77.2167],
  ["Karol Bagh",          28.6514, 77.1907],
  ["Lajpat Nagar",        28.5676, 77.2434],
  ["Rohini",              28.7396, 77.0547],
  ["Dwarka",              28.5921, 77.0460],
  ["Saket",               28.5244, 77.2066],
  ["Janakpuri",           28.6289, 77.0824],
  ["Nehru Place",         28.5491, 77.2530],
  ["Pitampura",           28.7008, 77.1351],
  ["Laxmi Nagar",         28.6303, 77.2778],
  ["Shahdara",            28.6724, 77.2945],
  ["Hauz Khas",           28.5494, 77.2001],
];
