import { motion } from "framer-motion";

export default function BoxVisual({ data = {} }) {
  const { x = 0, y = 0, label = "", highlight = false } = data;
  return (
    <motion.div
      className={`absolute flex items-center justify-center rounded-xl border shadow-md 
                  text-lg font-semibold bg-white select-none
                  ${highlight ? "ring-2 ring-amber-500 scale-[1.05]" : ""}`}
      style={{
        left: x,
        top: y,
        width: 64,
        height: 64,
        translateX: "-50%",
        translateY: "-50%",
      }}
      animate={{ scale: highlight ? [1, 1.05, 1] : 1 }}
      transition={{ duration: 0.6, repeat: highlight ? Infinity : 0 }}
    >
      {label || "?"}
    </motion.div>
  );
}
