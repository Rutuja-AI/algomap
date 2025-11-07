"""
Smart Split module (parked)
--------------------------
This file contains the optional "smart split" logic that was removed from app.py to keep
production simple and deterministic. You can import and re-enable it later without hunting
through old commits.

What it provides
================
- Line-level concept detector: stack / queue-linear / queue-priority
- Segment builders and cleaners
- Optional LLM-driven splitter (OpenRouter) with safeguards
- A single entry: `smart_split(code: str, *, use_llm=False, llm_api_key=None, llm_model="meta-llama/llama-3.1-8b-instruct")`
  returning a normalized list of segments: [{concept, line_range, code}]
- A helper `translate_segments(segments, translate: bool, translators)` that runs your
  translator functions for each known concept and returns a payload ready for the UI.

Wiring later (example)
======================
from smart_split import smart_split, translate_segments
segs = smart_split(code, use_llm=True, llm_api_key=API_KEY)
payload = translate_segments(
    segs,
    translate=True,
    translators={
        "stack": translate_stack_ir,
        "queue-linear": translate_queue_ir,
        "queue-priority": translate_priority_ir,
        "sort": lambda code: translate_sort_ir(code, []),
    },
    ensure_context_fn=_ensure_segment_context,  # from your app.py
    postprocess_queue_linear_fn=_guarantee_queue_linear_steps,  # from your app.py
)
"""
from gemini_manager import GeminiKeyManager

manager = GeminiKeyManager()

from __future__ import annotations
import re
import json
from typing import Callable, Dict, List, Optional

# -----------------------------
# Regex detectors (context-aware)
# -----------------------------
_HEAP_PUSH_RE = re.compile(r"heapq\.heappush\(\s*(?P<var>\w+)\s*,")
_HEAP_POP_RE  = re.compile(r"heapq\.heappop\(\s*(?P<var>\w+)\s*\)")
_LIST_INIT_RE = re.compile(r"(?P<var>\w+)\s*=\s*\[\s*\]")
INDEX0_RE     = re.compile(r"(?P<var>\w+)\s*\[\s*0\s*\]")
INDEXM1_RE    = re.compile(r"(?P<var>\w+)\s*\[\s*-\s*1\s*\]")
POP0_RE       = re.compile(r"(?P<var>\w+)\.pop\(\s*0\s*\)")
POP_EMPTY_RE  = re.compile(r"(?P<var>\w+)\.pop\(\s*\)")


def detect_concept_from_line(line: str, ctx: dict) -> Optional[str]:
    """Decide concept for a single line using simple syntax/context signals.
    ctx is mutated and should be a dict with keys: heap_vars, list_vars, heap_seen.
    """
    L = (line or "").strip()
    ctx.setdefault("heap_vars", set())
    ctx.setdefault("list_vars", set())
    ctx.setdefault("heap_seen", False)

    if not L or L.startswith("#"):
        return None

    # priority queue clues
    if L.startswith("import heapq") or re.search(r"\bheapq\b", L):
        ctx["heap_seen"] = True
        return "queue-priority"
    m = _HEAP_PUSH_RE.search(L)
    if m:
        ctx["heap_vars"].add(m.group("var"))
        return "queue-priority"
    m = _HEAP_POP_RE.search(L)
    if m:
        ctx["heap_vars"].add(m.group("var"))
        return "queue-priority"
    m = INDEX0_RE.search(L)
    if m:
        var = m.group("var")
        if var in ctx["heap_vars"] or (ctx["heap_seen"] and var in {"pq", "heap", "hp", "tasks"}):
            return "queue-priority"

    # list context (stack / linear)
    if _LIST_INIT_RE.search(L):
        ctx["list_vars"].add(_LIST_INIT_RE.search(L).group("var"))
        return None

    if POP0_RE.search(L):
        return "queue-linear"
    m = INDEX0_RE.search(L)
    if m and m.group("var") not in ctx["heap_vars"]:
        return "queue-linear"

    if POP_EMPTY_RE.search(L):
        return "stack"
    if INDEXM1_RE.search(L):
        return "stack"

    return None


def detect_concept_from_line_legacy(line: str) -> Optional[str]:
    return detect_concept_from_line(line, {"heap_vars": set(), "list_vars": set(), "heap_seen": False})


# -----------------------------
# Greedy legacy segmenter (no LLM)
# -----------------------------

def segment_code_by_concept(code: str) -> List[dict]:
    lines = (code or "").splitlines()
    segments: List[dict] = []
    cur_concept: Optional[str] = None
    cur_start = 0
    buf: List[str] = []

    def flush():
        nonlocal buf, cur_concept, cur_start
        if buf and cur_concept:
            seg_code = "\n".join(buf).strip()
            if seg_code:
                segments.append({
                    "concept": cur_concept,
                    "line_range": [cur_start + 1, cur_start + len(buf)],
                    "code": seg_code,
                })
        buf[:] = []
        cur_concept = None

    for i, line in enumerate(lines):
        c = detect_concept_from_line_legacy(line)
        if c:
            if cur_concept and c != cur_concept:
                flush()
            if not cur_concept:
                cur_concept = c
                cur_start = i
            buf.append(line)
        else:
            if cur_concept:
                buf.append(line)
    flush()
    return segments


# -----------------------------
# LLM-assisted splitter (optional)
# -----------------------------
SPLIT_SYSTEM = (
    "You split Python-like code into semantic segments for visualization.\n"
    "Return STRICT JSON only, no prose/markdown.\n"
    "Schema:\n"
    '{ "segments": [ { "concept": "stack|queue-linear|queue-priority|sort|graph-bfs|graph-dfs|tree|generic", '
    '"line_range": [start,end], "code": "verbatim code segment" } ] }\n'
    "Rules:\n"
    "- Concepts:\n"
    "  * stack: uses append/push + pop() (no index) and optional peek via s[-1].\n"
    "  * queue-linear: FIFO via append + pop(0) or deque.popleft.\n"
    "  * queue-priority: uses heapq (heappush/heappop) or heap variables.\n"
    "  * sort: classic in-place sorts.\n"
    "- Segments must be non-overlapping, increasing ranges (1-indexed, inclusive).\n"
    "- Avoid empty/comment-only segments."
)


def llm_split_call(code: str, *, api_key: Optional[str] = None, model: str = "gemini-1.5-flash") -> dict:
    """
    Call Gemini (via GeminiKeyManager) to split code into semantic segments.
    Uses the same schema as before, but with key rotation for reliability.
    """
    # Gemini system prompt
    GEMINI_SYSTEM = (
        "You split Python-like code into semantic segments for visualization.\n"
        "Return STRICT JSON only, no prose/markdown.\n"
        "Schema:\n"
        '{ "segments": [ { "concept": "stack|queue-linear|queue-priority|sort|graph-bfs|graph-dfs|tree|generic", '
        '"line_range": [start,end], "code": "verbatim code segment" } ] }\n'
        "Rules:\n"
        "- Concepts:\n"
        "  * stack: uses append/push + pop() (no index) and optional peek via s[-1].\n"
        "  * queue-linear: FIFO via append + pop(0) or deque.popleft.\n"
        "  * queue-priority: uses heapq (heappush/heappop) or heap variables.\n"
        "  * sort: classic in-place sorts.\n"
        "- Segments must be non-overlapping, increasing ranges (1-indexed, inclusive).\n"
        "- Avoid empty/comment-only segments."
    )

    user_msg = (
        "Split the following code. Use the schema and rules strictly. Return only JSON.\n\n"
        f"CODE:\n```python\n{code}\n```"
    )

    # Build prompt for Gemini
    prompt = f"{GEMINI_SYSTEM}\n\n{user_msg}"

    # Ask Gemini through KeyManager
    raw_text = manager.ask(prompt)

    # Clean and parse JSON
    import re, json
    cleaned = re.sub(r"```(?:json)?|```", "", raw_text, flags=re.I).strip()
    try:
        return json.loads(cleaned)
    except Exception as e:
        raise RuntimeError(f"❌ Gemini returned invalid JSON: {raw_text}") from e



def _validate_segments(code: str, segs: List[dict]) -> List[dict]:
    lines = (code or "").splitlines()
    n = len(lines)

    def clamp_pair(p):
        if not (isinstance(p, list) and len(p) == 2):
            return None
        a, b = int(p[0]), int(p[1])
        a = max(1, min(a, n)); b = max(1, min(b, n))
        if a > b:
            a, b = b, a
        return [a, b]

    cleaned: List[dict] = []
    last_end = 0
    for s in (segs or []):
        concept = (s.get("concept") or "generic").strip().lower()
        if concept not in {"stack","queue-linear","queue-priority","sort","graph-bfs","graph-dfs","tree","generic"}:
            concept = "generic"
        rng = clamp_pair(s.get("line_range"))
        if not rng:
            continue
        a, b = rng
        if b <= last_end:
            continue
        seg_code = "\n".join(lines[a-1:b]).strip()
        if not seg_code:
            continue
        cleaned.append({"concept": concept, "line_range": [a, b], "code": seg_code})
        last_end = b
    return cleaned


def _infer_concept_from_code(snippet: str) -> str:
    t = (snippet or "").lower()
    has_heap   = ("import heapq" in t) or ("heapq.heappush" in t) or ("heapq.heappop" in t)
    has_pop0   = re.search(r"\.pop\s*\(\s*0\s*\)", t) is not None or ".popleft(" in t
    has_append = ".append(" in t
    has_peek0  = re.search(r"\b[a-z_]\w*\s*\[\s*0\s*\]", t) is not None
    has_peekm1 = re.search(r"\b[a-z_]\w*\s*\[\s*-\s*1\s*\]", t) is not None
    has_pop    = re.search(r"\.pop\s*\(\s*\)", t) is not None
    if has_heap:
        return "queue-priority"
    if has_append and (has_pop0 or has_peek0):
        return "queue-linear"
    if has_append and (has_pop or has_peekm1):
        return "stack"
    return "generic"


def _strip_comment_only_edges(seg: dict) -> dict:
    lines = (seg.get("code") or "").splitlines()
    def is_noise(s: str) -> bool:
        t = (s or "").strip()
        return (not t) or t.startswith("#")
    i, j = 0, len(lines) - 1
    while i <= j and is_noise(lines[i]):
        i += 1
    while j >= i and is_noise(lines[j]):
        j -= 1
    seg["code"] = "\n".join(lines[i:j+1]) if i <= j else ""
    return seg


def _relabel_segments(segments: List[dict]) -> List[dict]:
    fixed = []
    for s in segments:
        s = _strip_comment_only_edges(s)
        inferred = _infer_concept_from_code(s.get("code", ""))
        concept = inferred if inferred != "generic" else s.get("concept", "generic")
        fixed.append({**s, "concept": concept})
    return fixed


def _merge_adjacent_same_concept(segs: List[dict]) -> List[dict]:
    if not segs:
        return segs
    out = [segs[0]]
    for s in segs[1:]:
        prev = out[-1]
        if s["concept"] == prev["concept"] and s["line_range"][0] == prev["line_range"][1] + 1:
            prev["line_range"][1] = s["line_range"][1]
            prev["code"] = (prev["code"] + "\n" + s["code"]).strip()
        else:
            out.append(s)
    return out


def _explode_mixed_segments(segs: List[dict]) -> List[dict]:
    out_all: List[dict] = []
    for s in segs:
        ctx = {"heap_vars": set(), "list_vars": set(), "heap_seen": False}
        lines = (s.get("code") or "").splitlines()
        base_start = s["line_range"][0]

        cur_concept: Optional[str] = None
        cur_start_local: Optional[int] = None
        buf: List[str] = []

        def flush(local_end: int):
            nonlocal buf, cur_concept, cur_start_local
            if cur_concept and buf:
                out_all.append({
                    "concept": cur_concept,
                    "line_range": [base_start + (cur_start_local - 1), base_start + (local_end - 1)],
                    "code": "\n".join(buf).strip(),
                })
            cur_concept = None
            cur_start_local = None
            buf = []

        for i, line in enumerate(lines, start=1):
            c = detect_concept_from_line(line, ctx)
            if cur_concept:
                if c and c != cur_concept:
                    flush(i - 1)
                    cur_concept = c
                    cur_start_local = i
                    buf = [line]
                else:
                    buf.append(line)
            else:
                if c:
                    cur_concept = c
                    cur_start_local = i
                    buf = [line]
        flush(len(lines))

        if not any(seg for seg in out_all if seg.get("line_range")):
            out_all.append(s)
    return out_all


# -----------------------------
# Public API
# -----------------------------

def smart_split(code: str, *, use_llm: bool = False, llm_api_key: Optional[str] = None, llm_model: str = "meta-llama/llama-3.1-8b-instruct") -> List[dict]:
    """Return normalized segments without translating to steps. Safe for reuse.
    If use_llm is True, tries LLM split then cleans; otherwise uses greedy detector only.
    """
    code = (code or "").rstrip("\n")
    if not code:
        return []

    if use_llm:
        try:
            raw = llm_split_call(code, api_key=llm_api_key, model=llm_model)
            segs = _validate_segments(code, raw.get("segments", []))
        except Exception:
            segs = segment_code_by_concept(code)
    else:
        segs = segment_code_by_concept(code)

    segs = _relabel_segments(segs)
    segs = _explode_mixed_segments(segs)
    segs = _merge_adjacent_same_concept(segs)
    return segs


def translate_segments(
    segments: List[dict],
    translate: bool,
    translators: Dict[str, Callable[[str], dict]],
    *,
    ensure_context_fn: Optional[Callable[[str, str], str]] = None,
    postprocess_queue_linear_fn: Optional[Callable[[str, list], list]] = None,
) -> dict:
    """Run the appropriate translator per segment and return a UI-ready payload.
    `translators` keys should include 'stack', 'queue-linear', 'queue-priority' (and 'sort' if used).
    `ensure_context_fn` can inject q=[], pq=[], import heapq, etc. (from your app.py)
    `postprocess_queue_linear_fn` can enforce dequeue-for-pop(0) policy (from your app.py)
    """
    results: List[dict] = []
    for idx, s in enumerate(segments, start=1):
        concept = s.get("concept")
        code    = s.get("code", "")
        code_ctx = code
        steps: List[dict] = []

        if ensure_context_fn and concept in {"queue-linear", "queue-priority"}:
            code_ctx = ensure_context_fn(concept, code)

        if translate and concept in translators:
            try:
                ir = translators[concept](code_ctx)
                steps = (ir or {}).get("steps", []) or []
            except Exception:
                steps = []

        if postprocess_queue_linear_fn and concept == "queue-linear":
            steps = postprocess_queue_linear_fn(code_ctx, steps)

        results.append({
            "idx": idx,
            "concept": concept,
            "line_range": s.get("line_range", [1, 1]),
            "code": code,
            "steps": steps,
            "step_count": len(steps),
        })

    summary = {
        "total_segments": len(results),
        "concept_counts": _count_concepts(results),
        "translated": bool(translate),
    }
    return {"segments": results, "summary": summary}


def _count_concepts(results: List[dict]) -> dict:
    out = {}
    for r in results:
        c = r.get("concept", "?")
        out[c] = out.get(c, 0) + 1
    return out


__all__ = [
    "smart_split",
    "translate_segments",
    # low-level bits if you want granular control later
    "detect_concept_from_line",
    "detect_concept_from_line_legacy",
    "segment_code_by_concept",
    "llm_split_call",
]
