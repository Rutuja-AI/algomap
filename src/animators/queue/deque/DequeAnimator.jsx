import React, { useMemo } from "react";
import { motion } from "framer-motion";

/**
 * 💫 DequeAnimator v2 — Animated + Dual Arrows
 * - Supports currStep playback
 * - Smooth Framer Motion transitions
 * - Bidirectional arrows between nodes (↔)
 */
export default function DequeAnimator({
  steps = [],
  meta = {},
  currStep = 0,
  playing = false,
  speed = 1,
  narration = "",
}) {
  // 🎞️ Active step state
  const { deque, desc } = useMemo(() => {
    const s = steps[currStep] || {};
    const dq = s.deque_state || s.buffer || s.array || [];
    return {
      deque: dq,
      desc: s.description || narration || "Double-ended queue",
    };
  }, [steps, currStep, narration]);

  return (
    <div className="w-full h-full flex flex-col items-center justify-center gap-6 transition-all duration-300">
      <h2 className="text-lg font-bold text-gray-700">
        Deque (Double-Ended Queue)
      </h2>

      {/* 🔳 Deque + Arrows */}
      <div className="flex flex-row items-center justify-center gap-4 py-4">
        {deque.length === 0 ? (
          <div className="text-gray-400 text-sm">∅ empty deque</div>
        ) : (
          deque.map((v, i) => (
            <React.Fragment key={i}>
              {/* Node */}
              <motion.div
                layout
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.3 / speed }}
                className="w-16 h-16 flex items-center justify-center rounded-xl border shadow-md bg-green-50 text-gray-700 font-semibold relative"
              >
                {String(v).replace(/['"]/g, "")}
                {i === 0 && (
                  <span className="absolute -top-5 text-xs text-blue-600 font-bold">
                    FRONT
                  </span>
                )}
                {i === deque.length - 1 && (
                  <span className="absolute -bottom-5 text-xs text-rose-600 font-bold">
                    REAR
                  </span>
                )}
              </motion.div>

              {/* ⬌ Arrow connectors */}
              {i < deque.length - 1 && (
                <div className="relative flex flex-col items-center justify-center w-10">
                  {/* forward (→) */}
                  <Arrow color="#666" direction="forward" />
                  {/* backward (←) */}
                  <Arrow color="#aaa" direction="backward" />
                </div>
              )}
            </React.Fragment>
          ))
        )}
      </div>

      {/* 🗣️ Narration */}
      <motion.div
        key={desc}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="text-base opacity-80 text-center"
      >
        🗣️ {desc}
      </motion.div>

      {/* Legend */}
      <div className="text-xs opacity-70 flex gap-4 mt-2">
        <span className="text-blue-600 font-bold">FRONT</span> = operations at
        front
        <span className="text-rose-600 font-bold">REAR</span> = operations at
        rear
        <span className="text-gray-400">∅ = empty deque</span>
      </div>
    </div>
  );
}

/* ---------- Arrow Helper (linear) ---------- */
function Arrow({ color = "#777", direction = "forward" }) {
  const isForward = direction === "forward";
  return (
    <svg
      width="40"
      height="14"
      viewBox="0 0 40 14"
      className={`${
        isForward ? "" : "rotate-180"
      } transition-all duration-500 ease-in-out`}
    >
      <defs>
        <marker
          id={`arrowhead-${direction}`}
          markerWidth="6"
          markerHeight="6"
          refX="5"
          refY="3"
          orient="auto"
        >
          <polygon points="0 0, 6 3, 0 6" fill={color} />
        </marker>
      </defs>
      <line
        x1="0"
        y1="7"
        x2="35"
        y2="7"
        stroke={color}
        strokeWidth="2"
        markerEnd={`url(#arrowhead-${direction})`}
        opacity={isForward ? 0.9 : 0.5}
      />
    </svg>
  );
}
