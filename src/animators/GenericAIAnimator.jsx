// src/animators/GenericAIAnimator.jsx
import React, { useMemo, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { AI_COMPONENTS, DEFAULT_COMPONENT } from "./ai/visual_component_map";
import useNarrator from "../hooks/useNarrator";

export default function GenericAIAnimator({
  steps = [],
  meta = {},
  animation = {},
  containerWidth = 600,
  containerHeight = 400,
}) {
  console.log("🎬 [GENERIC-AI-ANIMATOR] Mounted with props:", {
    steps,
    meta,
    animation,
  });

  // 🧩 Universal visual source patch (enhanced debug)
  console.groupCollapsed("🎨 [GENERIC-AI-ANIMATOR] Visual Source Debug");
  console.log("🗂️ meta keys:", Object.keys(meta || {}));
  console.log("🧱 meta.animation_plan keys:", Object.keys(meta?.animation_plan || {}));
  console.log("🧩 animation keys:", Object.keys(animation || {}));

  const objects =
    meta?.objects?.length
      ? meta.objects
      : meta?.animation_plan?.objects?.length
      ? meta.animation_plan.objects
      : meta?.elements?.length
      ? meta.elements
      : [];

  const operations =
    meta?.operations?.length
      ? meta.operations
      : meta?.animation_plan?.operations?.length
      ? meta.animation_plan.operations
      : [];

  console.table(
    (objects || []).map((o, i) => ({
      i,
      id: o.id,
      type: o.type,
      label: o.label,
      x: o.x,
      y: o.y,
    }))
  );
  console.log("🎬 Ops Preview:", (operations || []).slice(0, 3));
  console.log("🎨 Objects:", objects.length, "| Operations:", operations.length);
  console.groupEnd();

  // 🧠 Final plan extraction
  const rawPlan = meta?.animation_plan || animation?.animation_plan || {};
  const nestedPlan = rawPlan?.animation_plan || {};
  const finalPlan = Object.keys(nestedPlan).length ? nestedPlan : rawPlan;

  // 🧹 Filter out function/method boxes automatically
  const elements = (objects || []).filter(
    (o) => !/^[_a-z]+$/i.test(o.label?.trim()) // hide names like __init__, add, transpose
  );

  
  const motions = operations;
  const narration = finalPlan.narration || [];
  const layout = finalPlan.layout || meta?.layout || "unknown";
  const theme = finalPlan.theme || meta?.theme || "softblue";

  const { stop } = useNarrator();

  const [currentLine, setCurrentLine] = useState(null);
  const [activeMotion, setActiveMotion] = useState(null);
  const [visibleElements, setVisibleElements] = useState([]);
  const [isPlaying, setIsPlaying] = useState(true);

  const normalizeNarration = (text = "") =>
    text
      .replace(/arr_cell_\d+/g, (m) => `index ${m.match(/\d+/)?.[0]}`)
      .replace(/_/g, " ")
      .replace(/\s+/g, " ")
      .trim();

  // 🧾 Build playback script
  const script = useMemo(() => {
    if (Array.isArray(finalPlan.script)) return finalPlan.script;
    if (narration.length) {
      return narration.map((text, i) => ({
        t: i * 2,
        say: normalizeNarration(text),
        intent: motions[i]?.op || "highlight",
        targets: motions[i]?.target || [],
        label: motions[i]?.label || "",
      }));
    }
    return motions.map((m, i) => ({
      t: i * 2,
      step: i,
      say:
        normalizeNarration(m.comment || m.description) ||
        `Step ${i + 1}: Observe behavior.`,
      intent: m.op,
      targets: m.target,
      label: m.label,
    }));
  }, [finalPlan, narration, motions]);

  const performIntent = (line) => {
    if (!line) return;
    const sameStepOps = motions.filter((m) => m.step === line.step);
    const chosen =
      sameStepOps.find((m) => m.op === "found") || sameStepOps[0] || null;
    setActiveMotion(chosen);
  };

  // 🎬 Sequential Playback Controller
  useEffect(() => {
    if (!script.length) return;
    stop();
    setIsPlaying(true);
    setVisibleElements([]); // reset visibility

    let idx = 0;
    const playNext = () => {
      const line = script[idx];
      if (!line) return stop();

      setCurrentLine(line);
      performIntent(line);

      // 💫 Reveal gradually (box by box / step by step)
      setVisibleElements((prev) => {
        const limit = Math.min(elements.length, idx + 1);
        return elements.slice(0, limit);
      });

      idx++;
      const delay = (script[idx]?.t ? script[idx].t - line.t : 2) * 1000;
      timer = setTimeout(playNext, delay);
    };
    let timer = setTimeout(playNext, 400);

    return () => {
      clearTimeout(timer);
      stop();
    };
  }, [JSON.stringify(script)]);

  // 🖼️ Build visuals dynamically
  const visuals = useMemo(() => {
    if (!Array.isArray(elements)) return [];
    return visibleElements.map((el) => {
      const Comp = AI_COMPONENTS[el.type] || DEFAULT_COMPONENT;

      const isActive =
        activeMotion &&
        (activeMotion.target === el.id ||
          (Array.isArray(activeMotion.target) &&
            activeMotion.target.includes(el.id)));

      const isFound = activeMotion?.op === "found";

      if (["cell", "box", "label"].includes(el.type)) {
        return (
          <motion.div
            key={el.id}
            animate={{
              backgroundColor: isFound
                ? "#86efac"
                : isActive
                ? "#fde68a"
                : "#ffffff",
              borderColor: isFound
                ? "#22c55e"
                : isActive
                ? "#f59e0b"
                : "#d1d5db",
              scale: isActive || isFound ? 1.05 : 1.0,
            }}
            transition={{ duration: 0.4 }}
            className="absolute flex items-center justify-center border rounded-md text-xs font-semibold text-gray-700 shadow-sm"
            style={{
              left: `${el.x}px`,
              top: `${el.y}px`,
              transform: "translate(-50%, -50%)",
              width: el.w || 50,
              height: el.h || 50,
            }}
          >
            {el.label}
          </motion.div>
        );
      }

      return <Comp key={el.id} data={{ ...el, highlight: isActive }} />;
    });
  }, [visibleElements, activeMotion]);

  const bgStyle =
    theme === "softblue"
      ? "white"
      : theme === "darkmatrix"
      ? "rgba(0,0,0,0.3)"
      : "transparent";

  // 🧭 Optional visual overlay for empty state
  const showEmptyOverlay = !objects.length;

return (
  <div
    className="relative rounded-xl flex items-center justify-center overflow-hidden"
    style={{
      width: containerWidth * 1.4,    // increase width
      height: containerHeight * 1.4,  // increase height
      background: bgStyle,
      margin: "0 auto",               // center it horizontally
      border: "1px solid #e5e7eb",    // optional light border for clarity
      boxShadow: "0 0 12px rgba(0,0,0,0.05)", // optional soft shadow
    }}
  >

    {/* Main visuals (centered, no scroll frame) */}
    <div
      className="relative"
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
      }}
    >
      {visuals}
    </div>

    {/* Empty overlay */}
    {showEmptyOverlay && (
      <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-sm italic">
        No visual objects detected 🫥
      </div>
    )}

    {/* Narration overlay */}
    {currentLine?.say && (
      <motion.div
        key={currentLine.say}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="absolute bottom-4 left-1/2 -translate-x-1/2 text-center text-sm font-semibold text-purple-700 tracking-wide"
      >
        {normalizeNarration(currentLine.say)}
      </motion.div>
    )}
  </div>
);

}
