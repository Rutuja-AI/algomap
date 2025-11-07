import { motion } from "framer-motion";

export default function NodeVisual({ data = {} }) {
  const { x = 0, y = 0, label = "", color = "white", highlight = false } = data;
  return (
    <motion.div
      className={`absolute flex items-center justify-center rounded-full border-2 shadow-md font-semibold 
                 ${highlight ? "ring-2 ring-amber-500 scale-[1.05]" : ""}`}
      style={{
        left: x,
        top: y,
        width: 56,
        height: 56,
        background: color,
        translateX: "-50%",
        translateY: "-50%",
      }}
      animate={{ scale: highlight ? [1, 1.1, 1] : 1 }}
      transition={{ duration: 0.8, repeat: highlight ? Infinity : 0 }}
    >
      {label || "?"}
    </motion.div>
  );
}
