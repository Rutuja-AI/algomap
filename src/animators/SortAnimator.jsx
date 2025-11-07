import React, { useMemo } from "react";
import { motion } from "framer-motion";

/**
 * 💫 SortAnimator v4 — Algorithm-Aware Unified Visualizer
 * -------------------------------------------------------
 * ✅ Auto-detects algorithm type (bubble / selection / insertion / merge / quick)
 * ✅ Highlights according to logic pattern
 * ✅ Works with AlgoMap playback (currStep-driven)
 * ✅ Smooth, narration-synced transitions
 */
export default function SortAnimator({
  steps = [],
  initial = [],
  currStep = 0,
  stepDuration = 1500,
  containerWidth = 600,
  containerHeight = 400,
  meta = {},
}) {
  const { arr, highlights, sorted, pivots, narration, splitMeta, algoType } = useMemo(() => {
    let a = [...initial];
    let glow = [];
    let sortedIdx = new Set();
    let pivots = new Set();
    let narr = "";
    let splitMeta = null;
    let algo = meta?.sub_concept?.toLowerCase() || "unknown";

    // detect from narration keywords if meta missing
    for (let s of steps) {
      const d = (s.description || "").toLowerCase();
      if (d.includes("bubble")) algo = "bubble";
      else if (d.includes("selection")) algo = "selection";
      else if (d.includes("insertion")) algo = "insertion";
      else if (d.includes("merge")) algo = "merge";
      else if (d.includes("partition")) algo = "quick";
    }

    for (let i = 0; i <= currStep && i < steps.length; i++) {
      const st = steps[i];
      narr = st.description || st.action || "";

      switch (st.action) {
        case "compare":
          glow = [st.i, st.j].filter((x) => typeof x === "number");
          break;

        case "swap":
          if (typeof st.i === "number" && typeof st.j === "number") {
            [a[st.i], a[st.j]] = [a[st.j], a[st.i]];
          }
          glow = [st.i, st.j];
          break;

        case "shift":
          if (typeof st.from === "number" && typeof st.to === "number") {
            const [val] = a.splice(st.from, 1);
            a.splice(st.to, 0, val);
            glow = [st.from, st.to];
          }
          break;

        case "pivot":
          if (typeof st.i === "number") pivots.add(st.i);
          break;

        case "mark_sorted":
          if (typeof st.i === "number") sortedIdx.add(st.i);
          break;

        case "split":
          if (Array.isArray(st.range)) {
            splitMeta = {
              leftRange: [
                st.range[0],
                st.range[0] + (st.left?.length || 0) - 1,
              ],
              rightRange: [
                st.range[1] - (st.right?.length || 0) + 1,
                st.range[1],
              ],
              depth: st.depth || 0,
            };
          }
          break;

        // inside useMemo, after existing cases
        case "merge":
          if (Array.isArray(st.arr)) a = [...st.arr];
          break;

        // 🧩 NEW PATCH — detect textual merge updates
        default:
          // handle narration like "array becomes [3, 9, 10, ...]"
          const m = (st.description || "").match(/\[(.*?)\]/);
          if (m) {
            const parsed = m[1]
              .split(",")
              .map(x => x.trim())
              .filter(Boolean);
            if (parsed.length) a = parsed;
          }
          break;

      }
    }

    return {
      arr: a,
      highlights: glow,
      sorted: sortedIdx,
      pivots,
      narration: narr,
      splitMeta,
      algoType: algo,
    };
  }, [steps, currStep, initial, meta]);

  // 🎨 Layout
  const gap = 70,
    boxW = 60,
    padX = 40,
    padY = 100;
  const W = Math.max(400, arr.length * (boxW + gap) + padX * 2 - gap);
  const H = containerHeight || 260;
  const positions = arr.map((_, i) => ({
    x: padX + i * (boxW + gap) + boxW / 2,
    y: padY,
  }));

  // 🎨 Color Palettes by Algorithm
  const algoColors = {
    bubble: { base: "bg-blue-50", compare: "bg-yellow-200", sorted: "bg-green-200" },
    selection: { base: "bg-indigo-50", compare: "bg-orange-200", sorted: "bg-green-200" },
    insertion: { base: "bg-teal-50", compare: "bg-purple-200", sorted: "bg-green-200" },
    merge: { base: "bg-cyan-50", compare: "bg-pink-200", sorted: "bg-green-200" },
    quick: { base: "bg-gray-50", compare: "bg-amber-200", sorted: "bg-green-200" },
    unknown: { base: "bg-white", compare: "bg-yellow-100", sorted: "bg-green-200" },
  };
  const palette = algoColors[algoType] || algoColors.unknown;

  return (
    <div className="w-full h-full flex flex-col items-center gap-4">
      {/* Visualization Area — fixed positions */}
      <div
        className="relative mx-auto flex justify-center gap-4 transition-all"
        style={{
          width: W,
          height: H,
          alignItems: "center",
        }}
      >
        {arr.map((v, i) => {
          const isHighlight = highlights.includes(i);
          const isSorted = sorted.has(i);
          const isPivot = pivots.has(i);

          let colorClass = palette.base;
          if (isHighlight) colorClass = palette.compare;
          if (isPivot) colorClass = "bg-red-200 border-red-500";
          if (isSorted) colorClass = palette.sorted;

          return (
            <motion.div
              key={`slot-${i}`}
              className={`flex items-center justify-center w-14 h-14 rounded-xl 
                          border border-gray-300 shadow-md select-none font-semibold 
                          transition-all duration-300 ${colorClass}`}
              animate={{
                scale: isHighlight ? 1.1 : 1,
              }}
              transition={{
                duration: 0.3,
                type: "spring",
                stiffness: 200,
              }}
            >
              {String(v)}
            </motion.div>
          );
        })}
      </div>

      {/* Narration */}
      <div
        className="text-base opacity-80 text-center italic mt-2 relative"
        style={{ transform: "translateY(-600px)" }}
      >
        🧠 <span className="font-semibold capitalize">{algoType}</span> Sort →{" "}
        {narration || "sorting..."}
      </div>

    </div>
  );
}