# parser_universal.py — Phase 3: Loop Expansion + Enqueue Fix + State Tracking
import ast, json
from typing import Any, Dict, List

def translate_code(code: str, concept: str = "generic") -> Dict[str, Any]:
    print("\n🧠 [UNIVERSAL-DEBUG] --- Starting Universal Translation ---")
    print(f"[UNIVERSAL-DEBUG] Concept received → {concept}")
    print(f"[UNIVERSAL-DEBUG] Raw code:\n{code}\n")

    if not code.strip():
        return {"concept": concept, "steps": []}

    try:
        tree = ast.parse(code)
        print("[UNIVERSAL-DEBUG] ✅ AST parsed successfully.")
    except Exception as e:
        print(f"[UNIVERSAL-DEBUG] ❌ AST parse failed: {e}")
        return {"concept": concept, "steps": [{"action": "error", "description": str(e)}]}

    steps: List[Dict[str, Any]] = []
    vars_state: Dict[str, Any] = {}

    # -----------------------------
    # Helper to append step safely
    # -----------------------------
    def add_step(action: str, desc: str, vars_snapshot=None, value=None):
        steps.append({
            "action": action,
            "description": desc,
            "vars": vars_snapshot or vars_state.copy(),
            "value": value,
            "pre_explain": desc,
            "post_explain": ""
        })

       # -----------------------------
    # Walk through AST nodes
    # -----------------------------
    for node in ast.walk(tree):

        # ---------- Assignment ----------
        if isinstance(node, ast.Assign):
            targets = [ast.unparse(t) for t in node.targets]
            value = ast.unparse(node.value)
            for t in targets:
                try:
                    val = eval(value, {}, vars_state)
                except Exception:
                    val = value
                vars_state[t] = val
            desc = f"Assigned {value} to {', '.join(targets)}"
            print(f"[UNIVERSAL-DEBUG] ➕ {desc}")
            add_step("assign", desc)

        # ---------- For Loop ----------
        elif isinstance(node, ast.For):
            target = getattr(node.target, "id", "item")
            iterable_code = ast.unparse(node.iter)
            try:
                iterable = list(eval(iterable_code, {}, vars_state))
            except Exception:
                iterable = [iterable_code]
            print(f"[UNIVERSAL-LOOP] 🔁 For-loop detected → {target} over {iterable}")

            add_step("loop_enter", f"Starting loop over {iterable}")

            for i, val in enumerate(iterable):
                vars_state[target] = val
                add_step("loop_iter", f"Loop iteration {i+1}/{len(iterable)}: {target} = {val}")

                # Simulate loop body
                for sub in getattr(node, "body", []):
                    if isinstance(sub, ast.Expr) and isinstance(sub.value, ast.Call):
                        func_node = sub.value.func
                        func_name = getattr(func_node, "attr", getattr(func_node, "id", ""))
                        args = [ast.unparse(a) for a in sub.value.args]

                        # --- handle q.append(i)
                        if func_name == "append" and hasattr(func_node, "value"):
                            list_obj = ast.unparse(func_node.value)
                            arg_val = vars_state.get(args[0], args[0])
                            if list_obj in vars_state and isinstance(vars_state[list_obj], list):
                                vars_state[list_obj].append(arg_val)
                            else:
                                vars_state[list_obj] = [arg_val]
                            desc = f"Adding {arg_val} via append() to {list_obj}"
                            print(f"[UNIVERSAL-LOOP] {desc}")
                            add_step("enqueue", desc, vars_state.copy(), value=arg_val)

                        # --- handle print(x)
                        elif func_name == "print" or (
                            isinstance(func_node, ast.Name) and func_node.id == "print"
                        ):
                            desc = f"Printing {', '.join(args)}"
                            add_step("print", desc)

            add_step("loop_exit", f"Loop over {iterable} completed.")

        # ---------- While Loop ----------
        elif isinstance(node, ast.While):
            cond = ast.unparse(node.test)
            add_step("loop_enter", f"While loop with condition: {cond}")

        # ---------- Standalone Function Calls ----------
        elif isinstance(node, ast.Expr) and isinstance(node.value, ast.Call):
            func_node = node.value.func
            func_name = getattr(func_node, "id", getattr(func_node, "attr", ""))
            args = [ast.unparse(a) for a in node.value.args]
            # print() detection for Python 3+
            if func_name == "print" or (
                isinstance(func_node, ast.Name) and func_node.id == "print"
            ):
                desc = f"Printing {', '.join(args)}"
                add_step("print", desc)


    # ---------- Post Processing ----------
    if not steps:
        add_step("note", "No major operation detected.")

    print(f"[UNIVERSAL-DEBUG] ✅ Total steps generated: {len(steps)}")
    print("[UNIVERSAL-DEBUG] --- Universal Translation Complete ---\n")

        # ---------- Auto Meta Layout Detection ----------
    meta = {"layout": "linear", "theme": "neutral", "concept": concept}

    code_lower = code.lower()
    if "children" in code_lower and "node" in code_lower:
        meta = {"layout": "tree", "theme": "softblue", "concept": "tree"}
    elif "enqueue" in code_lower or "append" in code_lower:
        meta = {"layout": "linear", "theme": "darkmatrix", "concept": "queue"}
    elif "pop" in code_lower and "stack" in code_lower:
        meta = {"layout": "linear", "theme": "academic", "concept": "stack"}
    elif "edge" in code_lower or "graph" in code_lower or "adj" in code_lower:
        meta = {"layout": "graph", "theme": "softblue", "concept": "graph"}
    elif "sort" in code_lower:
        meta = {"layout": "grid", "theme": "softorange", "concept": "sort"}

    print(f"[UNIVERSAL-META] 🧩 Auto meta detected → {meta}")

    return {"concept": concept, "steps": steps, "meta": meta}

# --- Compatibility alias for app.py ---
def universal_parse(code: str, concept: str = "generic"):
    res = translate_code(code, concept)
    return res.get("steps", []), res.get("meta", {})

