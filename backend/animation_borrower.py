# ==========================================================
#  animation_borrower.py  |  AlgoMap "Director" (Phase 2)
# ----------------------------------------------------------
#  Purpose: Intelligently reuse existing animator types.
# ==========================================================

from instrument_master import resolve_parent_animator

def borrow_animation(concept: str, steps: list, meta: dict = None):
    """
    Determines which existing animator can visually perform the logic
    from Gemini’s IR and builds a lightweight motion plan.
    """

    print(f"\n[BORROWER] 🎬 Borrowing animation for concept: {concept}")
    c = (concept or "").lower()
    mk = (meta.get("kind", "") if meta else "").lower()

    # Step 1. Resolve parent animator
    parent = resolve_parent_animator(concept, meta)
    print(f"[BORROWER] 🧭 Parent resolved as: {parent}")

    # Step 2. Intelligent map (supports circular & doubly cases)
    if "circular" in c or "circular" in mk:
        borrowed_animator = "CircularSingly"
    elif "doubly" in c or "doubly" in mk:
        borrowed_animator = "Doubly"
    elif "linked" in c or "list" in mk:
        borrowed_animator = "Singly"
    elif "queue" in c:
        if "circular" in c:
            borrowed_animator = "CircularQueue"
        elif "priority" in c:
            borrowed_animator = "PriorityQueue"
        elif "deque" in c:
            borrowed_animator = "DequeAnimator"
        else:
            borrowed_animator = "LinearQueue"
    elif "stack" in c:
        borrowed_animator = "StackAnimator"
    elif any(k in c for k in ["tree", "avl", "redblack", "btree"]):
        borrowed_animator = "TreeAnimator"
    elif "graph" in c or any(k in c for k in ["bfs", "dfs"]):
        borrowed_animator = "GraphAnimator"
    elif "heap" in c:
        borrowed_animator = "TreeAnimator"
    elif "hash" in c or "array" in c:
        borrowed_animator = "HashTableAnimator"
    else:
        borrowed_animator = "GenericAIAnimator"

    print(f"[BORROWER] ✅ Selected animator: {borrowed_animator}")

    # Step 3. Build generic motion list
    generic_motions = []
    for i, step in enumerate(steps):
        act = (step.get("action") or "").lower()

        if any(k in act for k in ["enqueue", "push", "append", "insert"]):
            motion = {"step": i, "action": "fadeInNode"}
        elif any(k in act for k in ["dequeue", "pop", "remove", "delete"]):
            motion = {"step": i, "action": "fadeOutNode"}
        elif any(k in act for k in ["swap", "sift", "rotate", "relink"]):
            motion = {"step": i, "action": "swapNodes"}
        elif any(k in act for k in ["connect", "link", "edge"]):
            motion = {"step": i, "action": "drawArrow"}
        elif any(k in act for k in ["visit", "traverse", "explore"]):
            motion = {"step": i, "action": "highlightNode"}
        else:
            motion = {"step": i, "action": "idle"}

        generic_motions.append(motion)

    print(f"[BORROWER] 🧩 Generated {len(generic_motions)} generic motions.")
    return borrowed_animator, generic_motions
