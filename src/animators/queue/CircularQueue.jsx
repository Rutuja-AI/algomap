import React, { useMemo, useState, useEffect } from "react";

/**
 * 🌀 Circular Queue Visualizer — Unified Version
 * ----------------------------------------------
 * ✅ Handles class-based & procedural implementations
 * ✅ Reads from buffer or vars.buffer (backend-agnostic)
 * ✅ Normalizes undefined/null/"None" values
 * ✅ Array ↔ Ring toggle view
 */
export default function CircularQueue({
  steps = [],
  currStep = 0,
  meta = {},
  viewMode = "array",
  speed = 1,
}) {
  // 🧭 Auto-detect initial layout
  const defaultView =
    meta?.layout === "ring" ||
    steps?.[0]?.meta?.layout === "ring"
      ? "ring"
      : viewMode || "array";
  const [mode, setMode] = useState(defaultView);

  // 🔄 Sync external toggle events
  useEffect(() => {
    const handler = (e) => setMode(e.detail);
    window.addEventListener("queue-view-toggle", handler);
    return () => window.removeEventListener("queue-view-toggle", handler);
  }, []);

  // 🧮 Derive buffer/front/rear from steps up to currStep
  const { buffer, front, rear, narration } = useMemo(() => {
    let cap = meta?.capacity || steps[0]?.meta?.capacity || 5;
    let buf = Array(cap).fill(null);
    let f = -1,
      r = -1,
      narr = "";

    for (let i = 0; i <= currStep && i < steps.length; i++) {
      const s = steps[i];
      narr = s.description || s.action || "";

      // ✅ Prefer vars.buffer or buffer field
      const varsBuf =
        Array.isArray(s.vars?.buffer) && s.vars.buffer.length
          ? s.vars.buffer
          : null;
      if (varsBuf) buf = [...varsBuf];
      else if (Array.isArray(s.buffer)) buf = [...s.buffer];

      // 🧩 Normalize values
      buf = buf.map((v) => normalizeVal(v));

      // ✅ Detect front/rear markers
      if (typeof s.head === "number" || typeof s.front === "number")
        f = s.head ?? s.front;
      if (typeof s.tail === "number" || typeof s.rear === "number")
        r = s.tail ?? s.rear;
    }

    return { buffer: buf, front: f, rear: r, narration: narr };
  }, [steps, currStep, meta]);

  // 🌀 Toggle Array ↔ Ring
  const toggleView = () => {
    const next = mode === "array" ? "ring" : "array";
    setMode(next);
    meta.viewMode = next;
    window.dispatchEvent(new CustomEvent("queue-view-toggle", { detail: next }));
  };

  return (
    <div className="w-full h-full flex flex-col items-center gap-4 justify-center">
      {/* header + toggle */}
      <div className="flex items-center gap-3">
        <h2 className="text-lg font-bold text-gray-700">
          Circular Queue ({mode === "array" ? "Array View" : "Ring View"})
        </h2>
        <button
          onClick={toggleView}
          className="px-3 py-1 text-sm bg-gray-200 hover:bg-gray-300 rounded-lg shadow-sm"
        >
          🔁 Toggle View
        </button>
      </div>

      {/* view */}
      {mode === "array" ? (
        <ArrayView buffer={buffer} front={front} rear={rear} />
      ) : (
        <RingView buffer={buffer} front={front} rear={rear} />
      )}

      {/* narration */}
      <div className="text-base opacity-80 text-center italic mt-2">
        🗣️ {narration || "circular queue"}
      </div>

      {/* legend */}
      <div className="text-xs opacity-70 flex gap-4 mt-2">
        <span className="text-blue-600 font-bold">FRONT</span> = dequeue position
        <span className="text-rose-600 font-bold">REAR</span> = enqueue position
        <span className="text-gray-400">∅ = empty</span>
      </div>
    </div>
  );
}

/* ---------- Array View ---------- */
function ArrayView({ buffer, front, rear }) {
  return (
    <div className="flex flex-row items-center gap-2 py-6 transition-all duration-500 ease-in-out">
      {buffer.map((v, i) => {
        const empty = v === "∅";
        return (
          <div
            key={i}
            className={`w-16 h-16 flex items-center justify-center rounded-xl border shadow-md text-lg font-semibold relative transition-all duration-300 ${
              empty ? "bg-gray-100 text-gray-400" : "bg-green-100 text-gray-800"
            }`}
          >
            {v}
            <span className="absolute -bottom-12 text-[10px] text-gray-500">{i}</span>
            {i === front && (
              <span className="absolute -top-6 text-xs font-bold text-blue-600">
                FRONT
              </span>
            )}
            {i === rear && (
              <span className="absolute -bottom-6 text-xs font-bold text-rose-600">
                REAR
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ---------- Ring View ---------- */
function RingView({ buffer, front, rear }) {
  const n = buffer.length;
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
        {n > 1 &&
          buffer.map((_, i) => {
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
                color="gray"
              />
            );
          })}
      </svg>

      {/* nodes */}
      {buffer.map((v, i) => {
        const p = positions[i];
        const empty = v === "∅";
        return (
          <div
            key={`cq-node-${i}`}
            className={`absolute flex items-center justify-center rounded-2xl border shadow-md select-none transition-all duration-500 text-lg font-semibold ${
              empty ? "bg-gray-100 text-gray-400" : "bg-green-100 text-gray-800"
            }`}
            style={{
              width: box,
              height: box,
              left: `calc(50% + ${p.x - box / 2}px)`,
              top: `calc(50% + ${p.y - box / 2}px)`,
            }}
          >
            {v}
            <span className="absolute -bottom-10 text-[10px] text-gray-500">{i}</span>
            {i === front && (
              <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 border">
                FRONT
              </span>
            )}
            {i === rear && (
              <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 border">
                REAR
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ---------- Arrow Helper ---------- */
function Arrow({ x1, y1, x2, y2, offset = 26, color = "currentColor" }) {
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
      stroke={color}
      strokeWidth={2}
      markerEnd="url(#arrowHead)"
      opacity={0.7}
    />
  );
}

/* ---------- Value Normalizer ---------- */
function normalizeVal(v) {
  if (v === undefined || v === null || v === "" || v === "None") return "∅";
  const str = String(v).trim().toLowerCase();
  if (str === "" || str === "undefined" || str === "null") return "∅";
  return String(v).trim();
}
