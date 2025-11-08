import re
import json
from backend.gemini_manager import IR_POOL
from backend.instrument_master import resolve_parent_animator
from backend.animate_manager import build_animation_plan  # ✅ unified animation planner

# -------------------------------------------------
# 🧹 Safe JSON Parser
# -------------------------------------------------
# -------------------------------------------------
# 🧹 Safe JSON Parser (Updated – Debug-Proof)
# -------------------------------------------------
def safe_json_parse(text: str):
    """Cleans Gemini responses and safely parses valid JSON only."""
    try:
        # 💥 Step 1: remove all code block markers & debug text
        clean = re.sub(r"```(?:json|python)?", "", text)
        clean = re.sub(r"---\s*END\s*DEBUG\s*---", "", clean, flags=re.IGNORECASE)
        clean = re.sub(r"(?i)(here'?s|below|sure|animation plan|schema|debug)[:\s-]*", "", clean)
        clean = clean.strip()

        # 💥 Step 2: extract only JSON portion
        start = clean.find("{")
        end = clean.rfind("}") + 1
        if start == -1 or end <= 0:
            raise ValueError("No valid JSON braces found in response.")
        core = clean[start:end]

        # 💥 Step 3: ensure braces balanced
        open_braces = core.count("{")
        close_braces = core.count("}")
        if open_braces != close_braces:
            print(f"[SAFE-PARSE] ⚠️ Unbalanced braces detected ({open_braces} vs {close_braces}) → truncating")
            # truncate after last closing brace
            last_brace = core.rfind("}")
            core = core[:last_brace + 1]

        # 💥 Step 4: final cleanup of escaped quotes
        core = core.rstrip('"\\ ')
        return json.loads(core)

    except Exception as e:
        print(f"[SAFE-PARSE] ❌ JSON parse failed: {e}")
        # Fallback default (non-crashing)
        return {"steps": [], "meta": {"layout": "linear", "theme": "softblue"}}

# -------------------------------------------------
# ⚙️ Self-Learning IR Compressor
# -------------------------------------------------
AUTO_LEARN_PATH = "backend/ir_actions.json"

def compress_ir_minimal(steps, concept="generic"):
    concept = (concept or "").lower()
    try:
        import os
        cache = json.load(open(AUTO_LEARN_PATH)) if os.path.exists(AUTO_LEARN_PATH) else {}
    except Exception:
        cache = {}

    all_actions = [s.get("action", "").lower() for s in steps]
    universal_keep = {"initialize", "set_value", "update_var", "log"}
    frequent = {a for a in all_actions if all_actions.count(a) > 1}
    rare = {a for a in all_actions if all_actions.count(a) == 1}
    keep = universal_keep | frequent | rare
    learned = set(cache.get(concept, []))
    keep |= learned

    compressed, last_state, new_actions = [], None, set()
    for s in steps:
        act = s.get("action", "").lower()
        if act not in keep:
            new_actions.add(act)
            keep.add(act)
        sig = (tuple(s.get("buffer", [])), s.get("head"), s.get("tail"))
        if sig != last_state:
            compressed.append(s)
            last_state = sig

    if new_actions:
        cache.setdefault(concept, [])
        cache[concept] = sorted(set(cache[concept]) | new_actions)
        import os
        os.makedirs(os.path.dirname(AUTO_LEARN_PATH), exist_ok=True)
        json.dump(cache, open(AUTO_LEARN_PATH, "w"), indent=2)
        print(f"🧠 [LEARN] Added new actions for '{concept}': {sorted(new_actions)}")

    return compressed

# -------------------------------------------------
# 🗣️ Adaptive Narration Enhancer (Teaching Mode)
# -------------------------------------------------
def enhance_narration(steps, concept="generic"):
    friendly = []
    for s in steps:
        desc = s.get("description", "")
        act = s.get("action", "").lower()
        vars_ = s.get("vars", {})
        if concept.startswith("search") or "search" in concept:
            if "mid" in act or "mid" in desc:
                arr_val = vars_.get("arr[mid]")
                key = vars_.get("key")
                if arr_val is not None and key is not None:
                    if arr_val < key:
                        desc = f"We look at the middle — value {arr_val}. It's smaller than {key}, so we skip left part."
                    elif arr_val > key:
                        desc = f"Checking middle — value {arr_val}. It's greater than {key}, move left."
                    else:
                        desc = f"We found our match! The middle value {arr_val} equals the key {key}."
            elif "initialize" in act:
                desc = "We start by marking the search range from first to last element."
        s["description"] = desc
        friendly.append(s)
    return friendly

# -------------------------------------------------
# 🌳 Humanized Narration for B-Tree inserts
# -------------------------------------------------
def humanize_btree_narration(steps):
    pretty = []
    for s in steps:
        desc = s.get("description", "")
        act = s.get("action", "").lower()
        vars_ = s.get("vars", {})
        k = vars_.get("k") or vars_.get("key")
        node = vars_.get("node_focus") or vars_.get("node_id") or "current node"
        keys = vars_.get("node.keys") or vars_.get("keys") or []
        if "initialize" in act or "create" in act:
            desc = "Starting B-Tree initialization. Root node is empty and ready to insert keys."
        elif "insert" in act and "split" not in desc.lower():
            nkeys = len(keys)
            word = ["no", "one", "two", "three", "four", "five", "six", "seven"]
            keycount = word[nkeys] if nkeys < len(word) else str(nkeys)
            desc = f"The {node} currently has {keycount} key{'s' if nkeys != 1 else ''}. Inserting {k} in sorted order; space is available."
        elif "split" in act or "promote" in desc.lower():
            median = vars_.get("median") or vars_.get("promoted_key_value")
            desc = f"Node is full — splitting around the median key {median}. Left child keeps smaller keys, right child gets larger ones, and median is promoted."
        elif "traverse" in act or "move" in desc.lower():
            desc = f"Traversing into child node to place {k or 'next key'} correctly."
        s["description"] = desc
        pretty.append(s)
    return pretty

# -------------------------------------------------
# 🔧 IR Reconstruction with Gemini
# -------------------------------------------------
def reconstruct_with_gemini(code: str, concept: str = "generic", local_ir=None):
    
    print("\n[RECONSTRUCT] 🚀 Triggered Gemini IR Reconstruction...")
    parent = resolve_parent_animator(concept)
    if local_ir:
        print("🧠 [REFINER] Local IR already exists → sending it to Gemini for optimization.")
    else:
        print("🧠 [REFINER] No local IR found → requesting fresh plan from Gemini.")

    base_prompt = f"""
You are AlgoMap's Intelligent IR Refiner.
Concept: {concept}
Parent Animator: {parent}

Return RAW JSON only:
{{"steps":[{{"action":"...","description":"...","vars":{{}}}}]],"meta":{{"layout":"linear","theme":"softblue","parent_animator":"{parent}"}}}}
Code:
{code}
"""
    try:
        print("[RECONSTRUCT] 🔑 Sending IR request to Gemini (IR_POOL)...")
        response = IR_POOL.ask(base_prompt, hint="animation-plan").strip()
        print("\n[RECONSTRUCT] 🧩 Raw Gemini response (first 600 chars):")
        print(response[:600], "\n--- END DEBUG ---")

        data = safe_json_parse(response)
        steps = data.get("steps", [])
        meta = data.get("meta", {"layout": "linear", "theme": "softblue", "parent_animator": parent})

        # 🩹 FINAL UNIVERSAL META-FIX
        if isinstance(meta.get("animation_plan"), dict):
            inner = meta["animation_plan"]
            if "objects" in inner and "operations" in inner:
                print(f"🩹 [FINAL-META-FIX] Flattened animation_plan → meta (objs={len(inner['objects'])}, ops={len(inner['operations'])})")
                meta["objects"] = inner.get("objects", [])
                meta["operations"] = inner.get("operations", [])
                meta.pop("animation_plan", None)

        # 🧠 Enhance + Patch visuals
        steps = inject_queue_visuals(steps, concept)
        steps = enhance_narration(steps, concept)

        # Preserve array context
        if steps and "arr" in steps[0].get("vars", {}):
            arr = steps[0]["vars"]["arr"]
            for s in steps:
                s.setdefault("vars", {})["arr"] = arr

        if local_ir and isinstance(local_ir, dict):
            for k, v in local_ir.get("meta", {}).items():
                meta.setdefault(k, v)

        before = len(steps)
        # 🚫 disable compression temporarily for testing matrix / unknown concepts
        if concept.lower() in ["matrix", "matrices", "2d arrays", "2d array", "matrix operations", "unknown"]:
            print(f"[REFINER] DEBUG: keeping all {before} steps (no compression for {concept}).")
        else:
            if not local_ir and before > 15:
                steps = compress_ir_minimal(steps, concept)
            else:
                print(f"[REFINER] Skipping compression ({before} steps).")

        after = len(steps)
        print(f"[REFINER] Reduced {before} → {after} visible steps.")

        print(f"[RECONSTRUCT] ✅ Finalized {len(steps)} steps | Layout: {meta.get('layout')} | Theme: {meta.get('theme')}")

        # 🧩 Ensure meta consistency
        if "kind" not in meta:
            meta["kind"] = concept.lower() if concept else "generic"
        meta["parent_animator"] = meta.get("parent_animator", "GenericAIAnimator")

        return steps, meta

    except Exception as e:
        print(f"[RECONSTRUCT] ❌ Gemini reconstruction failed: {e}")
        return (
            [{"action": "note", "description": f"Reconstruction failed: {e}", "vars": {}}], 
            {"layout": "linear", "theme": "error", "parent_animator": parent}
        )

# -------------------------------------------------
# 🎬 Declarative Animation Plan Integration
# -------------------------------------------------
def generate_animation_plan(steps, concept="generic"):
    print("\n🎬 [PLAN] Generating declarative animation plan...")
    try:
        plan = build_animation_plan(steps, concept)
        if isinstance(plan, dict):
            if "script" in plan:
                plan.pop("script", None)
            if "animation_plan" in plan and isinstance(plan["animation_plan"], dict):
                inner = plan["animation_plan"]
                if "objects" in inner and "operations" in inner:
                    print(f"🩹 [PATCH] Using nested animation_plan (objs={len(inner['objects'])}, ops={len(inner['operations'])})")
                    plan = inner
            if not plan.get("objects") and not plan.get("elements"):
                plan.update({"layout": "none", "theme": "transparent", "elements": []})
                print("🪶 [NOTE] Empty plan detected → skipping placeholder rendering.")
        print(f"[PLAN] ✅ Built plan → Elements: {len(plan.get('objects', []))}")
        return plan
    except Exception as e:
        print("[PLAN] ❌ Failed to build plan:", e)
        return {"layout": "none", "elements": [], "relations": [], "intent": [], "meta": {"family": concept, "autoPlay": False}}

# -------------------------------------------------
# 🧩 Visual Patcher for Queues
# -------------------------------------------------
def inject_queue_visuals(steps, concept=None, *args, **kwargs):
    if not steps or not concept or ("queue" not in concept and "deque" not in concept):
        return steps
    for s in steps:
        vars_ = s.get("vars", {})
        if all(x is None for x in s.get("buffer", [])):
            if "deque" in vars_:
                s["buffer"] = vars_["deque"].copy()
            elif "array" in vars_:
                s["buffer"] = vars_["array"].copy()
            else:
                s["buffer"] = [None] * 5
        if "front" in vars_:
            s["head"] = vars_["front"]
        if "rear" in vars_:
            s["tail"] = vars_["rear"]
    return steps

# -------------------------------------------------
# 🔍 Utility
# -------------------------------------------------
def extract_value(desc: str):
    m = re.search(r"(\d+|'[^']+'|\"[^\"]+\")", desc)
    return m.group(1).strip("'\"") if m else None
# ✅ Alias for universal fallback (used in instrument_master)
reconstruct_ir = reconstruct_with_gemini
