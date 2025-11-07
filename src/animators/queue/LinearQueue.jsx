import React, { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * 🚦 Linear Queue (Sequential Playback Edition)
 * ---------------------------------------------
 * ✅ Step-by-step insert/dequeue animation
 * ✅ FRONT/REAR badges + smooth arrows
 * ✅ Same style as Singly Linked List for uniformity
 */
export default function LinearQueue({ steps = [], meta = {}, speed = 1, playing = true }) {
  const {
    gap = 80,
    boxW = 64,
    boxH = 44,


    fade = 0.22,
    showBadges = true,
    cursor = true,
  } = meta || {};

  const [queue, setQueue] = useState([]);
  const [highlight, setHighlight] = useState(null);
  const [narration, setNarration] = useState("linear queue");

  // 🎬 Sequential playback
  useEffect(() => {
    if (!steps.length || !playing) return;

    let i = 0;
    setQueue([]);
    setHighlight(null);
    setNarration("Starting queue simulation...");

    const timer = setInterval(() => {
      if (i >= steps.length) {
        clearInterval(timer);
        setNarration("✅ Visualization complete.");
        return;
      }

      const st = steps[i];
      const act = st.action;
      let val = st.value;

      // 🧩 Fallback: if no explicit value, use buffer snapshot
      if (
        (val === undefined || val === null || val === "" || val === "None") &&
        Array.isArray(st.buffer) &&
        st.buffer.length > 0
      ) {
        // for enqueue, take last; for dequeue, take first
        if (st.action === "enqueue" || st.action === "insert") val = st.buffer[st.buffer.length - 1];
        else if (st.action === "dequeue" || st.action === "delete") val = st.buffer[0];
      }

      // Robust normalization
      if (val === undefined || val === null || val === "" || val === "None") val = "∅";
      else val = String(val).trim();
      if (val === "" || val.toLowerCase() === "undefined" || val.toLowerCase() === "null") val = "∅";


      // 🧩 robust normalization
      if (val === undefined || val === null || val === "" || val === "None") val = "∅";
      else val = String(val).trim();
      if (val === "" || val.toLowerCase() === "undefined" || val.toLowerCase() === "null") val = "∅";
      ;


      setNarration(st.description || act || "");

      setQueue((prev) => {
        let newQ = [...prev];
        if (act === "enqueue" || act === "insert") {
          newQ.push(val);
        } else if (act === "dequeue" || act === "delete") {
          newQ.shift();
        } else if (act === "display" && Array.isArray(st.list_state)) {
          newQ = st.list_state;
        }
        return newQ;
      });

      setHighlight(val ?? null);
      i++;
    }, 1300 / speed);

    return () => clearInterval(timer);
  }, [steps, speed, playing]);

  // 🧮 Layout geometry
  const n = queue.length;
  const padX = 32;
  const W = Math.max(360, n * (boxW + gap) + padX * 2 - gap);
  const H = 220;
  const positions = useMemo(
    () =>
      queue.map((_, i) => ({
        x: padX + i * (boxW + gap) + boxW / 2,
        y: H / 2,
      })),
    [queue]
  );
  const idx = Object.fromEntries(queue.map((v, i) => [String(v), i]));

  // trim arrows
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
        {/* --- Arrows --- */}
        <svg className="absolute left-0 top-0" width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
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

        {/* --- Queue boxes --- */}
        {n === 0 ? (
          <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-sm">
            ∅ empty linear queue
          </div>
        ) : (
          queue.map((v, i) => (
            <div
              key={`qbox:${i}:${String(v)}`}
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
            >
              {v === undefined || v === null || v === "" ? "∅" : String(v)}

              {showBadges && i === 0 && (
                <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 border">
                  FRONT
                </span>
              )}
              {showBadges && i === n - 1 && (
                <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 border">
                  REAR
                </span>
              )}
            </div>
          ))
        )}

        {/* --- Cursor --- */}
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
        🗣️ {narration || "linear queue"}
      </div>
    </div>
  );
}

/* 🔹 Motion Line helper */
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
