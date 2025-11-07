import React from "react";

export default function ArrowVisual({ data = {} }) {
  const { x1 = 0, y1 = 0, x2 = 0, y2 = 0, subtle = false } = data;
  return (
    <svg className="absolute left-0 top-0 pointer-events-none" width="100%" height="100%">
      <defs>
        <marker id="arrowHead" markerWidth="6" markerHeight="6" refX="6" refY="3" orient="auto">
          <polygon points="0 0, 6 3, 0 6" />
        </marker>
      </defs>
      <line
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke="currentColor"
        strokeWidth={subtle ? 1.5 : 2}
        markerEnd="url(#arrowHead)"
        opacity={subtle ? 0.6 : 0.9}
      />
    </svg>
  );
}
