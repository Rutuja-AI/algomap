// /animators_ai/DNABadges.jsx
import React from "react";

/**
 * 🏷 DNABadge — reusable label (HEAD, TOP, etc.)
 */
export default function DNABadge({ label = "", color = "blue" }) {
  if (!label) return null;
  return (
    <span
      className={`absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-semibold px-2 py-0.5 rounded-full border bg-${color}-100 text-${color}-700`}
    >
      {label}
    </span>
  );
}
