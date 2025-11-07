import { useEffect, useRef, useState, useMemo } from "react";

import AnimatorResolver from "../animators/AnimatorResolver";
import Chatbot from "../components/Chatbot";

// ---- Queue Animators ----
import LinearQueue from "../animators/queue/LinearQueue";
import PriorityQueue from "../animators/queue/PriorityQueue";
import CircularQueue from "../animators/queue/CircularQueue";
import DequeAnimator from "../animators/queue/deque/DequeAnimator";
import CircularDequeAnimator from "../animators/queue/deque/CircularDequeAnimator";
import GenericAIAnimator from "../animators/GenericAIAnimator";
import LoadingQuiz from "../components/LoadingQuiz";

// ---- Stack ----
import StackAnimator from "../animators/StackAnimator";

// ---- Linked Lists ----
import Singly from "../animators/linkedlist/Singly";
import Doubly from "../animators/linkedlist/Doubly";
import CircularSingly from "../animators/linkedlist/CircularSingly";
import CircularDoubly from "../animators/linkedlist/CircularDoubly";

// ---- Trees ----
import TreeAnimator from "../animators/TreeAnimator";
import BSTAnimator from "../animators/tree/BSTAnimator";
import BTreeAnimator from "../animators/tree/BTreeAnimator";

// ---- Graphs ----
import GraphAnimator from "../animators/GraphAnimator";
import BFSAnimator from "../animators/graph/BFSAnimator";
import DFSAnimator from "../animators/graph/DFSAnimator";
import WeightedGraphAnimator from "../animators/graph/WeightedGraphAnimator";

import { motion } from "framer-motion"; // ✅ make sure this is already imported at top
// ---- Sorting ----
import SortAnimator from "../animators/SortAnimator";

const ANALYZE_URL =
  import.meta.env.VITE_BACKEND_URL || "http://127.0.0.1:5000/translate_one";
const TRANSLATE_SORT_CODE_URL =
  import.meta.env.VITE_BACKEND_SORT_CODE_URL ||
  "http://127.0.0.1:5000/translate_sort_code";

export default function Visualize() {
  const [concept, setConcept] = useState("stack");
  const [replayToken, setReplayToken] = useState(Date.now());
  const [displayLabel, setDisplayLabel] = useState("Concept");
  const [stepHistory, setStepHistory] = useState([]);
  const [implementation, setImplementation] = useState("unknown");
  const [sortSteps, setSortSteps] = useState([]);
  const [sortInitial, setSortInitial] = useState([]);
  const [rawResp, setRawResp] = useState(null);
  const [code, setCode] = useState("");
  const [steps, setSteps] = useState([]);
  const [currStep, setCurrStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const timerRef = useRef(null);
  const [stepDuration, setStepDuration] = useState(2000);
  const [speed, setSpeed] = useState(1.0);
  const containerRef = useRef(null);
  const [dims, setDims] = useState({ w: 600, h: 400 });
  const [borrowedAnimator, setBorrowedAnimator] = useState(null);
  const [viewMode, setViewMode] = useState("array");
  const currentNarration = stepHistory[currStep] || "";
  const [varsState, setVarsState] = useState({});
  const [showInfo, setShowInfo] = useState(false);
  const [explanation, setExplanation] = useState("");
  const [selectedRating, setSelectedRating] = useState(0); // ⭐ add this line
  const [showQuiz, setShowQuiz] = useState(false);
  const CHECK_COMPLEXITY_URL =
    import.meta.env.VITE_BACKEND_COMPLEXITY_URL ||
    "http://127.0.0.1:5000/check_complexity";

  // 🧠 Memoize meta
  const memoMeta = useMemo(
    () => ({ ...(rawResp?.segments?.[0]?.meta || {}), viewMode }),
    [rawResp, viewMode]
  );

  // --- Resize observer ---
  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver(() => {
      const rect = containerRef.current.getBoundingClientRect();
      setDims({ w: rect.width, h: rect.height });
    });
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    setCurrStep(0);
    setPlaying(false);
  }, [concept]);
  // 🕐 Show quiz if analyzing takes more than 5 seconds
  useEffect(() => {
    let timer;
    if (analyzing) {
      timer = setTimeout(() => setShowQuiz(true), 5000);
    } else {
      setShowQuiz(false);
      clearTimeout(timer);
    }
    return () => clearTimeout(timer);
  }, [analyzing]);

  // --- Playback loop ---
  useEffect(() => {
    if (!playing) return;
    if (currStep >= steps.length - 1) {
      setPlaying(false);
      return;
    }
    const adjustedDelay = stepDuration / speed;
    timerRef.current = setTimeout(() => setCurrStep((s) => s + 1), adjustedDelay);
    return () => clearTimeout(timerRef.current);
  }, [playing, currStep, steps, stepDuration, speed]);

  // --- Track variable changes per step ---
  useEffect(() => {
    const stepVars = steps[currStep]?.vars || {};
    let updatedVars = { ...varsState };

    if (Object.keys(stepVars).length > 0) {
      updatedVars = { ...updatedVars, ...stepVars };
    }

    const narr = steps[currStep]?.description?.toLowerCase() || "";
    const numMatch = narr.match(/\d+/);
    const val = numMatch ? Number(numMatch[0]) : null;

    if (/process|output|visit/.test(narr) && val !== null) {
      if (!Array.isArray(updatedVars.traversal_output)) {
        updatedVars.traversal_output = [];
      }
      if (!updatedVars.traversal_output.includes(val)) {
        updatedVars.traversal_output = [...updatedVars.traversal_output, val];
      }
    }

    if (/initialize|empty|start traversal/.test(narr)) {
      updatedVars.traversal_output = [];
    }

    setVarsState(updatedVars);
  }, [currStep, steps]);

  // --- Analyze code ---
  const onAnalyze = async () => {
    setCurrStep(0);
    setSteps([]);
    setStepHistory([]);
    setAnalyzing(true);
      // 🔍 Pre-check complexity before sending to heavy translation
      const check = await fetch(CHECK_COMPLEXITY_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      }).then((r) => r.json());

      if (!check.safe) {
        setAnalyzing(false);
        setExplanation(`⚠️ ${check.reason}`);
        alert(`⚠️ ${check.reason}`); // 💬 quick visible popup
        console.warn("[Complexity-Check]", check);
        return; // 🛑 stop here if unsafe / too complex / non-DSA
      }


    try {
      const res = await fetch(ANALYZE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });

      const data = await res.json();
      const seg = data?.segments?.[0];
      const newSteps = Array.isArray(seg?.steps) ? seg.steps : [];

      const conceptName =
        seg?.concept?.toLowerCase() ||
        `${seg?.meta?.family || ""}-${seg?.meta?.kind || "unknown"}`;

      const displayLabel =
        seg?.label ||
        conceptName
          .split(/[-_]/g)
          .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
          .join(" – ");

      let borrowed = seg?.meta?.borrowed_animator || null;
      if (borrowed) {
        const b = borrowed.toLowerCase();
        if (b.includes("queue")) borrowed = "queue";
        else if (b.includes("stack")) borrowed = "stack";
        else if (b.includes("linked")) borrowed = "linkedlist";
        else if (b.includes("tree")) borrowed = "tree";
        else if (b.includes("graph")) borrowed = "graph";
      }
      setBorrowedAnimator(borrowed);

      if (conceptName.includes("sort")) {
        const sortRes = await fetch(TRANSLATE_SORT_CODE_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code }),
        });
        const sortData = await sortRes.json();
        const sortSeg = sortData?.segments?.[0] || {};
        setSortInitial(Array.isArray(sortSeg.initial) ? sortSeg.initial : []);
        setSortSteps(Array.isArray(sortSeg.steps) ? sortSeg.steps : []);
        setSteps(Array.isArray(sortSeg.steps) ? sortSeg.steps : []);
        setConcept("sort");
        setRawResp(sortData);
        setDisplayLabel(displayLabel);
        setImplementation(seg?.implementation || "unknown");
        setStepHistory(newSteps.map((s) => s.description || ""));
        setCurrStep(0);
        return;
      }

      setRawResp(data);
      const exp =
        seg?.explanation ||
        data?.segments?.[0]?.explanation ||
        "No explanation available.";
      setExplanation(exp);
      setConcept(conceptName);
      setDisplayLabel(displayLabel);
      setImplementation(seg?.implementation || "unknown");
      setSteps(newSteps);
      const frozenHistory = newSteps.map((s) => s.description || s.action || "");
      setStepHistory(frozenHistory);
      setCurrStep(0);
    } catch (err) {
      console.error("Analyze error:", err);
    } finally {
      setAnalyzing(false);
    }
  };

  const onReplay = () => {
    if (!steps.length) return;
    clearTimeout(timerRef.current);
    setCurrStep(0);
    setPlaying(true);
    setReplayToken(Date.now()); // 🔥 trigger remount for all animators
  };


  const clearHistory = () => {
    setSteps([]);
    setStepHistory([]);
    setCurrStep(0);
  };

  const isCircularType = () => {
    const c = (concept || "").toLowerCase();
    const k = (rawResp?.segments?.[0]?.meta?.kind || "").toLowerCase();
    return (
      k === "circular" ||
      c.includes("circular queue") ||
      c.includes("circular-deque") ||
      c.includes("circular deque")
    );
  };

  return (
    <div className="pt-16 h-screen flex overflow-hidden bg-gray-50">
      {/* LEFT PANEL */}
      <div className="w-[25%] min-w-[280px] h-full overflow-y-auto border-r border-gray-300 bg-white p-4 flex-shrink-0">
        <textarea
          className="w-full h-64 border rounded-md p-3 font-mono text-sm"
          placeholder="Paste your Python code here…"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          spellCheck={false}
        />

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button
            onClick={onAnalyze}
            disabled={!code.trim().length || analyzing}
            className="px-4 py-2 rounded bg-black text-white disabled:opacity-50"
          >
            {analyzing ? "Analyzing..." : "Analyze"}
          </button>

          <button
            onClick={() => setPlaying(true)}
            disabled={!steps.length}
            className="px-3 py-2 rounded bg-orange-500 text-white disabled:opacity-50"
          >
            Play
          </button>

          <button
            onClick={() => setPlaying(false)}
            className="px-3 py-2 rounded bg-gray-500 text-white"
          >
            Pause
          </button>

          <button
            onClick={onReplay}
            disabled={!steps.length}
            className="px-4 py-2 rounded bg-blue-600 text-white disabled:opacity-50"
          >
            Replay
          </button>

        </div>


          {/* Speedometer Control */}
          <div className="mt-3 w-full flex flex-col items-center">
            <label className="text-sm font-medium text-gray-700 mb-1">Speed</label>

            {/* Range input */}
            <input
              type="range"
              min="0.2"
              max="9"
              step="0.1"
              value={speed}
              onChange={(e) => setSpeed(parseFloat(e.target.value))}
              className="w-48 accent-indigo-600 mb-3"
            />

            {/* Dial Gauge */}
            <div className="relative w-24 h-12">
              {/* Needle */}
              <motion.div
                className="absolute bottom-0 left-1/2 origin-bottom w-[2px] h-[42px] bg-indigo-600 rounded-full shadow-md"
                animate={{ rotate: -90 + (speed / 9) * 180 }} // maps speed → needle angle
                transition={{ type: "spring", stiffness: 150, damping: 15 }}
              />
              {/* Semicircle base */}
              <div className="absolute bottom-0 left-0 w-full h-full rounded-t-full border-[3px] border-gray-300"></div>
              {/* Speed display */}
              <motion.div
                key={speed}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute top-full left-1/2 -translate-x-1/2 mt-2 text-xs font-semibold text-gray-700"
              >
                {speed.toFixed(1)}×
              </motion.div>
            </div>
          </div>



        {(isCircularType() || concept.toLowerCase().includes("circular-deque")) && (
          <div className="mt-3 flex items-center gap-3">
            <label className="text-sm font-medium text-gray-700">View Mode:</label>
            <button
              onClick={() => setViewMode(viewMode === "array" ? "ring" : "array")}
              className={`px-3 py-1 text-sm rounded transition ${
                viewMode === "array"
                  ? "bg-indigo-100 text-indigo-700 hover:bg-indigo-200"
                  : "bg-rose-100 text-rose-700 hover:bg-rose-200"
              }`}
            >
              {viewMode === "array" ? "Array View" : "Ring View"}
            </button>
          </div>
        )}

        {showInfo && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
            <div className="bg-white shadow-2xl rounded-xl p-5 w-[90%] max-w-sm relative animate-fadeIn">
              <button
                onClick={() => setShowInfo(false)}
                className="absolute top-2 right-3 text-gray-600 hover:text-red-500 text-lg"
              >
                ×
              </button>
              <h3 className="text-lg font-bold text-gray-800 mb-2">Explanation</h3>
              <div className="text-sm text-gray-700 whitespace-pre-line max-h-60 overflow-y-auto leading-relaxed">
                {explanation
                  ? explanation
                  : "No explanation yet — analyze to load details."}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* CENTER PANEL */}
      <div className="flex-1 flex flex-col overflow-hidden bg-transparent">
        <div className="flex items-center justify-center gap-2 mb-2">
          <h2 className="text-xl font-bold text-gray-800 text-center">
            {rawResp?.segments?.[0]?.meta?.family && rawResp?.segments?.[0]?.meta?.kind
              ? `${rawResp.segments[0].meta.family.charAt(0).toUpperCase() + rawResp.segments[0].meta.family.slice(1)} – ${rawResp.segments[0].meta.kind.charAt(0).toUpperCase() + rawResp.segments[0].meta.kind.slice(1)}`
              : displayLabel || "Unknown"}
          </h2>
        </div>

        <div
          ref={containerRef}
          className="flex-1 flex items-center justify-center overflow-auto bg-transparent"
        >
          {/* 🧩 NEW: Loading state with quiz or emoji message */}
          {analyzing ? (
            <>
              {showQuiz ? (
                <LoadingQuiz />   // 🧠 shows after 5 s if still analyzing
              ) : (
                <div className="flex flex-col items-center justify-center text-center text-gray-500 p-6">
                  <p className="text-4xl animate-pulse">⏳✨</p>
                  <p className="mt-3 text-sm font-medium">
                    Just a little while, AlgoMap is preparing your animation...
                  </p>
                </div>
              )}
            </>
          ) : steps.length ? (

            concept === "sort" ? (
              <SortAnimator
                key={replayToken}
                steps={sortSteps}
                currStep={currStep}
                stepDuration={2000 / speed}
                initial={sortInitial || []}
                containerWidth={dims.w}
                containerHeight={dims.h}
              />
            ) : borrowedAnimator ? (
              <>
                {borrowedAnimator === "queue" && (
                  <LinearQueue
                    steps={steps}
                    currStep={currStep}
                    speed={speed}
                    narration={currentNarration}
                  />
                )}

                {borrowedAnimator === "stack" && (
                  <StackAnimator
                    steps={steps}
                    currStep={currStep}
                    speed={speed}
                    narration={currentNarration}
                  />
                )}

                {borrowedAnimator === "linkedlist" && (
                  <Singly
                    steps={steps}
                    currStep={currStep}
                    speed={speed}
                    narration={currentNarration}
                  />
                )}

                {borrowedAnimator === "tree" && (
                  <TreeAnimator
                    steps={steps}
                    meta={rawResp?.segments?.[0]?.meta || {}}
                    currStep={currStep}
                    playing={playing}
                    speed={speed}
                    narration={currentNarration}
                    containerWidth={dims.w}
                    containerHeight={dims.h}
                  />
                )}

                {borrowedAnimator === "graph" && (
                  <GraphAnimator
                    steps={steps}
                    currStep={currStep}
                    speed={speed}
                    narration={currentNarration}
                    meta={rawResp?.segments?.[0]?.meta || {}}
                    containerWidth={dims.w}
                    containerHeight={dims.h}
                  />
                )}
              </>
            ) : (
              <AnimatorResolver
                key={replayToken}
                steps={steps}
                currStep={currStep}
                playing={playing}
                speed={speed}
                meta={memoMeta}
                implementation={rawResp?.segments?.[0]?.implementation || "unknown"}
                concept={rawResp?.segments?.[0]?.concept || ""}
                viewMode={viewMode}
                narration={currentNarration}
              />
            )
          ) : (
            <div className="text-gray-500 h-full w-full flex items-center justify-center">
              Analyze to see the animation…
            </div>
          )}

          {/* Optional: GenericAIAnimator rendering (for LLM fallback visuals) */}
          {rawResp?.segments?.[0]?.animation?.elements?.length > 0 && (
            <GenericAIAnimator
              steps={rawResp.segments[0].steps || []}
              meta={rawResp.segments[0].meta || {}}
              animation={rawResp.segments[0].animation || {}}
              containerWidth={dims.w}
              containerHeight={dims.h}
            />
          )}
        </div>
      </div>


      {/* RIGHT PANEL */}
      <div className="w-[25%] min-w-[280px] h-full overflow-y-auto border-l border-gray-300 bg-white p-4 flex-shrink-0">
        <div className="mb-4">
          <h2 className="font-bold text-lg mb-2">Program Variables</h2>
          <div className="p-3 bg-gray-50 shadow-inner">
            {Object.keys(varsState).length > 0 ? (
              <ul className="space-y-1">
                {Object.entries(varsState).map(([key, val]) => (
                  <li
                    key={key}
                    className="flex justify-between text-sm overflow-hidden break-all"
                  >
                    <span className="font-medium text-gray-700 mr-2 whitespace-nowrap">
                      {key}
                    </span>
                    <span className="text-gray-900 text-right truncate">
                      {typeof val === "object"
                        ? JSON.stringify(val)
                        : String(val)}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500 text-sm italic">
                No tracked variables
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-col flex-1 border-t pt-2">
          <h3 className="font-bold text-gray-800 mb-2">Step History</h3>
          <div
            className="overflow-y-auto bg-white rounded-md shadow-inner p-2"
            style={{
              maxHeight: "calc(100vh - 18rem)",
              scrollbarWidth: "thin",
              scrollbarColor: "#cbd5e1 #f8fafc",
            }}
          >
            {stepHistory.map((s, idx) => (
              <p
                key={idx}
                className={`text-sm mb-1 ${
                  idx === currStep
                    ? "bg-purple-100 font-semibold text-purple-800"
                    : "text-gray-700"
                }`}
              >
                {idx + 1}. {s}
              </p>
            ))}
          </div>
        </div>

        <button
          onClick={clearHistory}
          className="mt-3 px-3 py-1 rounded bg-red-500 text-white text-sm self-end"
        >
          Clear History
        </button>

      </div>
      <Chatbot />

    </div>
  );
}
