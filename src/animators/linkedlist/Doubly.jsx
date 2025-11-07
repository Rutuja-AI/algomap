import React, { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * Doubly Linked List (Sequential Playback Edition)
 * -----------------------------------------------
 * ✅ Step-by-step playback with narration sync
 * ✅ Supports insert, delete, display, traverse, visit
 * ✅ Animates both next and prev arrows (↔)
 * ✅ Compatible with AlgoMap's speed slider & teaching mode
 */
export default function Doubly({ steps = [], meta = {}, speed = 1, playing = true }) {
  const {
    gap = 80,
    boxW = 64,
    boxH = 44,
    fade = 0.22,
    showBadges = true,
    cursor = true,
  } = meta || {};

  // 🌱 Dynamic playback state
  const [nodes, setNodes] = useState([]);
  const [highlight, setHighlight] = useState(null);
  const [narration, setNarration] = useState("doubly linked list");
  const [currStepIndex, setCurrStepIndex] = useState(0);

  // 🎬 Stepwise playback controller
  useEffect(() => {
    if (!steps.length || !playing) return;

    let i = 0;
    setNodes([]);
    setHighlight(null);
    setNarration("Starting visualization...");

    const interval = setInterval(() => {
      if (i >= steps.length) {
        clearInterval(interval);
        setNarration("✅ Visualization complete.");
        return;
      }

      const st = steps[i];
      const act = st.action;
      const val = st.value;

      // Narration update
      setNarration(st.description || act || "");

      // 🔁 Update nodes progressively
      setNodes((prev) => {
        let newList = [...prev];
        if (act === "insert" || act === "push") {
          newList.push(val);
        } else if (act === "delete" || act === "pop") {
          newList = newList.filter((x) => String(x) !== String(val));
        } else if (act === "display" && Array.isArray(st.list_state)) {
          newList = st.list_state;
        }
        return newList;
      });

      // ✨ Highlight active node
      setHighlight(val ?? null);

      setCurrStepIndex(i);
      i++;
    }, 1300 / speed);

    return () => clearInterval(interval);
  }, [steps, speed, playing]);

  // 🧮 Layout geometry
  const n = nodes.length;
  const padX = 32;
  const W = Math.max(360, n * (boxW + gap) + padX * 2 - gap);
  const H = 220;
  const positions = useMemo(
    () =>
      nodes.map((_, i) => ({
        x: padX + i * (boxW + gap) + boxW / 2,
        y: H / 2,
      })),
    [nodes]
  );
  const idx = Object.fromEntries(nodes.map((v, i) => [String(v), i]));

  // trim overlapping arrow lines
  const cut = (x1, y1, x2, y2, offset = 22) => {
    const dx = x2 - x1,
      dy = y2 - y1;
    const len = Math.hypot(dx, dy) || 1;
    const ux = dx / len,
      uy = dy / len;
    return {
      sx: x1 + ux * offset,
      sy: y1 + uy * offset,
      ex: x2 - ux * offset,
      ey: y2 - uy * offset,
    };
  };

  // ↔️ bidirectional edges
  const edges = Array.from({ length: Math.max(0, n - 1) }, (_, i) => {
    const a = positions[i],
      b = positions[i + 1];
    const { sx, sy, ex, ey } = cut(a.x, a.y, b.x, b.y, 26);
    return { id: `edge:${i}-${i + 1}`, x1: sx, y1: sy, x2: ex, y2: ey };
  });

  const hiIndex = highlight != null ? idx[String(highlight)] : null;
  const cur = hiIndex != null ? positions[hiIndex] : null;

  // 🧠 Render
  return (
    <div className="w-full h-full flex flex-col gap-4">
      <div className="relative mx-auto" style={{ width: W, height: H }}>
        {/* --- Bidirectional arrows --- */}
        <svg className="absolute left-0 top-0" width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
          <defs>
            <marker id="arrowHeadF" markerWidth="7" markerHeight="7" refX="7" refY="3.5" orient="auto">
              <polygon points="0 0, 7 3.5, 0 7" />
            </marker>
            <marker id="arrowHeadB" markerWidth="7" markerHeight="7" refX="0" refY="3.5" orient="auto">
              <polygon points="7 0, 0 3.5, 7 7" />
            </marker>
          </defs>
          <AnimatePresence>
            {edges.map((e) => (
              <MotionLine
                key={e.id}
                x1={e.x1}
                y1={e.y1}
                x2={e.x2}
                y2={e.y2}
                markerStart="url(#arrowHeadB)"
                markerEnd="url(#arrowHeadF)"
                opacity={0.9}
                duration={fade}
              />
            ))}
          </AnimatePresence>
        </svg>

        {/* --- Nodes --- */}
        {n === 0 ? (
          <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-sm">
            ∅ empty doubly linked list
          </div>
        ) : (
          nodes.map((v, i) => (
            <div
              key={`dll:${i}:${String(v)}`}
              className={`absolute -translate-x-1/2 -translate-y-1/2 flex items-center justify-center rounded-2xl
                          border shadow-md bg-white select-none px-3 transition-all
                          ${String(highlight) === String(v)
                            ? "ring-2 ring-amber-500 scale-[1.05]"
                            : ""}`}
              style={{
                left: positions[i].x,
                top: positions[i].y,
                width: boxW,
                height: boxH,
                fontWeight: 600,
              }}
              title={`node ${i}`}
            >
              {String(v)}
              {showBadges && i === 0 && (
                <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 border">
                  HEAD
                </span>
              )}
              {showBadges && i === n - 1 && (
                <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 border">
                  TAIL
                </span>
              )}
            </div>
          ))
        )}

        {/* --- Visit Cursor --- */}
        {cursor && cur && (
          <motion.div
            className="absolute w-3 h-3 rounded-full bg-amber-500 shadow"
            initial={false}
            animate={{ left: cur.x, top: cur.y - boxH / 2 - 10 }}
            transition={{ type: "spring", stiffness: 260, damping: 22 }}
            style={{ translateX: "-50%", translateY: "-50%" }}
          />
        )}
      </div>

      {/* --- Narration --- */}
      <div className="text-base opacity-80 text-center">
        🗣️ {narration || "doubly linked list"}
      </div>
    </div>
  );
}

/* 🔹 Motion Line Component */
function MotionLine({ x1, y1, x2, y2, markerStart, markerEnd, opacity = 0.9, duration = 0.22 }) {
  return (
    <motion.line
      x1={x1}
      y1={y1}
      x2={x2}
      y2={y2}
      stroke="currentColor"
      strokeWidth="2"
      markerStart={markerStart}
      markerEnd={markerEnd}
      initial={{ opacity: 0 }}
      animate={{ opacity }}
      exit={{ opacity: 0 }}
      transition={{ duration }}
    />
  );
}
