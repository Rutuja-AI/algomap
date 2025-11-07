// /animators_ai/DNANodeCircle.jsx
import React from "react";
import { motion } from "framer-motion";

/**
 * 🌕 DNANodeCircle — circular node component
 * Used for trees, graphs, heaps, etc.
 */
export default function DNANodeCircle({
  value = "?",
  highlight = false,
  size = 50,
  color = "gray",
}) {
  return (
    <motion.div
      layout
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0 }}
      transition={{ type: "spring", stiffness: 150, damping: 18 }}
      className={`absolute flex items-center justify-center rounded-full border shadow-md font-semibold select-none 
        ${highlight ? "bg-blue-200 border-blue-600 shadow-lg" : "bg-gray-100 border-gray-400"}`}
      style={{ width: size, height: size, color }}
    >
      {String(value)}
    </motion.div>
  );
}
