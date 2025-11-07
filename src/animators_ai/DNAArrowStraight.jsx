// /animators_ai/DNAArrowStraight.jsx
import React from "react";
import { motion } from "framer-motion";

/**
 * ➡️ DNAArrowStraight — straight line arrow
 * Used for Stack / Queue / List
 */
export default function DNAArrowStraight({
  x1,
  y1,
  x2,
  y2,
  opacity = 0.9,
  duration = 0.22,
}) {
  return (
    <motion.line
      x1={x1}
      y1={y1}
      x2={x2}
      y2={y2}
      stroke="currentColor"
      strokeWidth="2"
      markerEnd="url(#arrowHead)"
      initial={{ opacity: 0 }}
      animate={{ opacity }}
      exit={{ opacity: 0 }}
      transition={{ duration }}
    />
  );
}
