import React, { useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import { DFS_NARRATION } from "./shared/narrationMap";

/**
 * 💜 DFSAnimator — Debug version to trace missing arrow issue
 */
export default function DFSAnimator({ steps = [], currStep = 0 }) {
  const { nodes, edges, stack, visited, highlight, activeEdges } = useMemo(() => {
    const s = [];
    const v = [];
    let h = null;
    const nSet = new Set();
    const eSet = [];
    const aEdges = [];

    for (let i = 0; i <= currStep && i < steps.length; i++) {
      const st = steps[i];
      let { action, value, source, target, description } = st;

      if (!value && description) {
        const match = description.match(/node\s+([A-Za-z0-9]+)/i);
        if (match) value = match[1];
      }

      if (value) nSet.add(value);
      if (source) nSet.add(source);
      if (target) nSet.add(target);

      if (action === "push" && value) {
        if (!s.includes(value)) s.push(value);
      } else if (action === "pop" && value) {
        const idx = s.indexOf(value);
        if (idx !== -1) s.splice(idx, 1);
      }

      if (action === "visit") {
        if (value && !v.includes(value)) v.push(value);
        h = value;
      }

      if (["connect", "edge", "traverse"].includes(action)) {
        if (source && target) {
          eSet.push([source, target]);
          aEdges.push([source, target]);
        }
      }
    }

    console.groupCollapsed("🎬 DFSAnimator Debug");
    console.log("Total steps:", steps.length);
    console.log("Edges parsed:", eSet);
    console.log("Active edges:", aEdges);
    console.log("Nodes:", Array.from(nSet));
    console.log("Stack:", s);
    console.log("Visited:", v);
    console.groupEnd();

    return {
      nodes: Array.from(nSet),
      edges: eSet,
      activeEdges: aEdges,
      stack: [...s],
      visited: v,
      highlight: h,
    };
  }, [steps, currStep]);

  const radius = 150;
  const nodePositions = nodes.map((n, i) => {
    const angle = (2 * Math.PI * i) / nodes.length;
    return { id: n, x: 200 + radius * Math.cos(angle), y: 200 + radius * Math.sin(angle) };
  });
  const getPos = (id) => nodePositions.find((p) => p.id === id);
  const markerId = "dfs-arrow";


  // 🧩 Log each render pass
  useEffect(() => {
    console.groupCollapsed("🧩 DFS Render Cycle");
    console.log("Marker ID:", markerId);
    console.log("window.location.href:", window.location.href);
    console.log("Edges drawn:", edges);
    console.log("ActiveEdges:", activeEdges);
    console.log("Node positions:", nodePositions);
    console.groupEnd();
  });

  return (
    <div className="flex flex-col items-center gap-4">
      {/* 💜 DFS glossary bar */}
      <div className="flex flex-wrap justify-center gap-2 text-xs bg-purple-50 border border-purple-200 px-3 py-2 rounded-2xl shadow-sm w-fit">
        <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded-md">
          🧱 <b>Stack</b>: LIFO structure
        </span>
        <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded-md">
          ⬆️ <b>Push</b>: Add node for deeper exploration
        </span>
        <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded-md">
          ⬇️ <b>Pop</b>: Remove node from the top
        </span>
        <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded-md">
          👣 <b>Visit</b>: Mark explored
        </span>
        <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded-md">
          🔗 <b>Traverse</b>: Follow edge to neighbor
        </span>
      </div>

      {/* 🌐 Graph visualization */}
      <svg
        width="400"
        height="400"
        xmlns="http://www.w3.org/2000/svg"
        xmlnsXlink="http://www.w3.org/1999/xlink"
      >
      <defs>
        <marker
          id={markerId}
          viewBox="0 0 10 10"
          refX="8.5"   // positions arrow tip slightly beyond line end
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto-start-reverse"
        >
          <path d="M 0 0 L 10 5 L 0 10 z" fill="#a855f7" />
        </marker>
      </defs>

    {edges.map(([u, v], i) => {
      const a = getPos(u);
      const b = getPos(v);
      if (!a || !b) {
        console.warn("⚠️ Missing node position for edge:", u, v);
        return null;
      }

      // 🧭 Shorten line so arrow sits outside node circle
      const shrink = 18; // ≈ node radius
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const len = Math.sqrt(dx * dx + dy * dy);
      const ux = dx / len;
      const uy = dy / len;
      const x1 = a.x + ux * shrink;
      const y1 = a.y + uy * shrink;
      const x2 = b.x - ux * shrink;
      const y2 = b.y - uy * shrink;

      const active = activeEdges.find(([s, t]) => s === u && t === v);
      console.log(`🧭 Drawing edge ${u} → ${v}`, { x1, y1, x2, y2, marker: `url(#${markerId})` });

      return (
        <line
          key={i}
          x1={x1}
          y1={y1}
          x2={x2}
          y2={y2}
          stroke={active ? "#a855f7" : "#aaa"}
          strokeWidth={active ? 3 : 2}
          markerEnd={`url(#${markerId})`}
          strokeLinecap="round"
        />
      );
    })}


        {/* Nodes */}
        {nodePositions.map((p) => (
          <motion.circle
            key={p.id}
            cx={p.x}
            cy={p.y}
            r="20"
            fill={
              highlight === p.id
                ? "#a855f7"
                : visited.includes(p.id)
                ? "#e9d5ff"
                : "#f3f4f6"
            }
            stroke="#6b21a8"
            strokeWidth="2"
          />
        ))}

        {/* Labels */}
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

      {/* 🧭 Stack state */}
      <div className="text-sm font-medium text-purple-700">
        🧭 Stack: [{stack.join(", ") || "∅"}]
      </div>
    </div>
  );
}
