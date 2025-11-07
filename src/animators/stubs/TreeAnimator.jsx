// src/animators/TreeAnimator.jsx
import { useMemo } from "react";

// helper: ensure a node entry exists in the map
function ensureNode(map, key, value = key) {
  const id = String(key);
  if (!map.has(id)) {
    map.set(id, { id, value, children: {}, parent: null, color: "B" }); // default black
  }
  return map.get(id);
}

// ---- HEAP REPLAYER (complete-binary-tree by array index) ----
function replayHeap(steps = []) {
  const a = []; // heap array over time
  const colors = {}; // index -> "R"/"B"

  for (const st of steps) {
    switch (st.action) {
      case "insert":
        a[st.index] = st.value;
        break;
      case "move_last_to_root":
        a[0] = st.value;
        break;
      case "recolor": {
        if (st.index != null) {
          colors[st.index] = st.to_color || st.color || "B";
        }
        break;
      }
      case "swap": {
        const i = st.i, j = st.j;
        if (Number.isInteger(i) && Number.isInteger(j)) {
          [a[i], a[j]] = [a[j], a[i]];
          const ci = colors[i], cj = colors[j];
          colors[i] = cj; colors[j] = ci;
        }
        break;
      }
      case "extract_root":
        break;
      default:
        break;
    }
  }

  const nodes = [];
  const edges = [];
  const xSpacing = 80, ySpacing = 100;

  const occupied = a
    .map((v, i) => (v !== undefined && v !== null ? i : null))
    .filter((i) => i !== null);
  const maxIndex = occupied.length ? Math.max(...occupied) : -1;
  const levelOf = (i) => Math.floor(Math.log2(i + 1));
  const levels = {};
  for (let i = 0; i <= maxIndex; i++) {
    if (a[i] == null) continue;
    const d = levelOf(i);
    if (!levels[d]) levels[d] = [];
    levels[d].push(i);
  }

  const levelKeys = Object.keys(levels).map(Number).sort((a, b) => a - b);
  for (const depth of levelKeys) {
    const ids = levels[depth];
    ids.forEach((idx, k) => {
      const x = (k - (ids.length - 1) / 2) * xSpacing;
      const y = depth * ySpacing;
      const id = String(idx);
      nodes.push({
        id,
        value: a[idx],
        color: colors[idx] || "B",
        x,
        y,
        parent: idx > 0 ? String(Math.floor((idx - 1) / 2)) : null
      });
      if (idx > 0) edges.push({ from: String(Math.floor((idx - 1) / 2)), to: id });
    });
  }

  return { nodes, edges };
}

// derive highlights
function computeHighlights(steps = [], nodes = [], meta) {
  const last = steps[steps.length - 1];
  const ids = new Set();
  if (!last) return ids;

  const isHeap =
    (meta?.variant && String(meta.variant).toLowerCase().includes("heap")) ||
    steps?.some((s) =>
      (s.action === "insert" && typeof s.index === "number") ||
      s.action === "move_last_to_root" ||
      s.action === "extract_root"
    );

  if (isHeap) {
    if (last.action === "peek" && Number.isInteger(last.index)) ids.add(String(last.index));
    else if (last.action === "compare") {
      if (Number.isInteger(last.i)) ids.add(String(last.i));
      if (Number.isInteger(last.j)) ids.add(String(last.j));
    } else if (last.action === "extract_root") {
      ids.add("0");
    }
  } else {
    const byValue = (val) => nodes.find((n) => String(n.value) === String(val))?.id;
    if (last.action === "highlight" && last.node != null) ids.add(String(last.node));
    if (last.action === "visit" && last.value != null) {
      const id = byValue(last.value);
      if (id) ids.add(String(id));
    }
    if (last.action === "compare" && last.node != null) ids.add(String(last.node));
  }
  return ids;
}

export default function TreeAnimator({ steps = [], meta }) {
  const { nodes, edges, highlights } = useMemo(() => {
    const looksLikeHeap =
      (meta?.variant && String(meta.variant).toLowerCase().includes("heap")) ||
      steps?.some(
        (s) =>
          (s.action === "insert" && typeof s.index === "number") ||
          s.action === "move_last_to_root" ||
          s.action === "extract_root"
      );

    let nodes = [], edges = [];
    if (looksLikeHeap) {
      ({ nodes, edges } = replayHeap(steps));
    } else {
      const map = new Map();
      let rootId = null;

      for (const st of steps || []) {
        switch (st.action) {
          case "new_root": {
            const id = st.id ?? String(st.key ?? st.value);
            const node = ensureNode(map, id, st.key ?? st.value);
            node.parent = null;
            node.color = st.color || node.color;
            rootId = id;
            break;
          }
          case "insert": {
            const id = st.id ?? String(st.key ?? st.value);
            const node = ensureNode(map, id, st.key ?? st.value);
            node.color = st.color || node.color;
            if (st.under != null || st.parent != null) {
              const parentId = String(st.under ?? st.parent);
              const parent = ensureNode(map, parentId, parentId);
              node.parent = parent.id;
              if (st.side === "left" || st.side === "right") {
                parent.children[st.side] = node.id;
              } else {
                if (!parent.children.others) parent.children.others = [];
                if (!parent.children.others.includes(node.id)) {
                  parent.children.others.push(node.id);
                }
              }
            } else {
              node.parent = null;
              if (!rootId) rootId = id;
            }
            break;
          }
          case "link": {
            const parent = ensureNode(map, String(st.parent), st.parent);
            const child = ensureNode(map, String(st.child), st.child);
            child.parent = parent.id;
            if (st.side === "left" || st.side === "right") {
              parent.children[st.side] = child.id;
            } else {
              if (!parent.children.others) parent.children.others = [];
              if (!parent.children.others.includes(child.id)) {
                parent.children.others.push(child.id);
              }
            }
            break;
          }
          case "recolor": {
            const node = ensureNode(map, String(st.node), st.node);
            node.color = st.to_color || st.color || "B";
            break;
          }
          default:
            break;
        }
      }

      const placedNodes = [], placedEdges = [];
      if (rootId) {
        const queue = [{ id: rootId, depth: 0 }];
        const levels = {};
        while (queue.length) {
          const cur = queue.shift();
          const n = map.get(String(cur.id));
          if (!n) continue;
          if (!levels[cur.depth]) levels[cur.depth] = [];
          levels[cur.depth].push(n.id);
          if (n.children.left) queue.push({ id: n.children.left, depth: cur.depth + 1 });
          if (n.children.right) queue.push({ id: n.children.right, depth: cur.depth + 1 });
          if (n.children.others) {
            n.children.others.forEach((cid) =>
              queue.push({ id: cid, depth: cur.depth + 1 })
            );
          }
        }
        const levelKeys = Object.keys(levels).map(Number).sort((a, b) => a - b);
        const xSpacing = 80, ySpacing = 100;
        for (const depth of levelKeys) {
          const ids = levels[depth];
          ids.forEach((nid, i) => {
            const n = map.get(String(nid));
            const x = (i - (ids.length - 1) / 2) * xSpacing;
            const y = depth * ySpacing;
            placedNodes.push({ ...n, x, y });
            if (n.parent) placedEdges.push({ from: String(n.parent), to: n.id });
          });
        }
      }
      nodes = placedNodes; edges = placedEdges;
    }

    const highlights = computeHighlights(steps, nodes, meta);
    return { nodes, edges, highlights };
  }, [steps, meta?.variant]);

  return (
    <svg width="800" height="600" style={{ border: "1px solid #ccc" }}>
      {edges.map((e, i) => {
        const from = nodes.find((n) => n.id === e.from);
        const to = nodes.find((n) => n.id === e.to);
        if (!from || !to) return null;
        return (
          <line
            key={i}
            x1={from.x + 400}
            y1={from.y + 50}
            x2={to.x + 400}
            y2={to.y + 50}
            stroke="#444"
            strokeWidth="2"
          />
        );
      })}
      {nodes.map((n) => {
        const fill = n.color === "R" ? "#e74c3c" : "#2c3e50";
        const stroke = n.color === "R" ? "#c0392b" : "#1a252f";
        return (
          <g key={n.id} transform={`translate(${n.x + 400}, ${n.y + 50})`}>
            <circle r="24" fill={fill} stroke={stroke} strokeWidth="2.5" />
            <text textAnchor="middle" dy=".3em" fontSize="16" fontWeight="800" fill="#fff">
              {n.value}
            </text>
          </g>
        );
      })}
      {Array.from(highlights).map((hid) => {
        const node = nodes.find((n) => n.id === hid);
        if (!node) return null;
        return (
          <g key={`hi-${hid}`} transform={`translate(${node.x + 400}, ${node.y + 50})`}>
            <circle r="28" fill="none" stroke="#2a6df7" strokeWidth="4" opacity="0.85">
              <animate attributeName="r" values="26;30;26" dur="0.9s" repeatCount="1" />
              <animate attributeName="opacity" values="0.95;0.6;0.95" dur="0.9s" repeatCount="1" />
            </circle>
          </g>
        );
      })}
    </svg>
  );
}
