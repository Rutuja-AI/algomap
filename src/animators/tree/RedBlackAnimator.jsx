import { useMemo } from "react";
import { motion } from "framer-motion";
import { TreeEdge } from "./shared";

// 🎨 Colors for red-black
const RB_COLORS = {
  red: "#ef4444",
  black: "#111827",
  highlight: "#facc15", // yellow pulse for rotation/recolor
};

// -----------------------------
// Node helpers
// -----------------------------
function makeNode(value, color = "black") {
  return {
    id: `n${Math.random().toString(36).slice(2)}`,
    value: String(value),
    color,
    left: null,
    right: null,
  };
}

function findNode(root, value) {
  if (!root) return null;
  if (String(root.value) === String(value)) return root;
  return findNode(root.left, value) || findNode(root.right, value);
}

// -----------------------------
// Layout
// -----------------------------
function layoutTree(node, x = 400, y = 60, dx = 120, positions = {}) {
  if (!node) return positions;
  positions[node.id] = { x, y };

  if (node.left) layoutTree(node.left, x - dx, y + 80, dx / 1.4, positions);
  if (node.right) layoutTree(node.right, x + dx, y + 80, dx / 1.4, positions);

  return positions;
}

// -----------------------------
// Node Renderer
// -----------------------------
function TreeNode({ x, y, value, color, highlight }) {
  const fillColor = RB_COLORS[color] || RB_COLORS.black;
  return (
    <g>
      <motion.circle
        cx={x}
        cy={y}
        r={20}
        fill={fillColor}
        stroke={highlight ? RB_COLORS.highlight : "#000"}
        strokeWidth={highlight ? 4 : 2}
        animate={highlight ? { scale: [1, 1.2, 1] } : { scale: 1 }}
        transition={
          highlight
            ? { duration: 0.8, repeat: Infinity, ease: "easeInOut" }
            : { duration: 0.3 }
        }
      />
      <text
        x={x}
        y={y + 5}
        textAnchor="middle"
        fill="#fff"
        fontWeight="600"
      >
        {value}
      </text>
    </g>
  );
}

// -----------------------------
// Main Animator
// -----------------------------
export default function RedBlackAnimator({ steps = [], meta = {}, currentIndex = null }) {
  const { root, positions, narration, highlightNode } = useMemo(() => {
    let root = null;
    let narr = "";
    let highlightNode = null;

    const upto = currentIndex != null ? currentIndex : steps.length;
    for (let i = 0; i < upto; i++) {
      const st = steps[i];
      narr = st.description || st.action;

      if (st.action === "set_root") {
        root = makeNode(st.value, st.color || "black");
      }

      if (st.action === "insert") {
        const newNode = makeNode(st.value, st.color || "red");
        if (!root) root = newNode;
        else {
          // simple BST insert for visualization
          let curr = root;
          while (true) {
            if (parseInt(st.value) < parseInt(curr.value)) {
              if (!curr.left) {
                curr.left = newNode;
                break;
              }
              curr = curr.left;
            } else {
              if (!curr.right) {
                curr.right = newNode;
                break;
              }
              curr = curr.right;
            }
          }
        }
        highlightNode = st.value;
      }

      if (st.action === "recolor") {
        const target = findNode(root, st.node) || root;
        if (target) {
          if (st.color === "red" || st.color === "black") {
            target.color = st.color;
          } else {
            target.color = target.color === "red" ? "black" : "red";
          }
          highlightNode = target.value;
        }
      }

      if (st.action === "rotate-left" || st.action === "rotate-right") {
        // just highlight pivot for now
        highlightNode = st.pivot || st.node || null;
      }
    }

    const positions = root ? layoutTree(root) : {};
    return { root, positions, narration: narr, highlightNode };
  }, [steps, currentIndex]);

  const renderNode = (node) => {
    if (!node) return null;
    const pos = positions[node.id];
    return (
      <g key={node.id}>
        {node.left && (
          <>
            <TreeEdge
              x1={pos.x}
              y1={pos.y}
              x2={positions[node.left.id]?.x}
              y2={positions[node.left.id]?.y}
            />
            {renderNode(node.left)}
          </>
        )}
        {node.right && (
          <>
            <TreeEdge
              x1={pos.x}
              y1={pos.y}
              x2={positions[node.right.id]?.x}
              y2={positions[node.right.id]?.y}
            />
            {renderNode(node.right)}
          </>
        )}
        <TreeNode
          x={pos.x}
          y={pos.y}
          value={node.value}
          color={node.color}
          highlight={String(node.value) === String(highlightNode)}
        />
      </g>
    );
  };

  return (
    <div className="w-full h-full flex flex-col items-center gap-3">
      <svg width="100%" height="400">
        {root ? renderNode(root) : (
          <text x="50%" y="50%" textAnchor="middle">
            ∅ empty Red-Black Tree
          </text>
        )}
      </svg>
      <div className="text-sm text-gray-600">🗣 {narration || "Waiting for steps…"}</div>
    </div>
  );
}
