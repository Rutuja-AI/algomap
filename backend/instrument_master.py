# backend/instrument_master.py
# Central dispatcher for AlgoMap IR translators + Trace Breadcrumbs (Hybrid-Refiner v3.5)

import re
from typing import Dict, Any

# Import all translators
from backend.instrument_stack import translate_stack_ir
from backend.instrument_queue import translate_queue_ir
from backend.instrument_linkedlist import translate_linkedlist_ir
from backend.instrument_tree import translate_tree_ir
from backend.instrument_graph import translate_graph_ir
from backend.instrument_universal import translate_universal_ir

# 🧭 Optional trace import
try:
    from backend.app import trace
except ImportError:
    def trace(msg: str):
        print(f"🧭 [TRACE-local] {msg}")


# -------------------------------------------------
# Safe wrapper
# -------------------------------------------------
def _ensure_dict(res: Any, kind: str = "unknown") -> Dict[str, Any]:
    if res is None:
        return {"steps": [], "meta": {"kind": kind}}
    if isinstance(res, list):
        return {"steps": res, "meta": {"kind": kind}}
    if isinstance(res, dict):
        meta = res.get("meta", {"kind": kind})

        # 🔄 Normalize queue aliases
        mk = meta.get("kind", "")
        if mk in ["deque", "double-ended-queue", "doublequeue"]:
            meta["kind"] = "queue-deque"
        elif mk in ["circular-deque", "circulardeque", "double-ended-circularqueue"]:
            meta["kind"] = "queue-circular-deque"
        elif mk in ["linearqueue", "linear-queue"]:
            meta["kind"] = "queue-linear"
        elif mk in ["priorityqueue", "priority-queue"]:
            meta["kind"] = "queue-priority"
        elif mk in ["circular-queue", "circularqueue"]:
            meta["kind"] = "queue-circular"

        # 🔄 Normalize graph aliases
        if mk in ["graph-bfs", "bfs"]:
            meta["kind"] = "bfs"
        elif mk in ["graph-dfs", "dfs"]:
            meta["kind"] = "dfs"
        elif mk == "graph":
            meta["kind"] = "graph"

        return {
            "steps": res.get("steps", []) if isinstance(res.get("steps"), list) else [],
            "meta": meta,
        }

    return {"steps": [], "meta": {"kind": kind}}


# -------------------------------------------------
# Global Variable Normalizer 🌐
# -------------------------------------------------
def _normalize_vars(steps):
    """Ensure each IR step has vars + description."""
    normalized = []
    for s in steps:
        if not isinstance(s, dict):
            continue
        s.setdefault("vars", {})
        s.setdefault("description", s.get("action", ""))
        normalized.append(s)
    return normalized


# -------------------------------------------------
# Animator Family Resolver
# -------------------------------------------------
def resolve_parent_animator(concept: str, meta: dict | None = None) -> str:
    if not concept:
        return "GenericAIAnimator"
    c = (concept or "").lower().strip()
    k = (meta or {}).get("kind", "").lower()

    # --- Queue ---
    if "priority" in c or "priority" in k:
        return "PriorityQueue"
    if "deque" in c or "double" in c or "queue-deque" in k:
        if "circular" in c or "circular" in k or "queue-circular-deque" in k:
            return "CircularDequeAnimator"
        return "DequeAnimator"
    if "circular" in c or "queue-circular" in k:
        return "CircularQueue"
    if "queue" in c or "linearqueue" in k:
        return "LinearQueue"

    # --- Linked List ---
    if "circular" in c or "circular" in k:
        if "doubly" in c or "doubly" in k:
            return "CircularDoubly"
        return "CircularSingly"
    if "doubly" in c or "doubly" in k:
        return "Doubly"
    if "linked" in c or "linkedlist" in c or "singly" in c:
        return "Singly"

    # --- Stack ---
    if "stack" in c or "stack" in k:
        return "StackAnimator"

    # --- Tree ---
    if "redblack" in c or "rbt" in c or "red-black" in c:
        return "TreeAnimator"
    if "avl" in c:
        return "TreeAnimator"
    if "btree" in c or "b-tree" in c:
        return "BTreeAnimator"
    if "bst" in c or "binarysearchtree" in c:
        return "BSTAnimator"
    if "heap" in c or "tree" in c:
        return "TreeAnimator"

    # --- Graph ---
    if "bfs" in c or k == "bfs":
        return "BFSAnimator"
    if "dfs" in c or k == "dfs":
        return "DFSAnimator"
    if "weighted" in c or "dijkstra" in c or "graph-weighted" in k:
        return "WeightedGraphAnimator"
    if "graph" in c or "graph" in k:
        return "GraphAnimator"

    # --- Sorting ---
    if "sort" in c or "sorting" in c:
        return "SortAnimator"

    return "GenericAIAnimator"


# -------------------------------------------------
# 🧠 Universal Gemini Refiner (Hybrid)
# -------------------------------------------------
from backend.fallback_reconstruct import reconstruct_with_gemini

def _refine_with_gemini_if_needed(code: str, concept: str, res: dict) -> dict:
    """Hybrid-Refiner: send local IR to Gemini when it's weak or loop-heavy."""
    steps = res.get("steps", [])
    meta = res.get("meta", {})
    loop_signals = any(kw in code for kw in ["for ", "while ", "if ", "elif "])
    weak_ir = len(steps) <= 4 or meta.get("kind") in ["universal", "unknown"]

    # 🩹 Skip refinement for lightweight static families
    # 🩹 Refiner rules update
    # Static families (simple, no traversal) can skip Gemini.
    static_families = ["linkedlist", "singly", "doubly", "queue", "stack"]

    # ✅ Graph families (BFS/DFS) will now go through Gemini refinement too.
    if any(f in concept for f in static_families):
        print(f"⚡ [SKIP] Gemini refiner disabled for static concept='{concept}'")
        res["steps"] = _normalize_vars(res.get("steps", []))
        return res

    # 🌟 Allow Gemini for trees, sorts, and graph traversals (BFS/DFS)
    if weak_ir or loop_signals or any(k in concept for k in ["tree", "sort", "bfs", "dfs"]):
        print(f"[MASTER] ✨ Refining {concept} IR via Gemini (hybrid mode)…")
        refined_steps, refined_meta = reconstruct_with_gemini(
            code,
            concept,
            local_ir={"steps": steps, "meta": meta}
        )
        if refined_steps:
            refined_steps = _normalize_vars(refined_steps)
            refined_meta.setdefault("kind", meta.get("kind", concept))
            refined_meta.setdefault("family", meta.get("family", concept.split('-')[0]))
            return {"steps": refined_steps, "meta": refined_meta}

    # 🧩 Fallback normalization
    res["steps"] = _normalize_vars(res.get("steps", []))
    return res


    # 🌟 Allow Gemini for trees, sorts


# -------------------------------------------------
# 🌐 Universal Meta Normalizer
# -------------------------------------------------
def normalize_meta_kind(concept: str, kind: str, family: str = "") -> str:
    c = (concept or "").lower().strip()
    k = (kind or "").lower().strip()
    f = (family or "").lower().strip()
    if "-" in k or "-" in c:
        return k or c
    if not k:
        k = f or c
    if "-" in k:
        return k
    if k == "queue":
        return "queue-linear"
    elif k == "tree":
        k = "tree-bst"
    elif k == "linkedlist":
        # 🩹 Preserve the detected subtype (avoid forcing singly)
        if "doubly" in c or "doubly" in f:
            k = "linkedlist-doubly"
        elif "circular-doubly" in c or "circular-doubly" in f:
            k = "linkedlist-circular-doubly"
        elif "circular-singly" in c or "circular-singly" in f or "circular" in c:
            k = "linkedlist-circular-singly"
        else:
            k = "linkedlist-singly"

    return k


# -------------------------------------------------
# Main Translator Router
# -------------------------------------------------
def translate_ir(concept: str, code: str, skip_refine: bool = False) -> Dict[str, Any]:
    from flask import request
    body = request.get_json(force=True, silent=True) or {}
    sub_concept = body.get("sub_concept") or body.get("meta", {}).get("sub_concept")

    # 🧠 Normalize concept strings early
    concept_raw = (concept or "").lower().strip()
    sub_concept_raw = (sub_concept or "").lower().strip()

    # Normalize any spaces/hyphens BEFORE aliasing
    concept_raw = concept_raw.replace(" ", "-")
    sub_concept_raw = sub_concept_raw.replace(" ", "-")
    if sub_concept_raw and sub_concept_raw not in concept_raw:
        concept_raw = f"{concept_raw}-{sub_concept_raw}"

    # Clean junk characters
    concept_raw = re.sub(r"[\(\)\[\]]", "", concept_raw)
    concept_raw = re.sub(r"-+", "-", concept_raw).strip("-_ ")

    # 🩹 Normalize Linked List variants
    concept_raw = concept_raw.replace("linked-list", "linkedlist").replace("linked list", "linkedlist")
    concept_raw = concept_raw.replace("doublylinkedlist", "linkedlist-doubly")
    concept_raw = concept_raw.replace("doubly-linked-list", "linkedlist-doubly")
    concept_raw = concept_raw.replace("doubly linked list", "linkedlist-doubly")
    concept_raw = concept_raw.replace("circular-linked-list", "linkedlist-circular")
    concept_raw = concept_raw.replace("circular doubly linked list", "linkedlist-circular-doubly")

    concept_clean = re.sub(r"[^a-z0-9\-\s_/]", "", concept_raw)
    concept_base = concept_clean.strip() if "-" in concept_clean else re.split(r"[\s\_/]+", concept_clean)[0]

    # 🔗 Universal alias map
    # 🔗 Universal alias map
    alias_map = {
        # 🧱 Queue family
        "double-ended": "queue-deque",
        "queue-deque": "queue-deque",
        "deque": "queue-deque",
        "circular-deque": "queue-circular-deque",
        "circulardeque": "queue-circular-deque",
        "queue-circularqueue": "queue-circular",      # ✅ fixed
        "queue-circulardeque": "queue-circular-deque",
        "queue-circular-deque": "queue-circular-deque",
        "circularqueue": "queue-circular",
        "circular-queue": "queue-circular",
        "queuecircular": "queue-circular",
        "linearqueue": "queue-linear",
        "priorityqueue": "queue-priority",
        "priority-queue": "queue-priority",


        # 🌳 Tree family
        "bst": "tree-bst",
        "avl": "tree-avl",
        "rbt": "tree-redblack",
        "redblack": "tree-redblack",
        "b-tree": "tree-btree",
        "btree": "tree-btree",

        # 🕸️ Graph family
        "graphbfs": "graph-bfs",
        "graphdfs": "graph-dfs",
    }


    concept = alias_map.get(concept_base, concept_base)

    # 🩹 Preserve sub_concept for linked list family (e.g., doubly, circular)
    if sub_concept_raw and "linkedlist" in concept and sub_concept_raw not in concept:
        concept = f"{concept}-{sub_concept_raw}"

    concept = concept.strip().lower()
    print("💡 incoming concept:", repr(concept))
    trace(f"instrument_master.py → normalized concept '{concept_raw}' → '{concept}'")

    # ---------- ROUTES ----------

    # Stack
    if concept == "stack":
        res = _ensure_dict(translate_stack_ir(code), "stack")
        res["steps"] = _normalize_vars(res.get("steps", []))
        return _refine_with_gemini_if_needed(code, concept, res)

    # Queue / Deque
    if concept.startswith("queue") or "deque" in concept:
        # 🧠 Smart subtype detector for Queue family
        if "circular-deque" in concept:
            kind = "circular-deque"
        elif "deque" in concept:
            kind = "deque"
        elif "priority" in concept:
            kind = "priority"
        elif "circular" in concept:
            kind = "circular"
        else:
            kind = "linear"

        trace(f"Master → Queue route detected → kind={kind}")
        res = _ensure_dict(translate_queue_ir(code, kind=kind), f"queue-{kind}")
        res["steps"] = _normalize_vars(res.get("steps", []))
        res["meta"]["kind"] = f"queue-{kind}"
        res["meta"].setdefault("family", "queue")

        # ✅ Keep Gemini off for simple static queue logic
        return _refine_with_gemini_if_needed(code, concept, res)


    # -------------------------------------------------
    # 🧩 Linked List Router — precise variant detection
    # -------------------------------------------------
    if any(x in concept for x in [
        "linkedlist", "linked-list", "doublylinkedlist",
        "linkedlist-doubly", "linked-list-doubly",
        "linkedlist-circular", "linkedlist-circular-singly",
        "linkedlist-circular-doubly"
    ]):
        trace(f"Master → LinkedList route for '{concept}'")

        # 🔍 detect exact subtype
        if "circular" in concept and "doubly" in concept:
            kind = "circular-doubly"
        elif "circular" in concept:
            kind = "circular-singly"
        elif "doubly" in concept:
            kind = "doubly"
        else:
            kind = "singly"

        # 🧠 local translator
        res = _ensure_dict(translate_linkedlist_ir(code, kind=kind), f"linkedlist-{kind}")
        res["steps"] = _normalize_vars(res.get("steps", []))
        res["meta"]["kind"] = f"linkedlist-{kind}"
        res["meta"]["family"] = "linkedlist"
        res["meta"]["parent"] = "linkedlist"
        trace(f"✅ [MASTER] Final LL meta.kind = {res['meta']['kind']}")


        # 🚫 skip Gemini refiner for lists
        pass

    # Tree
    if any(x in concept for x in ["avl", "redblack", "bst", "btree", "tree"]):
        variant = "bst"
        if "red" in concept: variant = "redblack"
        elif "avl" in concept: variant = "avl"
        elif "btree" in concept: variant = "btree"
        res = _ensure_dict(translate_tree_ir(code, variant=variant), variant)
        res["steps"] = _normalize_vars(res.get("steps", []))
        return _refine_with_gemini_if_needed(code, concept, res)

    # Graph
    if any(x in concept for x in ["graph", "bfs", "dfs", "weighted"]):
        variant = "bfs" if concept == "graph" else concept
        res = _ensure_dict(translate_graph_ir(code, variant=variant), variant)
        res["steps"] = _normalize_vars(res.get("steps", []))
        return _refine_with_gemini_if_needed(code, concept, res)

    # Sorting
    if "sort" in concept:
        from backend.instrument_sort import translate_sort_from_code
        res = _ensure_dict(translate_sort_from_code(code), "sort")
        res["steps"] = _normalize_vars(res.get("steps", []))
        return _refine_with_gemini_if_needed(code, concept, res)

    # 🌌 UNIVERSAL ZERO-STEP FALLBACK (applies to all translators)
    if not res or not res.get("steps"):
        trace(f"⚠️ [MASTER] No steps detected for concept='{concept}' → invoking Gemini IR fallback")
        try:
            from backend.fallback_reconstruct import reconstruct_ir
            # 🚀 send existing meta + concept to Gemini for step reconstruction
            fallback_result = reconstruct_ir(code, concept=concept, local_ir=res)

            # 🧩 handle both (steps, meta) tuple OR dict return types
            if isinstance(fallback_result, tuple):
                steps, meta = fallback_result
                res["steps"] = steps
                res["meta"] = meta
            elif isinstance(fallback_result, dict):
                res = fallback_result

            # 🪄 preserve local animator context even after IR fallback
            if res.get("meta"):
                old_meta = res.get("meta", {})
                # keep previous kind / parent / layout info if available
                old_kind = res.get("meta", {}).get("kind", concept)
                parent = res.get("meta", {}).get("parent", resolve_parent_animator(concept))
                res["meta"]["kind"] = old_kind
                res["meta"]["parent"] = parent
                trace(f"🪄 [MASTER] Preserved animator context → kind={old_kind}, parent={parent}")

            if res.get("steps"):
                trace(f"✅ [MASTER] Fallback IR produced {len(res['steps'])} steps")
                return res
            else:
                trace("⚠️ [MASTER] Gemini IR fallback returned empty or invalid result")

        except Exception as e:
            trace(f"❌ [MASTER] Universal fallback failed: {e}")

    # 🌌 FINAL UNIVERSAL PARSER (failsafe)
    res = _ensure_dict(translate_universal_ir(code), "universal")
    res["steps"] = _normalize_vars(res.get("steps", []))
    return _refine_with_gemini_if_needed(code, concept, res)



# -------------------------------------------------
# 🩹 Merge & Deduplicate Steps
# -------------------------------------------------
def merge_all_segments(data: dict) -> dict:
    if not data or "segments" not in data:
        return data
    all_steps = [s for seg in data.get("segments", []) for s in seg.get("steps", [])]
    seen, merged = set(), []
    for s in all_steps:
        desc = s.get("description", "")
        if desc not in seen:
            merged.append(s)
            seen.add(desc)
    meta = data["segments"][0].get("meta", {}) if data["segments"] else {}
    data["segments"] = [{"steps": merged, "meta": meta}]
    return data
