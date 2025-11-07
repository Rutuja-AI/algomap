import { useEffect, useState } from "react";
import { TreeNode, TreeEdge } from "./shared";

// helper: layout tree nodes with fixed spacing
function layoutTree(node, x = 400, y = 60, dx = 200, positions = {}) {
  if (!node) return positions;
  positions[node.value] = { x, y };
  if (node.left) layoutTree(node.left, x - dx, y + 100, dx / 2, positions);
  if (node.right) layoutTree(node.right, x + dx, y + 100, dx / 2, positions);
  return positions;
}

export default function AVL({ steps, meta }) {
  const [tree, setTree] = useState(null);
  const [positions, setPositions] = useState({});
  const [highlight, setHighlight] = useState(null);
  const [narration, setNarration] = useState("");

  useEffect(() => {
    let root = null;

    // === Tree operations ===
    function insertNode(root, val) {
      if (!root) return { value: val, left: null, right: null };
      if (val < root.value) root.left = insertNode(root.left, val);
      else root.right = insertNode(root.right, val);
      return root;
    }

    function deleteNode(root, val) {
      if (!root) return null;
      if (val < root.value) {
        root.left = deleteNode(root.left, val);
      } else if (val > root.value) {
        root.right = deleteNode(root.right, val);
      } else {
        // Node found
        if (!root.left) return root.right;
        if (!root.right) return root.left;
        // 2 children: inorder successor
        let successor = root.right;
        while (successor.left) successor = successor.left;
        root.value = successor.value;
        root.right = deleteNode(root.right, successor.value);
      }
      return root;
    }

    function rotateRight(node) {
      if (!node || !node.left) return node;
      const newRoot = node.left;
      node.left = newRoot.right;
      newRoot.right = node;
      return newRoot;
    }

    function rotateLeft(node) {
      if (!node || !node.right) return node;
      const newRoot = node.right;
      node.right = newRoot.left;
      newRoot.left = node;
      return newRoot;
    }

    // === Replay steps ===
    steps.forEach((s) => {
      const act = s.action;
      setNarration(s.description || act || "");
      if (act === "set_root") {
        root = { value: parseInt(s.value), left: null, right: null };
      } else if (act === "insert") {
        root = insertNode(root, parseInt(s.value));
      } else if (act === "delete") {
        root = deleteNode(root, parseInt(s.value));
      } else if (act === "rotate_left") {
        root = rotateLeft(root);
      } else if (act === "rotate_right") {
        root = rotateRight(root);
      } else if (act === "visit" || act === "search") {
        setHighlight(s.value);
      }
    });

    setTree(root);
    if (root) setPositions(layoutTree(root));
  }, [steps]);

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
    <div className="w-full h-full flex flex-col items-center gap-3">
      <svg width="100%" height="400">
        {tree ? (
          renderTree(tree)
        ) : (
          <text x="50%" y="50%" textAnchor="middle">
            empty AVL tree
          </text>
        )}
      </svg>
      <div className="text-sm text-gray-600">🗣 {narration}</div>
    </div>
  );
}
