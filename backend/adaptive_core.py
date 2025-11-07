# ============================================
# 🧠 AlgoMap Adaptive Learning Core v2.0
# --------------------------------------------
# Learns animation logic & layout adaptively.
# Stores user feedback (ratings) and reuses
# top-rated IRs instead of re-generating.
# ============================================

import os
import json
import hashlib
import difflib
from datetime import datetime
from gemini_manager import IR_POOL

# 🗂️ Adaptive memory folder
ADAPTIVE_DIR = os.path.join(os.path.dirname(__file__), "adaptive_memory")
os.makedirs(ADAPTIVE_DIR, exist_ok=True)


# ------------------------------------------------
# 🔹 Safe JSON parsing for LLM responses
# ------------------------------------------------
def safe_json_parse(text):
    """Parse model text to JSON safely."""
    import re

    try:
        cleaned = text.strip()
        cleaned = re.sub(r"^```[a-zA-Z]*", "", cleaned)
        cleaned = re.sub(r"```$", "", cleaned)
        cleaned = cleaned.strip()

        match = re.search(r"\[.*\]", cleaned, re.DOTALL)
        if match:
            cleaned = match.group(0)

        return json.loads(cleaned)
    except Exception as e:
        print(f"[AIM] ⚠️ Could not parse IR JSON → {e}")
        return [{"action": "note", "description": "Parse error in IR", "vars": {}}]


# ------------------------------------------------
# 💾 Save learned logic with rating feedback
# ------------------------------------------------
def save_adaptive_patch(concept, code, ir_steps, rating=None, meta=None):
    """Save learned IR + user feedback rating to adaptive_memory/<concept>.jsonl"""
    path = os.path.join(ADAPTIVE_DIR, f"{concept}.jsonl")
    sig = hashlib.sha1(code.encode()).hexdigest()

    record = {
        "pattern_hash": sig,
        "concept": concept,
        "ir": ir_steps,
        "rating": rating or 0,  # ❤️ user feedback
        "meta": meta or {},
        "code": code,
        "learned_at": datetime.now().isoformat(),
    }

    with open(path, "a", encoding="utf-8") as f:
        f.write(json.dumps(record) + "\n")

    print(f"[AIM] ✅ Saved adaptive {concept} patch → {path}")


# ------------------------------------------------
# 🔍 Retrieve top-rated / best-matching patch
# ------------------------------------------------
def get_best_patch(concept, code, min_rating=3):
    """Retrieve best-rated matching animation for similar code."""
    path = os.path.join(ADAPTIVE_DIR, f"{concept}.jsonl")
    if not os.path.exists(path):
        return None

    sig = hashlib.sha1(code.encode()).hexdigest()

    try:
        with open(path, "r", encoding="utf-8") as f:
            records = [json.loads(l) for l in f if l.strip()]
    except Exception as e:
        print(f"[AIM] ⚠️ Could not read adaptive patches for {concept} → {e}")
        return None

    # 🔹 Try exact hash match first
    for r in records:
        if r["pattern_hash"] == sig and r.get("rating", 0) >= min_rating:
            print(f"[AIM] 🎯 Using cached {concept} animation (exact hash match)")
            return r

    # 🔹 Fuzzy match fallback
    best = max(
        records,
        key=lambda r: difflib.SequenceMatcher(None, code, r.get("code", "")).ratio(),
        default=None,
    )
    if best and best.get("rating", 0) >= min_rating:
        print(f"[AIM] 🪄 Using similar {concept} animation (fuzzy match)")
        return best

    return None


# ------------------------------------------------
# 🧹 Clean redundant IR steps before saving
# ------------------------------------------------
def clean_ir_steps(steps):
    condensed = []
    for s in steps:
        if s["action"] in ["ITERATION", "loop_start", "loop_end"]:
            continue
        if (
            condensed
            and condensed[-1]["action"] == "stack_push"
            and s["action"] == "stack_push"
        ):
            condensed[-1]["vars"]["stack"] = s["vars"]["stack"]
            continue
        condensed.append(s)
    return condensed


# ------------------------------------------------
# 🚀 Learn missing logic or reuse cached ones
# ------------------------------------------------
def learn_missing_logic(code, concept="generic"):
    """Learn or reuse animation IR adaptively."""
    print(f"[AIM] 🚀 Learning missing logic for {concept}")

    # 🧠 Step 1 — try to reuse best-rated patch
    cached = get_best_patch(concept, code)
    if cached:
        return {"implementation": f"adaptive-{concept}", "steps": cached["ir"]}

    # 🧩 Step 2 — otherwise, call model and learn
    prompt = f"""
    You are AlgoMap IR Generator.
    Analyze this {concept}-related Python code and output JSON with steps.
    Each step must include: action, description, vars.
    Code:
    {code}
    """

    try:
        resp = IR_POOL.ask(prompt, hint="Generate missing IR for AlgoMap")
        ir = safe_json_parse(resp)
        ir = clean_ir_steps(ir)
        save_adaptive_patch(concept, code, ir)
        return {"implementation": f"adaptive-{concept}", "steps": ir}
    except Exception as e:
        print(f"[AIM] ❌ Learning failed → {e}")
        return {"implementation": f"fallback-{concept}", "steps": []}


# ------------------------------------------------
# 💬 Feedback entrypoint for user ratings
# ------------------------------------------------
def record_user_feedback(concept, code, rating, meta=None):
    """Record rating feedback from frontend."""
    print(f"[AIM] ⭐ Received feedback: {concept} rated {rating}/5")
    save_adaptive_patch(concept, code, meta.get("steps", []), rating, meta)
    return {"status": "ok", "message": "Feedback stored successfully"}
