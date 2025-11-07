// /animators_ai/DNABox.jsx
import React from "react";
import { motion } from "framer-motion";

/**
 * 🧱 DNABox — generic rectangular node
 * Used for Stack / Queue / Linked List visuals
 */
export default function DNABox({
  value = "?",
  highlight = false,
  badge = "",
  badgeColor = "blue",
  w = 64,
  h = 44,
}) {
  return (
    <motion.div
      layout
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0 }}
      transition={{ type: "spring", stiffness: 160, damping: 20 }}
      className={`relative flex items-center justify-center rounded-2xl border shadow-md select-none bg-white
        ${highlight ? "ring-2 ring-amber-500 scale-[1.05]" : ""}`}
      style={{ width: w, height: h, fontWeight: 600 }}
    >
      {String(value)}
      {badge && (
        <span
          className={`absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-semibold px-2 py-0.5 rounded-full border bg-${badgeColor}-100 text-${badgeColor}-700`}
        >
          {badge}
        </span>
      )}
    </motion.div>
  );
}
