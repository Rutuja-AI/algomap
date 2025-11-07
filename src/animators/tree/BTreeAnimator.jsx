import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * 🌳 BTreeAnimator v2.5 — Stable & Centered
 * ----------------------------------------
 * ✅ Detects all insert/create actions
 * ✅ Nodes persist after splits
 * ✅ Perfectly centered layout (no right drift)
 * ✅ Smooth transitions using Framer Motion
 */
export default function BTreeAnimator({
  steps = [],
  meta = {},
  currStep = 0,
  playing = false,
  speed = 1,
  narration = "",
}) {
  const treeRef = useRef(null);
  const [highlighted, setHighlighted] = useState(null);
  const [tick, setTick] = useState(0);
  const [order, setOrder] = useState(2);
  const [nodesMap, setNodesMap] = useState({});

  // 🌱 Node factory
  const makeNode = (id, leaf = true, keys = []) => ({
    id,
    keys,
    children: [],
    leaf,
  });

  // ⚙️ Child split handler
  const handleSplit = (parentId, childId, t, promotedKey = null) => {
    setNodesMap((prev) => {
      const map = { ...prev };
      const parent = map[parentId];
      const child = map[childId];
      if (!parent || !child) return prev;

      const leftKeys = child.keys.slice(0, t - 1);
      const rightKeys = child.keys.slice(t);
      const median = promotedKey ?? child.keys[t - 1];
      const siblingId = `${childId}_r${median}`;
      const sibling = makeNode(siblingId, child.leaf, rightKeys);

      if (!parent.children) parent.children = [];
      if (!map[childId].children) map[childId].children = [];

      map[childId] = { ...child, keys: leftKeys };

      if (!parent.children.includes(childId)) parent.children.push(childId);
      const pos = parent.children.indexOf(childId);
      parent.keys.splice(pos, 0, median);
      parent.children.splice(pos + 1, 0, siblingId);

      map[siblingId] = sibling;
      map[parentId] = { ...parent };
      return map;
    });
  };

  // 🌳 Root split handler (stable)
  const handleRootSplit = (oldRootId, t) => {
    setNodesMap((prev) => {
      const map = { ...prev };
      const oldRoot = map[oldRootId];
      if (!oldRoot) return prev;

      const median = oldRoot.keys[t - 1];
      const leftKeys = oldRoot.keys.slice(0, t - 1);
      const rightKeys = oldRoot.keys.slice(t);

      const leftId = `${oldRootId}_L`;
      const rightId = `${oldRootId}_R`;

      const leftChildren = oldRoot.children?.slice(0, t) || [];
      const rightChildren = oldRoot.children?.slice(t) || [];

      map[leftId] = makeNode(leftId, leftChildren.length === 0, leftKeys);
      map[rightId] = makeNode(rightId, rightChildren.length === 0, rightKeys);
      map[leftId].children = leftChildren;
      map[rightId].children = rightChildren;

      const newRootId = `root_${Date.now()}`;
      const newRoot = makeNode(newRootId, false, [median]);
      newRoot.children = [leftId, rightId];

      map[newRootId] = newRoot;
      treeRef.current = newRootId;
      return map;
    });
  };

  // 🧮 Insert logic
  const insertKey = (nodeId, k, t) => {
    k = Number(k);
    if (isNaN(k)) return;
    setNodesMap((prev) => {
      const map = { ...prev };
      const node = map[nodeId];
      if (!node) return prev;

      if (node.leaf) {
        node.keys = [...new Set([...node.keys, k])].sort((a, b) => a - b);
        map[nodeId] = { ...node };
      } else {
        let i = node.keys.length - 1;
        while (i >= 0 && k < node.keys[i]) i--;
        i++;
        const childId = node.children[i];
        const child = map[childId];
        if (child && child.keys.length === 2 * t - 1) {
          const median = child.keys[t - 1];
          handleSplit(nodeId, childId, t, median);
          if (k > median) i++;
        }
        const nextId = node.children[i];
        if (nextId && map[nextId]) {
          map[nextId].keys = [...new Set([...map[nextId].keys, k])].sort(
            (a, b) => a - b
          );
        }
      }
      return map;
    });
  };

  useEffect(() => {
    if (!steps.length) return;
    const s = steps[currStep];
    if (!s) return;

    const action = (s.action || "").toLowerCase();
    const key = Number(s.key ?? s.vars?.current_key ?? s.vars?.key ?? null);

    // 🧹 Reset/init
    if (["init", "info", "create_node", "initialize_btree"].includes(action)) {
      setHighlighted(null);
      setTick((t) => t + 1);
      return;
    }

    // 🌱 Create node (for explicit IDs)
    if (action === "create_node" && s.node_id) {
      setNodesMap((prev) => ({
        ...prev,
        [s.node_id]: makeNode(s.node_id, s.is_leaf, s.keys || []),
      }));
      if (!treeRef.current) treeRef.current = s.node_id;
      setTick((t) => t + 1);
      return;
    }

    // 🌳 Root split
    if (action === "split_root_node") {
      handleRootSplit(s.old_root_id || "node_0", order);
      setTick((t) => t + 1);
      return;
    }

    // 🌿 Child split
    if (action === "split_child_node") {
      handleSplit(
        s.parent_id || "node_1",
        s.split_node_id || "node_2",
        order,
        s.promoted_key || s.key
      );
      setTick((t) => t + 1);
      return;
    }

    // 🔗 Connect nodes
    if (action === "connect_nodes") {
      setNodesMap((prev) => {
        const map = { ...prev };
        const parent = map[s.parent_id];
        if (parent) {
          parent.children = Array.from(
            new Set([...(parent.children || []), ...(s.child_ids || [])])
          );
          map[s.parent_id] = { ...parent };
        }
        return map;
      });
      setTick((t) => t + 1);
      return;
    }

    // 🧩 Update node keys
    if (action === "update_node" && s.node_id) {
      setNodesMap((prev) => {
        const map = { ...prev };
        const node = map[s.node_id] || makeNode(s.node_id, s.is_leaf, []);
        node.keys = s.keys || [];
        map[s.node_id] = { ...node };
        return map;
      });
      setTick((t) => t + 1);
      return;
    }

    // 🔢 Insert key
    if (action.includes("insert_key_into_node")) {
      setNodesMap((prev) => {
        const map = { ...prev };
        const id = s.node_id || treeRef.current || "node_0";
        const node = map[id] || makeNode(id, true, []);
        node.keys = s.vars?.keys_after || [...new Set([...node.keys, key])];
        map[id] = { ...node };
        if (!treeRef.current) treeRef.current = id;
        return map;
      });
      setHighlighted(`n_${key}`);
      setTimeout(() => setHighlighted(null), 700 / speed);
      setTick((t) => t + 1);
      return;
    }

    // 🎬 Finish
    if (action === "finish") {
      setHighlighted(null);
      setTick((t) => t + 1);
    }
  }, [currStep]);


  // 🧭 Layout computation (stable + centered)
  const { nodes, edges } = useMemo(() => {
    if (!treeRef.current || Object.keys(nodesMap).length === 0)
      return { nodes: [], edges: [] };

    const nodes = [];
    const edges = [];
    const layoutPositions = {};

    const spacingX = 60;
    const spacingY = 110;

    const layout = (id, depth = 0) => {
      const node = nodesMap[id];
      if (!node) return 0;

      const nodeWidth = (node.keys?.length || 0) * 35 + 35;
      const children = node.children || [];

      if (children.length === 0) {
        layoutPositions[id] ??= { x: 0, y: depth * spacingY };
        return nodeWidth;
      }

      const childWidths = children.map((cid) => layout(cid, depth + 1));
      const totalChildrenWidth =
        childWidths.reduce((a, b) => a + b + spacingX, -spacingX);
      const parentX = layoutPositions[id]?.x ?? 0;

      let startX = parentX - totalChildrenWidth / 2;
      children.forEach((cid, i) => {
        const cw = childWidths[i];
        const cx = startX + cw / 2;
        const cy = (depth + 1) * spacingY;
        layoutPositions[cid] = { x: cx, y: cy };
        edges.push({ parent: id, child: cid });
        startX += cw + spacingX;
      });

      layoutPositions[id] ??= { x: parentX, y: depth * spacingY };
      return Math.max(nodeWidth, totalChildrenWidth);
    };

    layoutPositions[treeRef.current] = { x: 0, y: 0 };
    layout(treeRef.current, 0);

    Object.entries(nodesMap).forEach(([id, n]) => {
      const pos = layoutPositions[id];
      if (pos)
        nodes.push({
          id,
          keys: n.keys || [],
          x: pos.x,
          y: pos.y,
          width: (n.keys?.length || 0) * 35 + 35,
        });
    });

    return { nodes, edges };
  }, [nodesMap, tick]);

  const nodeStyle = (id) =>
    highlighted === id
      ? "bg-blue-200 border-blue-600 shadow-lg"
      : "bg-gray-100 border-gray-400";

  // 🖼 Render
  return (
    <div className="w-full h-full flex flex-col items-center justify-center overflow-auto select-none">
      <motion.div
        className="relative flex justify-center items-start w-full h-full overflow-visible"
        style={{ minHeight: "480px" }}
        animate={{ x: 0 }}
        transition={{ type: "spring", stiffness: 80, damping: 18 }}
      >
        {/* 🔗 Edges */}
        {edges.map((e, i) => {
          const from = nodes.find((n) => n.id === e.parent);
          const to = nodes.find((n) => n.id === e.child);
          if (!from || !to) return null;
          const dx = to.x - from.x;
          const dy = to.y - from.y;
          const len = Math.hypot(dx, dy);
          const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
          return (
            <div
              key={`edge-${e.parent}-${e.child}-${i}`}
              className="absolute bg-gray-400 opacity-60"
              style={{
                left: from.x + from.width / 2,
                top: from.y + 35,
                width: len - 40,
                height: 2,
                transform: `rotate(${angle}deg)`,
                transformOrigin: "0 0",
              }}
            />
          );
        })}

        {/* 🌳 Nodes */}
        <AnimatePresence>
          {nodes.map((n) => {
            const uniqueKeys = [...new Set(n.keys)];
            return (
              <motion.div
                key={n.id}
                layout
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ type: "spring", stiffness: 120, damping: 15 }}
                className={`btree-node absolute flex items-center justify-center gap-2 border rounded-md shadow-md text-base font-semibold ${nodeStyle(
                  n.id
                )}`}
                style={{
                  left: n.x,
                  top: n.y,
                  width: n.width,
                  height: 40,
                }}
              >
                {uniqueKeys.map((k, idx) => (
                  <span
                    key={`${n.id}-${k}-${idx}`}
                    id={`n_${k}`}
                    className={`font-semibold ${
                      highlighted === `n_${k}` ? "text-blue-700" : "text-gray-700"
                    }`}
                  >
                    {k}
                  </span>
                ))}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </motion.div>

      {/* 🗣 Narration */}
      <div className="mt-4 text-purple-600 font-semibold text-sm text-center">
        🗣 {steps[currStep]?.description || narration || "Waiting for step..."}
      </div>
      <p className="text-xs text-gray-400 mt-1">
        Step {currStep + 1} / {steps.length} • Order {order}
      </p>
    </div>
  );
}
