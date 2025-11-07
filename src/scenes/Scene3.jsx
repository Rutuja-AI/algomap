// src/scenes/Scene3.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import bgTexture from "../assets/scene_scroll_part_3_extended_v2_softwhite.png";
import { analyzeCodeToSteps } from "../api/analyzeCode"; // hardened now
import { analyzeLocal } from "../api/analyzeLocal";

export default function Scene3() {
  const bgStyle = useMemo(
    () => ({
      backgroundColor: "#F8F7F4",
      backgroundImage: `url(${bgTexture})`,
      backgroundRepeat: "no-repeat",
      backgroundPosition: "center 20%",
      backgroundSize: "clamp(900px, 80vw, 1400px) auto",
    }),
    []
  );

  const [code, setCode] = useState(`// Paste any code and click "Run"
function bubbleSort(arr){
  for(let i=0;i<arr.length-1;i++){
    for(let j=0;j<arr.length-1-i;j++){
      if(arr[j] > arr[j+1]){
        const t = arr[j]; arr[j] = arr[j+1]; arr[j+1] = t;
      }
    }
  }
  return arr;
}`);

  const [steps, setSteps] = useState([]);
  const [idx, setIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(600);
  const [loading, setLoading] = useState(false);
  const timer = useRef(null);

  // autoplay
  useEffect(() => {
    if (!playing || steps.length === 0) return;
    timer.current = setInterval(() => {
      setIdx((i) => (i + 1 < steps.length ? i + 1 : i));
    }, speed);
    return () => clearInterval(timer.current);
  }, [playing, speed, steps]);

  // run → call your API
  const handleRun = async () => {
    if (!code.trim()) return;
    setLoading(true);
    setPlaying(false);
    setIdx(0);
    try {
      const local = await analyzeLocal(code);
      if (local?.length >= 2) {
        setSteps(local);
        return;
      }
      // fallback if you want:
      const ai = await analyzeCodeToSteps(code);
      setSteps(Array.isArray(ai) ? ai : ai?.steps || []);
    } catch (e) {
      console.error("Analyze error:", e);
      setSteps([{ note: "Analysis failed. Check your API or response format." }]);
    } finally {
      setLoading(false);
    }
  };

  // Demo loader (guarantees bars even offline)
  const loadDemo = () => {
    setIdx(0);
    setPlaying(false);
    setSteps([
      { array: [5,3,8,4], highlights: [0,1], codeLines: [1], note: "compare 5 & 3" },
      { array: [3,5,8,4], highlights: [1,2], codeLines: [1], note: "swap 5 & 3" },
      { array: [3,5,8,4], highlights: [2,3], codeLines: [1], note: "compare 8 & 4" },
      { array: [3,5,4,8], highlights: [2,3], codeLines: [1], note: "swap 8 & 4" },
      { array: [3,5,4,8], highlights: [],    codeLines: [1], note: "pass complete" },
    ]);
  };

  // current step fields
  const s = steps[idx] || {};
  const bars = Array.isArray(s.array) ? s.array : [];
  const highlights = new Set(Array.isArray(s.highlights) ? s.highlights : []);
  const activeLines = Array.isArray(s.codeLines) ? s.codeLines : [];
  const note = s.note || "";

  return (
    <section
      id="scene-3"
      className="w-full min-h-[calc(100svh-4rem)] snap-start relative flex items-center py-14 md:py-18"
      style={bgStyle}
    >
      <div className="absolute inset-0 bg-gradient-to-b from-[#F6FAFE]/85 via-[#F8F9FB]/85 to-[#F8F7F4]/85" />

      <div className="relative z-10 mx-auto w-full max-w-6xl px-4 md:px-8">
        {/* Header */}
        <div className="text-center mb-6 md:mb-8">
          <h2
            className="text-3xl md:text-5xl font-bold text-slate-900"
            style={{
              fontFamily: "'Irish Grover', cursive",
              WebkitTextStroke: "2px #f5e27a",
              paintOrder: "stroke fill",
              textShadow: "0 2px 0 rgba(0,0,0,0.08), 0 0 12px rgba(245,226,122,0.35)",
            }}
          >
            Code → Animation
          </h2>
          <p className="mt-2 text-slate-700">
            Paste any code. We’ll fetch step events and animate them.
          </p>
        </div>

        {/* Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: editor + controls */}
          <div className="rounded-2xl bg-white/70 backdrop-blur-md border border-white/60 ring-1 ring-black/5 p-4 md:p-5 shadow-[0_8px_24px_rgba(2,18,33,0.12)]">
            <div
              className="text-lg md:text-xl font-bold mb-3 text-slate-900"
              style={{ fontFamily: "'Irish Grover', cursive" }}
            >
              Your Code
            </div>

            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full h-[280px] md:h-[340px] font-mono text-sm md:text-base p-3 rounded-lg border border-white/70 bg-white/80"
              spellCheck={false}
            />

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <button
                onClick={handleRun}
                disabled={loading || !code.trim()}
                className="rounded-xl px-4 py-2 bg-[#0b1520] text-white hover:opacity-90 disabled:opacity-50"
              >
                {loading ? "Running…" : "Run (GPT)"}
              </button>

              <button
                onClick={loadDemo}
                className="rounded-xl px-3 py-2 border border-[#0b1520] text-[#0b1520] bg-white/80 text-sm"
                title="Loads a guaranteed working demo sequence"
              >
                Load Demo
              </button>

              <div className="flex items-center gap-2 ml-auto">
                <label className="text-sm text-slate-700">Speed</label>
                <input
                  type="range"
                  min="150"
                  max="1200"
                  step="50"
                  value={speed}
                  onChange={(e) => setSpeed(Number(e.target.value))}
                />
              </div>
            </div>

            {/* timeline controls */}
            <div className="mt-4 flex items-center gap-2">
              <button
                onClick={() => setPlaying((p) => !p)}
                disabled={!steps.length}
                className="rounded-xl px-3 py-1.5 bg-[#0b1520] text-white text-sm disabled:opacity-50"
              >
                {playing ? "Pause" : "Play"}
              </button>
              <button
                onClick={() => setIdx((i) => (i + 1 < steps.length ? i + 1 : i))}
                disabled={!steps.length}
                className="rounded-xl px-3 py-1.5 border border-[#0b1520] text-[#0b1520] bg-white/80 text-sm disabled:opacity-50"
              >
                Step
              </button>
              <button
                onClick={() => {
                  setIdx(0);
                  setPlaying(false);
                }}
                disabled={!steps.length}
                className="rounded-xl px-3 py-1.5 border border-[#0b1520] text-[#0b1520] bg-white/80 text-sm disabled:opacity-50"
              >
                Reset
              </button>

              <div className="ml-3 text-sm text-slate-600">
                Step {Math.min(idx + 1, steps.length)} / {steps.length || 0}
              </div>
            </div>

            {/* scrubber */}
            <input
              type="range"
              min="0"
              max={Math.max(0, steps.length - 1)}
              value={idx}
              onChange={(e) => setIdx(Number(e.target.value))}
              disabled={!steps.length}
              className="mt-2 w-full"
            />
          </div>

          {/* Right: animation */}
          <div className="rounded-2xl bg-white/70 backdrop-blur-md border border-white/60 ring-1 ring-black/5 p-4 md:p-5 shadow-[0_8px_24px_rgba(2,18,33,0.12)]">
            <div
              className="text-lg md:text-xl font-bold mb-3 text-slate-900"
              style={{ fontFamily: "'Irish Grover', cursive" }}
            >
              Animation
            </div>

            {Array.isArray(bars) && bars.length ? (
              <div className="relative h-[260px] md:h-[300px] w-full flex items-end gap-2 border border-white/60 rounded-xl bg-white/50 p-3 overflow-hidden">
                {bars.map((val, k) => {
                  const max = Math.max(...bars, 1);
                  const H = Math.round((val / max) * 92) + 8; // Adjusted for more height headroom
                  const hot = highlights.has(k);
                  return (
                    <div key={k} className="flex-1 grid place-items-end h-full" title={`a[${k}] = ${val}`}>
                      <div
                        className="w-full rounded-t-md transition-all duration-300"
                        style={{
                          height: `${Math.max(10, H)}%`,
                          background: hot ? "#14b8a6" : "#22d3ee",
                          outline: hot ? "2px solid rgba(0,0,0,0.12)" : "none",
                        }}
                      />
                      <div className="text-center text-xs mt-1 text-slate-800">{val}</div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="h-[260px] md:h-[300px] w-full border border-white/60 rounded-xl bg-white/60 p-4 overflow-auto">
                {activeLines.length > 0 && (
                  <div className="mb-2 text-xs text-slate-500">
                    Highlight lines: {activeLines.join(", ")}
                  </div>
                )}
                <div className="text-slate-800 text-base leading-relaxed">
                  {note || "Run your code or click “Load Demo” to see animated steps here."}
                </div>
              </div>
            )}

            <div className="mt-3 text-sm text-slate-600">
              {note ? <>› {note}</> : null}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
