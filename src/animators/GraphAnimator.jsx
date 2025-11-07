import Undirected from "./graph/Undirected";
import Directed from "./graph/Directed";
import BFSAnimator from "./graph/BFSAnimator";
import DFSAnimator from "./graph/DFSAnimator";
import WeightedGraphAnimator from "./graph/WeightedGraphAnimator";

export default function GraphAnimator({ steps = [], meta = {}, currentIndex }) {
  const kind = (meta?.kind || "undirected").toLowerCase();

  console.log("[GRAPH-ANIMATOR] Received kind:", kind, "meta:", meta, "steps count:", steps.length);

  if (kind === "graph-weighted" || kind === "weighted") {
    console.log("[GRAPH-ANIMATOR] Rendering WeightedGraphAnimator 🚀");
    return <WeightedGraphAnimator steps={steps} meta={meta} currentIndex={currentIndex} />;
  }

  if (kind === "undirected_graph" || kind === "undirected") {
    return <Undirected steps={steps} meta={meta} />;
  }

  if (kind === "directed_graph" || kind === "directed") {
    return <Directed steps={steps} meta={meta} />;
  }

  if (kind.includes("bfs")) {
    console.log("[GRAPH-ANIMATOR] 🎯 Rendering BFSAnimator");
    return <BFSAnimator steps={steps} meta={meta} currentIndex={currentIndex} />;
  }

  if (kind.includes("dfs")) {
    console.log("[GRAPH-ANIMATOR] 🎯 Rendering DFSAnimator");
    return <DFSAnimator steps={steps} meta={meta} currentIndex={currentIndex} />;
  }

  return <Undirected steps={steps} meta={meta} />;
}

