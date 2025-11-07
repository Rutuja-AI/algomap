# backend/instrument_universal.py
import ast

def translate_universal_ir(code: str):
    """
    Generates a generic IR from any Python code using AST.
    Captures assignments, for/while loops, prints, and function calls.
    Returns a dict with {steps, meta}.
    """
    steps = []
    try:
        tree = ast.parse(code)
    except Exception as e:
        return {
            "steps": [
                {"action": "error", "description": f"AST parse failed: {e}", "vars": {}}
            ],
            "meta": {"kind": "universal"},
        }

    for node in ast.walk(tree):

        # ---------- Assignment ----------
        if isinstance(node, ast.Assign):
            targets = [ast.unparse(t) for t in node.targets]
            value = ast.unparse(node.value) if hasattr(ast, "unparse") else "value"
            steps.append({
                "action": "assign",
                "description": f"Assign {value} to {', '.join(targets)}",
                "vars": {targets[0]: value} if targets else {}
            })

        # ---------- Augmented Assignment ----------
        elif isinstance(node, ast.AugAssign):
            target = ast.unparse(node.target)
            op = type(node.op).__name__
            value = ast.unparse(node.value)
            steps.append({
                "action": "augassign",
                "description": f"{target} {op}= {value}",
                "vars": {target: f"{target} ({op}= {value})"}
            })

        # ---------- For Loop ----------
        elif isinstance(node, ast.For):
            target = ast.unparse(node.target)
            iter_ = ast.unparse(node.iter)
            steps.append({
                "action": "loop",
                "description": f"For each {target} in {iter_}",
                "vars": {}
            })

        # ---------- While Loop ----------
        elif isinstance(node, ast.While):
            cond = ast.unparse(node.test)
            steps.append({
                "action": "loop",
                "description": f"While {cond}",
                "vars": {}
            })

        # ---------- Function / Method Calls ----------
        elif isinstance(node, ast.Call):
            func = getattr(node.func, "id", None) or getattr(node.func, "attr", "call")
            args = [ast.unparse(a) for a in node.args]
            steps.append({
                "action": "call",
                "description": f"Call {func}({', '.join(args)})",
                "vars": {}
            })

        # ---------- Return Statements ----------
        elif isinstance(node, ast.Return):
            val = ast.unparse(node.value) if node.value else ""
            steps.append({
                "action": "return",
                "description": f"Return {val}",
                "vars": {}
            })

        # ---------- Print Statements / Calls ----------
        elif (
            isinstance(node, ast.Expr)
            and isinstance(getattr(node, "value", None), ast.Call)
            and (
                getattr(node.value.func, "id", "") == "print"
                or getattr(node.value.func, "attr", "") == "print"
            )
        ):
            args = [ast.unparse(a) for a in node.value.args]
            steps.append({
                "action": "print",
                "description": f"Print {' '.join(args)}",
                "vars": {}
            })

    # ---------- Fallback Note ----------
    if not steps:
        steps.append({
            "action": "note",
            "description": "No recognizable actions found",
            "vars": {}
        })

    return {"steps": steps, "meta": {"kind": "universal"}}
