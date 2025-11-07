// =============================================
// File: src/animators/SortAnimator.jsx
// Purpose: Generic sorter visualizer header (no default algorithm label).
//          If `algorithm` prop is provided (e.g. "bubble"|"insertion"|"selection"),
//          it is shown as: "Sorting Animation (Insertion)". Otherwise just "Sorting Animation".
// =============================================
import { useEffect, useMemo, useRef, useState } from "react";

export default function SortAnimator({
  initial = [],
  steps = [],
  speed = 1.0,         // 0.25x .. 2x
  algorithm = "",      // optional: bubble|selection|insertion (lowercase)
  onReplay = () => {}, // parent hook
}) {
  const [array, setArray] = useState(initial);
  const [pointer, setPointer] = useState(0);
  const [sortedSet, setSortedSet] = useState(new Set());
  const [focus, setFocus] = useState({ i: -1, j: -1, kind: "" });
  const timerRef = useRef(null);

  const delay = useMemo(() => {
    // 1.0 → ~700ms per step, scale inversely with speed
    const base = 700;
    return Math.max(120, base / (speed || 1));
  }, [speed]);

  useEffect(() => {
    setArray(initial);
    setPointer(0);
    setSortedSet(new Set());
    setFocus({ i: -1, j: -1, kind: "" });
    return () => timerRef.current && clearTimeout(timerRef.current);
  }, [initial, steps]);

  useEffect(() => {
    if (pointer >= steps.length) return;
    timerRef.current = setTimeout(() => {
      const step = steps[pointer];
      if (!step) return;

      if (step.action === "compare") {
        setFocus({ i: step.i, j: step.j, kind: "compare" });
      } else if (step.action === "swap") {
        setFocus({ i: step.i, j: step.j, kind: "swap" });
      } else if (step.action === "set_array") {
        setArray(step.array);
      } else if (step.action === "mark_sorted") {
        setSortedSet(prev => new Set([...prev, step.index]));
        setFocus({ i: -1, j: -1, kind: "" });
      }

      setPointer(p => p + 1);
    }, delay);

    return () => clearTimeout(timerRef.current);
  }, [pointer, steps, delay]);

  const maxVal = useMemo(() => Math.max(...array, 1), [array]);
  const title = useMemo(() => {
    if (!algorithm) return "Sorting Animation";
    const cap = algorithm.charAt(0).toUpperCase() + algorithm.slice(1);
    return `Sorting Animation (${cap})`;
  }, [algorithm]);

  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <div className="text-lg font-semibold">{title}</div>
        <button
          onClick={() => onReplay()}
          className="px-3 py-1 rounded-xl bg-gray-900 text-white text-sm shadow"
        >
          Replay
        </button>
      </div>

      {/* Bars */}
      <div className="grid grid-cols-12 gap-3">
        <div className="col-span-9">
          <div className="h-72 w-full bg-gray-50 rounded-2xl p-4 shadow-inner flex items-end gap-2 overflow-hidden">
            {array.map((v, idx) => {
              const height = Math.max(16, (v / maxVal) * 220);
              const isCompare = (idx === focus.i || idx === focus.j) && focus.kind === "compare";
              const isSwap = (idx === focus.i || idx === focus.j) && focus.kind === "swap";
              const isSorted = sortedSet.has(idx);
              const cls = [
                "transition-all duration-300 ease-out",
                "flex-1 rounded-t-xl",
                "flex items-end justify-center",
                "text-xs font-semibold select-none",
                isSorted ? "bg-green-500 text-white" :
                isSwap ? "bg-red-500 text-white" :
                isCompare ? "bg-yellow-400 text-gray-900" :
                "bg-blue-500 text-white",
              ].join(" ");
              return (
                <div key={idx} className={cls} style={{ height }}>
                  <div className="mb-2">{v}</div>
                </div>
              );
            })}
          </div>
          <div className="mt-3 text-sm text-gray-600">
            Step {Math.min(pointer, steps.length)} / {steps.length}
          </div>
        </div>

        {/* Narration */}
        <div className="col-span-3">
          <div className="h-72 w-full rounded-2xl border p-3 overflow-auto bg-white">
            <div className="font-semibold mb-2">Narration</div>
            {pointer === 0 ? (
              <div className="text-gray-500">Ready. Click Replay to start.</div>
            ) : (
              <div className="space-y-2">
                {steps.slice(0, pointer).slice(-6).map((s, k) => (
                  <div key={k} className="text-sm">
                    • {s.description || s.action}
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="mt-3 text-xs text-gray-500">
            Colors: Compare = yellow, Swap = red, Sorted = green.
          </div>
        </div>
      </div>
    </div>
  );
}