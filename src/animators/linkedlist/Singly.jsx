import React, { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * Singly Linked List (Sequential Playback Edition)
 * -----------------------------------------------
 * ✅ Supports insert, delete, display, traverse, visit
 * ✅ Animates step-by-step with narration timing
 * ✅ Compatible with AlgoMap's speed slider & narration bar
 */
export default function Singly({ steps = [], meta = {}, speed = 1, playing = true }) {
  const {
    gap = 80,
    boxW = 64,
    boxH = 44,
    fade = 0.22,
    showBadges = true,
    cursor = true,
  } = meta || {};

  // 🌱 Dynamic state
  const [nodes, setNodes] = useState([]);
  const [highlight, setHighlight] = useState(null);
  const [narration, setNarration] = useState("singly linked list");
  const [currStepIndex, setCurrStepIndex] = useState(0);

  // 🎬 Stepwise playback controller
  useEffect(() => {
    if (!steps.length || !playing) return;

    let i = 0;
    setNodes([]);
    setHighlight(null);
    setNarration("Starting simulation...");

    const interval = setInterval(() => {
      if (i >= steps.length) {
        clearInterval(interval);
        setNarration("✅ Visualization complete.");
        return;
      }

      const st = steps[i];
      const act = st.action;
      const val = st.value;

      // narration text
      setNarration(st.description || act || "");

      // 🔁 Node list transitions
      setNodes((prev) => {
        let newList = [...prev];
        if (["insert", "push", "create_node"].includes(act)) {
          const nodeVal =
            st.vars?.data ?? st.vars?.id ?? val ?? `node${newList.length + 1}`;
          if (!newList.includes(nodeVal)) newList.push(nodeVal);
        } else if (["delete", "pop", "remove_node"].includes(act)) {
          const target = st.vars?.id ?? val;
          newList = newList.filter((x) => String(x) !== String(target));
        } else if (act === "link_nodes") {
          // ensure both ends exist visually
          const src = st.vars?.source_id,
            tgt = st.vars?.target_id;
          [src, tgt].forEach((id) => {
            if (id && !newList.includes(id)) newList.push(id);
          });
        } else if (Array.isArray(st.list_state)) {
          newList = st.list_state;
        }

        return newList;
      });

      // ✨ Highlight node
      setHighlight(val ?? null);

      // Step counter
      setCurrStepIndex(i);
      i++;
    }, 1300 / speed); // slower base interval for visible narration

    return () => clearInterval(interval);
  }, [steps, speed, playing]);

  // 🧮 Layout
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

  // Arrow trimming to avoid overlap
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

  // Forward arrows
  const edges = Array.from({ length: Math.max(0, n - 1) }, (_, i) => {
    const a = positions[i],
      b = positions[i + 1];
    const { sx, sy, ex, ey } = cut(a.x, a.y, b.x, b.y, 26);
    return { id: `adj:${i}-${i + 1}`, x1: sx, y1: sy, x2: ex, y2: ey };
  });

  const hiIndex = highlight != null ? idx[String(highlight)] : null;
  const cur = hiIndex != null ? positions[hiIndex] : null;

  // 🧠 Render
  return (
    <div className="w-full h-full flex flex-col gap-4">
      <div className="relative mx-auto" style={{ width: W, height: H }}>
        {/* --- Edges --- */}
        <svg
          className="absolute left-0 top-0"
          width={W}
          height={H}
          viewBox={`0 0 ${W} ${H}`}
        >
          <defs>
            <marker
              id="arrowHead"
              markerWidth="7"
              markerHeight="7"
              refX="7"
              refY="3.5"
              orient="auto"
            >
              <polygon points="0 0, 7 3.5, 0 7" />
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
                markerEnd="url(#arrowHead)"
                opacity={0.9}
                duration={fade}
              />
            ))}
          </AnimatePresence>
        </svg>

        {/* --- Nodes --- */}
        {n === 0 ? (
          <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-sm">
            ∅ empty singly linked list
          </div>
        ) : (
          nodes.map((v, i) => (
            <div
              key={`sll:${i}:${String(v)}`}
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
        🗣️ {narration || "singly linked list"}
      </div>
    </div>
  );
}

/* 🔹 Motion Line Component */
function MotionLine({ x1, y1, x2, y2, markerEnd, opacity = 0.9, duration = 0.22 }) {
  return (
    <motion.line
      x1={x1}
      y1={y1}
      x2={x2}
      y2={y2}
      stroke="currentColor"
      strokeWidth="2"
      markerEnd={markerEnd}
      initial={{ opacity: 0 }}
      animate={{ opacity }}
      exit={{ opacity: 0 }}
      transition={{ duration }}
    />
  );
}
