import React, { useMemo, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * 🌐 Circular Singly Linked List (Array ↔ Ring View)
 * --------------------------------------------------
 * ✅ Identical design to CircularQueue
 * ✅ Stepwise playback from AlgoMap backend
 * ✅ Toggle between Array View & Ring View
 * ✅ Shows HEAD badge instead of FRONT/REAR
 * ✅ Works with speed slider & teaching mode
 */
export default function CircularSingly({
  steps = [],
  currStep = 0,
  meta = {},
  speed = 1,
  playing = true,
}) {
  // 🌀 Default viewMode auto-detect
  const defaultView =
    meta?.layout === "ring" ||
    steps?.[0]?.meta?.layout === "ring"
      ? "ring"
      : meta?.viewMode || "array";

  const [mode, setMode] = useState(defaultView);

  // 🔄 Listen to external toggle events
  useEffect(() => {
    const handler = (e) => setMode(e.detail);
    window.addEventListener("cll-view-toggle", handler);
    return () => window.removeEventListener("cll-view-toggle", handler);
  }, []);

  // 🧮 Derive current list state
  const { nodes, narration } = useMemo(() => {
    let narr = "";
    let arr = [];

    for (let i = 0; i <= currStep && i < steps.length; i++) {
      const s = steps[i];
      narr = s.description || s.action;
      if (Array.isArray(s.list_state) && s.list_state.length)
        arr = [...s.list_state];
      else if (s.action === "insert") arr.push(String(s.value ?? "?"));
      else if (s.action === "delete")
        arr = arr.filter((x) => String(x) !== String(s.value));
    }

    return { nodes: arr, narration: narr };
  }, [steps, currStep]);

  // 🔁 Toggle view
  const toggleView = () => {
    const next = mode === "array" ? "ring" : "array";
    setMode(next);
    meta.viewMode = next;
    window.dispatchEvent(new CustomEvent("cll-view-toggle", { detail: next }));
  };

  return (
    <div className="w-full h-full flex flex-col items-center gap-4 justify-center">
      {/* header + toggle */}
      <div className="flex items-center gap-3">
        <h2 className="text-lg font-bold text-gray-700">
          Circular Singly Linked List (
          {mode === "array" ? "Array View" : "Ring View"})
        </h2>
        <button
          onClick={toggleView}
          className="px-3 py-1 text-sm bg-gray-200 hover:bg-gray-300 rounded-lg shadow-sm"
        >
          🔁 Toggle View
        </button>
      </div>

      {/* view mode */}
      {mode === "array" ? (
        <ArrayView nodes={nodes} />
      ) : (
        <RingView nodes={nodes} />
      )}

      {/* narration */}
      <div className="text-base opacity-80 text-center italic mt-2">
        🗣️ {narration || "circular singly linked list"}
      </div>

      {/* legend */}
      <div className="text-xs opacity-70 flex gap-4 mt-2">
        <span className="text-emerald-600 font-bold">HEAD</span> = start of list
        <span className="text-gray-400">∅ = empty</span>
      </div>
    </div>
  );
}

/* ---------- Array View ---------- */
function ArrayView({ nodes }) {
  const arr = nodes.length ? nodes : [null];
  return (
    <div className="flex flex-row items-center gap-2 py-6 transition-all duration-500 ease-in-out">
      {arr.map((v, i) => {
        const empty = v === null || v === undefined;
        return (
          <div
            key={i}
            className={`w-16 h-16 flex items-center justify-center rounded-xl border shadow-md text-lg font-semibold relative transition-all duration-300 ${
              empty ? "bg-gray-100" : "bg-green-100"
            }`}
          >
            {empty ? "∅" : String(v)}
            <span className="absolute -bottom-12 text-[10px] text-gray-500">
              {i}
            </span>
            {i === 0 && !empty && (
              <span className="absolute -top-6 text-xs font-bold text-emerald-600">
                HEAD
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ---------- Ring View ---------- */
function RingView({ nodes }) {
  const n = nodes.length || 1;
  const radius = 120;
  const box = 52;
  const W = 2 * (radius + 40);
  const H = 2 * (radius + 40);

  const positions = [];
  for (let i = 0; i < n; i++) {
    const ang = (2 * Math.PI * i) / n - Math.PI / 2;
    positions.push({ x: Math.cos(ang) * radius, y: Math.sin(ang) * radius });
  }
  const C = (p) => ({ x: W / 2 + p.x, y: H / 2 + p.y });

  return (
    <div
      className="relative mx-auto transition-all duration-700"
      style={{ width: W, height: H }}
    >
      {/* ring outline */}
      <div
        className="absolute rounded-full border-2 border-dashed border-gray-200"
        style={{
          left: "50%",
          top: "50%",
          transform: "translate(-50%, -50%)",
          width: 2 * radius,
          height: 2 * radius,
        }}
      />

      {/* arrows */}
      <svg
        className="absolute left-0 top-0"
        width={W}
        height={H}
        viewBox={`0 0 ${W} ${H}`}
      >
        <defs>
          <marker
            id="arrowHeadCSLL"
            markerWidth="7"
            markerHeight="7"
            refX="7"
            refY="3.5"
            orient="auto-start-reverse"   // 🧠 key fix
          >
            <polygon points="0 0, 7 3.5, 0 7" fill="gray" />
          </marker>

        </defs>
        {n > 1 &&
          nodes.map((_, i) => {
            const j = (i + 1) % n;
            const a = C(positions[i]);
            const b = C(positions[j]);
            return (
              <Arrow
                key={`fw-${i}`}
                x1={a.x}
                y1={a.y}
                x2={b.x}
                y2={b.y}
                offset={box / 2}
              />
            );
          })}
      </svg>

      {/* nodes */}
      {nodes.length === 0 ? (
        <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-sm">
          ∅ empty circular singly linked list
        </div>
      ) : (
        nodes.map((v, i) => {
          const p = positions[i];
          return (
            <div
              key={`csll-node-${i}`}
              className="absolute flex items-center justify-center rounded-2xl border shadow-md select-none transition-all duration-500 text-lg font-semibold bg-green-100"
              style={{
                width: box,
                height: box,
                left: `calc(50% + ${p.x - box / 2}px)`,
                top: `calc(50% + ${p.y - box / 2}px)`,
              }}
            >
              {String(v)}
              <span className="absolute -bottom-10 text-[10px] text-gray-500">
                {i}
              </span>
              {i === 0 && (
                <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 border">
                  HEAD
                </span>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}

/* ---------- Arrow Helper ---------- */
function Arrow({ x1, y1, x2, y2, offset = 26 }) {
  const dx = x2 - x1,
    dy = y2 - y1;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len,
    uy = dy / len;
  const sx = x1 + ux * offset,
    sy = y1 + uy * offset;
  const ex = x2 - ux * offset,
    ey = y2 - uy * offset;

  return (
    <line
      x1={sx}
      y1={sy}
      x2={ex}
      y2={ey}
      stroke="gray"
      strokeWidth={2}
      markerEnd="url(#arrowHeadCSLL)"   // unique marker ID
      opacity={0.7}
    />
  );
}
