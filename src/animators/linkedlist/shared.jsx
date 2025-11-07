import React from "react";

// Simple node box
export function Node({ value, glow }) {
  return (
    <div
      className={`px-4 py-3 rounded-2xl shadow-md border text-lg font-semibold ${
        glow ? "ring-2 ring-amber-500 scale-[1.02]" : ""
      }`}
      style={{ minWidth: 64, textAlign: "center" }}
    >
      {String(value)}
    </div>
  );
}

// Arrow helper
export function Arrow({ x1, y1, x2, y2, offset = 26, subtle = false }) {
  const dx = x2 - x1, dy = y2 - y1;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len, uy = dy / len;
  const sx = x1 + ux * offset, sy = y1 + uy * offset;
  const ex = x2 - ux * offset, ey = y2 - uy * offset;
  return (
    <line
      x1={sx} y1={sy} x2={ex} y2={ey}
      stroke="currentColor" strokeWidth={2}
      markerEnd="url(#arrowHead)"
      opacity={subtle ? 0.65 : 0.9}
    />
  );
}
