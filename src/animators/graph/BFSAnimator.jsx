import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { BFS_NARRATION } from "./shared/narrationMap";


/**
 * 🧭 BFSAnimator — Step-driven, queue + edge animation
 * Includes glossary + educational narration line
 */



export default function BFSAnimator({ steps = [], currStep = 0 }) {
  // derive BFS state based on all steps up to currStep
  // 🧩 universal meta patch for graph animators
  const metaNodes = meta?.graph_nodes || meta?.nodes || [];
  const metaEdges = meta?.graph_edges || meta?.edges || [];
  console.log("🎨 BFSAnimator meta:", metaNodes, metaEdges);
  const { nodes, edges, queue, visited, highlight, activeEdges } = useMemo(() => {
    const q = [];
    const v = [];
    let h = null;
    const nSet = new Set();
    const eSet = [];
    const aEdges = [];

  for (let i = 0; i <= currStep && i < steps.length; i++) {
    const st = steps[i];
    let { action, value, source, target, description } = st;

    // 🩵 fallback: try to get node name from description
    if (!value && description) {
      const match = description.match(/node\s+([A-Za-z0-9]+)/i);
      if (match) value = match[1];
    }

    // record nodes
    if (value) nSet.add(value);
    if (source) nSet.add(source);
    if (target) nSet.add(target);

    // queue logic
    if (action === "enqueue" && value) {
      if (!q.includes(value)) q.push(value);
    } else if (action === "dequeue" && value) {
      const idx = q.indexOf(value);
      if (idx !== -1) q.splice(idx, 1);
    }

    // visit / highlight
    if (action === "visit") {
      if (value && !v.includes(value)) v.push(value);
      h = value;
    }

    // edges
    if (action === "connect" || action === "edge" || action === "traverse") {
      if (source && target) {
        eSet.push([source, target]);
        aEdges.push([source, target]);
      }
    }
  }


    return {
      nodes: Array.from(nSet),
      edges: eSet,
      activeEdges: aEdges,
      queue: [...q],   // keep the current queue state here
      visited: v,
      highlight: h,
    };

  }, [steps, currStep]);

  // 🧠 Narration resolver
  const renderNarration = (step) => {
    if (!step) return "";
    const { action, value, source, target } = step;
    switch (action) {
      case "initialize":
        return BFS_NARRATION.initialize?.(value);
      case "dequeue":
        return BFS_NARRATION.dequeue?.(value);
      case "enqueue":
        return BFS_NARRATION.enqueue?.(value);
      case "visit":
        return BFS_NARRATION.visit?.(value);
      case "traverse":
        return BFS_NARRATION.traverse?.(source, target);
      case "complete":
        return BFS_NARRATION.complete?.();
      default:
        return step.description || "";
    }
  };

  // circular layout
  const radius = 150;
  const nodePositions = nodes.map((n, i) => {
    const angle = (2 * Math.PI * i) / nodes.length;
    return { id: n, x: 200 + radius * Math.cos(angle), y: 200 + radius * Math.sin(angle) };
  });

  const getPos = (id) => nodePositions.find((p) => p.id === id);
  const narration = renderNarration(steps[currStep]);

  return (
    <div className="flex flex-col items-center gap-4">
      {/* 💙 BFS glossary bar */}
      <div className="flex flex-wrap justify-center gap-2 text-xs bg-blue-50 border border-blue-200 px-3 py-2 rounded-2xl shadow-sm w-fit">
        <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-md">
          🌀 <b>Queue</b>: FIFO structure
        </span>
        <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-md">
          📤 <b>Dequeue</b>: Take node to process
        </span>
        <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-md">
          📥 <b>Enqueue</b>: Add node for later
        </span>
        <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-md">
          👣 <b>Visit</b>: Mark explored
        </span>
        <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-md">
          🔗 <b>Traverse</b>: Follow edge to neighbor
        </span>
      </div>

      {/* 🌐 Graph visualization */}
      <svg width="400" height="400">
        {edges.map(([u, v], i) => {
          const a = getPos(u);
          const b = getPos(v);
          if (!a || !b) return null;
          return (
            <line
              key={i}
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
              stroke={activeEdges.find(([s, t]) => s === u && t === v) ? "#60a5fa" : "#aaa"}
              strokeWidth={2}
              markerEnd="url(#arrow)"
            />
          );
        })}

        <defs>
          <marker id="arrow" markerWidth="8" markerHeight="8" refX="5" refY="3" orient="auto">
            <path d="M0,0 L0,6 L6,3 z" fill="#aaa" />
          </marker>
        </defs>

        {nodePositions.map((p) => (
          <motion.circle
            key={p.id}
            cx={p.x}
            cy={p.y}
            r="20"
            fill={
              highlight === p.id
                ? "#60a5fa"
                : visited.includes(p.id)
                ? "#a7f3d0"
                : "#e5e7eb"
            }
            stroke="#374151"
            strokeWidth="2"
          />
        ))}

        {nodePositions.map((p) => (
          <text
            key={p.id}
            x={p.x}
            y={p.y + 5}
            textAnchor="middle"
            className="font-semibold text-sm"
          >
            {p.id}
          </text>
        ))}
      </svg>

      {/* 🧭 Queue state */}
      <div className="text-sm font-medium text-blue-600">
        🧭 Queue: [{queue.join(", ") || "∅"}]
      </div>

      {/* 💬 Educational narration */}
      {narration && (
        <div className="text-center text-blue-700 bg-blue-50 border border-blue-200 rounded-lg px-4 py-2 w-fit shadow-sm">
          {narration}
        </div>
      )}
    </div>
  );
}
