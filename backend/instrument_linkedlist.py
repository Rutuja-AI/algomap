# backend/instrument_linkedlist.py
# Linked List IR Translator — Universal Insert Version
# Supports: singly, doubly, circular singly, circular doubly
# Detects both OOP-style and procedural insert/delete/display patterns.

import re
from typing import Any, Dict, List

try:
    from backend.app import trace
except ImportError:
    def trace(msg: str):  # fallback if run standalone
        print(f"🧭 [TRACE-local] {msg}")


# -------------------------------------------------------
# 🧩 Helpers
# -------------------------------------------------------
def _make_step(action: str, line: int, description: str, **extra) -> Dict[str, Any]:
    step = {"action": action, "line": line, "description": description}
    step.update(extra)
    return step


def _clean_val(v: str) -> str:
    """Extract and normalize captured node values for consistent animation."""
    if not v:
        return "?"
    v = str(v).strip().strip('"').strip("'").strip()
    if "," in v:
        v = v.split(",")[-1].strip()
    v = v.replace("(", "").replace(")", "")
    if v.lower() in ["self", "data", "value", "none", "node", "head"]:
        return "?"
    if re.fullmatch(r"\d+(\.\d+)?", v):
        return v
    if re.fullmatch(r"[A-Za-z_]\w*", v):
        return v
    return v if v else "?"


def _with_vars(step: Dict[str, Any], nodes: List[str]) -> Dict[str, Any]:
    """Attach live program variables for AlgoMap variable panel."""
    step["vars"] = {
        "head": nodes[0] if nodes else "∅",
        "tail": nodes[-1] if nodes else "∅",
        "length": len(nodes),
    }
    return step


# -------------------------------------------------------
# 🔧 Main Translator
# -------------------------------------------------------
def translate_linkedlist_ir(code: str, kind: str = "singly") -> Dict[str, Any]:
    trace("instrument_linkedlist.py → translate_linkedlist_ir() entered")

    steps: List[Dict[str, Any]] = []
    nodes: List[str] = []

    # --- detect type automatically ---
    code_lower = code.lower()
    saw_prev = ".prev" in code_lower
    saw_circular = (
        "make circular" in code_lower
        or re.search(r"\.next\s*=\s*(self\.)?head", code_lower)
        or re.search(r"while\s+\w+\.next\s*!=", code_lower)
    )

    if saw_circular and saw_prev:
        kind = "circular_doubly"
    elif saw_circular:
        kind = "circular_singly"
    elif saw_prev:
        kind = "doubly"
    else:
        kind = "singly"

    trace(f"instrument_linkedlist.py → detected list kind: {kind}")

    # --- regex matchers ---
    lines = (code or "").splitlines()
    insert_pattern = re.compile(
        r"(?:(?:\w+\.)?(?:insert|insert_end|insert_front|insert_after|insert_before|append|add|add_node|push|create_node))\s*\(([^)]*)\)",
        re.IGNORECASE,
    )
    delete_pattern = re.compile(
        r"(?:(?:\w+\.)?(?:delete|remove|delete_node|del_node))\s*\(([^)]*)\)",
        re.IGNORECASE,
    )
    display_pattern = re.compile(
        r"(?:(?:\w+\.)?(?:display|show|print_list|print_forward|print_backward))\s*\(([^)]*)\)",
        re.IGNORECASE,
    )
    traverse_pattern = re.compile(r"(?:for|while)\s+.*(next|prev)\s*")

    # --- line scan ---
    for i, L in enumerate(lines, start=1):
        line = L.strip()
        if not line or line.startswith("#"):
            continue
        if line.startswith("def ") or line.startswith("return") or line.startswith("print("):
            continue
        if "create_node" in line or "new_node" in line:
            continue

        # INSERT -------------------------------------------------
        m = insert_pattern.search(line)
        if m:
            args = m.group(1).split(",")
            val = _clean_val(args[-1]) if args else "?"
            nodes.append(val)
            desc = f"Insert node {val}"
            if "end" in line:
                desc += " at end"
            elif "front" in line or "head" in line:
                desc += " at front"
            elif "after" in line:
                desc += " after given node"
            elif "before" in line:
                desc += " before given node"

            step = _make_step(
                "insert",
                i,
                desc,
                node=f"node_{val}",
                value=str(val),
                list_state=[str(x) for x in nodes],
            )
            steps.append(_with_vars(step, nodes))
            trace(f"  ↳ insert node {val} → {nodes}")
            continue

        # DELETE -------------------------------------------------
        m = delete_pattern.search(line)
        if m:
            val = _clean_val(m.group(1))
            if val in nodes:
                nodes.remove(val)
                desc = f"Delete node {val}"
            else:
                desc = f"Attempted delete of {val} (not found)"
            step = _make_step(
                "delete",
                i,
                desc,
                node=f"node_{val}",
                value=str(val),
                list_state=[str(x) for x in nodes],
            )
            steps.append(_with_vars(step, nodes))
            trace(f"  ↳ delete node {val} → {nodes}")
            continue

        # DISPLAY -------------------------------------------------
        m = display_pattern.search(line)
        if m:
            direction = (
                "forward" if "forward" in line else
                "backward" if "backward" in line else
                "generic"
            )
            arrow = "→" if direction == "forward" else "←" if direction == "backward" else "→"
            desc = f"Display {direction} list: {' ' + arrow + ' '.join(nodes) + ' ' + arrow if nodes else 'Empty'}"
            step = _make_step(
                "display",
                i,
                desc,
                direction=direction,
                list_state=[str(x) for x in nodes],
            )
            steps.append(_with_vars(step, nodes))
            trace(f"  ↳ display ({direction}) list {nodes}")
            continue

        # TRAVERSE -----------------------------------------------
        if traverse_pattern.search(line):
            step = _make_step(
                "traverse",
                i,
                "Traverse list",
                list_state=[str(x) for x in nodes],
            )
            steps.append(_with_vars(step, nodes))
            for v in nodes:
                visit_step = _make_step(
                    "visit",
                    i,
                    f"Visit node {v}",
                    node=f"node_{v}",
                    value=str(v),
                    list_state=[str(x) for x in nodes],
                )
                steps.append(_with_vars(visit_step, nodes))
            trace(f"  ↳ traverse through nodes {nodes}")
            continue

    # --- Summary Log ---
    print("[LL-TRANSLATE] ✅ Steps Generated:")
    for s in steps:
        print("  ", s)

    trace(f"instrument_linkedlist.py → translation complete, {len(steps)} steps generated for {kind}")

    # --- Meta for Frontend ---
    meta = {
        "kind": kind,
        "parent_animator": "linkedlist",
        "layout": kind.replace("_", "-"),
    }

    trace(f"instrument_linkedlist.py → emitting meta.kind={meta['kind']} parent={meta['parent_animator']}")
    return {"steps": steps, "meta": meta}
