// src/animators/graph/Directed.jsx
import { motion } from "framer-motion";

export default function Directed({ steps = [], meta = {} }) {
  const nodes = meta?.nodes || [];
  const edges = meta?.edges || [];

  // ✅ Circle layout
  const centerX = 300;
  const centerY = 200;
  const radius = 120;
  const angleStep = (2 * Math.PI) / nodes.length;

  const nodePositions = {};
  nodes.forEach((n, i) => {
    const angle = i * angleStep - Math.PI / 2;
    nodePositions[n] = {
      x: centerX + radius * Math.cos(angle),
      y: centerY + radius * Math.sin(angle),
    };
  });

  // ✅ Active edges (step-by-step)
  const activeEdges = steps
    .filter((s) => s.action === "add_edge")
    .map((s) => [s.from_, s.to]);

  // ✅ Last edge to highlight
  const lastStep = activeEdges.length ? activeEdges[activeEdges.length - 1] : null;

  // 🔹 helper: draw a line + arrowhead
  const drawArrow = (from, to, color, key) => {
    const angle = Math.atan2(to.y - from.y, to.x - from.x);
    const headlen = 12;

    const arrowX1 = to.x - headlen * Math.cos(angle - Math.PI / 6);
    const arrowY1 = to.y - headlen * Math.sin(angle - Math.PI / 6);

    const arrowX2 = to.x - headlen * Math.cos(angle + Math.PI / 6);
    const arrowY2 = to.y - headlen * Math.sin(angle + Math.PI / 6);

    return (
      <g key={key}>
        <motion.line
          x1={from.x}
          y1={from.y}
          x2={to.x}
          y2={to.y}
          stroke={color}
          strokeWidth="2"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.6 }}
        />
        <polygon
          points={`${to.x},${to.y} ${arrowX1},${arrowY1} ${arrowX2},${arrowY2}`}
          fill={color}
        />
      </g>
    );
  };

  return (
    <div className="flex flex-col gap-2">
      <svg width="100%" height="400">
        {/* Draw animated edges */}
        {activeEdges.map(([u, v], idx) => {
          const from = nodePositions[u];
          const to = nodePositions[v];
          if (!from || !to) return null;

          const isLast = lastStep && lastStep[0] === u && lastStep[1] === v;
          return drawArrow(from, to, isLast ? "red" : "black", idx);
        })}

        {/* Draw nodes */}
        {nodes.map((n, idx) => {
          const pos = nodePositions[n];
          return (
            <g key={idx} transform={`translate(${pos.x}, ${pos.y})`}>
              <circle r="20" fill="white" stroke="black" strokeWidth="2" />
              <text
                textAnchor="middle"
                alignmentBaseline="middle"
                dy=".3em"
                fontSize="14"
              >
                {n}
              </text>
            </g>
          );
        })}
      </svg>

      {/* 🔹 Narration */}
      {steps.length > 0 && (
        <div className="text-base opacity-80 text-center">
          🗣️ {steps[steps.length - 1].description}
        </div>
      )}
    </div>
  );
}
