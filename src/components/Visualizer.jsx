import { motion } from "framer-motion";
import { useCallback, useMemo, useRef, useState } from "react";

const SAMPLE_CODE = `arr = [5, 3, 8]\nfor i in range(len(arr)-1):\n    if arr[i] > arr[i+1]:\n        arr[i], arr[i+1] = arr[i+1], arr[i]`;

export default function Visualizer() {
  const [code, setCode] = useState(SAMPLE_CODE);
  const [arr, setArr] = useState([5, 3, 8]);
  const [steps, setSteps] = useState([]);
  const [idxHi, setIdxHi] = useState([]);
  const [narration, setNarration] = useState("");
  const [playing, setPlaying] = useState(false);
  const delayRef = useRef(700);

  // Parse arr = [ ... ] from code if present
  const parseInitial = useCallback((text) => {
    const m = text.match(/arr\s*=\s*\[(.*?)\]/);
    if (!m) return null;
    const nums = m[1]
      .split(/,\s*/)
      .map((v) => Number(v))
      .filter((v) => Number.isFinite(v));
    return nums.length ? nums : null;
  }, []);

  const fetchSteps = async () => {
    setPlaying(false);
    setSteps([]);
    setNarration("Analyzing code...");

    const init = parseInitial(code);
    if (init) setArr(init);

    const res = await fetch("http://localhost:5000/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });
    const data = await res.json();
    if (!data.steps) {
      setNarration(data.error || "Model returned no steps");
      return;
    }
    setSteps(data.steps);
    setNarration("Ready. Press Play.");
  };

  const swap = (a, b) => {
    setArr((prev) => {
      const next = [...prev];
      const tmp = next[a];
      next[a] = next[b];
      next[b] = tmp;
      return next;
    });
  };

  const play = async () => {
    if (!steps.length) return;
    setPlaying(true);

    for (let i = 0; i < steps.length; i++) {
      if (!playing) break; // safety if we pause mid-run
      const step = steps[i];

      setIdxHi(step.indices || []);
      setNarration(step.description || "");

      if (step.action === "swap" && Array.isArray(step.indices) && step.indices.length === 2) {
        swap(step.indices[0], step.indices[1]);
      }

      // pace
      await new Promise((r) => setTimeout(r, delayRef.current));
    }

    setPlaying(false);
    setIdxHi([]);
  };

  const pause = () => setPlaying(false);
  const reset = () => {
    setPlaying(false);
    setIdxHi([]);
    const init = parseInitial(code);
    setArr(init || [5, 3, 8]);
    setNarration("");
  };

  // Make boxes reorder smoothly when arr changes
  const Item = ({ value, index }) => (
    <motion.div
      layout
      className={`w-14 h-14 rounded-2xl shadow flex items-center justify-center text-lg font-semibold select-none ${
        idxHi.includes(index) ? "bg-yellow-300" : "bg-blue-200"
      }`}
      style={{ minWidth: 56 }}
    >
      {value}
    </motion.div>
  );

  return (
    <div className="max-w-3xl mx-auto p-4 space-y-4">
      <h2 className="text-2xl font-bold">AlgoMap — Mini Visualizer</h2>

      <textarea
        value={code}
        onChange={(e) => setCode(e.target.value)}
        className="w-full h-40 rounded-xl p-3 border outline-none"
        spellCheck={false}
      />

      <div className="flex gap-2">
        <button onClick={fetchSteps} className="px-4 py-2 rounded-xl bg-slate-900 text-white">Analyze</button>
        <button onClick={() => { setPlaying(true); play(); }} disabled={!steps.length || playing} className="px-4 py-2 rounded-xl bg-green-600 text-white disabled:opacity-50">Play</button>
        <button onClick={pause} className="px-4 py-2 rounded-xl bg-amber-500 text-white">Pause</button>
        <button onClick={reset} className="px-4 py-2 rounded-xl bg-gray-300">Reset</button>
        <label className="ml-auto text-sm flex items-center gap-2">Speed(ms)
          <input type="number" defaultValue={700} className="w-20 border rounded p-1" onChange={(e)=> (delayRef.current = Math.max(100, Number(e.target.value)||700))} />
        </label>
      </div>

      <div className="flex gap-3 items-center">
        {arr.map((v, i) => (
          <Item key={`${v}-${i}`} value={v} index={i} />
        ))}
      </div>

      <div className="mt-2 text-purple-800 font-semibold min-h-6">{narration}</div>

      <div className="text-xs text-gray-500">
        Tip: The array initializes from <code>arr = [...]</code> if present in your code.
      </div>
    </div>
  );
}
