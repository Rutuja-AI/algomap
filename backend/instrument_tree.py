# instrument_tree.py
# Variable-agnostic IR translator for tree operations
# Supports BST, AVL, Red-Black, B-Tree, and manual TreeNode linking 🌳

import re
import ast
from typing import Any, Dict, List
from backend.instrument_btree import translate_btree_insert   # ✅ delegate B-Tree

BAD_PLACEHOLDERS = {"", "node", "key", "temp.key", "null"}


# -----------------------------
# Helper
# -----------------------------
def _make_step(action: str, line: int, description: str, **extra) -> Dict[str, Any]:
    step = {"action": action, "line": line, "description": description}
    step.update(extra)
    return step


def _clean_val(val: str) -> str | None:
    if not val:
        return None
    v = str(val).lower()
    return None if v in BAD_PLACEHOLDERS else val


# -----------------------------
# Traversal Expander (AST based)
# -----------------------------
def _expand_traversal(code: str, variant: str, order: str) -> List[Dict[str, Any]]:
    steps: List[Dict[str, Any]] = []
    try:
        tree = ast.parse(code)
        values = set()

        for node in ast.walk(tree):
            if isinstance(node, ast.Call) and isinstance(node.func, ast.Attribute):
                if node.func.attr in ("insert", "delete"):
                    if node.args:
                        val = None
                        if isinstance(node.args[-1], ast.Constant):
                            val = str(node.args[-1].value)
                        if val:
                            values.add(int(val))

        if not values:
            return []

        vals = sorted(values)
        if order == "preorder":
            seq = vals
        elif order == "postorder":
            seq = list(reversed(vals))
        else:  # inorder
            seq = vals

        for v in seq:
            steps.append(
                _make_step(
                    f"traverse-{order}",
                    0,
                    f"Visit {v} during {order} traversal of {variant.upper()}",
                    node=str(v),
                )
            )
    except Exception as e:
        print("[DEBUG] traversal expand fail:", e)
    return steps


# -----------------------------
# Tree Translator
# -----------------------------
def translate_tree_ir(code: str, variant: str = "bst") -> Dict[str, Any]:
    """
    Enhanced local translator that simulates Gemini-style IR for BST insertions.
    Produces descriptive, human-readable steps (compare, insert, link, etc.)
    even in Fast Mode.
    """

    # ✅ Delegate to B-Tree if needed
    if variant.lower() in {"btree", "b-tree"}:
        return translate_btree_insert(code)

    steps: List[Dict[str, Any]] = []
    lines = (code or "").splitlines()
    variant = variant.lower()
    root_set = False
    node_counter = 0

    def new_id():
        nonlocal node_counter
        node_counter += 1
        return f"n{node_counter}"

    # 🌱 Extract inserted values (simple parse)
    values = []
    for i, line in enumerate(lines):
        if "insert(" in line and not line.strip().startswith("def "):
            matches = re.findall(r"insert\s*\([^,]+,\s*([^)]+)\)", line)
            for m in matches:
                m = m.strip().strip("'\" ")
                if m.isdigit():
                    values.append(int(m))
        elif re.search(r"for\s+\w+\s+in\s+\[.*\]", line):
            nums = re.findall(r"\d+", line)
            for n in nums:
                values.append(int(n))
    values = sorted(set(values))

    # 🌳 Build detailed IR like Gemini
    prev_nodes = []
    for idx, val in enumerate(values):
        nid = new_id()
        val = str(val)

        # Root insertion
        if idx == 0:
            steps.append(_make_step("set_root", idx + 1, f"Set root node {val} of {variant.upper()}", value=val))
            steps.append(_make_step("create_node", idx + 1, f"Create node {val}", node_id=nid, value=val))
            root_set = True
            prev_nodes.append(val)
            continue

        # Comparison chain (simulate decision path)
        compare_target = prev_nodes[-1]
        side = "left" if int(val) < int(compare_target) else "right"
        steps.append(
            _make_step(
                "compare",
                idx + 1,
                f"Compare {val} with {compare_target} → go {side}",
                a=val,
                b=compare_target,
                result=side,
            )
        )

        # Create and link node
        steps.append(_make_step("create_node", idx + 1, f"Create node {val}", node_id=nid, value=val))
        steps.append(
            _make_step(
                "link_child",
                idx + 1,
                f"Link {val} as {side} child of {compare_target}",
                parent=compare_target,
                child=val,
                side=side,
            )
        )
        steps.append(_make_step("insert", idx + 1, f"Insert {val} into {variant.upper()}", value=val))
        prev_nodes.append(val)

    # 🧭 Add traversal hints for visualization
    if values:
        steps.append(_make_step("traverse-inorder", len(values) + 1, f"Inorder traversal of {variant.upper()}"))
        steps.append(_make_step("traverse-preorder", len(values) + 2, f"Preorder traversal of {variant.upper()}"))

    # 🪄 Guarantee root if no values found
    if not steps:
        fake = _make_step("set_root", 0, f"(Auto) Set root 0 of {variant.upper()}", value="0")
        steps.append(fake)

    meta = {
        "kind": f"{variant}-fast",
        "family": "tree",
        "layout": "hierarchical",
        "theme": "softblue",
        "animator_capabilities": {
            "components": ["node", "edge_arrow", "label"],
            "relations": ["left_child", "right_child"],
            "usable_for": ["bst", "avl", "redblack", "btree", "heap"],
            "description": "Gemini-style hierarchical tree visualization with reasoning-based narration."
        }
    }

    return {"steps": steps, "meta": meta, "step_count": len(steps)}


__all__ = ["translate_tree_ir"]
