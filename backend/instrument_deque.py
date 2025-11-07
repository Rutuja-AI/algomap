# backend/instrument_deque.py
import re
import json

# Tiny helpers
def _init_ir(capacity=8, variant="deque"):
    return {
        "variant": variant,
        "meta": {"capacity": capacity},
        "initial": [],
        "steps": [],
        "final": []
    }

# Very light parser: looks for deque operations in user code and turns them into steps.
# Supported ops: append(x), appendleft(x), pop(), popleft()
# You can enhance later with real AST; this is minimal and deterministic.
VAL = r"([-+]?\w+|\"[^\"]*\"|'[^']*')"

def _scan_ops(code: str):
    lines = code.splitlines()
    ops = []
    for ln in lines:
        s = ln.strip()
        # capacity hint like: cap = 5  or capacity = 5
        mcap = re.search(r"\b(cap|capacity)\s*=\s*(\d+)", s)
        if mcap: 
            ops.append(("capacity", int(mcap.group(2))))
        if "appendleft(" in s:
            m = re.search(r"appendleft\(\s*(.+?)\s*\)", s)
            if m: ops.append(("appendleft", m.group(1)))
        if re.search(r"\bappend\(", s):
            m = re.search(r"append\(\s*(.+?)\s*\)", s)
            if m: ops.append(("append", m.group(1)))
        if re.search(r"\bpopleft\(", s):
            ops.append(("popleft", None))
        if re.search(r"\bpop\(", s) and "popleft" not in s:
            ops.append(("pop", None))
    return ops

def translate_deque_ir(code: str):
    ops = _scan_ops(code)
    capacity = 8
    for kind, val in ops:
        if kind == "capacity": capacity = val
    ir = _init_ir(capacity, "deque")

    for kind, val in ops:
        if kind == "capacity": 
            continue
        if kind == "append":
            ir["steps"].append({"action":"enqueue_back","value":str(val), "description":f"push back {val}"})
        elif kind == "appendleft":
            ir["steps"].append({"action":"enqueue_front","value":str(val), "description":f"push front {val}"})
        elif kind == "pop":
            ir["steps"].append({"action":"dequeue_back","description":"pop back"})
        elif kind == "popleft":
            ir["steps"].append({"action":"dequeue_front","description":"pop front"})
    return ir

def _restrict_check(ops, allow_insert=("front","back"), allow_delete=("front","back")):
    errs = []
    for kind, val in ops:
        if kind in ("append","appendleft"):
            side = "back" if kind=="append" else "front"
            if side not in allow_insert:
                errs.append(f"insertion not allowed at {side}")
        if kind in ("pop","popleft"):
            side = "back" if kind=="pop" else "front"
            if side not in allow_delete:
                errs.append(f"deletion not allowed at {side}")
    return errs

def translate_input_restricted_deque_ir(code: str):
    ops = _scan_ops(code)
    capacity = 8
    for kind, val in ops:
        if kind == "capacity": capacity = val
    ir = _init_ir(capacity, "deque_input_restricted")

    errs = _restrict_check(ops, allow_insert=("back",), allow_delete=("front","back"))
    if errs:
        ir["steps"].append({"action":"error","description":"; ".join(errs)})
        return ir

    for kind, val in ops:
        if kind == "append":      ir["steps"].append({"action":"enqueue_back","value":str(val),"description":f"push back {val}"})
        elif kind == "appendleft": ir["steps"].append({"action":"error","description":"insert-left blocked"})
        elif kind == "pop":        ir["steps"].append({"action":"dequeue_back","description":"pop back"})
        elif kind == "popleft":    ir["steps"].append({"action":"dequeue_front","description":"pop front"})
    return ir

def translate_output_restricted_deque_ir(code: str):
    ops = _scan_ops(code)
    capacity = 8
    for kind, val in ops:
        if kind == "capacity": capacity = val
    ir = _init_ir(capacity, "deque_output_restricted")

    errs = _restrict_check(ops, allow_insert=("front","back"), allow_delete=("back",))
    if errs:
        ir["steps"].append({"action":"error","description":"; ".join(errs)})
        return ir

    for kind, val in ops:
        if kind == "append":      ir["steps"].append({"action":"enqueue_back","value":str(val),"description":f"push back {val}"})
        elif kind == "appendleft": ir["steps"].append({"action":"enqueue_front","value":str(val),"description":f"push front {val}"})
        elif kind == "pop":        ir["steps"].append({"action":"dequeue_back","description":"pop back"})
        elif kind == "popleft":    ir["steps"].append({"action":"error","description":"front deletions blocked"})
    return ir
