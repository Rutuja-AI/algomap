import { useState, useEffect, useRef } from "react";

/* ---------------- Graph Node Component ---------------- */
function GraphNode({ node, position, isVisited = false, isActive = false }) {
  const { x, y } = position;
  return (
    <g>
      <circle
        cx={x}
        cy={y}
        r="20"
        fill={isActive ? "#3b82f6" : isVisited ? "#86efac" : "#e5e7eb"}
        stroke="#374151"
        strokeWidth="2"
      />
      <text
        x={x}
        y={y + 5}
        textAnchor="middle"
        fontSize="14"
        fill="#111827"
        fontWeight="bold"
      >
        {node}
      </text>
    </g>
  );
}

/* ---------------- Graph Edge Component ---------------- */
function GraphEdge({ from, to, positions, weights }) {
  const { x: x1, y: y1 } = positions[from];
  const { x: x2, y: y2 } = positions[to];
  const midX = (x1 + x2) / 2;
  const midY = (y1 + y2) / 2;

  const weight = weights?.[`${from}${to}`] ?? weights?.[`${to}${from}`];

  return (
    <>
      <line
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke="#9ca3af"
        strokeWidth="2"
      />
      {weight !== undefined && (
        <text
          x={midX}
          y={midY - 5}
          textAnchor="middle"
          fontSize="12"
          fill="#111827"
          fontWeight="bold"
        >
          {weight}
        </text>
      )}
    </>
  );
}

/* ---------------- Graph Visualization ---------------- */
function Graph({ nodes, edges, positions, visited, active, weights }) {
  return (
    <svg width="350" height="300" className="bg-white rounded-xl shadow p-2">
      {edges.map(([from, to], idx) => (
        <GraphEdge
          key={idx}
          from={from}
          to={to}
          positions={positions}
          weights={weights}
        />
      ))}
      {nodes.map((node) => (
        <GraphNode
          key={node}
          node={node}
          position={positions[node]}
          isVisited={visited.includes(node)}
          isActive={active === node}
        />
      ))}
    </svg>
  );
}

/* ---------------- Algorithms (Storyboards) ---------------- */
function bfsStoryboard(graph, start) {
  let queue = [start];
  let visited = [];
  let steps = [];
  while (queue.length > 0) {
    let node = queue.shift();
    if (!visited.includes(node)) {
      visited.push(node);
      steps.push({
        active: node,
        visited: [...visited],
        narration: `BFS: Visiting ${node}. Its neighbors are added to the queue.`,
      });
      for (let neighbor of graph[node]) {
        if (!visited.includes(neighbor)) {
          queue.push(neighbor);
        }
      }
    }
  }
  return steps;
}

function dfsStoryboard(graph, start) {
  let stack = [start];
  let visited = [];
  let steps = [];
  while (stack.length > 0) {
    let node = stack.pop();
    if (!visited.includes(node)) {
      visited.push(node);
      steps.push({
        active: node,
        visited: [...visited],
        narration: `DFS: Visiting ${node}. Its neighbors are pushed to the stack.`,
      });
      for (let neighbor of [...graph[node]].reverse()) {
        if (!visited.includes(neighbor)) {
          stack.push(neighbor);
        }
      }
    }
  }
  return steps;
}

function dijkstraStoryboard(graph, weights, start) {
  let dist = {};
  let visited = [];
  let steps = [];
  let pq = [start];
  for (let node in graph) dist[node] = Infinity;
  dist[start] = 0;

  while (pq.length > 0) {
    pq.sort((a, b) => dist[a] - dist[b]);
    let node = pq.shift();
    if (visited.includes(node)) continue;
    visited.push(node);

    steps.push({
      active: node,
      visited: [...visited],
      narration: `Dijkstra: Visiting ${node}. Current shortest distance = ${dist[node]}.`,
    });

    for (let neighbor of graph[node]) {
      let w = weights?.[`${node}${neighbor}`] ?? weights?.[`${neighbor}${node}`];
      if (w !== undefined && dist[node] + w < dist[neighbor]) {
        dist[neighbor] = dist[node] + w;
        pq.push(neighbor);
      }
    }
  }
  return steps;
}

function primStoryboard(graph, weights, start) {
  let visited = [];
  let steps = [];
  visited.push(start);

  steps.push({
    active: start,
    visited: [...visited],
    narration: `Prim: Start from ${start}.`,
  });

  while (visited.length < Object.keys(graph).length) {
    let minEdge = null;
    let minWeight = Infinity;
    for (let u of visited) {
      for (let v of graph[u]) {
        let w = weights?.[`${u}${v}`] ?? weights?.[`${v}${u}`];
        if (!visited.includes(v) && w < minWeight) {
          minWeight = w;
          minEdge = [u, v];
        }
      }
    }
    if (!minEdge) break;
    visited.push(minEdge[1]);

    steps.push({
      active: minEdge[1],
      visited: [...visited],
      narration: `Prim: Adding edge ${minEdge[0]}-${minEdge[1]} (w=${minWeight}).`,
    });
  }
  return steps;
}

function kruskalStoryboard(nodes, edges, weights) {
  let parent = {};
  nodes.forEach((n) => (parent[n] = n));
  const find = (n) => (parent[n] === n ? n : (parent[n] = find(parent[n])));
  const union = (a, b) => (parent[find(a)] = find(b));

  let sortedEdges = [...edges].sort(
    ([u1, v1], [u2, v2]) =>
      (weights?.[`${u1}${v1}`] ?? weights?.[`${v1}${u1}`]) -
      (weights?.[`${u2}${v2}`] ?? weights?.[`${v2}${u2}`])
  );
  let mst = [];
  let visited = [];
  let steps = [];

  for (let [u, v] of sortedEdges) {
    if (find(u) !== find(v)) {
      union(u, v);
      mst.push([u, v]);
      if (!visited.includes(u)) visited.push(u);
      if (!visited.includes(v)) visited.push(v);
      let w = weights?.[`${u}${v}`] ?? weights?.[`${v}${u}`];
      steps.push({
        active: v,
        visited: [...visited],
        narration: `Kruskal: Adding edge ${u}-${v} (w=${w}).`,
      });
    }
  }
  return steps;
}

/* ---------------- Algo Player Hook ---------------- */
function useAlgoPlayer(steps, speed) {
  const [step, setStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (isPlaying) {
      const intervalDelay = 3500 - speed; // ✅ flip mapping
      intervalRef.current = setInterval(() => {
        setStep((s) => (s < steps.length - 1 ? s + 1 : s));
      }, intervalDelay);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [isPlaying, speed, steps]);

  const reset = () => {
    setStep(0);
    setIsPlaying(false);
  };

  return { step, isPlaying, setIsPlaying, reset };
}

/* ---------------- Demo Components ---------------- */
function BFSvsDFS({ graph, edges, positions, speed }) {
  const bfsSteps = bfsStoryboard(graph, "A");
  const dfsSteps = dfsStoryboard(graph, "A");
  const { step, setIsPlaying, reset } = useAlgoPlayer(bfsSteps, speed);

  return (
    <div className="flex flex-col gap-4 w-full items-center">
      <div className="flex justify-around w-full">
        <Graph
          nodes={Object.keys(graph)}
          edges={edges}
          positions={positions}
          visited={bfsSteps[step].visited}
          active={bfsSteps[step].active}
        />
        <Graph
          nodes={Object.keys(graph)}
          edges={edges}
          positions={positions}
          visited={dfsSteps[step].visited}
          active={dfsSteps[step].active}
        />
      </div>
      <div className="text-center">
        {bfsSteps[step].narration} | {dfsSteps[step].narration}
      </div>
      <Controls setIsPlaying={setIsPlaying} reset={reset} />
    </div>
  );
}

function AlgorithmDemo({ steps, graph, edges, positions, weights, speed }) {
  const { step, setIsPlaying, reset } = useAlgoPlayer(steps, speed);

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      <Graph
        nodes={Object.keys(graph)}
        edges={edges}
        positions={positions}
        visited={steps[step]?.visited ?? []}
        active={steps[step]?.active ?? null}
        weights={weights}
      />
      <div>{steps[step]?.narration}</div>
      <Controls setIsPlaying={setIsPlaying} reset={reset} />
    </div>
  );
}

/* ---------------- Shared Controls ---------------- */
function Controls({ setIsPlaying, reset }) {
  return (
    <div className="flex justify-center gap-4">
      <button
        className="px-3 py-1 bg-blue-500 text-white rounded"
        onClick={() => setIsPlaying(true)}
      >
        ▶ Play
      </button>
      <button
        className="px-3 py-1 bg-yellow-500 text-white rounded"
        onClick={() => setIsPlaying(false)}
      >
        ⏸ Pause
      </button>
      <button
        className="px-3 py-1 bg-red-500 text-white rounded"
        onClick={reset}
      >
        ⏹ Reset
      </button>
    </div>
  );
}

/* ---------------- Main Visualizer Layout ---------------- */
export default function GraphVisualizer() {
  const [selectedAlgo, setSelectedAlgo] = useState("BFSvsDFS");
  const [speed, setSpeed] = useState(1500);

  const graph = {
    A: ["B", "C"],
    B: ["A", "D", "E"],
    C: ["A", "F"],
    D: ["B"],
    E: ["B", "F"],
    F: ["C", "E"],
  };

  const edges = [
    ["A", "B"],
    ["A", "C"],
    ["B", "D"],
    ["B", "E"],
    ["C", "F"],
    ["E", "F"],
  ];

  const positions = {
    A: { x: 170, y: 40 },
    B: { x: 80, y: 120 },
    C: { x: 260, y: 120 },
    D: { x: 40, y: 220 },
    E: { x: 120, y: 220 },
    F: { x: 260, y: 220 },
  };

  const weights = { AB: 2, AC: 4, BD: 1, BE: 7, CF: 3, EF: 2 };

  let steps = [];
  let useWeights = false;
  if (selectedAlgo === "Dijkstra") {
    steps = dijkstraStoryboard(graph, weights, "A");
    useWeights = true;
  } else if (selectedAlgo === "Prim") {
    steps = primStoryboard(graph, weights, "A");
    useWeights = true;
  } else if (selectedAlgo === "Kruskal") {
    steps = kruskalStoryboard(Object.keys(graph), edges, weights);
    useWeights = true;
  }

  const algoInfo = {
    BFSvsDFS: {
      title: "BFS vs DFS",
      description:
        "Breadth-First Search explores neighbors level by level using a queue, while Depth-First Search explores one path deeply using a stack.",
      complexity: "BFS: O(V+E), DFS: O(V+E)",
      type: "Traversal",
    },
    Dijkstra: {
      title: "Dijkstra's Algorithm",
      description:
        "Finds shortest paths from a source node to all other nodes in a weighted graph with non-negative edges.",
      complexity: "O((V+E) log V)",
      type: "Shortest Path",
    },
    Prim: {
      title: "Prim's Algorithm",
      description:
        "Builds a Minimum Spanning Tree by starting at a node and repeatedly adding the smallest edge that connects a new vertex.",
      complexity: "O(E log V)",
      type: "Minimum Spanning Tree",
    },
    Kruskal: {
      title: "Kruskal's Algorithm",
      description:
        "Builds a Minimum Spanning Tree by sorting edges by weight and adding them if they don't form a cycle.",
      complexity: "O(E log E)",
      type: "Minimum Spanning Tree",
    },
  };

  return (
    <div className="grid grid-cols-[20%_60%_20%] h-screen bg-gray-50 pt-14">
      {/* Sidebar */}
      {/* Sidebar */}
<div className="bg-white shadow-lg p-4">
  <h2 className="text-xl font-bold mb-4"> Graph Algorithms</h2>

  {/* Dropdown */}
  <select
    value={selectedAlgo}
    onChange={(e) => setSelectedAlgo(e.target.value)}
    className="w-full p-2 border rounded mb-4"
  >
    <option value="BFSvsDFS">BFS vs DFS</option>
    <option value="Dijkstra">Dijkstra</option>
    <option value="Prim">Prim</option>
    <option value="Kruskal">Kruskal</option>
  </select>

  {/* Speed control */}
  <div className="mt-6">
    <label className="font-medium text-sm">Animation Speed</label>
    <input
      type="range"
      min="500"
      max="3000"
      step="100"
      value={speed}
      onChange={(e) => setSpeed(Number(e.target.value))}
      className="w-full"
    />
    <div className="flex justify-between text-xs text-gray-500 mt-1">
      <span>Slow</span>
      <span>Fast</span>
    </div>
  </div>
</div>

      {/* Center Visualization */}
      <div className="flex flex-col items-center justify-center">
        <h1 className="text-2xl font-bold mb-4">Graph Visualizer</h1>

        {selectedAlgo === "BFSvsDFS" ? (
          <BFSvsDFS graph={graph} edges={edges} positions={positions} speed={speed} />
        ) : steps.length > 0 ? (
          <AlgorithmDemo
            steps={steps}
            graph={graph}
            edges={edges}
            positions={positions}
            weights={useWeights ? weights : undefined}
            speed={speed}
          />
        ) : (
          <div className="text-gray-500">Select an algorithm to start.</div>
        )}
      </div>

      {/* Right Info Column */}
      <div className="bg-white shadow-lg p-4">
        <h2 className="text-xl font-bold mb-4">Info</h2>
        <h3 className="text-lg font-semibold">{algoInfo[selectedAlgo].title}</h3>
        <p className="mt-2 text-sm text-gray-700">{algoInfo[selectedAlgo].description}</p>
        <p className="mt-2 text-sm"><b>Complexity:</b> {algoInfo[selectedAlgo].complexity}</p>
        <p className="mt-1 text-sm"><b>Type:</b> {algoInfo[selectedAlgo].type}</p>
      </div>
    </div>
  );
}
