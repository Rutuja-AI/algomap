import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * MascotTest v2 — free-roam mascot that can pick boxes & swap them.
 *
 * Drop in: src/pages/MascotTest.jsx
 * Route: <Route path="/mascot" element={<MascotTest />} />
 *
 * What’s new:
 * - Bigger/cuter mascot 🐣 with wobble & wink.
 * - Drag mascot anywhere on the stage.
 * - Click "Grab / Drop" near a box to pick it up and carry it.
 * - Drag over another box and "Drop" to swap values & positions.
 * - Boxes are positioned on a flexible track; mascot can "touch" them.
 */

export default function MascotTest() {
  // demo array
  const [arr, setArr] = useState([5, 12, 4, 9, 2]);

  // stage layout + boxes (x positions within stage)
  const stageRef = useRef(null);
  const [trackX, setTrackX] = useState([]); // center x positions for each box
  const [boxWidth, setBoxWidth] = useState(76);
  const [boxY, setBoxY] = useState(120); // y baseline for all boxes (inside stage)

  // mascot state
  const [bubble, setBubble] = useState({ text: "hi, i can carry stuff 🐣", mood: "happy" });
  const [showBubble, setShowBubble] = useState(true);
  const [pinned, setPinned] = useState(false);

  // mascot pose & holding
  const [mascot, setMascot] = useState({ x: 420, y: 180, holdingIdx: null }); // local to stage
  const holdOffset = { x: 0, y: -64 }; // how far above mascot the held box sits

  // auto-hide speech unless pinned
  const hideTimer = useRef(null);
  const say = (t, mood = "happy", ms = 2200) => {
    setBubble({ text: t, mood });
    setShowBubble(true);
    if (!pinned) {
      if (hideTimer.current) clearTimeout(hideTimer.current);
      hideTimer.current = setTimeout(() => setShowBubble(false), ms);
    }
  };

  // init / recompute track when stage resizes
  useEffect(() => {
    const computeTrack = () => {
      const el = stageRef.current;
      if (!el) return;
      const w = el.clientWidth;
      const padding = 48;
      const usable = w - padding * 2;
      const gap = usable / (arr.length + 1);
      const xCenters = arr.map((_, i) => padding + gap * (i + 1));
      setTrackX(xCenters);
    };
    computeTrack();
    const ro = new ResizeObserver(computeTrack);
    if (stageRef.current) ro.observe(stageRef.current);
    return () => ro.disconnect();
  }, [arr.length]);

  useEffect(() => () => hideTimer.current && clearTimeout(hideTimer.current), []);

  // helpers
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  const stagePoint = (clientX, clientY) => {
    const rect = stageRef.current.getBoundingClientRect();
    return { x: clientX - rect.left, y: clientY - rect.top };
  };

  // find nearest box index to a given point
  const nearestBox = (pt) => {
    let best = { idx: null, d: Infinity };
    trackX.forEach((cx, i) => {
      const center = { x: cx, y: boxY };
      const d = dist(center, pt);
      if (d < best.d) best = { idx: i, d };
    });
    return best;
  };

  // GRAB: if near a box, attach it
  const onGrabOrDrop = () => {
    const here = { x: mascot.x, y: mascot.y };
    if (mascot.holdingIdx === null) {
      const { idx, d } = nearestBox(here);
      if (idx === null || d > 110) {
        say("come closer to a box to grab it 🫰", "think");
        return;
      }
      setMascot((m) => ({ ...m, holdingIdx: idx }));
      say(`got it! lifted box #${idx + 1} (${arr[idx]}) 🐥`, "proud");
    } else {
      // dropping: find target box near mascot
      const { idx: targetIdx, d } = nearestBox(here);
      const from = mascot.holdingIdx;

      if (targetIdx !== null && d < 110) {
        if (targetIdx !== from) {
          // swap values & positions
          setArr((prev) => {
            const next = [...prev];
            [next[from], next[targetIdx]] = [next[targetIdx], next[from]];
            return next;
          });
          setTrackX((prev) => {
            const nx = [...prev];
            [nx[from], nx[targetIdx]] = [nx[targetIdx], nx[from]];
            return nx;
          });
          say(`swap! ${arr[from]} ⇄ ${arr[targetIdx]} ✨`, "happy");
        } else {
          say("placed back where it was 😌", "casual");
        }
      } else {
        say("dropped in air—put it near another box to swap ✋", "warn");
      }
      setMascot((m) => ({ ...m, holdingIdx: null }));
    }
  };

  // when dragging mascot, clamp inside stage
  const onMascotDrag = (_, info) => {
    const el = stageRef.current;
    if (!el) return;
    const w = el.clientWidth, h = el.clientHeight;
    setMascot((m) => {
      let x = m.x + info.delta.x;
      let y = m.y + info.delta.y;
      x = Math.max(16, Math.min(w - 16, x));
      y = Math.max(16, Math.min(h - 16, y));
      return { ...m, x, y };
    });
  };

  const onCompare = () => say("comparing… who’s bigger here? 🤔", "think");
  const onShuffle = () => {
    // simple shuffle + recompute track order visually
    const zipped = arr.map((v, i) => ({ v, x: trackX[i] }));
    for (let i = zipped.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [zipped[i], zipped[j]] = [zipped[j], zipped[i]];
    }
    setArr(zipped.map(z => z.v));
    setTrackX(zipped.map(z => z.x));
    say("shuffled the lane 🎲", "casual");
  };

  // where to render the held box (follows mascot)
  const heldBoxXY = useMemo(() => {
    if (mascot.holdingIdx === null) return null;
    return { x: mascot.x + holdOffset.x, y: mascot.y + holdOffset.y };
  }, [mascot, holdOffset.x, holdOffset.y]);

  return (
    <div className="min-h-[80vh] bg-gradient-to-b from-amber-50 to-white">
      <div className="max-w-6xl mx-auto px-6 py-10">
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">
          Mascot <span className="text-amber-600">Testing</span> Page 🐣
        </h1>
        <p className="mt-2 text-gray-600">
          Drag the mascot around. Click <b>Grab / Drop</b> near a box to pick it up. Move and drop near another box to swap.
        </p>

        {/* Controls */}
        <div className="mt-6 flex flex-wrap gap-3">
          <button className="btn" onClick={onCompare}>Compare (talk)</button>
          <button className="btn" onClick={() => setPinned(p => !p)}>{pinned ? "Unpin Bubble" : "Pin Bubble"}</button>
          <button className="btn" onClick={onShuffle}>Shuffle Lane</button>
          <button className="btn-emph" onClick={onGrabOrDrop}>{mascot.holdingIdx === null ? "Grab" : "Drop"}</button>
        </div>

        {/* Stage */}
        <div
          ref={stageRef}
          className="mt-8 relative rounded-3xl border border-amber-200 bg-white/80 backdrop-blur p-3 min-h-[420px] overflow-hidden"
        >
          {/* Track label */}
          <p className="text-sm text-gray-500 px-2">Playground (drag mascot • grab/drop to swap)</p>

          {/* Boxes on the track */}
          <div className="absolute inset-0">
            {arr.map((v, i) => {
              // base position is track center (x) & boxY
              const cx = trackX[i] ?? 100 + i * (boxWidth + 18);
              const x = cx - boxWidth / 2;
              const y = boxY - 60; // height ~120
              return (
                <motion.div
                  key={i}
                  className={`absolute rounded-2xl border bg-amber-50 flex items-end justify-center select-none ${
                    mascot.holdingIdx === i ? "opacity-0" : "opacity-100"
                  }`}
                  style={{ width: boxWidth, height: 120 }}
                  animate={{ x, y }}
                  transition={{ type: "spring", stiffness: 260, damping: 22 }}
                >
                  <div className="w-full h-full rounded-2xl border-amber-300 grid place-items-end pb-3">
                    <span className="font-semibold text-amber-900 text-lg">{v}</span>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Held box that follows mascot */}
          <AnimatePresence>
            {heldBoxXY && (
              <motion.div
                className="absolute rounded-2xl border border-amber-300 bg-amber-100 grid place-items-end"
                style={{ width: boxWidth, height: 120 }}
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ x: heldBoxXY.x - boxWidth / 2, y: heldBoxXY.y - 60, opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ type: "spring", stiffness: 260, damping: 20 }}
              >
                <span className="font-semibold text-amber-900 text-lg pb-3">
                  {mascot.holdingIdx !== null ? arr[mascot.holdingIdx] : ""}
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Mascot — bigger & cuter */}
          <motion.div
            className="absolute"
            drag
            dragMomentum={false}
            onDrag={onMascotDrag}
            style={{ x: mascot.x, y: mascot.y }}
          >
            <Mascot mood={bubble.mood} showBubble={showBubble} text={bubble.text} />
          </motion.div>
        </div>

        <div className="mt-6 text-xs text-gray-500">
          Next: we can let the mascot “tap” a box during your real animation steps to highlight or initiate moves automatically.
        </div>
      </div>

      {/* handy styles */}
      <style>{`
        .btn {
          @apply px-3 py-2 rounded-xl bg-amber-600 text-white font-semibold hover:bg-amber-700 active:scale-[0.98] transition;
        }
        .btn-emph {
          @apply px-3 py-2 rounded-xl bg-violet-600 text-white font-semibold hover:bg-violet-700 active:scale-[0.98] transition;
        }
      `}</style>
    </div>
  );
}

/** BIGGER + CUTER mascot with bounce & wink and a speech bubble */
function Mascot({ mood = "happy", showBubble, text }) {
  const face = useMemo(() => {
    switch (mood) {
      case "happy": return "◕‿◕";
      case "think": return "•ᴗ•?";
      case "warn":  return "•︵•";
      case "proud": return "＾▿＾";
      case "casual":return "・‿・";
      default:      return "•‿•";
    }
  }, [mood]);

  const bounce = { animate: { y: [0, -8, 0], scale: [1, 1.04, 1], transition: { repeat: Infinity, duration: 1.6 } } };
  const wink = { initial: { rotate: 0 }, animate: { rotate: [0, 0, 7, 0], transition: { repeat: Infinity, repeatDelay: 2.4, duration: 0.6 } } };

  return (
    <div className="relative flex items-center gap-3">
      <AnimatePresence>
        {showBubble && (
          <motion.div
            key={text}
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ type: "spring", stiffness: 240, damping: 20 }}
            className="max-w-[300px] rounded-2xl border border-amber-200 bg-white shadow-md p-3 text-sm"
          >
            <p className="text-gray-800 leading-snug">{text}</p>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div className="relative" {...bounce}>
        {/* body */}
        <motion.div
          className="w-20 h-20 rounded-full bg-amber-300 border-2 border-amber-500 grid place-items-center shadow"
          {...wink}
        >
          <span className="font-extrabold text-lg select-none">{face}</span>
        </motion.div>

        {/* blush */}
        <div className="absolute left-3 top-9 w-4 h-2 bg-rose-300/70 rounded-full blur-[1px]" />
        <div className="absolute right-3 top-9 w-4 h-2 bg-rose-300/70 rounded-full blur-[1px]" />

        {/* tiny wings */}
        <div className="absolute -left-3 top-6 w-4 h-3 bg-amber-200 rounded-full rotate-[-20deg]" />
        <div className="absolute -right-3 top-6 w-4 h-3 bg-amber-200 rounded-full rotate-[20deg]" />

        {/* feet */}
        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
          <div className="w-4 h-1.5 bg-amber-700 rounded-full" />
          <div className="w-4 h-1.5 bg-amber-700 rounded-full" />
        </div>
      </motion.div>
    </div>
  );
}
