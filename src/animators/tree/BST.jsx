import { useMemo } from "react";
import { TreeNode, TreeEdge } from "./shared";
import useTraversalTracker from "./useTraversalTracker";
import TraversalPanel from "./TraversalPanel";

// helper: insert node into BST
function insertNode(root, val) {
  if (!root) return { value: val, left: null, right: null };
  if (val < root.value) root.left = insertNode(root.left, val);
  else root.right = insertNode(root.right, val);
  return root;
}

// helper: layout BST nodes with x/y coordinates
function layoutTree(node, x = 400, y = 60, dx = 200, positions = {}) {
  if (!node) return positions;
  positions[node.value] = { x, y };
  if (node.left) layoutTree(node.left, x - dx, y + 100, dx / 2, positions);
  if (node.right) layoutTree(node.right, x + dx, y + 100, dx / 2, positions);
  return positions;
}

// ✅ safe parse for values (fixes NaN issue)
function parseValue(v) {
  if (v === null || v === undefined) return "";
  return isNaN(Number(v)) ? String(v) : parseInt(v);
}

export default function BST({ steps = [] }) {
  // derive tree + highlight
  const { tree, positions, highlight } = useMemo(() => {
    let root = null;
    let glow = null;

    for (const st of steps) {
      const act = st?.action;

      if (act === "set_root") {
        const v = parseValue(st.value);
        root = { value: v, left: null, right: null };
      } else if (act === "insert") {
        const v = parseValue(st.value);
        root = insertNode(root, v);
      } else if (act === "visit") {
        glow = String(st.value);
      }
    }

    return {
      tree: root,
      positions: root ? layoutTree(root) : {},
      highlight: glow,
    };
  }, [steps]);

  // ✅ new hook for narration + traversal path
  const { narration, traversalPath } = useTraversalTracker(steps);

  // recursive render
  const renderTree = (node) => {
    if (!node) return null;
    const pos = positions[node.value];
    return (
      <>
        {node.left && (
          <>
            <TreeEdge
              x1={pos.x}
              y1={pos.y}
              x2={positions[node.left.value].x}
              y2={positions[node.left.value].y}
            />
            {renderTree(node.left)}
          </>
        )}
        {node.right && (
          <>
            <TreeEdge
              x1={pos.x}
              y1={pos.y}
              x2={positions[node.right.value].x}
              y2={positions[node.right.value].y}
            />
            {renderTree(node.right)}
          </>
        )}
        <TreeNode
          x={pos.x}
          y={pos.y}
          value={node.value}
          highlight={highlight === String(node.value)}
        />
      </>
    );
  };

  return (
    <div className="flex flex-col gap-2">
      <svg width="100%" height="400">
        {tree ? renderTree(tree) : (
          <text x="50%" y="50%" textAnchor="middle">∅ empty BST</text>
        )}
      </svg>

      {/* ✅ Reusable traversal panel */}
      <TraversalPanel narration={narration} path={traversalPath} />
    </div>
  );
}
