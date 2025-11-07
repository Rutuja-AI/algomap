// /animators_ai/DNAAnimatorCore.jsx
import React from "react";

/**
 * 🧬 DNAAnimatorCore — layout shell for AI-driven visuals
 *  → children can be boxes, circles, edges, arrows
 */
export default function DNAAnimatorCore({ children, width = 600, height = 400 }) {
  return (
    <div
      className="relative mx-auto overflow-visible flex items-center justify-center"
      style={{ width, height }}
    >
      <svg className="absolute left-0 top-0" width={width} height={height}>
        <defs>
          <marker id="arrowHead" markerWidth="7" markerHeight="7" refX="7" refY="3.5" orient="auto">
            <polygon points="0 0, 7 3.5, 0 7" />
          </marker>
        </defs>
      </svg>
      {children}
    </div>
  );
}
