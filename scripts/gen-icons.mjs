/**
 * Generates public/icons/icon-192.png and icon-512.png
 * Uses the built-in Canvas API available in Bun / Node ≥ 18 (via @napi-rs/canvas fallback).
 * Run with: bun scripts/gen-icons.mjs
 */

import { createCanvas } from "@napi-rs/canvas";
import { writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, "..", "public", "icons");
mkdirSync(OUT_DIR, { recursive: true });

const THEME  = "#FF9F1C";
const BG     = "#FFF7EC";
const PIN    = "#E55A1C";   // darker orange-red for the pin body
const SIZES  = [192, 512];

function drawIcon(size) {
  const canvas = createCanvas(size, size);
  const ctx    = canvas.getContext("2d");
  const s      = size / 512;   // scale factor (everything drawn at 512 baseline)

  // Background rounded rect
  const r = 96 * s;
  ctx.fillStyle = THEME;
  ctx.beginPath();
  ctx.moveTo(r, 0);
  ctx.lineTo(512 * s - r, 0);
  ctx.quadraticCurveTo(512 * s, 0, 512 * s, r);
  ctx.lineTo(512 * s, 512 * s - r);
  ctx.quadraticCurveTo(512 * s, 512 * s, 512 * s - r, 512 * s);
  ctx.lineTo(r, 512 * s);
  ctx.quadraticCurveTo(0, 512 * s, 0, 512 * s - r);
  ctx.lineTo(0, r);
  ctx.quadraticCurveTo(0, 0, r, 0);
  ctx.closePath();
  ctx.fill();

  // Map-pin silhouette
  const cx  = 256 * s;
  const cy  = 210 * s;
  const pr  = 110 * s;  // pin head radius

  // Pin head circle
  ctx.fillStyle = BG;
  ctx.beginPath();
  ctx.arc(cx, cy, pr, 0, Math.PI * 2);
  ctx.fill();

  // Pin body (teardrop tail)
  ctx.fillStyle = BG;
  ctx.beginPath();
  ctx.moveTo(cx - 48 * s, cy + 60 * s);
  ctx.quadraticCurveTo(cx, cy + pr + 100 * s, cx, cy + pr + 180 * s);
  ctx.quadraticCurveTo(cx, cy + pr + 100 * s, cx + 48 * s, cy + 60 * s);
  ctx.closePath();
  ctx.fill();

  // Inner dot
  ctx.fillStyle = THEME;
  ctx.beginPath();
  ctx.arc(cx, cy, 46 * s, 0, Math.PI * 2);
  ctx.fill();

  return canvas.toBuffer("image/png");
}

for (const size of SIZES) {
  const buf  = drawIcon(size);
  const file = join(OUT_DIR, `icon-${size}.png`);
  writeFileSync(file, buf);
  console.log(`✓  ${file}  (${size}×${size})`);
}
