import { useMemo } from "react";

export default function LinkedListAnimator({ steps = [], meta }) {
  const kind = meta?.kind || "singly";
  const isCircular = kind.includes("circular");
  const isDoubly = kind.includes("doubly");
  const isStack = meta?.isStack || false;
  const orientation = meta?.orientation || (isStack ? "vertical" : "horizontal");

  const { nodes, highlight, narration } = useMemo(() => {
    let items = [];
    let glow = null;
    let narr = "";
    const removeByValue = (v) => {
      const k = items.findIndex((x) => String(x) === String(v));
      if (k >= 0) items.splice(k, 1);
    };
    const removeByIndex = (k) => {
      if (Number.isInteger(k) && k >= 0 && k < items.length) items.splice(k, 1);
    };
    for (const st of steps) {
      const act = st?.action;
      narr = st?.description || act || "";
      if (act === "init") {
        items = [];
        glow = null;
      } else if (act === "insert" || act === "push") {
        const v = st?.value ?? "?";
        // For stack, always insert at head (top)
        const at = isStack ? 0 : (Number.isInteger(st?.index) ? Math.min(Math.max(st.index, 0), items.length) : items.length);
        items = [...items.slice(0, at), v, ...items.slice(at)];
        glow = v;
      } else if (act === "delete" || act === "pop") {
        if (isStack) {
          if (items.length > 0) items.splice(0, 1);
        } else if (typeof st?.value !== "undefined") removeByValue(st.value);
        else removeByIndex(st?.index);
        glow = null;
      } else if (act === "visit") {
        glow = st?.value ?? null;
      }
    }
    return { nodes: items, highlight: glow, narration: narr };
  }, [steps, isStack]);

  // ---------- Stack as vertical linked list ----------
  if (!isCircular && isStack && orientation === "vertical") {
    return (
      <div className="w-full h-full flex flex-col gap-4 items-center justify-center">
        <div className="flex flex-col-reverse items-center gap-2 py-6">
          {nodes.length === 0 ? (
            <div className="text-gray-400 text-sm">∅ empty stack</div>
          ) : (
            nodes.map((v, i) => (
              <div
                key={`stack-ll-${i}-${String(v)}`}
                className={`px-6 py-3 rounded-xl shadow-md border text-lg font-semibold select-none transition bg-gradient-to-b from-yellow-200 to-yellow-400 ${i === nodes.length - 1 ? "ring-2 ring-amber-500 scale-[1.04]" : ""}`}
                style={{ minWidth: 64, textAlign: "center" }}
                title={i === nodes.length - 1 ? "top" : undefined}
              >
                {String(v)}
                {i === nodes.length - 1 && <span className="ml-2 text-xs text-amber-700">(top)</span>}
              </div>
            ))
          )}
        </div>
        <div className="text-base opacity-80 text-center">
          🗣️ {narration || "stack (linked list)"}
        </div>
      </div>
    );
  }

  // ---------- Linear layout for singly linked list ----------
  if (!isCircular && kind === "singly") {
    return (
      <div className="w-full h-full flex flex-col gap-4 items-center justify-center">
        <div className="flex flex-row items-center gap-4 py-6">
          {nodes.length === 0 ? (
            <div className="text-gray-400 text-sm">∅ empty linked list</div>
          ) : (
            nodes.map((v, i) => (
              <LinearNode
                key={`ll-node-${i}-${String(v)}`}
                value={v}
                isLast={i === nodes.length - 1}
                showBackward={isDoubly && i > 0}
                glow={String(highlight) === String(v)}
              />
            ))
          )}
        </div>
        <div className="text-base opacity-80 text-center">
          🗣️ {narration || "linked list"}
        </div>
      </div>
    );
  }

  // ---------- Circular (ring) ----------
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
    <div className="w-full h-full flex flex-col gap-4">
      <div className="relative mx-auto" style={{ width: W, height: H }}>
        {/* dashed guide ring */}
        <div
          className="absolute rounded-full border-2 border-dashed border-gray-200"
          style={{
            left: "50%", top: "50%", transform: "translate(-50%, -50%)",
            width: 2 * radius, height: 2 * radius,
          }}
        />

        {/* arrow layer */}
        <svg className="absolute left-0 top-0" width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
          <defs>
            <marker id="arrowHead" markerWidth="7" markerHeight="7" refX="7" refY="3.5" orient="auto">
              <polygon points="0 0, 7 3.5, 0 7" />
            </marker>
          </defs>

          {/* forward arrows around the ring */}
          {n > 1 && nodes.map((_, i) => {
            const j = (i + 1) % n;
            const a = C(positions[i]); const b = C(positions[j]);
            return <Arrow key={`fw-${i}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y} offset={box / 2} />;
          })}

          {/* backward arrows if doubly */}
          {isDoubly && n > 1 && nodes.map((_, i) => {
            const j = (i - 1 + n) % n;
            const a = C(positions[i]); const b = C(positions[j]);
            return <Arrow key={`bw-${i}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y} offset={box / 2} subtle />;
          })}
        </svg>

        {/* node boxes */}
        {n === 0 ? (
          <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-sm">
            ∅ empty linked list
          </div>
        ) : (
          nodes.map((v, i) => {
            const p = positions[i];
            return (
              <div
                key={`cnode-${i}-${String(v)}`}
                className={`absolute flex items-center justify-center rounded-2xl border shadow-md bg-white select-none ${
                  String(highlight) === String(v) ? "ring-2 ring-amber-500 scale-[1.02]" : ""
                }`}
                style={{
                  width: box, height: box,
                  left: `calc(50% + ${p.x - box / 2}px)`,
                  top: `calc(50% + ${p.y - box / 2}px)`,
                  textAlign: "center", fontWeight: 600,
                }}
                title={`node ${i}`}
              >
                {String(v)}
              </div>
            );
          })
        )}
      </div>

      <div className="text-base opacity-80 text-center">
        🗣️ {narration || (isDoubly ? "circular doubly linked list" : "circular singly linked list")}
      </div>
    </div>
  );
}

/* ---------- helpers ---------- */

function LinearNode({ value, isLast, showBackward, glow }) {
  return (
    <div className="flex items-center gap-4">
      {showBackward && (
        <svg width="48" height="24" viewBox="0 0 48 24" className="opacity-70">
          <line x1="46" y1="18" x2="10" y2="18" stroke="currentColor" strokeWidth="2" />
          <polygon points="0,18 10,12 10,24" fill="currentColor" />
        </svg>
      )}
      <div
        className={`px-4 py-3 rounded-2xl shadow-md border text-lg font-semibold select-none transition ${
          glow ? "ring-2 ring-amber-500 scale-[1.02]" : ""
        }`}
        style={{ minWidth: 64, textAlign: "center" }}
        title="node"
      >
        {String(value)}
      </div>
      {!isLast && (
        <svg width="48" height="24" viewBox="0 0 48 24" className="opacity-80">
          <line x1="2" y1="12" x2="38" y2="12" stroke="currentColor" strokeWidth="2" />
          <polygon points="48,12 38,6 38,18" fill="currentColor" />
        </svg>
      )}
    </div>
  );
}

// Draw a trimmed straight arrow between two points (to avoid overlapping node boxes)
function Arrow({ x1, y1, x2, y2, offset = 26, subtle = false }) {
  const dx = x2 - x1, dy = y2 - y1;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len, uy = dy / len;
  const sx = x1 + ux * offset, sy = y1 + uy * offset;
  const ex = x2 - ux * offset, ey = y2 - uy * offset;

  return (
    <line
      x1={sx} y1={sy} x2={ex} y2={ey}
      stroke="currentColor" strokeWidth={2}
      markerEnd="url(#arrowHead)"
      opacity={subtle ? 0.65 : 0.9}
    />
  );
}
