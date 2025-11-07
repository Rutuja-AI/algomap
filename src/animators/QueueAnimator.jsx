
import { motion, AnimatePresence } from "framer-motion";

export default function QueueAnimator({ steps = [], upto = 0 }) {
  // Compute queue state from steps up to 'upto'
  let queue = [];
  steps.slice(0, upto).forEach((st) => {
    if (st.action === "enqueue") queue.push(st.value);
    if (st.action === "dequeue") queue.shift();
  });

  return (
    <div className="flex gap-2 items-center justify-center h-full w-full">
      <div className="w-full max-w-xl overflow-x-auto flex gap-2 p-2 border rounded bg-gray-50">
        <AnimatePresence>
          {queue.length === 0 ? (
            <span className="text-gray-400">Queue is empty</span>
          ) : (
            queue.map((item, idx) => (
              <motion.div
                key={idx + '-' + item}
                initial={{ x: 40, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -40, opacity: 0 }}
                transition={{ duration: 0.4 }}
                className="px-4 py-2 rounded bg-blue-100 text-blue-800 font-bold border border-blue-300"
              >
                {item}
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
