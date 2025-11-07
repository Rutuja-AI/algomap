# backend/universal_ir.py
import ast

def universal_translate(code: str) -> dict:
    """
    Universal IR fallback.
    Parses ANY Python code into a basic step list with
    actions like assign, append, loop, print, call, etc.
    Returns: {"concept": "generic", "steps": [...], "meta": {...}}
    """
    steps = []
    try:
        tree = ast.parse(code)
    except Exception as e:
        return {
            "concept": "generic",
            "steps": [{"action": "note", "description": f"Parse error: {e}", "vars": {}}],
            "meta": {"layout": "linear", "theme": "softblue"},
        }

    vars_state = {}

    def add_step(action, desc):
        steps.append({"action": action, "description": desc, "vars": vars_state.copy()})

    for node in ast.walk(tree):
        if isinstance(node, ast.Assign):
            # a = 5  or a, b = ...
            for t in node.targets:
                if isinstance(t, ast.Name):
                    val = getattr(node.value, "n", None) or getattr(node.value, "s", None)
                    vars_state[t.id] = val
                    add_step("assign", f"Assign {val!r} to {t.id}")
        elif isinstance(node, ast.AugAssign):
            # a += 1
            target = getattr(node.target, "id", "?")
            op = node.op.__class__.__name__
            vars_state[target] = f"{vars_state.get(target, 0)} {op} ..."
            add_step("update", f"Update {target} using {op}")
        elif isinstance(node, ast.For):
            iter_name = getattr(node.target, "id", "?")
            add_step("loop", f"Start loop variable {iter_name}")
        elif isinstance(node, ast.While):
            add_step("loop", "Start while loop")
        elif isinstance(node, ast.If):
            add_step("condition", "Evaluate if-condition")
        elif isinstance(node, ast.Call):
            func = getattr(node.func, "id", None) or getattr(getattr(node.func, "attr", None), "__str__", lambda: "?")()
            add_step("call", f"Call function {func}")
        elif isinstance(node, ast.Expr) and isinstance(node.value, ast.Call):
            # print(...)
            func = getattr(node.value.func, "id", "")
            if func == "print":
                add_step("print", "Execute print statement")

    # fallback if no steps were added
    if not steps:
        add_step("note", "No significant operations found")

    return {
        "concept": "generic",
        "steps": steps,
        "meta": {"layout": "linear", "theme": "softblue"},
    }
