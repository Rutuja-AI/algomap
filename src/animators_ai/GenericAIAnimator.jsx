// /src/animators_ai/GenericAIAnimator.jsx
import React, { useEffect, useState } from "react";
import DNAAnimatorCore from "./DNAAnimatorCore";
import DNABox from "./DNABox";
import DNANodeCircle from "./DNANodeCircle";
import DNAArrowStraight from "./DNAArrowStraight";
import DNAArrowCurved from "./DNAArrowCurved";
import DNAEdgeLine from "./DNAEdgeLine";
import { linearLayout, ringLayout, treeLayout } from "./DNALayouts";
import { pulseGlow } from "./DNAHighlight";

/**
 * 🧠 GenericAIAnimator (DNA version)
 * ---------------------------------
 * - Reads AI-generated IR steps (action, vars, layout)
 * - Chooses appropriate visuals dynamically
 * - Supports layouts: linear | ring | tree
 * - Actions: create, connect, highlight
 */
export default function GenericAIAnimator({
  steps = [],
  currStep = 0,
  speed = 1,
  layout = "linear",
  width = 600,
  height = 400,
}) {
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [highlight, setHighlight] = useState(null);

  // 🧩 Interpret IR up to current step
  useEffect(() => {
    if (!steps.length) return;

    let tempNodes = [];
    let tempEdges = [];

    steps.slice(0, currStep + 1).forEach((s) => {
      const action = s.action?.toLowerCase?.() || "";

      if (["create", "insert", "push", "enqueue"].includes(action)) {
        const id = s.id || s.vars?.id || s.vars?.name || `n${tempNodes.length}`;
        const value = s.value ?? s.vars?.value ?? "?";
        tempNodes.push({ id, value });
      }

      if (["connect", "link", "edge"].includes(action)) {
        const from = s.from || s.vars?.from || null;
        const to = s.to || s.vars?.to || null;
        if (from && to) tempEdges.push({ from, to });
      }

      if (["highlight", "visit", "peek"].includes(action)) {
        const target = s.target || s.vars?.target;
        setHighlight(target);
        pulseGlow(target);
      }
    });

    setNodes(tempNodes);
    setEdges(tempEdges);
  }, [steps, currStep]);

  // 🧮 layout
  const positions =
    layout === "ring"
      ? ringLayout(nodes.length, 120, width, height)
      : layout === "tree"
      ? treeLayout({ nodes })
      : linearLayout(nodes.length, 64, 80, 32, height);

  const nodeMap = Object.fromEntries(
    nodes.map((n, i) => [n.id, { ...n, ...positions[i] }])
  );

  // 🧱 Render visuals
  return (
    <DNAAnimatorCore width={width} height={height}>
      {/* edges */}
      {edges.map((e, i) => {
        const a = nodeMap[e.from];
        const b = nodeMap[e.to];
        if (!a || !b) return null;

        if (layout === "ring")
          return (
            <DNAArrowCurved
              key={`curved-${i}`}
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
              offset={26}
            />
          );
        if (layout === "tree")
          return <DNAEdgeLine key={`edge-${i}`} from={a} to={b} />;
        return (
          <DNAArrowStraight
            key={`edge-${i}`}
            x1={a.x}
            y1={a.y}
            x2={b.x}
            y2={b.y}
          />
        );
      })}

      {/* nodes */}
      {nodes.map((n) =>
        layout === "tree" ? (
          <DNANodeCircle
            key={n.id}
            value={n.value}
            highlight={n.id === highlight}
            size={50}
            color="gray"
            style={{
              position: "absolute",
              left: n.x,
              top: n.y,
              transform: "translate(-50%, -50%)",
            }}
          />
        ) : (
          <DNABox
            key={n.id}
            value={n.value}
            highlight={n.id === highlight}
            w={64}
            h={44}
          />
        )
      )}
    </DNAAnimatorCore>
  );
}
