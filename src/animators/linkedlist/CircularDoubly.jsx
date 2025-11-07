import { useEffect, useState, useMemo } from "react";

/**
 * 🌐 Circular Doubly Linked List Animator (Dual View)
 * ---------------------------------------------------
 * ✅ Toggle between Array View and Ring View
 * ✅ Forward + Backward arrows in ring mode
 * ✅ Stepwise playback synced with narration
 * ✅ Identical layout to CircularQueue.jsx
 */
export default function CircularDoubly({
  steps = [],
  meta = {},
  currStep = 0,
  speed = 1,
  playing = true,
}) {
  const defaultView =
    meta?.layout === "ring" ||
    steps?.[0]?.meta?.layout === "ring"
      ? "ring"
      : "array";
  const [mode, setMode] = useState(defaultView);

  const [nodes, setNodes] = useState([]);
  const [highlight, setHighlight] = useState(null);
  const [narration, setNarration] = useState("");

  // 🎬 sequential playback
  useEffect(() => {
    if (!steps.length || !playing) return;

    let items = [];
    let glow = null;
    let i = 0;
    setNodes([]);
    setHighlight(null);
    setNarration("Starting circular doubly linked list...");

    const timer = setInterval(() => {
      if (i >= steps.length) {
        clearInterval(timer);
        setNarration("✅ Visualization complete.");
        return;
      }

      const st = steps[i];
      const act = st?.action;
      setNarration(st?.description || act || "");

      if (act === "insert" || act === "push") {
        const v = st?.value ?? "?";
        items.push(v);
        glow = v;
      } else if (act === "delete" || act === "pop") {
        items = items.filter((x) => String(x) !== String(st?.value));
        glow = null;
      } else if (act === "visit") {
        glow = st?.value ?? null;
      }

      setNodes([...items]);
      setHighlight(glow);
      i++;
    }, 1300 / speed);

    return () => clearInterval(timer);
  }, [steps, speed, playing]);

  const toggleView = () => {
    const next = mode === "array" ? "ring" : "array";
    setMode(next);
    meta.viewMode = next;
  };

  return (
    <div className="w-full h-full flex flex-col items-center gap-4 justify-center">
      {/* header + toggle */}
      <div className="flex items-center gap-3">
        <h2 className="text-lg font-bold text-gray-700">
          Circular Doubly Linked List ({mode === "array" ? "Array View" : "Ring View"})
        </h2>
        <button
          onClick={toggleView}
          className="px-3 py-1 text-sm bg-gray-200 hover:bg-gray-300 rounded-lg shadow-sm"
        >
          🔁 Toggle View
        </button>
      </div>

      {/* layout */}
      {mode === "array" ? (
        <ArrayView nodes={nodes} highlight={highlight} />
      ) : (
        <RingView nodes={nodes} highlight={highlight} />
      )}

      {/* narration */}
      <div className="text-base opacity-80 text-center italic mt-2">
        🗣️ {narration || "circular doubly linked list"}
      </div>

      {/* legend */}
      <div className="text-xs opacity-70 flex gap-4 mt-2">
        <span className="text-emerald-600 font-bold">HEAD</span> = start node
        <span className="text-indigo-600 font-bold">TAIL</span> = end node
      </div>
    </div>
  );
}

/* ---------- Array View ---------- */
function ArrayView({ nodes, highlight }) {
  return (
    <div className="flex flex-row items-center gap-2 py-6 transition-all duration-500 ease-in-out">
      {nodes.length === 0 ? (
        <div className="text-gray-400 text-sm">∅ empty list</div>
      ) : (
        nodes.map((v, i) => (
          <div
            key={`arr-${i}`}
            className={`w-16 h-16 flex items-center justify-center rounded-xl border shadow-md text-lg font-semibold relative transition-all duration-300 bg-white ${
              String(highlight) === String(v)
                ? "ring-2 ring-amber-500 scale-[1.05]"
                : "bg-green-100"
            }`}
          >
            {String(v)}
            {i === 0 && (
              <span className="absolute -top-6 text-xs font-bold text-emerald-600">
                HEAD
              </span>
            )}
            {i === nodes.length - 1 && (
              <span className="absolute -bottom-6 text-xs font-bold text-indigo-600">
                TAIL
              </span>
            )}
          </div>
        ))
      )}
    </div>
  );
}

/* ---------- Ring View ---------- */
function RingView({ nodes, highlight }) {
  const n = nodes.length;
  const radius = 120;
  const box = 52;
  const W = 2 * (radius + 40);
  const H = 2 * (radius + 40);

  const positions = [];
  for (let i = 0; i < Math.max(n, 1); i++) {
    const ang = (2 * Math.PI * i) / Math.max(n, 1) - Math.PI / 2;
    positions.push({ x: Math.cos(ang) * radius, y: Math.sin(ang) * radius });
  }
  const C = (p) => ({ x: W / 2 + p.x, y: H / 2 + p.y });

  return (
    <div className="relative mx-auto transition-all duration-700" style={{ width: W, height: H }}>
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

      <svg className="absolute left-0 top-0" width={W} height={H}>
        <defs>
          <marker id="arrowHead" markerWidth="7" markerHeight="7" refX="7" refY="3.5" orient="auto">
            <polygon points="0 0, 7 3.5, 0 7" />
          </marker>
        </defs>

        {/* forward arrows */}
        {n > 1 &&
          nodes.map((_, i) => {
            const j = (i + 1) % n;
            const a = C(positions[i]);
            const b = C(positions[j]);
            return (
              <CurvedArrow
                key={`fw-${i}`}
                x1={a.x}
                y1={a.y}
                x2={b.x}
                y2={b.y}
                offset={box / 2}
                subtle={false}
              />
            );
          })}

        {/* backward arrows */}
        {n > 1 &&
          nodes.map((_, i) => {
            const j = (i - 1 + n) % n;
            const a = C(positions[i]);
            const b = C(positions[j]);
            return (
              <CurvedArrow
                key={`bw-${i}`}
                x1={a.x}
                y1={a.y}
                x2={b.x}
                y2={b.y}
                offset={box / 2}
                subtle={true}
              />
            );
          })}
      </svg>

      {n === 0 ? (
        <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-sm">
          ∅ empty circular doubly linked list
        </div>
      ) : (
        nodes.map((v, i) => {
          const p = positions[i];
          return (
            <div
              key={`node-${i}-${v}`}
              className={`absolute flex items-center justify-center rounded-2xl border shadow-md select-none transition-all text-lg font-semibold bg-white ${
                String(highlight) === String(v)
                  ? "ring-2 ring-amber-500 scale-[1.05]"
                  : ""
              }`}
              style={{
                width: box,
                height: box,
                left: `calc(50% + ${p.x - box / 2}px)`,
                top: `calc(50% + ${p.y - box / 2}px)`,
              }}
            >
              {String(v)}
              {i === 0 && (
                <span className="absolute -top-6 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 border">
                  HEAD
                </span>
              )}
              {i === n - 1 && (
                <span className="absolute -bottom-6 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 border">
                  TAIL
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
function CurvedArrow({ x1, y1, x2, y2, offset = 26, subtle = false }) {
  const dx = x2 - x1,
    dy = y2 - y1;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len,
    uy = dy / len;
  const sx = x1 + ux * offset,
    sy = y1 + uy * offset;
  const ex = x2 - ux * offset,
    ey = y2 - uy * offset;
  const mx = (sx + ex) / 2,
    my = (sy + ey) / 2;
  const cx = mx + (my - sy) * 0.2,
    cy = my - (mx - sx) * 0.2;

  return (
    <path
      d={`M ${sx} ${sy} Q ${cx} ${cy} ${ex} ${ey}`}
      stroke="currentColor"
      strokeWidth={2}
      fill="none"
      markerEnd="url(#arrowHead)"
      opacity={subtle ? 0.55 : 0.95}
    />
  );
}
