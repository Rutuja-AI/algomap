import BST from "./tree/BST";
import AVL from "./tree/AVL";
import BTree from "./tree/BTreeAnimator";
import Nary from "./tree/Nary";
import RedBlack from "./tree/RedBlackAnimator";
import BSTAnimator from "./tree/BSTAnimator"; // ✅ new replay-enabled one

/**
 * TreeAnimator
 * Acts as a router for all tree variants.
 * Decides which tree component to render based on meta.kind.
 */
export default function TreeAnimator({
  steps = [],
  meta = {},
  currStep = 0,     // ✅ new props from Visualize
  playing = false,
  speed = 1,
}) {
  const kind = (meta?.kind || "bst").toLowerCase();

  if (kind === "avl") {
    return <AVL steps={steps} meta={meta} currStep={currStep} playing={playing} speed={speed} />;
  }
  if (kind === "btree") {
    return <BTree steps={steps} meta={meta} currStep={currStep} playing={playing} speed={speed} />;
  }
  if (kind === "redblack") {
    return <RedBlack steps={steps} meta={meta} currStep={currStep} playing={playing} speed={speed} />;
  }
  if (kind === "nary") {
    return <Nary steps={steps} meta={meta} currStep={currStep} playing={playing} speed={speed} />;
  }

  // ✅ All BST-like variants
  if (["bst", "bst-fresh", "bst-fast", "tree"].includes(kind)) {
    return (
      <BSTAnimator
        steps={steps}
        meta={meta}
        currStep={currStep}
        playing={playing}
        speed={speed}
      />
    );
  }

  // fallback
  return <BST steps={steps} meta={meta} currStep={currStep} playing={playing} speed={speed} />;
}
