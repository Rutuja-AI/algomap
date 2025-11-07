# instrument_queue.py
# Hybrid IR translator: regex + detection
# ✅ Supports Linear, Circular, Priority, Deque, CircularDeque, KQueues
# ✅ Auto-detects kind from code if not passed
# ✅ Returns {steps, meta: {kind: ...}}

from typing import Any, Dict, List
import heapq
import re


try:
    from backend.app import trace
except ImportError:
    def trace(msg: str):
        print(f"🧭 [TRACE-local] {msg}")

# -------------------------------------------------------
# 🌟 Variable Tracker Helper
# -------------------------------------------------------
def _with_vars(step: dict, kind: str, buffer=None, head=None, tail=None, capacity=None, heap=None):
    """Attach current runtime variable states for Program Variables panel."""
    if kind == "priority":
        step["vars"] = {"heap": heap.copy() if heap else []}
    elif "circular" in kind:
        step["vars"] = {
            "queue": buffer.copy() if buffer else [],
            "front": head,
            "rear": tail,
            "capacity": capacity,
        }
    elif "deque" in kind:
        step["vars"] = {
            "deque_state": buffer.copy() if buffer else [],
            "front": 0 if buffer else -1,
            "rear": len(buffer) - 1 if buffer else -1,
        }
    else:  # Linear queue fallback
        step["vars"] = {
            "queue": buffer.copy() if buffer else [],
            "front": 0 if buffer else -1,
            "rear": len(buffer) - 1 if buffer else -1,
        }
    return step


# -------------------------------------------------------
# 🧩 Helper Utilities
# -------------------------------------------------------
def _make_step(action: str, line: int, description: str, **extra) -> Dict[str, Any]:
    step = {"action": action, "line": line, "description": description}
    step.update(extra)
    return step

# -----------------------------
# Linear Queue
# -----------------------------
def _translate_linear(code: str) -> Dict[str, Any]:
    steps: List[Dict[str, Any]] = []
    queue_state: List[str] = []
    lines = (code or "").splitlines()

    # --- 🔍 Detect for-loop early (e.g. for val in [10, 20, 30, 40]:)
    loop_values: List[str] = []
    loop_var = None
    loop_match = re.search(r'for\s+(\w+)\s+in\s+\[([^\]]+)\]', code)
    if loop_match:
        loop_var = loop_match.group(1)
        loop_values = [v.strip() for v in loop_match.group(2).split(',')]

    # -----------------------------
    # Line scanning
    # -----------------------------
    for i, raw in enumerate(lines, start=1):
        L = raw.strip()
        if not L or L.startswith("def ") or L.startswith("class "):
            continue

        # --- ✅ Enqueue detection (q.enqueue(val))
        m_call = re.search(r'\.enqueue\(([^)]+)\)', L)
        if m_call:
            arg = m_call.group(1).strip()
            if loop_var and arg == loop_var and loop_values:
                for v in loop_values:
                    queue_state.append(v)
                    steps.append(_make_step("enqueue", i, f"Enqueue element {v} into queue", value=v))
            else:
                val = re.sub(r"\bself\b\s*,?\s*", "", arg).strip()
                queue_state.append(val)
                steps.append(_make_step("enqueue", i, f"Enqueue element {val} into queue", value=val))
            continue

        # --- Direct append (q.append(x))
        m_append = re.search(r'\.append\(([^)]+)\)', L)
        if m_append:
            val = m_append.group(1).strip()
            val = re.sub(r"\bself\b\s*,?\s*", "", val).strip()
            queue_state.append(val)
            steps.append(_make_step("enqueue", i, f"Enqueue element {val} into queue", value=val))
            continue

        # --- Dequeue (q.dequeue() or q.pop(0))
        if re.search(r"\.dequeue\s*\(\)|\.pop\s*\(\s*0\s*\)", L):
            val = queue_state.pop(0) if queue_state else None
            steps.append(_make_step("dequeue", i, f"Dequeue element {val if val else ''} from front of queue", value=val))
            continue

        # --- Peek
        if re.search(r"\[\s*0\s*\]", L) or "peek(" in L:
            val = queue_state[0] if queue_state else None
            steps.append(_make_step("peek", i, f"Peek at front element {val if val else ''}", value=val))
            continue

        # --- Display (q.display())
        if re.search(r"display\s*\(\)", L):
            steps.append(_make_step("display", i, "Display queue contents"))
            continue

    return {"steps": steps, "meta": {"kind": "linear"}}


# -----------------------------
# Circular Queue
# -----------------------------
def _translate_circular(code: str) -> dict:
    steps = []
    capacity = 5
    buffer = [None] * capacity
    head = -1
    tail = -1

    lines = code.splitlines()
    loop_values, loop_var = [], None
    loop_match = re.search(r'for\s+(\w+)\s+in\s+\[([^\]]+)\]', code)
    if loop_match:
        loop_var = loop_match.group(1)
        loop_values = [v.strip() for v in loop_match.group(2).split(',')]

    for i, L in enumerate(lines, start=1):
        line = L.strip()
        if not line:
            continue

        # --- enqueue(data)
        m = re.search(r'\.enqueue\(([^)]+)\)', line)
        if m:
            val = m.group(1).strip()
            values = loop_values if (loop_var and val == loop_var) else [val]
            for v in values:
                if (tail + 1) % capacity == head:
                    steps.append(_make_step("overflow", i, f"Queue Overflow on {v}", buffer=buffer.copy(), head=head, tail=tail, capacity=capacity))
                    continue
                if head == -1:
                    head = tail = 0
                else:
                    tail = (tail + 1) % capacity
                buffer[tail] = v
                steps.append(_make_step("enqueue", i, f"Enqueue {v} into circular queue", buffer=buffer.copy(), head=head, tail=tail, capacity=capacity, value=v))
            continue

        # --- dequeue()
        if re.search(r'\.dequeue\s*\(\s*\)', line):
            if head == -1:
                steps.append(_make_step("underflow", i, "Queue Underflow — empty queue", buffer=buffer.copy(), head=head, tail=tail, capacity=capacity))
            else:
                removed = buffer[head]
                buffer[head] = None
                if head == tail:
                    head = tail = -1
                else:
                    head = (head + 1) % capacity
                steps.append(_make_step("dequeue", i, f"Dequeue {removed} from circular queue", buffer=buffer.copy(), head=head, tail=tail, capacity=capacity, value=removed))
            continue

        # --- display()
        if re.search(r'\.display\s*\(\s*\)', line):
            steps.append(_make_step("display", i, "Display current circular queue state", buffer=buffer.copy(), head=head, tail=tail, capacity=capacity))
            continue

    # 🧩 Add summary / final snapshot so IR isn't 'too short'
    steps.append(_make_step("summary", len(lines) + 1, "Final queue state recorded", buffer=buffer.copy(), head=head, tail=tail, capacity=capacity))

    return {
        "steps": steps,
        "meta": {
            "kind": "circular",
            "capacity": capacity,
            "layout": "array",
            "theme": "softblue",
            "ir_complete": True
        }
    }


# -----------------------------
# Priority Queue / Deque / Circular Deque / KQueues
# -----------------------------
def _translate_priority(code: str) -> Dict[str, Any]:
    steps: List[Dict[str, Any]] = []
    lines = (code or "").splitlines()
    heap: List[Any] = []

    for i, line in enumerate(lines, start=1):
        L = line.strip()

        # --- Enqueue via heapq.heappush(...) ---
        m = re.search(r"heapq\.heappush\s*\([^,]+,\s*(.+)\)", L)
        if m:
            val = m.group(1).strip()
            try:
                heap.append(eval(val))
            except:
                heap.append(val)
            heapq.heapify(heap)
            steps.append(_make_step("enqueue", i, f"Insert {val} into priority queue", value=val, heap=heap.copy()))
            continue

        # --- Dequeue via heapq.heappop(...) ---
        if "heapq.heappop" in L:
            val = heapq.heappop(heap) if heap else None
            steps.append(_make_step("dequeue", i, f"Remove highest priority element {val if val else ''}", value=val, heap=heap.copy()))
            continue

        # --- Peek (top element check) ---
        if ".peek(" in L or re.search(r"self\.queue\[0\]", L):
            val = heap[0] if heap else None
            steps.append(_make_step("peek", i, f"Peek top element {val if val else ''}", value=val, heap=heap.copy()))
            continue

        # --- Direct enqueue() method (non-heapq form) ---
        m2 = re.search(r"\.enqueue\s*\((.+)\)", L)
        if m2:
            val = m2.group(1).strip()
            loop_match = re.search(r"for\s+(\w+)\s+in\s+\[([^\]]+)\]", code)
            if loop_match and loop_match.group(1) == val:
                values = [v.strip() for v in loop_match.group(2).split(",")]
                for v in values:
                    try:
                        heap.append(eval(v))
                    except:
                        heap.append(v)
                    heapq.heapify(heap)
                    steps.append(_make_step("enqueue", i, f"Insert {v} into priority queue", value=v, heap=heap.copy()))
            else:
                try:
                    heap.append(eval(val))
                except:
                    heap.append(val)
                heapq.heapify(heap)
                steps.append(_make_step("enqueue", i, f"Insert {val} into priority queue", value=val, heap=heap.copy()))
            continue

        # --- Direct dequeue() method ---
        if ".dequeue" in L:
            val = heapq.heappop(heap) if heap else None
            steps.append(_make_step("dequeue", i, f"Remove highest priority element {val if val else ''}", value=val, heap=heap.copy()))
            continue

    return {"steps": steps, "meta": {"kind": "priority"}}


def _translate_deque(code: str, capacity: int = 6) -> Dict[str, Any]:
    steps = []
    dq = []
    lines = code.splitlines()

    for i, line in enumerate(lines, start=1):
        L = line.strip()
        if not L:
            continue

        # --- Standard Python deque() ops ---
        m_app = re.search(r'\.append\(([^)]+)\)', L)
        if m_app and "appendleft" not in L:
            val = m_app.group(1).strip()
            dq.append(val)
            steps.append(_make_step("enqueue_back", i, f"Append {val} at rear", deque_state=dq.copy()))
            continue

        m_app_left = re.search(r'\.appendleft\(([^)]+)\)', L)
        if m_app_left:
            val = m_app_left.group(1).strip()
            dq.insert(0, val)
            steps.append(_make_step("enqueue_front", i, f"Append {val} at front", deque_state=dq.copy()))
            continue

        if re.search(r'\.pop\s*\(\s*\)', L) and "popleft" not in L:
            if dq:
                removed = dq.pop()
                steps.append(_make_step("dequeue_back", i, f"Pop {removed} from rear", deque_state=dq.copy(), value=removed))
            else:
                steps.append(_make_step("underflow", i, "Deque is empty"))
            continue

        if re.search(r'\.popleft\s*\(\s*\)', L):
            if dq:
                removed = dq.pop(0)
                steps.append(_make_step("dequeue_front", i, f"Popleft {removed} from front", deque_state=dq.copy(), value=removed))
            else:
                steps.append(_make_step("underflow", i, "Deque is empty"))
            continue

        # --- Custom class methods (insert_front/rear etc) ---
        m_rear = re.search(r"\.(insert_rear|enqueue_rear)\s*\(([^)]+)\)", L)
        if m_rear:
            val = m_rear.group(2).strip()
            dq.append(val)
            steps.append(_make_step("insert_rear", i, f"Insert {val} at rear", deque_state=dq.copy()))
            continue

        m_front = re.search(r"\.(insert_front|enqueue_front)\s*\(([^)]+)\)", L)
        if m_front:
            val = m_front.group(2).strip()
            dq.insert(0, val)
            steps.append(_make_step("insert_front", i, f"Insert {val} at front", deque_state=dq.copy()))
            continue

        # --- Deletion (custom methods) ---
        if re.search(r"\.(delete_front|dequeue_front)\s*\(\)", L):
            if dq:
                removed = dq.pop(0)
                steps.append(_make_step("delete_front", i, f"Delete {removed} from front", deque_state=dq.copy(), value=removed))
            else:
                steps.append(_make_step("underflow", i, "Deque is empty"))
            continue

        if re.search(r"\.(delete_rear|dequeue_rear)\s*\(\)", L):
            if dq:
                removed = dq.pop()
                steps.append(_make_step("delete_rear", i, f"Delete {removed} from rear", deque_state=dq.copy(), value=removed))
            else:
                steps.append(_make_step("underflow", i, "Deque is empty"))
            continue

        # --- Display ---
        if re.search(r"\.display\s*\(\)", L):
            steps.append(_make_step("display", i, "Display deque contents", deque_state=dq.copy()))
            continue

    # 🧩 Patch: ensure buffer mirror for frontend rendering
    for s in steps:
        if "deque_state" in s:
            s["buffer"] = s["deque_state"].copy()

    return {"steps": steps, "meta": {"kind": "deque"}}


def _translate_circular_deque(code: str, capacity: int = 6) -> Dict[str, Any]:
    res = _translate_deque(code, capacity)
    for s in res["steps"]:
        s["description"] = s["description"].replace("deque", "circular deque")

    # ✅ Fix meta for frontend toggle detection
    res["meta"] = {
        "kind": "queue-circular-deque",
        "capacity": capacity,
        "layout": "circular",
        "theme": "softblue",
        "animation": {
            "layout": "circular",
            "theme": "softblue",
            "family": "deque",
            "autoPlay": True,
        },
    }
    return res


def _translate_kqueues(code: str) -> Dict[str, Any]:
    steps = []
    for i, L in enumerate(code.splitlines(), start=1):
        if "enqueue" in L:
            steps.append(_make_step("enqueue", i, "Enqueue into one of the k queues"))
        if "dequeue" in L:
            steps.append(_make_step("dequeue", i, "Dequeue from one of the k queues"))
    return {"steps": steps}


def _clean_val(v: str) -> str:
    """Normalize and clean values extracted from queue ops."""
    if not v:
        return "?"
    v = str(v).strip().strip('"').strip("'").strip()
    v = v.replace("(", "").replace(")", "")
    if "," in v:
        v = v.split(",")[-1].strip()
    if v.lower() in ["self", "none", "q", "queue", "front", "rear"]:
        return "?"
    return v

def _normalize_buffer(buf):
    return [str(x) if x not in (None, "None", "") else "∅" for x in buf]

# -----------------------------
# Dispatcher
# -----------------------------
# -------------------------------------------------------
# 🔧 Main Translator
# -------------------------------------------------------
def translate_queue_ir(code: str, kind: str = None) -> Dict[str, Any]:
    trace("instrument_queue.py → translate_queue_ir() entered")
    steps: List[Dict[str, Any]] = []
    buffer: List[str] = []
    heap = []
    capacity = 5
    head, tail = -1, -1

    code_lower = (code or "").lower()
    lines = (code or "").splitlines()

    # --- Auto-detect queue kind ---
    if not kind:
        if "heapq" in code_lower:
            kind = "priority"
        elif "maxlen" in code_lower or "circulardeque" in code_lower or "circular_deque" in code_lower:
            kind = "circular-deque"
        elif "appendleft" in code_lower or "popleft" in code_lower or "insert_front" in code_lower:
            kind = "deque"
        elif "circular" in code_lower or "%" in code_lower or "rear" in code_lower:
            kind = "circular"

        elif "kqueues" in code_lower:
            kind = "kqueues"
        else:
            kind = "linear"
    trace(f"🧭 Auto-detected queue kind: {kind}")

    enqueue_pattern = re.compile(r"(enqueue|append|push|insert(_rear|_end)?)\s*\(([^)]*)\)", re.IGNORECASE)
    dequeue_pattern = re.compile(r"(dequeue|pop|remove|delete(_front|_rear)?)\s*\(?([^)]*)?\)?", re.IGNORECASE)
    peek_pattern = re.compile(r"(peek|front|rear)\s*\(\s*\)", re.IGNORECASE)
    display_pattern = re.compile(r"(display|show|print_queue|print)\s*\(\s*\)", re.IGNORECASE)
    traverse_pattern = re.compile(r"(for|while).*(queue|deque|q)\s*", re.IGNORECASE)

    # -------------------------------------------------------
    # 🧩 Line-by-line analysis
    # -------------------------------------------------------
    for i, raw in enumerate(lines, start=1):
        L = raw.strip()
        if not L or L.startswith("#") or L.startswith("def ") or L.startswith("class "):
            continue

        # === ENQUEUE ===
        m = enqueue_pattern.search(L)
        if m:
            raw_val = m.group(3).strip()
            val = _clean_val(raw_val)

            # 🧠 Try resolving assigned variable value
            if val in ["value", "data", "val", "size", "item", "max_size"]:
                for prev in reversed(lines[:i]):
                    prev_line = prev.strip()
                    assign_match = re.search(rf"\b{val}\s*=\s*([A-Za-z0-9_\[\]\"'().+-]+)", prev_line)
                    if assign_match:
                        val = assign_match.group(1).strip().strip('"').strip("'")
                        break

            val_str = str(val) if val not in (None, "None", "", "?") else "∅"
            buffer = _normalize_buffer(buffer)

            if kind == "priority":
                heapq.heappush(heap, val_str)
                step = _make_step("enqueue", i, f"Insert {val_str} into priority queue",
                                  heap=heap.copy(), value=val_str)
                steps.append(_with_vars(step, kind, heap=heap))

            elif kind.startswith("circular"):
                if (tail + 1) % capacity == head:
                    step = _make_step("overflow", i, f"Queue Overflow on {val_str}",
                                      buffer=_normalize_buffer(buffer), head=head, tail=tail)
                else:
                    if head == -1:
                        head = tail = 0
                    else:
                        tail = (tail + 1) % capacity
                    if len(buffer) < capacity:
                        buffer.append(val_str)
                    else:
                        buffer[tail] = val_str
                    step = _make_step("enqueue", i, f"Enqueue {val_str} into circular queue",
                                      buffer=_normalize_buffer(buffer), head=head, tail=tail)
                steps.append(_with_vars(step, kind, buffer=_normalize_buffer(buffer),
                                        head=head, tail=tail, capacity=capacity))

            else:
                buffer.append(val_str)
                step = _make_step("enqueue", i, f"Enqueue element {val_str} at rear",
                                  buffer=_normalize_buffer(buffer),
                                  head=0, tail=len(buffer)-1)
                steps.append(_with_vars(step, kind, buffer=_normalize_buffer(buffer)))
            continue

        # === DEQUEUE ===
        m = dequeue_pattern.search(L)
        if m:
            buffer = _normalize_buffer(buffer)
            if kind == "priority":
                val = heapq.heappop(heap) if heap else None
                val_str = str(val) if val not in (None, "None", "", "?") else "∅"
                step = _make_step("dequeue", i, f"Remove highest priority element {val_str}",
                                  heap=heap.copy(), value=val_str)
                steps.append(_with_vars(step, kind, heap=heap))

            elif kind.startswith("circular"):
                if head == -1:
                    step = _make_step("underflow", i, "Queue Underflow — empty queue",
                                      buffer=_normalize_buffer(buffer), head=head, tail=tail)
                else:
                    val = buffer[head] if head < len(buffer) else None
                    val_str = str(val) if val not in (None, "None", "", "?") else "∅"
                    if head < len(buffer):
                        buffer[head] = "∅"
                    if head == tail:
                        head = tail = -1
                    else:
                        head = (head + 1) % capacity
                    step = _make_step("dequeue", i, f"Dequeue {val_str} from circular queue",
                                      buffer=_normalize_buffer(buffer), head=head, tail=tail, value=val_str)
                steps.append(_with_vars(step, kind, buffer=_normalize_buffer(buffer),
                                        head=head, tail=tail, capacity=capacity))

            else:
                val = buffer.pop(0) if buffer else None
                val_str = str(val) if val not in (None, "None", "", "?") else "∅"
                step = _make_step("dequeue", i, f"Dequeue element {val_str} from front",
                                  buffer=_normalize_buffer(buffer),
                                  head=0, tail=len(buffer)-1, value=val_str)
                steps.append(_with_vars(step, kind, buffer=_normalize_buffer(buffer)))
            continue

        # === PEEK ===
        if peek_pattern.search(L):
            val = None
            if kind == "priority":
                val = heap[0] if heap else None
            elif buffer:
                val = buffer[0]
            val_str = str(val) if val not in (None, "None", "", "?") else "∅"
            step = _make_step("peek", i, f"Peek front element {val_str}",
                              value=val_str, buffer=_normalize_buffer(buffer))
            steps.append(_with_vars(step, kind, buffer=_normalize_buffer(buffer),
                                    head=head, tail=tail, capacity=capacity, heap=heap))
            continue

        # === DISPLAY ===
        if display_pattern.search(L):
            desc = f"Display queue contents: {' → '.join(_normalize_buffer(buffer)) or 'Empty'}"
            step = _make_step("display", i, desc, buffer=_normalize_buffer(buffer))
            steps.append(_with_vars(step, kind, buffer=_normalize_buffer(buffer),
                                    head=head, tail=tail, capacity=capacity, heap=heap))
            continue

        # === TRAVERSE ===
        if traverse_pattern.search(L):
            step = _make_step("traverse", i, "Traverse through queue",
                              buffer=_normalize_buffer(buffer))
            steps.append(_with_vars(step, kind, buffer=_normalize_buffer(buffer),
                                    head=head, tail=tail, capacity=capacity))
            for v in buffer:
                v_str = str(v) if v not in (None, "None", "", "?") else "∅"
                s2 = _make_step("visit", i, f"Visit element {v_str}",
                                value=v_str, buffer=_normalize_buffer(buffer))
                steps.append(_with_vars(s2, kind, buffer=_normalize_buffer(buffer),
                                        head=head, tail=tail, capacity=capacity))
            continue

    # -------------------------------------------------------
    # 🧩 Meta
    # -------------------------------------------------------
    meta = {
        "kind": f"queue-{kind}",
        "family": "queue",
        "layout": "circular" if "circular" in kind else "linear",
        "theme": "softblue",
        "capacity": capacity if "circular" in kind else None,
        "ir_complete": True,
    }

    trace(f"instrument_queue.py → translation complete ({kind}), {len(steps)} steps generated.")
    return {"steps": steps, "meta": meta}


__all__ = ["translate_queue_ir"]