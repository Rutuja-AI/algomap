// /animators_ai/DNAArrowCurved.jsx
import React from "react";

/**
 * 🔄 DNAArrowCurved — curved arrow for circular or bidirectional links
 */
export default function DNAArrowCurved({
  x1,
  y1,
  x2,
  y2,
  offset = 26,
  subtle = false,
}) {
  const dx = x2 - x1,
    dy = y2 - y1;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len,
    uy = dy / len;
  const sx = x1 + ux * offset,
    sy = y1 + uy * offset;
  const ex = x2 - ux * offset,
    ey = y2 - uy * offset;
  const mx = (sx + ex) / 2,
    my = (sy + ey) / 2;
  const cx = mx + (my - sy) * 0.2,
    cy = my - (mx - sx) * 0.2;

  return (
    <path
      d={`M ${sx} ${sy} Q ${cx} ${cy} ${ex} ${ey}`}
      stroke="currentColor"
      strokeWidth={2}
      fill="none"
      markerEnd="url(#arrowHead)"
      opacity={subtle ? 0.55 : 0.95}
    />
  );
}
