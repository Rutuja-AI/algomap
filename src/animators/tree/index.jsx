import BST from "./BST";
import AVL from "./AVL";
import Heap from "./Heap";
import RedBlack from "./RedBlack";
import Nary from "./Nary";
import BTree from "./BTree";

export default function TreeAnimator({ steps, meta }) {
  const kind = meta?.kind || "bst";

  if (kind === "avl") return <AVL steps={steps} meta={meta} />;
  if (kind === "heap") return <Heap steps={steps} meta={meta} />;
  if (kind === "redblack") return <RedBlack steps={steps} meta={meta} />;
  if (kind === "nary") return <Nary steps={steps} meta={meta} />;
  if (kind === "btree") return <BTree steps={steps} meta={meta} />;
  return <BST steps={steps} meta={meta} />;
}
