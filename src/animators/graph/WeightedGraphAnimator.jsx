// src/animators/graph/WeightedGraphAnimator.jsx
import { motion } from "framer-motion";

export default function WeightedGraphAnimator({ steps = [], meta = {}, currentIndex: currentIndexProp }) {
  const nodes = meta.nodes || [];
  const edges = meta.edges || []; // Format: [from, to, weight]

  // -----------------------------
  // Circle layout for nodes
  // -----------------------------
  const centerX = 300, centerY = 200, radius = 140;
  const angleStep = (2 * Math.PI) / (nodes.length || 1);
  const nodePositions = {};
  nodes.forEach((n, i) => {
    const angle = i * angleStep - Math.PI / 2;
    nodePositions[n] = {
      x: centerX + radius * Math.cos(angle),
      y: centerY + radius * Math.sin(angle),
    };
  });

  // -----------------------------
  // Steps tracking
  // -----------------------------
  const currentIndex = currentIndexProp ?? steps.length - 1;
  const visibleSteps = steps.slice(0, currentIndex + 1);
  const current = visibleSteps[currentIndex];

  const visited = visibleSteps.filter((s) => s.action === "visit").map((s) => s.value);
  const relaxed = visibleSteps.filter((s) => s.action === "relax").map((s) => [s.from_, s.to]);

  // 🔹 Track last known distances
  let latestDistances = {};
  for (const s of visibleSteps) {
    if (s.distance) {
      latestDistances = s.distance;
    }
  }

  // -----------------------------
  // Render
  // -----------------------------
  return (
    <div className="p-4">
      <h3 className="font-bold text-purple-700 mb-2">Weighted Graph Traversal (Dijkstra)</h3>

      <svg width="650" height="450" style={{ border: "1px solid #ddd" }}>
        <defs>
          <marker
            id="arrow-weighted"
            markerWidth="6"
            markerHeight="6"
            refX="10"
            refY="3"
            orient="auto"
            markerUnits="strokeWidth"
          >
            <path d="M0,0 L0,6 L9,3 z" fill="black" />
          </marker>
        </defs>

        {/* Edges with weight labels */}
        {edges.map(([u, v, w], idx) => {
          const from = nodePositions[u];
          const to = nodePositions[v];
          if (!from || !to) return null;

          const isRelaxed = relaxed.some(([x, y]) => x === u && y === v);

          const midX = (from.x + to.x) / 2;
          const midY = (from.y + to.y) / 2;

          return (
            <g key={idx}>
              <motion.line
                x1={from.x}
                y1={from.y}
                x2={to.x}
                y2={to.y}
                stroke={isRelaxed ? "orange" : "#999"}
                strokeWidth={isRelaxed ? 3 : 1.5}
                markerEnd="url(#arrow-weighted)"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.6 }}
              />
              <text
                x={midX}
                y={midY - 5}
                fontSize="12"
                fill="black"
                textAnchor="middle"
              >
                {w}
              </text>
            </g>
          );
        })}

        {/* Nodes with distances */}
        {nodes.map((n, idx) => {
          const pos = nodePositions[n];
          if (!pos) return null;

          const isVisited = visited.includes(n);
          const isCurrent = current?.action === "visit" && current?.value === n;

          let fill = "lightgray";
          if (isCurrent) fill = "orange";
          else if (isVisited) fill = "#90ee90";

          // show distance value (∞ if not set)
          const distVal = latestDistances[n];
          const distLabel =
            distVal === undefined || distVal === Infinity
              ? "∞"
              : String(distVal);

          return (
            <motion.g
              key={idx}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4 }}
            >
              <circle
                cx={pos.x}
                cy={pos.y}
                r={25}
                fill={fill}
                stroke="black"
                strokeWidth={2}
              />
              <text
                x={pos.x}
                y={pos.y - 2}
                textAnchor="middle"
                fontSize="14"
                fontWeight="bold"
                fill="black"
              >
                {n}
              </text>
              <text
                x={pos.x}
                y={pos.y + 14}
                textAnchor="middle"
                fontSize="12"
                fill="#333"
              >
                {distLabel}
              </text>
            </motion.g>
          );
        })}
      </svg>

      {/* Narration */}
      {current && (
        <div className="mt-2 text-sm">
          <span className="font-semibold text-purple-600">🗣️ {current.description}</span>
        </div>
      )}
    </div>
  );
}
