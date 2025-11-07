import re
from typing import Any, Dict, List
from backend.adaptive_core import learn_missing_logic

def _make_step(action: str, line: int, description: str, stack: List[Any]) -> Dict[str, Any]:
    return {
        "action": action,
        "line": line,
        "description": description,
        "vars": {
            "stack": stack.copy(),
            "top": stack[-1] if stack else None,
            "size": len(stack),
        },
    }


def _clean_val(v: str):
    """Normalize pushed value for consistent animation."""
    if v is None or v.strip() == "":
        return "?"
    v = v.strip().strip('"').strip("'")
    # try to evaluate simple numbers
    try:
        return eval(v)
    except Exception:
        return v


def translate_stack_ir(code: str) -> Dict[str, Any]:
    steps: List[Dict[str, Any]] = []
    lines = (code or "").splitlines()
    stack: List[Any] = []

    loop_var = None
    loop_range = None
    inside_loop = False

    for i, line in enumerate(lines, start=1):
        L = line.strip()
        if not L or L.startswith("#"):
            continue

        # ---------- For loop expansion ----------
        m_for = re.match(r"for\s+(\w+)\s+in\s+range\((\d+),\s*(\d+)\):", L)
        if m_for:
            loop_var = m_for.group(1)
            start, end = int(m_for.group(2)), int(m_for.group(3))
            loop_range = range(start, end)
            inside_loop = True
            continue

        # --- Push / Append ---
        m_push = re.search(r"\.(?:push|append)\s*\(([^)]+)\)", L)
        if m_push:
            val_raw = m_push.group(1).strip()

            # handle constants like 10, "A", etc.
            try:
                val_eval = eval(val_raw)
            except Exception:
                val_eval = val_raw

            # expand inside loops like for i in range(...)
            if inside_loop and loop_var and val_raw == loop_var and loop_range:
                for v in loop_range:
                    stack.append(v)
                    steps.append(_make_step("push", i, f"Pushed {v} onto stack", stack))
            else:
                stack.append(val_eval)
                steps.append(_make_step("push", i, f"Pushed {val_eval} onto stack", stack))
            continue


        # ---------- Function-based push(stack, value) ----------
        m_push_func = re.search(r"push\s*\(\s*\w+\s*,\s*([^)]+)\)", L)
        if m_push_func:
            val_raw = m_push_func.group(1).strip()
            v = _clean_val(val_raw)
            stack.append(v)
            steps.append(_make_step("push", i, f"Pushed {v} onto stack", stack))
            continue

        # ---------- Pop ----------
        if re.search(r"\.pop\s*\(\s*\)", L) or re.search(r"pop\s*\(\s*\w+\s*\)", L):
            if stack:
                removed = stack.pop()
                steps.append(_make_step("pop", i, f"Popped {removed} from stack", stack))
            else:
                steps.append(_make_step("pop", i, "Tried to pop from empty stack", stack))
            continue

        # ---------- Peek ----------
        if re.search(r"\[\s*-1\s*\]", L) or "peek" in L:
            top_val = stack[-1] if stack else None
            steps.append(_make_step("peek", i, f"Peeked at top element {top_val}", stack))
            continue

    # ---------- Fallback if few steps ----------
    if not steps or len(steps) < 3:
        return learn_missing_logic(code, concept="stack")

    return {"steps": steps, "meta": {"kind": "stack"}}
