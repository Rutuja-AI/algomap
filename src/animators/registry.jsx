// src/animators/registry.jsx
import QueueAnimator from "./stubs/QueueAnimator";
import StackAnimator from "./stubs/StackAnimator";
import SortAnimator from "./stubs/SortAnimator";
import TreeAnimator from "./stubs/TreeAnimator";
import GraphBFSAnimator from "./stubs/GraphBFSAnimator";
import GraphDFSAnimator from "./stubs/GraphDFSAnimator";

export const MODE_TO_ANIMATOR = {
  queue: QueueAnimator,
  stack: StackAnimator,
  sort: SortAnimator,
  tree: TreeAnimator,
  "graph-bfs": GraphBFSAnimator,
  "graph-dfs": GraphDFSAnimator,
};

export function Animator({ mode, info, codeForTranslate }) {
  const Unknown = () => <div className="p-4">Unknown concept</div>;
  const Comp = MODE_TO_ANIMATOR[mode] || Unknown;
  return <Comp info={info} codeForTranslate={codeForTranslate} mode={mode} />;
}
