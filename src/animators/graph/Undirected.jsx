import { motion } from "framer-motion";

export function GraphNode({ id, x, y, highlight = false }) {
  return (
    <motion.g
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", stiffness: 200, damping: 15 }}
    >
      <motion.circle
        cx={x}
        cy={y}
        r="20"
        fill="#fff"
        stroke={highlight ? "orange" : "black"}
        strokeWidth="2"
        animate={
          highlight
            ? { scale: [1, 1.2, 1], strokeWidth: [2, 4, 2] }
            : { scale: 1, strokeWidth: 2 }
        }
        transition={
          highlight
            ? { duration: 0.6, repeat: Infinity, ease: "easeInOut" }
            : { duration: 0.3 }
        }
      />
      <text x={x} y={y + 5} textAnchor="middle" fontSize="14" fontWeight="600">
        {id}
      </text>
    </motion.g>
  );
}

export function GraphEdge({ x1, y1, x2, y2, highlight = false }) {
  return (
    <motion.line
      x1={x1}
      y1={y1}
      x2={x2}
      y2={y2}
      stroke={highlight ? "orange" : "black"}
      strokeWidth="2"
      initial={{ pathLength: 0 }}
      animate={{ pathLength: 1 }}
      transition={{ duration: 0.6 }}
    />
  );
}

export default function Undirected({ steps = [], meta = {} }) {
  // ✅ sort nodes numerically
  const nodes = (meta.nodes || []).sort((a, b) => parseInt(a) - parseInt(b));
  const edges = meta.edges || [];

  // ✅ circle layout
  const radius = 150;
  const cx = 300,
    cy = 200;
  const positions = {};
  nodes.forEach((n, i) => {
    const angle = (2 * Math.PI * i) / nodes.length;
    positions[n] = {
      x: cx + radius * Math.cos(angle),
      y: cy + radius * Math.sin(angle),
    };
  });

  // ✅ only show edges that exist up to current step
  const activeEdges = steps
    .filter((s) => s.action === "add_edge")
    .map((s) => [s.from_, s.to]);

  const lastStep = activeEdges.length
    ? activeEdges[activeEdges.length - 1]
    : null;

  return (
    <div className="flex flex-col gap-2">
      <svg width="100%" height="400">
        {activeEdges.map(([u, v], i) => {
          const from = positions[u];
          const to = positions[v];
          const isLast =
            lastStep && lastStep[0] === u && lastStep[1] === v;
          return from && to ? (
            <GraphEdge
              key={i}
              x1={from.x}
              y1={from.y}
              x2={to.x}
              y2={to.y}
              highlight={isLast}
            />
          ) : null;
        })}

        {nodes.map((id) => (
          <GraphNode
            key={id}
            id={id}
            {...positions[id]}
            highlight={
              steps.length &&
              steps[steps.length - 1]?.action === "visit" &&
              steps[steps.length - 1]?.value === id
            }
          />
        ))}
      </svg>

      {steps.length > 0 && (
        <div className="text-base opacity-80 text-center">
          🗣️ {steps[steps.length - 1].description}
        </div>
      )}
    </div>
  );
}
