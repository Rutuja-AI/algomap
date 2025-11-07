// src/animators/tree/shared.jsx
import { motion } from "framer-motion";

// 🎨 Color mapping for different actions
const MODE_COLORS = {
  insert: { stroke: "#2563eb", pulse: "#3b82f6" },   // blue
  delete: { stroke: "#dc2626", pulse: "#ef4444" },   // red
  compare: { stroke: "#f97316", pulse: "#fb923c" },  // orange
  traverse: { stroke: "#9333ea", pulse: "#a855f7" }, // purple
  default: { stroke: "black", pulse: "black" }
};

// -----------------------------
// Node component (circle with value + pulse animation on highlight)
// -----------------------------
export function TreeNode({ x, y, value, mode = "default", highlight = false }) {
  const colors = MODE_COLORS[mode] || MODE_COLORS.default;

  return (
    <motion.g
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", stiffness: 200, damping: 15 }}
    >
      <motion.circle
        cx={x}
        cy={y}
        r="22"
        fill="white"
        stroke={colors.stroke}
        strokeWidth="2.5"
        animate={
          highlight
            ? { scale: [1, 1.2, 1], stroke: colors.pulse, strokeWidth: [2.5, 5, 2.5] }
            : { scale: 1, stroke: colors.stroke, strokeWidth: 2.5 }
        }
        transition={
          highlight
            ? { duration: 0.8, repeat: Infinity, ease: "easeInOut" }
            : { duration: 0.3 }
        }
      />
      <text
        x={x}
        y={y + 5}
        fontSize="14"
        textAnchor="middle"
        fontWeight="600"
        fill="black"
      >
        {value}
      </text>
    </motion.g>
  );
}

// -----------------------------
// Edge component (line between nodes, can glow on compare)
// -----------------------------
export function TreeEdge({ x1, y1, x2, y2, mode = "default", highlight = false }) {
  const colors = MODE_COLORS[mode] || MODE_COLORS.default;

  return (
    <motion.line
      x1={x1}
      y1={y1}
      x2={x2}
      y2={y2}
      stroke={highlight ? colors.pulse : colors.stroke}
      strokeWidth={highlight ? 3.5 : 2.5}
      initial={{ pathLength: 0 }}
      animate={{ pathLength: 1 }}
      transition={{ duration: 0.6 }}
    />
  );
}
