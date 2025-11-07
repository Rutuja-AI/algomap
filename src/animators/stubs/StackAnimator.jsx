// src/components/StackAnimator.jsx
import { motion, AnimatePresence } from "framer-motion";

export default function StackAnimator({ steps }) {
  // compute stack state from steps
  let stack = [];
  steps.forEach((st) => {
    if (st.action === "push") stack.push(st.value);
    if (st.action === "pop") stack.pop();
  });

  return (
    <div className="flex flex-col-reverse gap-2 items-center">
      <AnimatePresence>
        {stack.map((val, idx) => (
          <motion.div
            key={idx + "-" + val}
            initial={{ y: -40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ x: 80, opacity: 0 }} // 👈 pops fly sideways
            transition={{ duration: 0.4 }}
            className="w-20 h-12 rounded-lg bg-gradient-to-b from-yellow-300 to-yellow-500 flex items-center justify-center text-xl font-bold shadow-lg"
          >
            {val}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
