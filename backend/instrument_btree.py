# instrument_btree.py
# 🌳 AlgoMap B-Tree IR Translator v3.1 (Normalized)
# -------------------------------------------------------
# ✅ Clean & deduped IR for B-Tree insertion visualization
# ✅ Includes vars for frontend animator sync
# ✅ Trace-safe logging (instead of print)
# ✅ Adds degree info + consistent meta
# ✅ Compatible with BTreeAnimator v2.5
# ✅ Normalized action names for visualizer compatibility

from typing import Dict, Any, List

# ---------------------------
# Safe trace import
# ---------------------------
try:
    from app import trace
except ImportError:
    def trace(msg: str):
        print(msg)

BAD_PLACEHOLDERS = {"", "node", "key", "temp.key", "null"}


def _make_step(action: str, description: str, **extra) -> Dict[str, Any]:
    """Helper to build IR step dictionaries."""
    s = {"action": action, "description": description}
    s.update(extra)
    return s


def translate_btree_insert(code: str | List[int]) -> Dict[str, Any]:
    """
    Generates clean, non-duplicated IR steps for B-Tree insertions.
    Simulates splits and promotions in a simplified, deterministic way.
    """
    steps: List[Dict[str, Any]] = []

    # 🩹 Dedupe guard
    def add_step(new_step: Dict[str, Any]):
        if not steps or (
            new_step["action"] != steps[-1]["action"]
            or new_step["description"] != steps[-1]["description"]
        ):
            steps.append(new_step)

    # ---------------------------
    # Parse input
    # ---------------------------
    if isinstance(code, list):
        keys = code
    else:
        import re
        keys = [int(x) for x in re.findall(r"\d+", code)]

    # Remove duplicates while preserving order
    seen = set()
    unique_keys = []
    for k in keys:
        if k not in seen:
            unique_keys.append(k)
            seen.add(k)
        else:
            trace(f"[Skip] Duplicate key {k} ignored.")
    keys = unique_keys

    if not keys:
        return {"steps": [], "meta": {"kind": "btree-fast"}}

    # ---------------------------
    # Initialization steps
    # ---------------------------
    t = 3  # Minimum degree
    add_step(_make_step("init", "Starting B-Tree initialization. Root node is empty and ready to insert keys."))
    add_step(_make_step("info", f"Initialize a new B-Tree with minimum degree t={t} (each node can hold up to {2*t-1} keys)."))

    node_counter = 0
    def node_name(i: int): return f"node_{i}"

    current_root = node_name(node_counter)
    add_step(_make_step("create_node", f"Create root node {current_root}. It is currently empty.", node_id=current_root))

    # ---------------------------
    # Simulated insertions
    # ---------------------------
    for i, key in enumerate(keys):
        add_step(_make_step("insert", f"Inserting key {key}. Determining correct position in the tree.", key=key))

        # Artificial split trigger every (2t-1) keys
        if (i + 1) % (2 * t - 1) == 0:
            mid = keys[i - 2] if i >= 2 else key
            left = keys[max(0, i - 4):i - 2]
            right = keys[i - 1:i + 1]

            add_step(
                _make_step(
                    "split_node",
                    f"Node is full — splitting around median key {mid}. "
                    f"Left child keeps {left}, right child gets {right}, and {mid} is promoted.",
                    vars={
                        "parent_node": current_root,
                        "split_node_id": current_root,
                        "median_key": mid,
                        "left_keys": left,
                        "right_keys": right,
                    },
                )
            )

            node_counter += 1
            new_root = node_name(node_counter)
            add_step(
                _make_step(
                    "promote",
                    f"Promoted key {mid} to new root {new_root}. Tree height increases.",
                    vars={
                        "parent_node": current_root,
                        "new_root": new_root,
                        "promoted_key": mid,
                    },
                )
            )
            current_root = new_root

        # Normal insert into leaf node
        else:
            add_step(
                _make_step(
                    "insert_leaf",
                    f"Insert key {key} into the appropriate leaf node (maintaining sorted order).",
                    key=key,
                    vars={"target_node": current_root, "insert_key": key},
                )
            )

    # ---------------------------
    # Completion
    # ---------------------------
    add_step(_make_step("finish", "All keys inserted successfully. B-Tree structure complete."))

    # ---------------------------
    # Normalize actions for animator compatibility
    # ---------------------------
    normalized = []
    for s in steps:
        a = s["action"].lower()
        if a in ["insert", "insert_leaf"]:
            s["action"] = "insert_key_into_node"
        elif a in ["split_node"]:
            s["action"] = "split_child_node"
        elif a in ["promote"]:
            s["action"] = "split_root_node"
        elif a in ["create_node"]:
            s["action"] = "create_node"
        elif a in ["finish"]:
            s["action"] = "finish"
        normalized.append(s)
    steps = normalized

    # ---------------------------
    # Metadata
    # ---------------------------
    meta = {
        "kind": "btree-fast",
        "family": "tree",
        "layout": "btree",
        "theme": "softgreen",
        "degree": t,
        "animator_capabilities": {
            "components": ["multi_node", "edge_arrow", "label"],
            "relations": ["child_links"],
            "usable_for": ["btree"],
            "description": "Clean, non-duplicated IR for B-Tree insertion and splitting visualization.",
        },
        "parent_animator": "BTreeAnimator",
    }

    return {"steps": steps, "meta": meta, "step_count": len(steps)}


# ✅ Alias for dispatcher compatibility
btree_steps = translate_btree_insert

__all__ = ["translate_btree_insert", "btree_steps"]
