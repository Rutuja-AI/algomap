# backend/instrument_kqueues.py
import re

def translate_kqueues_ir(code: str):
    """
    K queues in one array (teaching classic).
    IR uses actions with a queue index: enqueue(i, v), dequeue(i)
    We also emit meta: {"k": k, "capacity": cap}
    """
    k = 3
    cap = 10
    lines = code.splitlines()
    for s in lines:
        t = s.strip()
        mk = re.search(r"\bk\s*=\s*(\d+)", t)
        if mk: k = int(mk.group(1))
        mc = re.search(r"\b(cap|capacity)\s*=\s*(\d+)", t)
        if mc: cap = int(mc.group(2))

    ir = {
        "variant": "kqueues",
        "meta": {"k": k, "capacity": cap},
        "initial": [],
        "steps": [],
        "final": []
    }

    # Patterns:
    # enqueue(q0, 10)  OR  enqueue(0, 10)
    # dequeue(q2)      OR  dequeue(2)
    for s in lines:
        t = s.strip()
        menq = re.search(r"\benqueue\(\s*(?:q)?(\d+)\s*,\s*(.+?)\s*\)", t)
        if menq:
            qi = int(menq.group(1)); val = menq.group(2)
            ir["steps"].append({"action":"enqueue","queue":qi,"value":val,"description":f"enqueue {val} into Q{qi}"})
            continue
        mdq = re.search(r"\bdequeue\(\s*(?:q)?(\d+)\s*\)", t)
        if mdq:
            qi = int(mdq.group(1))
            ir["steps"].append({"action":"dequeue","queue":qi,"description":f"dequeue from Q{qi}"})
            continue
    return ir
