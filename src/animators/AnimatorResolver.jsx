import React, { useMemo, useState, useEffect } from "react";

// ==== Core Animators ====
import TreeAnimator from "./TreeAnimator";
import StackAnimator from "./StackAnimator";
import GraphAnimator from "./GraphAnimator";
import GenericAIAnimator from "./GenericAIAnimator";
import BFSAnimator from "./graph/BFSAnimator";
import DFSAnimator from "./graph/DFSAnimator";
import GenericAIDNAAnimator from "../animators_ai/GenericAIAnimator";

// ==== Queue & List imports ====
import LinearQueue from "./queue/LinearQueue";
import CircularQueue from "./queue/CircularQueue";
import PriorityQueue from "./queue/PriorityQueue";
import DequeAnimator from "./queue/deque/DequeAnimator";
import CircularDequeAnimator from "./queue/deque/CircularDequeAnimator";
import Singly from "./linkedlist/Singly";
import Doubly from "./linkedlist/Doubly";
import CircularSingly from "./linkedlist/CircularSingly";
import CircularDoubly from "./linkedlist/CircularDoubly";

// ==== Trees ====
import BSTAnimator from "./tree/BSTAnimator";
import BTreeAnimator from "./tree/BTreeAnimator";

/**
 * 🧩 AnimatorResolver v3.7 — Canonical + DNA-Smart
 * ------------------------------------------------
 * ✅ Resolves all DSA animators cleanly
 * ✅ Adds Gemini → DNA switch for AI-generated animations
 * ✅ Preserves replay safety + concept hierarchy
 */
export default function AnimatorResolver({
  steps = [],
  meta = {},
  implementation = "",
  concept = "",
  viewMode = "array",
  currStep = 0,
  playing = false,
  speed = 1.0,
  narration = "",
}) {
  // 🧹 Canonical normalization
  let rawKind = (meta?.kind || implementation || concept || "").toLowerCase();
  let kind = rawKind;
  let parent = (meta?.parent || meta?.parent_animator || meta?.family || "").toLowerCase();

  // 🔗 Linked List family
  if (rawKind.includes("linkedlist")) {
    parent = "linkedlist";
    if (rawKind.includes("circular-doubly")) kind = "circulardoubly";
    else if (rawKind.includes("circular-singly")) kind = "circularsingly";
    else if (rawKind.includes("doubly")) kind = "doubly";
    else kind = "singly";
  }
  // 🌈 Universal AI Animation Fallback
  if (
    (!rawKind || rawKind === "unknown") &&
    meta?.animation_plan &&
    Object.keys(meta.animation_plan).length > 0
  ) {
    console.log("🎨 [AI-FALLBACK] Using GenericAIAnimator with AI plan (Gemini key detected)");
    kind = "ai-generic";       // virtual marker
    parent = "ai";
  }

  // 🧱 Queue family
  else if (rawKind.includes("queue")) {
    parent = "queue";
    if (rawKind.includes("circular-deque")) kind = "circular-deque";
    else if (rawKind.includes("deque")) kind = "deque";
    else if (rawKind.includes("priority")) kind = "priority";
    else if (rawKind.includes("circular")) kind = "circular";
    else kind = "linear";
  }

  // 🌳 Tree family
  else if (rawKind.includes("tree")) {
    parent = "tree";
    if (rawKind.includes("btree")) kind = "btree";
    else if (rawKind.includes("bst")) kind = "bst";
    else kind = "tree";
  }

  // 🧭 Debug trace
  console.groupCollapsed("🎬 [ANIMATOR-RESOLVER] Debug Trace");
  console.log("🧩 rawKind:", rawKind);
  console.log("🧩 normalized kind:", kind);
  console.log("🪞 meta.kind:", meta?.kind);
  console.log("🧱 parent:", parent);
  console.log("🧮 concept:", concept);
  console.log("📦 implementation:", implementation);
  console.log("🔢 steps count:", steps?.length || 0);
  console.groupEnd();

  // 🎬 Replay Token — remounts when animation restarts
  const [replayToken, setReplayToken] = useState(Date.now());
  useEffect(() => {
    if (currStep === 0 && playing) setReplayToken(Date.now());
  }, [currStep, playing]);

  // 🧩 Animator selection
  const memoizedAnimator = useMemo(() => {
    const props = { steps, meta, currStep, playing, speed, viewMode, narration };

    // 🌳 B-Tree
    if (
      kind.includes("btree") ||
      kind.includes("b-tree") ||
      kind === "btree-fast" ||
      parent === "btree" ||
      meta?.layout === "btree"
    )
      return <BTreeAnimator key={replayToken} {...props} />;

    // 🌲 BST / Tree
    if (["bst", "bst-fast", "bst-fresh", "tree"].includes(kind) || parent === "tree")
      return <BSTAnimator key={replayToken} {...props} />;

    // 🧱 Stack
    if (["stack", "pushpop", "lifo"].includes(kind) || parent === "stack")
      return <StackAnimator key={replayToken} {...props} />;

    // 📦 Linear Queue
    if (
      parent === "queue" &&
      (kind.includes("linearqueue") ||
        kind.includes("queue-linear") ||
        kind.includes("linear") ||
        kind === "queue")
    )
      return <LinearQueue key={replayToken} {...props} />;

    // 🔄 Circular Queue
    if (
      parent === "queue" &&
      (kind.includes("circularqueue") ||
        kind.includes("queue-circular") ||
        kind === "circular" ||
        kind === "cq")
    )
      return <CircularQueue key={replayToken} {...props} />;

    // ⭐ Priority Queue
    if (
      parent === "queue" &&
      (kind.includes("priority") ||
        kind.includes("queue-priority") ||
        kind.includes("priorityqueue") ||
        kind === "pq")
    )
      return <PriorityQueue key={replayToken} {...props} />;

    // ↔️ Deque & Circular Deque
    if (parent === "queue" && (kind.includes("circular-deque") || kind.includes("queue-circular-deque")))
      return <CircularDequeAnimator key={replayToken} {...props} />;
    if (parent === "queue" && (kind.includes("deque") || kind === "queue-deque"))
      return <DequeAnimator key={replayToken} {...props} />;

    // 🔗 Linked Lists
    if (["singly", "linkedlist", "list"].includes(kind))
      return <Singly key={replayToken} {...props} />;
    if (kind === "doubly") return <Doubly key={replayToken} {...props} />;
    if (kind === "circularsingly" || kind === "circular-singly")
      return <CircularSingly key={replayToken} {...props} />;
    if (kind === "circulardoubly" || kind === "circular-doubly")
      return <CircularDoubly key={replayToken} {...props} />;

    // 🕸️ Graphs & Traversals
    if (
      ["bfs", "dfs"].includes(kind) ||
      concept.includes("graph-bfs") ||
      concept.includes("graph-dfs")
    ) {
      if (kind.includes("bfs") || concept.includes("graph-bfs"))
        return <BFSAnimator key={replayToken} {...props} />;
      if (kind.includes("dfs") || concept.includes("graph-dfs"))
        return <DFSAnimator key={replayToken} {...props} />;
    }

    // 🌐 Generic Graph fallback
    if (
      (parent === "graph" || kind.includes("graph")) &&
      !kind.includes("bfs") &&
      !kind.includes("dfs")
    )
      return <GraphAnimator key={replayToken} {...props} />;
    // 💫 If AI plan exists even for unknown kind → render directly
    if (kind === "ai-generic" || (meta?.animation_plan && !parent)) {
      return (
        <GenericAIAnimator
          key={replayToken}
          steps={steps}
          meta={meta}
          animation={{ animation_plan: meta.animation_plan }}
        />
      );
    }

    // 🤖 Generic fallback selector (Smart AI / DNA switch)
    const parentLower = (meta?.parent_animator || "").toLowerCase();

    // 🧠 Rule:
    // Use DNA animator only when NO animation_plan exists.
    // If Gemini already provided an animation_plan → use GenericAIAnimator.
    if (
      parentLower === "genericaianimator" &&
      !meta?.animation_plan
    ) {
      return <GenericAIDNAAnimator key={replayToken} {...props} />;
    }

    // 🎬 Otherwise use visual-plan animator
    return (
      <GenericAIAnimator
        steps={steps}
        meta={meta}
        animation={
          meta?.animation_plan
            ? { animation_plan: meta.animation_plan }
            : {}
        }
      />
    );

    // 🧩 Default legacy fallback
    return (
      <GenericAIAnimator
        steps={steps}
        meta={meta}
        animation={meta?.animation_plan ? { animation_plan: meta.animation_plan } : {}}
      />
    );


  }, [
    kind,
    parent,
    steps,
    meta,
    viewMode,
    currStep,
    narration,
    playing,
    speed,
    replayToken,
  ]);

  return memoizedAnimator;
}
