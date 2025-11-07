// /animators_ai/DNAEdgeLine.jsx
import React from "react";

/**
 * 🌿 DNAEdgeLine — simple div edge between two nodes
 * Great for Tree layouts
 */
export default function DNAEdgeLine({ from, to, color = "gray-400" }) {
  if (!from || !to) return null;
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const len = Math.hypot(dx, dy);
  const angle = (Math.atan2(dy, dx) * 180) / Math.PI;

  return (
    <div
      className={`absolute bg-${color} opacity-60`}
      style={{
        left: from.x + 25,
        top: from.y + 25,
        width: len - 40,
        height: 2,
        transform: `rotate(${angle}deg)`,
        transformOrigin: "0 0",
      }}
    />
  );
}
