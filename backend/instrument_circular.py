# backend/instrument_circular.py

import re

def translate_circular_ir(code: str):
    """
    Deterministic circular queue translator.
    Recognizes:
      - size hints: size=6 / SIZE=6 / capacity=6 / cap=6 (anywhere in the code)
      - enqueue(VAL)
      - dequeue()
      - peek()
      - clear()
    Emits steps with fields: action, description, size, front, rear, value (for enqueue)
    """

    # -------- read size/cap hint once --------
    size = 8  # default
    for ln in code.splitlines():
        t = ln.strip()
        m = re.search(r"\b(size|SIZE|capacity|cap)\s*=\s*(\d+)", t)
        if m:
            size = int(m.group(2))
            break

    steps = []
    front = -1
    rear  = -1
    n = size

    def is_empty(f, r):
        return f == -1 and r == -1

    def is_full(f, r):
        if is_empty(f, r):
            return False
        return ((r + 1) % n) == f

    lines = [ln.strip() for ln in code.splitlines() if ln.strip() and not ln.strip().startswith("#")]

    for i, s in enumerate(lines):
        # allow size/cap reassign mid-stream
        msz = re.search(r"\b(size|SIZE|capacity|cap)\s*=\s*(\d+)", s)
        if msz:
            n = int(msz.group(2))
            size = n
            # reset pointers when resizing
            front = -1
            rear  = -1
            steps.append({"action":"clear","description":f"resize buffer to {n}","size":n,"front":front,"rear":rear})
            continue

        if s == "clear()" or s.startswith("clear("):
            front = rear = -1
            steps.append({"action":"clear","description":"clear buffer","size":n,"front":front,"rear":rear})
            continue

        if re.search(r"\bpeek\s*\(\s*\)", s):
            steps.append({"action":"peek","description":"peek front","size":n,"front":front,"rear":rear})
            continue

        menq = re.search(r"\benqueue\s*\(\s*(.+?)\s*\)", s)
        if menq:
            val = menq.group(1)
            if is_empty(front, rear):
                front = rear = 0
            else:
                if is_full(front, rear):
                    # full: do not advance; just narrate (UI shows no insert)
                    steps.append({"action":"enqueue","value":val,"description":f"enqueue {val} (full - ignored)","size":n,"front":front,"rear":rear})
                    continue
                rear = (rear + 1) % n

            steps.append({
                "action":"enqueue",
                "value":val,
                "description":f"enqueue {val} at {rear}",
                "size":n,"front":front,"rear":rear
            })
            continue

        if re.search(r"\bdequeue\s*\(\s*\)", s):
            if not is_empty(front, rear):
                # narrate before moving pointer (value is at current front)
                steps.append({
                    "action":"dequeue",
                    "description":f"dequeue from {front}",
                    "size":n,"front":front,"rear":rear
                })
                if front == rear:
                    front = rear = -1
                else:
                    front = (front + 1) % n
            else:
                steps.append({"action":"dequeue","description":"dequeue (empty - ignored)","size":n,"front":front,"rear":rear})
            continue

        # ignore any other lines

    return {
        "mode": "queue",
        "variant": "circular",
        "steps": steps,
        "meta": {"capacity": size},
        "initial": [],
        "final": [],
    }
