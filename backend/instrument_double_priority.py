# backend/instrument_double_priority.py
import re

def translate_double_priority_ir(code: str):
    """
    Minimal recognizer for a double-ended priority queue (min & max).
    We emit IR using actions: insert(key), delete_min(), delete_max(), peek_min(), peek_max()
    """
    ir = {
        "variant": "double_priority",
        "meta": {},
        "initial": [],
        "steps": [],
        "final": []
    }
    lines = code.splitlines()
    for s in lines:
        t = s.strip()
        # capacity hint (optional)
        mcap = re.search(r"\b(cap|capacity)\s*=\s*(\d+)", t)
        if mcap:
            ir["meta"]["capacity"] = int(mcap.group(2))

        if re.search(r"\b(insert|minmax_push|push)\(", t):
            m = re.search(r"\((.+?)\)", t)
            if m: ir["steps"].append({"action":"insert","value":m.group(1), "description":f"insert {m.group(1)}"})
        elif "delete_min" in t or "pop_min" in t:
            ir["steps"].append({"action":"delete_min","description":"remove smallest"})
        elif "delete_max" in t or "pop_max" in t:
            ir["steps"].append({"action":"delete_max","description":"remove largest"})
        elif "peek_min" in t:
            ir["steps"].append({"action":"peek_min","description":"peek smallest"})
        elif "peek_max" in t:
            ir["steps"].append({"action":"peek_max","description":"peek largest"})
    return ir
