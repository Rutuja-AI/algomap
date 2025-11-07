import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

/*
  AIMLVisualizer_v2.jsx
  - Single-file React component (JSX) using Tailwind CSS classes
  - Cleaner structure, fixes to A* and Neural Net forward pass, better controls, accessibility
  - Split into small pure components and memoized renderings for performance
*/

/* ---------------- Utility helpers ---------------- */
const coordKey = (c) => `${c[0]},${c[1]}`;
const parseKey = (k) => k.split(",").map((n) => parseInt(n, 10));

/* ---------------- Grid Component (memoized) ---------------- */
const Grid = React.memo(function Grid({ grid, path = [], current = null, goal = null, start = null, exploring = [], visited = [] }) {
  return (
    <div className="grid grid-cols-8 gap-1 p-3 bg-gray-100 rounded-lg" aria-hidden>
      {grid.map((row, i) =>
        row.map((cell, j) => {
          let className = "w-10 h-10 border-2 border-gray-300 flex items-center justify-center text-xs font-semibold transition-all duration-300 rounded-sm";

          const isStart = start && start[0] === i && start[1] === j;
          const isGoal = goal && goal[0] === i && goal[1] === j;
          const isCurrent = current && current[0] === i && current[1] === j;
          const isExploring = exploring.some(([x, y]) => x === i && y === j);
          const isVisited = visited.some(([x, y]) => x === i && y === j);
          const isPath = path.some(([x, y]) => x === i && y === j);

          if (isStart) className += " bg-green-600 text-white shadow-sm transform scale-105";
          else if (isGoal) className += " bg-red-600 text-white shadow-sm transform scale-105";
          else if (isCurrent) className += " bg-blue-600 text-white shadow animate-pulse";
          else if (isExploring) className += " bg-orange-300 animate-pulse";
          else if (isPath) className += " bg-yellow-400 shadow-inner";
          else if (isVisited) className += " bg-purple-100";
          else if (cell === 1) className += " bg-gray-800";
          else className += " bg-white hover:bg-gray-50";

          return (
            <div key={`${i}-${j}`} className={className} role="img" aria-label={`cell ${i}-${j}`}>
              {isStart ? "S" : isGoal ? "G" : isCurrent ? "●" : ""}
            </div>
          );
        })
      )}
    </div>
  );
});

/* ---------------- Chart Component ---------------- */
const Chart = React.memo(function Chart({ data, current = null, exploring = [], title = "Fitness Landscape" }) {
  const maxVal = Math.max(...data);
  const minVal = Math.min(...data);
  const range = maxVal - minVal || 1;

  return (
    <div className="bg-gray-100 rounded-lg p-4 w-full">
      <h4 className="text-lg font-medium mb-3 text-center">{title}</h4>
      <div className="flex items-end justify-center gap-2 h-44">
        {data.map((val, i) => {
          const height = ((val - minVal) / range) * 100;
          const isActive = current === i;
          const isExploring = exploring.includes(i);

          return (
            <div key={i} className="flex flex-col items-center">
              <div
                className={`w-8 flex flex-col items-center justify-end transition-all duration-500 rounded-t-md ${isActive ? "shadow-lg transform scale-110" : ""} ${isExploring ? "animate-pulse" : ""}`}
                style={{ height: `${Math.max(height, 10)}%`, background: isActive ? undefined : undefined }}
              >
                <div className={`${isActive ? "bg-blue-600 text-white" : isExploring ? "bg-orange-400 text-white" : "bg-gray-500 text-white"} w-full h-full flex items-end justify-center rounded-t-md`}>
                  <span className="text-xs font-bold p-1">{val}</span>
                </div>
              </div>

              <div className="text-sm mt-2 font-medium text-gray-700">{i}</div>
              {isActive && <div className="text-xs text-blue-600 font-bold">Current</div>}
              {isExploring && <div className="text-xs text-orange-600">Checking</div>}
            </div>
          );
        })}
      </div>
      <div className="mt-4 text-center">
        <p className="text-sm text-gray-600">Position (x-axis) vs Fitness Value (height)</p>
      </div>
    </div>
  );
});

/* ---------------- Neural Network SVG ---------------- */
const NeuralNetwork = React.memo(function NeuralNetwork({ layers, weights, activations = [], highlight = [], currentStep = "" }) {
  // compute node positions dynamically
  const width = 560;
  const height = 280;
  const xSpacing = width / (layers.length + 1);

  const layerPositions = layers.map((n, i) => ({ x: xSpacing * (i + 1) }));

  return (
    <div className="bg-gray-100 rounded-lg p-6 relative overflow-hidden w-full">
      <div className="text-center mb-2">
        <h4 className="text-lg font-medium">{currentStep}</h4>
      </div>

      <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid">
        {/* connections */}
        {weights.map((layerWeights, layerIdx) => (
          layerWeights.map((nodeWeights, nodeIdx) => (
            nodeWeights.map((weight, weightIdx) => {
              const x1 = layerPositions[layerIdx].x;
              const y1 = height / 2 + (nodeIdx - (layers[layerIdx] - 1) / 2) * 50;
              const x2 = layerPositions[layerIdx + 1].x;
              const y2 = height / 2 + (weightIdx - (layers[layerIdx + 1] - 1) / 2) * 50;
              const opacity = Math.min(Math.abs(weight), 1);
              const isHighlighted = highlight.includes(`${layerIdx}-${nodeIdx}-${weightIdx}`);

              return (
                <g key={`${layerIdx}-${nodeIdx}-${weightIdx}`}>
                  <line
                    x1={x1} y1={y1} x2={x2} y2={y2}
                    stroke={isHighlighted ? "#3B82F6" : weight > 0 ? "#10B981" : "#EF4444"}
                    strokeWidth={isHighlighted ? 3.5 : 1.8}
                    opacity={isHighlighted ? 1 : 0.75 * opacity}
                    className="transition-all duration-300"
                  />
                  {isHighlighted && (
                    <text x={(x1 + x2) / 2} y={(y1 + y2) / 2 - 6} textAnchor="middle" fontSize={11} fill="#1E40AF">w={weight.toFixed(2)}</text>
                  )}
                </g>
              );
            })
          ))
        ))}

        {/* nodes */}
        {layers.map((layerCount, layerIdx) => (
          Array.from({ length: layerCount }, (_, nodeIdx) => {
            const x = layerPositions[layerIdx].x;
            const y = height / 2 + (nodeIdx - (layerCount - 1) / 2) * 50;
            const activation = activations[layerIdx] && activations[layerIdx][nodeIdx];
            const isActive = highlight.includes(`layer-${layerIdx}-${nodeIdx}`);

            return (
              <g key={`node-${layerIdx}-${nodeIdx}`}>
                <circle cx={x} cy={y} r={18} fill={isActive ? "#3B82F6" : activation !== undefined ? "#FFFFFF" : "#F3F4F6"} stroke={isActive ? "#1D4ED8" : "#374151"} strokeWidth={isActive ? 3 : 1.6} />
                <text x={x} y={y + 5} textAnchor="middle" fontSize={12} fill={isActive ? "#FFFFFF" : "#374151"} fontWeight={700}>
                  {activation !== undefined ? activation.toFixed(2) : ""}
                </text>
                <text x={x} y={y + 32} textAnchor="middle" fontSize={11} fill="#4B5563">
                  {layerIdx === 0 ? `In${nodeIdx + 1}` : layerIdx === layers.length - 1 ? `Out${nodeIdx + 1}` : `H${nodeIdx + 1}`}
                </text>
              </g>
            );
          })
        ))}
      </svg>

      <div className="relative z-10 flex justify-between pt-2 text-sm text-gray-700">
        <span>Input Layer</span>
        <span>Hidden Layer</span>
        <span>Output Layer</span>
      </div>
    </div>
  );
});

/* ---------------- AlgorithmDemo wrapper (reusable) ---------------- */
function AlgorithmDemo({ name, generateSteps, defaultParams, speed = 0.8, renderVisualization }) {
  const [params, setParams] = useState(defaultParams);
  const [steps, setSteps] = useState(() => generateSteps(defaultParams));
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const intervalRef = useRef(null);

  useEffect(() => {
    setSteps(generateSteps(params));
    setIndex(0);
    setPlaying(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!playing) {
      clearInterval(intervalRef.current);
      return;
    }

    intervalRef.current = setInterval(() => {
      setIndex((i) => {
        if (i < steps.length - 1) return i + 1;
        setPlaying(false);
        return i;
      });
    }, Math.max(250, 1800 / speed));

    return () => clearInterval(intervalRef.current);
  }, [playing, steps.length, speed]);

  const apply = useCallback(() => {
    const s = generateSteps(params);
    setSteps(s);
    setIndex(0);
    setPlaying(false);
  }, [generateSteps, params]);

  const reset = useCallback(() => {
    setIndex(0);
    setPlaying(false);
  }, []);

  const step = steps[index] || {};

  return (
    <div className="flex flex-col items-center w-full">
      <div className="flex gap-3 mb-4 flex-wrap justify-center bg-white p-4 rounded-lg shadow-sm">
        {Object.entries(params).map(([k, v]) => (
          <div key={k} className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700 capitalize">{k}:</label>
            <input
              type="text"
              value={Array.isArray(v) ? v.join(",") : v}
              onChange={(e) => {
                const raw = e.target.value;
                if (k === "landscape" || k === "inputs") {
                  const parsed = raw.split(",").map((x) => parseFloat(x.trim())).filter((n) => !Number.isNaN(n));
                  setParams((p) => ({ ...p, [k]: parsed }));
                } else if (k === "gridSize") {
                  const num = parseInt(raw || "0", 10) || 8;
                  setParams((p) => ({ ...p, [k]: num }));
                } else {
                  setParams((p) => ({ ...p, [k]: raw }));
                }
              }}
              className="border-2 border-gray-300 rounded-md px-3 py-1 w-36 text-sm focus:border-blue-500"
              aria-label={`${k} input`}
            />
          </div>
        ))}

        <div className="flex items-center gap-2">
          <button onClick={apply} className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-md text-sm">Apply</button>
          <button onClick={() => setPlaying(true)} disabled={playing} className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1 rounded-md text-sm disabled:opacity-50">Play</button>
          <button onClick={() => setPlaying(false)} disabled={!playing} className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded-md text-sm disabled:opacity-50">Pause</button>
          <button onClick={() => setIndex((i) => Math.max(0, i - 1))} className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded-md text-sm">Prev</button>
          <button onClick={() => setIndex((i) => Math.min(steps.length - 1, i + 1))} className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded-md text-sm">Next</button>
          <button onClick={reset} className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 py-1 rounded-md text-sm">Reset</button>
        </div>
      </div>

      <div className="mb-6 w-full flex justify-center">{renderVisualization(step)}</div>

      <div className="text-center bg-white p-4 rounded-lg shadow-sm max-w-2xl">
        <p className="text-gray-800 text-base mb-2 leading-relaxed">{step.narration || "Set parameters and press Apply"}</p>
        <div className="flex justify-center gap-4 text-sm text-gray-600">
          <span>Step {index + 1} of {Math.max(steps.length, 1)}</span>
          {step.hint && (<span className="text-blue-600 font-medium">💡 {step.hint}</span>)}
        </div>
      </div>
    </div>
  );
}

/* ---------------- Hill Climbing Implementation ---------------- */
function HillClimbingDemo({ speed = 0.8 }) {
  const generateSteps = useCallback(({ landscape, start }) => {
    const steps = [{ landscape, current: start, exploring: [], narration: `Start at ${start} (value=${landscape[start]})`, hint: "Hill climbing checks neighbors and moves uphill." }];

    let cur = start;
    const maxIter = 50;
    let it = 0;

    while (it < maxIter) {
      const neighbors = [cur - 1, cur + 1].filter((p) => p >= 0 && p < landscape.length);
      const currentFitness = landscape[cur];

      steps.push({ landscape, current: cur, exploring: neighbors.slice(), narration: `Checking neighbors ${neighbors.join(", ")}`, hint: "Look for better fitness." });

      let best = cur;
      let bestVal = currentFitness;

      for (const n of neighbors) {
        const val = landscape[n];
        steps.push({ landscape, current: cur, exploring: [n], narration: `Neighbor ${n} => ${val}` });
        if (val > bestVal) {
          best = n; bestVal = val;
        }
      }

      if (best === cur) {
        steps.push({ landscape, current: cur, exploring: [], narration: `Local maximum at ${cur} (${currentFitness}).` });
        break;
      }

      steps.push({ landscape, current: best, exploring: [], narration: `Move to ${best} (value=${bestVal}).` });
      cur = best; it += 1;
    }

    return steps;
  }, []);

  const render = useCallback((step) => (
    <Chart data={step.landscape || [1,3,2,7,4,8,3,6,2,9]} current={step.current} exploring={step.exploring || []} title="Hill Climbing" />
  ), []);

  return <AlgorithmDemo name="Hill Climbing" generateSteps={generateSteps} defaultParams={{ landscape: [1,3,2,7,4,8,3,6,2,9], start: 0 }} speed={speed} renderVisualization={render} />;
}

/* ---------------- A* Implementation (fixed path reconstruction) ---------------- */
function AStarDemo({ speed = 0.8 }) {
  const generateSteps = useCallback(({ gridSize = 8 }) => {
    const grid = Array.from({ length: gridSize }, () => Array.from({ length: gridSize }, () => 0));
    // sample obstacles
    [[2,3],[3,3],[4,3],[5,1],[5,2],[5,3]].forEach(([x,y]) => { if (x < gridSize && y < gridSize) grid[x][y]=1; });

    const start = [0,0];
    const goal = [gridSize-1, gridSize-1];

    const steps = [{ grid, path: [], current: null, exploring: [], visited: [], start, goal, narration: "Start A*" }];

    const openSet = new Set([coordKey(start)]);
    const closedSet = new Set();
    const gScore = { [coordKey(start)]: 0 };
    const fScore = { [coordKey(start)]: Math.abs(start[0]-goal[0]) + Math.abs(start[1]-goal[1]) };
    const cameFrom = {}; // key -> key

    const neighborsOf = ([x,y]) => (
      [[x-1,y],[x+1,y],[x,y-1],[x,y+1]].filter(([a,b]) => a>=0 && a<gridSize && b>=0 && b<gridSize && grid[a][b]===0)
    );

    while (openSet.size > 0) {
      // pick lowest fScore
      let currentKey = null;
      for (const k of openSet) {
        if (currentKey === null || (fScore[k] ?? Infinity) < (fScore[currentKey] ?? Infinity)) currentKey = k;
      }
      const current = parseKey(currentKey);

      const neighbors = neighborsOf(current);

      steps.push({ grid, path: Array.from(closedSet).map(parseKey), current, exploring: neighbors.slice(), visited: Array.from(closedSet).map(parseKey), start, goal, narration: `Exploring ${currentKey} with f=${(fScore[currentKey]||0).toFixed(1)}` });

      if (currentKey === coordKey(goal)) {
        // reconstruct path
        const path = [];
        let k = currentKey;
        while (k) {
          path.unshift(parseKey(k));
          k = cameFrom[k];
        }
        steps.push({ grid, path, current: null, exploring: [], visited: Array.from(closedSet).map(parseKey), start, goal, narration: `Found path of ${path.length} steps.` });
        break;
      }

      openSet.delete(currentKey);
      closedSet.add(currentKey);

      for (const n of neighbors) {
        const nk = coordKey(n);
        if (closedSet.has(nk)) continue;
        const tentativeG = (gScore[currentKey] || Infinity) + 1;
        if (!openSet.has(nk)) openSet.add(nk);
        else if (tentativeG >= (gScore[nk] || Infinity)) continue;

        cameFrom[nk] = currentKey;
        gScore[nk] = tentativeG;
        fScore[nk] = tentativeG + Math.abs(n[0]-goal[0]) + Math.abs(n[1]-goal[1]);

        steps.push({ grid, path: Array.from(closedSet).map(parseKey), current: n, exploring: [n], visited: Array.from(closedSet).map(parseKey), start, goal, narration: `Add neighbor ${nk} with f=${fScore[nk].toFixed(1)}` });
      }
    }

    return steps;
  }, []);

  const render = useCallback((step) => (
    <Grid grid={step.grid || Array.from({ length: 8 }, () => Array(8).fill(0))} path={step.path || []} current={step.current} exploring={step.exploring || []} visited={step.visited || []} start={step.start} goal={step.goal} />
  ), []);

  return <AlgorithmDemo name="A*" generateSteps={generateSteps} defaultParams={{ gridSize: 8 }} speed={speed} renderVisualization={render} />;
}

/* ---------------- Neural Network Demo (fixed forward pass) ---------------- */
function NeuralNetworkDemo({ speed = 0.8 }) {
  const generateSteps = useCallback(({ inputs }) => {
    const layers = [2, 3, 1];
    const weights = [
      [[0.5, -0.2, 0.8], [0.3, 0.7, -0.1]], // input->hidden (2x3)
      [[0.6], [-0.4], [0.9]] // hidden->out (3x1)
    ];

    const clampExp = (x) => Math.max(-500, Math.min(500, x));
    const sigmoid = (x) => 1 / (1 + Math.exp(-clampExp(x)));

    const steps = [{ layers, weights, activations: [inputs.slice(), [], []], highlight: [], currentStep: "Neural Net - start", narration: `Inputs: [${inputs.join(', ')}]` }];

    // input layer active
    steps.push({ layers, weights, activations: [[...inputs], [], []], highlight: [`layer-0-0`, `layer-0-1`], currentStep: "Input Layer", narration: "Input neurons active." });

    const activations = [inputs.slice(), new Array(layers[1]).fill(0), new Array(layers[2]).fill(0)];

    // compute hidden
    for (let j = 0; j < layers[1]; j++) {
      steps.push({ layers, weights, activations: activations.map(a=>[...a]), highlight: [`0-0-${j}`], currentStep: `Compute Hidden ${j+1}`, narration: `Computing hidden neuron ${j+1}` });
      let sum = 0;
      for (let i = 0; i < layers[0]; i++) {
        sum += inputs[i] * weights[0][i][j];
      }
      activations[1][j] = sigmoid(sum);
      steps.push({ layers, weights, activations: activations.map(a=>[...a]), highlight: [`layer-1-${j}`], currentStep: `Hidden ${j+1} ready`, narration: `Hidden ${j+1} -> raw=${sum.toFixed(3)} activated=${activations[1][j].toFixed(3)}` });
    }

    // compute output
    steps.push({ layers, weights, activations: activations.map(a=>[...a]), highlight: [`layer-1-0`,`layer-1-1`,`layer-1-2`], currentStep: `Compute Output`, narration: `Hidden outputs: ${activations[1].map(x=>x.toFixed(3)).join(', ')}` });

    let sumOut = 0;
    for (let i = 0; i < layers[1]; i++) {
      const contrib = activations[1][i] * weights[1][i][0];
      sumOut += contrib;
      steps.push({ layers, weights, activations: activations.map(a=>[...a]), highlight: [`1-${i}-0`, `layer-1-${i}`], currentStep: `Add hidden ${i+1}`, narration: `Add ${activations[1][i].toFixed(3)} * ${weights[1][i][0]} = ${contrib.toFixed(3)}` });
    }

    activations[2][0] = sigmoid(sumOut);
    steps.push({ layers, weights, activations: activations.map(a=>[...a]), highlight: [`layer-2-0`], currentStep: `Output ready`, narration: `Output sigmoid(${sumOut.toFixed(3)}) = ${activations[2][0].toFixed(3)}` });

    steps.push({ layers, weights, activations: activations.map(a=>[...a]), highlight: [], currentStep: `Forward pass complete`, narration: `Result: ${activations[2][0].toFixed(3)}` });

    return steps;
  }, []);

  const render = useCallback((step) => (
    <NeuralNetwork layers={(step.layers||[2,3,1])} weights={(step.weights||[])} activations={(step.activations||[])} highlight={(step.highlight||[])} currentStep={step.currentStep||""} />
  ), []);

  return <AlgorithmDemo name="Neural Network" generateSteps={generateSteps} defaultParams={{ inputs: [1.0, 0.5] }} speed={speed} renderVisualization={render} />;
}

/* ---------------- Main Visualizer (layout & controls) ---------------- */
export default function AIMLVisualizerV2() {
  const [selected, setSelected] = useState("Hill Climbing");
  const [speed, setSpeed] = useState(0.8);

  const DEMOS = useMemo(() => ({
    "Hill Climbing": <HillClimbingDemo speed={speed} />,
    "A* Pathfinding": <AStarDemo speed={speed} />,
    "Neural Network": <NeuralNetworkDemo speed={speed} />
  }), [speed]);

  const EXPLANATIONS = {
    "Hill Climbing": "Simple local search that moves to better neighbors; fast but can get stuck in local maxima.",
    "A* Pathfinding": "Search algorithm that uses g + h (actual + heuristic) to find optimal shortest paths when heuristic is admissible.",
    "Neural Network": "Layered computing model where activations flow forward and weights modulate signals."
  };

  return (
    <div className="flex h-screen pt-16">
      <aside className="w-72 bg-white border-r p-6 flex flex-col overflow-y-auto">
        <h2 className="text-xl font-bold mb-4"> AI/ML Algorithms </h2>
        

        <label className="block text-sm font-medium mb-2">Algorithm</label>
        <select value={selected} onChange={(e) => setSelected(e.target.value)} className="w-full border-2 border-gray-300 rounded-md p-2 mb-4">
          {Object.keys(DEMOS).map(k => <option key={k} value={k}>{k}</option>)}
        </select>

        <label className="block text-sm font-medium mb-2">Animation speed</label>
        <input type="range" min="0.3" max="1.5" step="0.1" value={speed} onChange={(e) => setSpeed(parseFloat(e.target.value))} className="w-full mb-2" />
        <div className="flex justify-between text-xs text-gray-500 mb-4"><span>Slower</span><span className="font-medium">x{speed.toFixed(1)}</span><span>Faster</span></div>

        <div className="mb-6 bg-blue-50 rounded-lg p-4">
          <h3 className="text-sm font-bold mb-2 text-blue-800">Key Concepts</h3>
          <p className="text-xs text-blue-700">{EXPLANATIONS[selected]}</p>
        </div>

        <button onClick={() => window.location.reload()} className="bg-gray-200 hover:bg-gray-300 text-gray-700 py-2 px-4 rounded-md">Reload Page</button>
      </aside>

      <main className="flex-1 flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-8">
        <div className="text-center mb-6">
          <h2 className="text-3xl font-bold mb-2">{selected}</h2>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8 min-h-[480px] flex items-center justify-center w-full max-w-5xl">
          <div className="w-full">
            {DEMOS[selected]}
          </div>
        </div>
      </main>

      <aside className="w-80 bg-white border-l p-6 overflow-y-auto">
        <h3 className="text-lg font-bold mb-3">Learn More</h3>
        <div className="mb-4 text-sm text-gray-600">{EXPLANATIONS[selected]}</div>

        <div className="mb-4 bg-gray-50 rounded-lg p-4">
          <h4 className="text-sm font-bold mb-2">Performance</h4>
          <div className="text-xs text-gray-600">
            <div><strong>Hill Climbing:</strong> small memory, local optima risk.</div>
            <div><strong>A*:</strong> optimal with admissible heuristic; memory heavy.</div>
            <div><strong>Neural Net:</strong> depends on architecture and data.</div>
          </div>
        </div>


      </aside>
    </div>
  );
}
