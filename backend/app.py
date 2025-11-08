# backend/app.py — AlgoMap Backend (Blessed Hybrid v3)
import os
import re
import json
import tempfile
import time
from flask import Flask, request, jsonify
from flask_cors import CORS
import google.generativeai as genai

# ✅ Corrected imports with backend prefix
from backend.gemini_manager import DETECT_POOL, IR_POOL, ANIMATE_POOL, GeminiKeyManager
from backend.instrument_sort import translate_sort_from_code
from backend.instrument_master import translate_ir, resolve_parent_animator, merge_all_segments
from backend.fallback_reconstruct import reconstruct_with_gemini, generate_animation_plan
from backend.instrument_graph import translate_graph_ir
from backend.complexity_checker import analyze_complexity

# ✅ Initialize Gemini key manager
gemini_keys = GeminiKeyManager()  # ✅ no arguments




app = Flask(__name__)
CORS(
    app,
    resources={r"/*": {"origins": [
        "https://algomappppp.vercel.app",  # ✅ your deployed frontend
        "http://localhost:5173"            # ✅ your local dev (optional)
    ]}},
    supports_credentials=True
)

# -------------------------------------------------
# 🧠 CONCEPT DETECTION PROMPTS (legacy templates)
# -------------------------------------------------
CONCEPT_DETECT_SYSTEM = """You are a code concept detector for data structures and algorithms.
- Language: Python-like pseudocode (students).
- Recognize: stack, queue-linear, queue-priority, sort,
  tree (BST, AVL, Red-Black, B-Tree, N-ary),
  linkedlist, doublylinkedlist, circularlinkedlist,
  circular-queue, deque, circular-deque, graph, dfs, bfs.
- If the code does not match any of these concepts with high confidence,
  return "unknown" as the concept.
- Return JSON only.
"""

CONCEPT_DETECT_USER = """Detect the main data structure or algorithm concept in the student's code.
Return JSON with fields: concept, explanation.

CODE:
```python
{code}
```"""

CONCEPT_DETECT_SYSTEM_UNLIMITED = """You are an open concept identifier that can detect **any** programming concept.
- You may include algorithmic or library-based types (heap, recursion, hashmap, dp, oops, etc).
- Explain in natural language but keep your JSON output concise.
Return JSON only.
"""

CONCEPT_DETECT_USER_UNLIMITED = """Identify what the following Python code demonstrates.
Return JSON with: concept, explanation.

CODE:
```python
{code}
```"""

DEBUG_SAVE_PATH = os.path.join(os.getcwd(), "debug_cache.json")

def save_debug_ir(payload: dict):
    """Save last analyzed IR to a debug JSON file (auto-overwrites each time)."""
    try:
        with open(DEBUG_SAVE_PATH, "w", encoding="utf-8") as f:
            json.dump(payload, f, indent=2, ensure_ascii=False)
        print(f"🧾 [DEBUG SAVE] IR saved to {DEBUG_SAVE_PATH}")
    except Exception as e:
        print(f"⚠️ [DEBUG SAVE ERROR]: {e}")

def call_gemini(prompt: str, model_name="gemini-2.0-flash") -> str:
    """Send a prompt to Gemini and return its reply text."""
    try:
        key = gemini_keys.next_key()
        genai.configure(api_key=key)
        model = genai.GenerativeModel(model_name)
        response = model.generate_content(prompt)
        return response.text.strip()
    except Exception as e:
        print("⚠️ [GEMINI ERROR]", e)
        return f"Error: {e}"
# =========================================================
# 🧠 GEMINI CONCEPT + SUB-CONCEPT DETECTION (Enhanced v2)
# =========================================================
@app.post("/")
def quiz():
    data = request.get_json(force=True) or {}
    message = data.get("message", "").strip()

    if not message:
        return jsonify({"reply": "⚠️ No message provided."}), 200

    system_prompt = (
        "You are AlgoBot, a friendly algorithm assistant.\n"
        "Answer user questions clearly and concisely, or generate one multiple-choice DSA quiz question if asked."
    )
    prompt = f"{system_prompt}\n\nUser: {message}"
    reply = call_gemini(prompt)
    return jsonify({"reply": reply}), 200


def llm_detect_concept_strict(code: str):
    """Gate-1: detects only canonical DSA families; returns 'unknown' if uncertain."""
    print("🔎 [GATE-1: STRICT] Sending code to Gemini (DSA-only)…")
    detect_prompt = f"""
    You are a **strict DSA concept detector** for the AlgoMap visualizer.
    You must classify the student's Python code ONLY if it clearly belongs to one of these families:
    [stack, queue, linkedlist, tree, graph, sorting, searching].
    If the code does not belong to any of them with HIGH confidence,
    output exactly "unknown" as concept.

    Return JSON only:
    {{
      "concept": "<family or 'unknown'>",
      "sub_concept": "<variant or ''>",
      "explanation": "<1-2 line reasoning>"
    }}

    CODE:
    ```python
    {code}
    ```"""
    try:
        text = DETECT_POOL.ask(detect_prompt, hint="gate1-strict")
        clean = text.replace("```json", "").replace("```", "").strip()
        data = json.loads(clean)
        print("✅ [GATE-1 RESULT]", data)
        data["concept"] = data.get("concept", "").lower().strip()
        data["sub_concept"] = data.get("sub_concept", "").lower().strip()
        if data["concept"] not in [
            "stack","queue","linkedlist","tree","graph","sorting","searching"
        ]:
            data["concept"] = "unknown"
        return data
    except Exception as e:
        print("⚠️ [GATE-1 ERROR]", e)
        return {"concept": "unknown", "sub_concept": "", "explanation": str(e)}


def llm_detect_concept_unlimited(code: str):
    """Gate-2: open Gemini; free to name any concept or idea."""
    print("🧠 [GATE-2: OPEN] Triggered for unknown code…")
    detect_prompt = f"""
    You are an **open concept identifier** for the AlgoMap system.
    Identify what the following Python code demonstrates — even if it is not a data-structure algorithm.
    It can be OOP, recursion, hashing, string processing, file I/O, pattern printing, etc.

    Return concise JSON:
    {{
      "concept": "<general concept>",
      "explanation": "<short reasoning>"
    }}

    CODE:
    ```python
    {code}
    ```"""
    try:
        text = DETECT_POOL.ask(detect_prompt, hint="gate2-open")
        clean = text.replace("```json", "").replace("```", "").strip()
        data = json.loads(clean)
        print("✅ [GATE-2 RESULT]", data)
        return data
    except Exception as e:
        print("⚠️ [GATE-2 ERROR]", e)
        return {"concept": "unknown_general", "explanation": str(e)}



def _print_steps_json(tag: str, payload):
    import sys
    print(f"\n===== {tag} =====")
    try:
        print(json.dumps(payload, ensure_ascii=False, indent=2))
    except Exception as e:
        print(f"(could not JSON-dump: {e})\n{payload!r}")
    sys.stdout.flush()


# -------------------------------------------------
# Concept → Animator Resolver
# -------------------------------------------------
def resolve_known_animator(concept: str):
    """Maps concept to its animator family for trace logs."""
    mapping = {
        "stack": "stack",
        "queue": "queue-linear",
        "queue-priority": "priorityqueue",
        "queue-circular": "circularqueue",
        "deque": "deque",
        "circular-deque": "circulardeque",
        "linkedlist": "linkedlist",
        "doubly": "doubly",
        "circular linkedlist": "circularlinkedlist",
        "tree": "tree",
        "bst": "tree",
        "avl": "tree",
        "redblack": "tree",
        "btree": "tree",
        "graph": "graph",
        "dfs": "graph",
        "bfs": "graph",
        "sort": "sorting"
    }
    return mapping.get(concept, "generic")


# -------------------------------------------------
# 🧩 Animator Capability Registry
# -------------------------------------------------
ANIMATOR_CAPABILITIES = {
    "generic": {
        "components": ["box", "label", "text"],
        "relations": [],
        "usable_for": ["expression", "string", "palindrome", "matrix", "io"],
        "description": "Generic visuals for unknown or logic-based programs (text + label boxes)."
    },
    "stack": {"components": ["box", "label", "arrow"], "relations": ["top_pointer"]},
    "queue-linear": {"components": ["cell", "label", "arrow"], "relations": ["front", "rear"]},
    "linkedlist": {"components": ["node_box", "arrow", "label"], "relations": ["next"]},
    "doubly": {"components": ["node_box", "arrow", "label"], "relations": ["next", "prev"]},
    "tree": {"components": ["node", "edge_arrow", "label"], "relations": ["left_child", "right_child"]},
    "graph": {"components": ["node", "edge_arrow", "weight_label"], "relations": ["connects"]},
    "sorting": {"components": ["cell", "label", "highlight"], "relations": ["swap", "compare"]}
}
def normalize_concept_family(concept: str, sub: str) -> str:
    """Unify Gemini's freeform concept/sub_concept text into standard internal names."""
    combo = f"{concept.strip().lower()} {sub.strip().lower()}".strip()

    # --- Linked List family ---
    if "linked" in combo:
        if "circular" in combo and "doubly" in combo:
            return "linkedlist-circulardoubly"
        if "circular" in combo:
            return "linkedlist-circularsingly"
        if "doubly" in combo:
            return "linkedlist-doubly"
        return "linkedlist-singly"

    # --- Queue family ---
    if "queue" in combo:
        if "circular" in combo:
            return "queue-circularqueue"
        if "priority" in combo:
            return "queue-priorityqueue"
        if "deque" in combo and "circular" in combo:
            return "queue-circulardeque"
        if "deque" in combo:
            return "queue-deque"
        return "queue-linearqueue"

    # --- Tree family ---
    if "tree" in combo:
        if "red" in combo and "black" in combo:
            return "tree-redblack"
        if "avl" in combo:
            return "tree-avl"
        if "b-tree" in combo or "btree" in combo:
            return "tree-btree"
        return "tree"

    # --- Graph family ---
    if "graph" in combo:
        if "bfs" in combo:
            return "graph-bfs"
        if "dfs" in combo:
            return "graph-dfs"
        return "graph"

    # --- Sorting / Searching family ---
    if "sort" in combo:
        if "bubble" in combo:
            return "sorting-bubble"
        if "selection" in combo:
            return "sorting-selection"
        if "insertion" in combo:
            return "sorting-insertion"
        if "merge" in combo:
            return "sorting-merge"
        if "quick" in combo:
            return "sorting-quick"
        return "sorting"
    if "search" in combo:
        if "binary" in combo:
            return "search-binary"
        if "linear" in combo:
            return "search-linear"
        return "searching"

    # Default fallback
    return concept.strip().lower()

@app.post("/check_complexity")
def check_complexity():
    data = request.get_json(force=True) or {}
    code = (data.get("code") or "").strip()
    result = analyze_complexity(code)
    print(f"🧩 [CHECKER] {result}")
    return jsonify(result), 200


@app.post("/translate_one")
def translate_one():
    import time
    start_total = time.time()  # 🕒 Start overall timer

    data = request.get_json(force=True) or {}
    code = (data.get("code") or "").strip()
    if not code:
        return jsonify({"segments": [], "summary": {"note": "empty code"}}), 200

    # 1️⃣ Concept detection
    t0 = time.time()
    # 🎯 Gate-1 strict classification
    concept_result = llm_detect_concept_strict(code)

    # 🔄 Gate-2 open reasoning if unknown
    if concept_result.get("concept") == "unknown":
        print("🔄 [CHAIN] Gate-1 returned unknown → triggering Gate-2 (open mode)")
        gate2 = llm_detect_concept_unlimited(code)
        # merge reasoning for display
        concept_result["explanation"] = (
            concept_result.get("explanation","") + " | " +
            gate2.get("explanation","")
        )
        # record secondary label for GenericAIAnimator
        concept_result["meta_alt_concept"] = gate2.get("concept","")

    print(f"⏱️ [TIMER] llm_detect_concept → {time.time() - t0:.2f}s")

    concept = concept_result.get("concept", "unknown").lower().strip()
    sub_concept = concept_result.get("sub_concept", "").lower().strip()
    full_concept = normalize_concept_family(concept, sub_concept)

    explanation = concept_result.get("explanation", "")

    # full_concept = concept

    steps, meta, implementation = [], {}, "unknown"

    # 🚀 Fast shortcut for sorting
    if concept in ["sorting", "sort"]:
        print("🧩 [FAST-PATH] Sorting detected → translate_sort_from_code()")
        res = translate_sort_from_code(code)
        payload = {
            "segments": [{
                "idx": 1,
                "concept": full_concept,
                "code": code,
                "steps": res.get("steps", []),
                "meta": res.get("meta", {}),
                "step_count": len(res.get("steps", [])),
            }]
        }
        save_debug_ir(payload)
        print(f"⏱️ [TIMER] TOTAL translate_one → {time.time() - start_total:.2f}s\n")
        return jsonify(payload), 200

    # 2️⃣ Translation or fallback
    t1 = time.time()
    try:
        if full_concept in [
            "stack", "queue", "queue-linearqueue", "queue-priorityqueue",
            "queue-circularqueue", "queue-deque", "queue-circular deque","queue-circulardeque",
            "linkedlist", "linkedlist-singly", "linkedlist-doubly",
            "linkedlist-circularsingly", "linkedlist-circulardoubly",
            "tree", "bst", "avl", "redblack", "btree", "tree-btree",
            "graph", "dfs", "bfs", "graph-bfs", "graph-dfs",
            "sorting-bubble", "sorting-insertion", "sorting-selection",
            "sorting-merge", "sorting-quick",
        ]:
            print(f"🧩 [ROUTE] Using local instrumentor → {resolve_known_animator(full_concept)}")
            print(f"💡 incoming concept: '{full_concept}'")  # ✅ use normalized name here!

            if full_concept in ["graph", "dfs", "bfs"]:
                res = translate_graph_ir(code, variant=sub_concept or concept)
            elif concept == "sorting" or concept == "sort" or full_concept.startswith("sorting-"):
                res = translate_sort_from_code(code)
            else:
                res = translate_ir(full_concept, code)  # ✅ normalized


            # ✅ extract steps/meta only once here
            steps = res.get("steps", [])
            meta = res.get("meta", {})

        else:
            print("🌌 [AUTO-FALLBACK] Unknown concept → using Gemini IR_POOL")
            steps, meta = reconstruct_with_gemini(code, full_concept)
            animation_plan = generate_animation_plan(steps, full_concept)
            meta.update({"animation_plan": animation_plan})

    except Exception as e:
        print("❌ [TRANSLATE_ONE ERROR]", e)
        explanation += f" | Exception: {e}"
        steps, meta = [], {"layout": "linear", "theme": "error"}

    print(f"⏱️ [TIMER] translate_ir / fallback → {time.time() - t1:.2f}s")

    # 3️⃣ Postprocessing (sanitizer + filter)
    t2 = time.time()
    # (keep your existing btree sanitizer & duplicate filter here)
    print(f"⏱️ [TIMER] postprocessing → {time.time() - t2:.2f}s")

    # 4️⃣ Build payload & debug save
    payload = {
        "segments": [{
            "idx": 1,
            "concept": full_concept,
            "code": code,
            "steps": steps,
            "meta": meta,
            "step_count": len(steps),
        }]
    }

    save_debug_ir(payload)
    print(f"⏱️ [TIMER] TOTAL translate_one → {time.time() - start_total:.2f}s\n")

    return jsonify(payload), 200


# -------------------------------------------------
# Sorting endpoint
# -------------------------------------------------
@app.post("/translate_sort_code")
def translate_sort_code():
    data = request.get_json(force=True) or {}
    code = (data.get("code") or "").strip()
    try:
        res = translate_sort_from_code(code)
        algorithm = res.get("algorithm", "unknown")
        steps = res.get("steps", [])

        # 🧩 extract the original array from the user's code
        import re, ast
        arr = []
        match = re.search(r"arr\s*=\s*(\[[^\]]+\])", code)
        if match:
            try:
                arr = ast.literal_eval(match.group(1))
            except Exception:
                arr = []

        payload = {
            "segments": [
                {
                    "idx": 1,
                    "concept": "sort",
                    "explanation": f"Detected {algorithm.capitalize()} Sort.",
                    "code": code,
                    "initial": arr,             # ✅ added this line
                    "steps": steps,
                    "step_count": len(steps),
                    "implementation": "sorting",
                }
            ],
            "summary": {
                "total_segments": 1,
                "concept_counts": {"sort": 1}
            },
        }

    except Exception as e:
        print("❌ [APP-DEBUG] Sorting instrumentor error:", repr(e))
        payload = {"segments": [], "summary": {"error": str(e)}}
    return jsonify(payload), 200


@app.post("/api/chat")
def chatbot_proxy():
    """
    Secure backend proxy for AlgoBot chat requests.
    Keeps the Gemini key hidden from the frontend.
    """
    try:
        data = request.get_json(force=True)
        # 🔹 get the first key from your GEMINI_KEYS list
        api_key = os.getenv("GEMINI_KEYS", "").split(",")[0].strip()
        url = f"https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent?key={api_key}"

        r = requests.post(url, headers={"Content-Type": "application/json"}, data=json.dumps(data))
        return (r.text, r.status_code, {"Content-Type": "application/json"})
    except Exception as e:
        print("❌ [CHATBOT PROXY ERROR]", e)
        return jsonify({"error": {"message": str(e)}}), 500
# -------------------------------------------------
# Ping
# -------------------------------------------------
@app.get("/ping")
def ping():
    return {"ok": True}

@app.get("/")
def home():
    return "AlgoMap Backend Live 🌟 (Smart Split OFF)"




if __name__ == "__main__":
    print("🚀 Starting AlgoMap Backend (Blessed Hybrid v3) on http://127.0.0.1:5000")
    app.run(host="127.0.0.1", port=int(os.getenv("PORT", 5000)), debug=True, use_reloader=True)
