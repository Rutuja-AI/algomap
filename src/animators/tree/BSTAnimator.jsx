import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * 🌳 BSTAnimator — narration-driven sync engine
 * Handles build, traversal glow, and proper replay resets.
 */
export default function BSTAnimator({
  steps = [],
  meta = {},
  currStep = 0,
  playing = false,
  speed = 1,
  narration = "",
}) {
  const treeRef = useRef(null);
  const [highlighted, setHighlighted] = useState(null);
  const [tick, setTick] = useState(0);

  // --- recursive insert builder
  const insertNode = (node, value) => {
    if (!node) return { value, left: null, right: null };
    if (value < node.value) node.left = insertNode(node.left, value);
    else if (value > node.value) node.right = insertNode(node.right, value);
    return node;
  };

  // 🧹 clear tree when replay restarts
  useEffect(() => {
    if (currStep === 0 && playing) {
      treeRef.current = null;
      setHighlighted(null);
      setTick((t) => t + 1);
    }
  }, [currStep, playing]);

  // --- narration listener → live animation logic
  useEffect(() => {
    if (!narration) return;
    const text = narration.toLowerCase();
    const numMatch = narration.match(/\d+/);
    const val = numMatch ? Number(numMatch[0]) : null;

    // 🌱 Build phase (quiet, no highlight)
    if (/(create|insert|root|link|set as|left child|right child)/.test(text)) {
      if (val !== null) {
        treeRef.current = insertNode(treeRef.current, val);
      }
    }

    // 🌳 Traversal phase (glow + highlight)
    else if (/(process|visit|output|inorder)/.test(text)) {
      if (val !== null) {
        const id = `n_${val}`;
        setHighlighted(id);

        const nodeEl = document.getElementById(id);
        if (nodeEl) {
          nodeEl.classList.add("inorder-glow");
          setTimeout(() => nodeEl.classList.remove("inorder-glow"), 900 / speed);
        }
      }
    }

    // ↩️ Return or backtrack
    else if (/return|backtrack/.test(text)) {
      setHighlighted(null);
    }

    // 🧹 Reset / Initialize
    else if (/initialize|empty|start traversal/.test(text)) {
      treeRef.current = null;
      setHighlighted(null);
    }

    setTick((t) => t + 1);
  }, [narration]);

  // --- rebuild layout (viewport-aware centering)
  const { nodes, edges } = useMemo(() => {
    const nodes = [];
    const edges = [];
    let x = 0;

    const traverse = (node, depth = 0, parent = null, side = "root") => {
      if (!node) return;
      traverse(node.left, depth + 1, node.value, "left");

      const id = `n_${node.value}`;
      const spacingX = 90 - depth * 6;
      nodes.push({ id, label: node.value, x: x++ * spacingX, y: depth * 100 });
      if (parent !== null) edges.push({ parent: `n_${parent}`, child: id, side });

      traverse(node.right, depth + 1, node.value, "right");
    };

    traverse(treeRef.current);

    if (nodes.length > 0) {
      const minX = Math.min(...nodes.map((n) => n.x));
      const maxX = Math.max(...nodes.map((n) => n.x));
      const midX = (minX + maxX) / 2;
      const containerWidth = window.innerWidth * 0.5;
      const screenCenter = containerWidth / 2;
      nodes.forEach((n) => (n.x = n.x - midX + screenCenter - 25));

      const maxDepth = Math.max(...nodes.map((n) => n.y));
      const verticalOffset = Math.max(0, (maxDepth - 200) / 2);
      nodes.forEach((n) => (n.y -= verticalOffset));
    }

    return { nodes, edges };
  }, [tick, currStep]);

  const nodeStyle = (id) => {
    if (id === highlighted) return "bg-blue-200 border-blue-600 shadow-lg";
    return "bg-gray-100 border-gray-400";
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-center overflow-auto select-none">
      <div
        className="relative flex justify-center items-start"
        style={{ width: "100%", minHeight: "480px", overflow: "visible" }}
      >
        {/* 🌿 Edges */}
        {edges.map((e, i) => {
          const from = nodes.find((n) => n.id === e.parent);
          const to = nodes.find((n) => n.id === e.child);
          if (!from || !to) return null;
          const dx = to.x - from.x;
          const dy = to.y - from.y;
          const len = Math.hypot(dx, dy);
          const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
          return (
            <div
              key={`edge-${i}`}
              className="absolute bg-gray-400 opacity-60"
              style={{
                left: from.x + 30,
                top: from.y + 30,
                width: len - 40,
                height: 2,
                transform: `rotate(${angle}deg)`,
                transformOrigin: "0 0",
              }}
            />
          );
        })}

        {/* 🌳 Nodes */}
        <AnimatePresence>
          {nodes.map((n) => (
            <motion.div
              key={n.id}
              layout
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ type: "spring", stiffness: 120, damping: 15 }}
              className={`absolute flex items-center justify-center rounded-full border shadow-md text-lg font-semibold ${nodeStyle(
                n.id
              )}`}
              style={{ width: 50, height: 50, left: n.x, top: n.y }}
            >
              {n.label}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* 🗣 Narration */}
      <div className="mt-4 text-purple-600 font-semibold text-sm text-center">
        🗣 {narration || "Waiting for step..."}
      </div>
      <p className="text-xs text-gray-400 mt-1">
        Step {currStep + 1} / {steps.length}
      </p>
    </div>
  );
}
