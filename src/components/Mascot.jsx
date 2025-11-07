import { AnimatePresence, motion } from "framer-motion";

export default function Mascot({ text, mood = "happy" }) {
  const face =
    mood === "happy" ? "◕‿◕" :
    mood === "think" ? "•ᴗ•?" :
    mood === "warn"  ? "•︵•" :
    mood === "proud" ? "＾▿＾" :
    "•‿•";

  return (
    <div className="flex flex-col items-center gap-3 select-none">
      {/* body */}
      <motion.div
        className="relative w-24 h-24 rounded-full bg-amber-300 border-4 border-amber-600 grid place-items-center shadow"
        animate={{ y: [0, -4, 0] }}
        transition={{ repeat: Infinity, duration: 1.8 }}
      >
        <span className="font-extrabold text-xl">{face}</span>

        {/* blush */}
        <div className="absolute left-4 top-12 w-5 h-2 bg-rose-300/70 rounded-full blur-[1px]" />
        <div className="absolute right-4 top-12 w-5 h-2 bg-rose-300/70 rounded-full blur-[1px]" />

        {/* tiny wings */}
        <div className="absolute -left-3 top-8 w-5 h-3 bg-amber-200 rounded-full rotate-[-20deg]" />
        <div className="absolute -right-3 top-8 w-5 h-3 bg-amber-200 rounded-full rotate-[20deg]" />

        {/* FEET */}
        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 flex gap-2">
          <div className="w-5 h-1.5 bg-amber-700 rounded-full" />
          <div className="w-5 h-1.5 bg-amber-700 rounded-full" />
        </div>
      </motion.div>

      {/* bubble */}
      <div className="relative max-w-xs">
        <AnimatePresence mode="popLayout">
          <motion.div
            key={text || "idle"}
            initial={{ opacity: 0, y: 6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ type: "spring", stiffness: 240, damping: 20 }}
            className="rounded-2xl border border-amber-200 bg-white shadow-md px-3 py-2 text-sm text-gray-800"
          >
            {text || "Run the animation and I’ll narrate 👋"}
          </motion.div>
        </AnimatePresence>
        <div className="absolute -left-2 bottom-2 w-0 h-0 border-t-8 border-t-transparent border-r-8 border-r-amber-200 border-b-8 border-b-transparent" />
        <div className="absolute -left-[6px] bottom-[6px] w-0 h-0 border-t-8 border-t-transparent border-r-8 border-r-white border-b-8 border-b-transparent" />
      </div>
    </div>
  );
}
