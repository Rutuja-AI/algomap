# backend/animate_manager.py
import json
import re
from gemini_manager import ANIMATE_POOL
from animator_dictionary import get_animator_vocab


def build_animation_plan(steps, concept="generic"):
    """
    Converts IR steps into a declarative *Animation Plan*.
    🎨 Voice narration temporarily disabled (commented out)
    """

    print("\n🧠 [ANIM-MANAGER] Building animation plan (visual-only mode)...")

    try:
        vocab = get_animator_vocab(concept)
        allowed_objects = vocab.get("objects", [])
        allowed_ops = vocab.get("operations", [])
        default_layout = vocab.get("layout", "linear")
        default_theme = vocab.get("theme", "softblue")

        steps_json = json.dumps(steps, indent=2) if not isinstance(steps, str) else steps

        vocab_hint = """
Allowed Object Types:
- "box" → variable/value container
- "cell" → array/queue element
- "node" → tree/graph node
- "arrow" → connection between elements
- "label" → minimal descriptive text (avoid unless necessary)
- "text" → inline narration
"""

        PROMPT = f"""
You are AlgoMap’s **Animation Plan Generator (Visual-Only Mode)**.

Concept: {concept}
IR steps:
{steps_json}

Your task:
Return only the **animation plan JSON**, skipping any narration or script.

🎬 Output JSON Format:
{{
  "animation_plan": {{
    "layout": "linear" | "grid" | "tree" | "ring" | "stack" | "generic",
    "theme": "softblue" | "vivid" | "neutral",
    "objects": [
      {{
        "id": "unique_id",
        "type": "cell" | "box" | "node",
        "label": "short readable label (like 10, 25, 45)",
        "x": 100,
        "y": 100
      }}
    ],
    "operations": [
      {{
        "step": 1,
        "op": "highlight" | "compare" | "found" | "dim",
        "target": "id or list of ids",
        "comment": "brief explanation for internal mapping"
      }}
    ]
  }}
}}

🧠 Simplification Rules:
- No narration or voice lines.
- Focus only on visible objects and operations.
- Use neat layout and minimal labels.

Allowed Objects: {allowed_objects}
Allowed Operations: {allowed_ops}
Default Layout: {default_layout}
Default Theme: {default_theme}
"""

        print("[ANIM-MANAGER] Requesting animation plan from Gemini (ANIMATE_POOL)...")
        response_text = ANIMATE_POOL.ask(PROMPT, hint="animation-plan-visual")

        # Clean response text safely
        cleaned = response_text.strip("` \n")
        cleaned = re.sub(r"^```(json)?", "", cleaned)
        cleaned = re.sub(r"```$", "", cleaned)
        match = re.search(r"\{.*\}", cleaned, re.DOTALL)
        if match:
            cleaned = match.group(0)
        cleaned = re.sub(r",\s*([\]}])", r"\1", cleaned)

        data = json.loads(cleaned)

        # --- Extract and flatten plan ---
        plan = data.get("animation_plan", {})
        obj_count = len(plan.get("objects", []))
        op_count = len(plan.get("operations", []))
        print(f"[ANIM-MANAGER] ✅ Parsed successfully → Objects: {obj_count}, Operations: {op_count}")

        # 🩹 PATCH: flatten nested animation_plan so frontend can see objects directly
        if "animation_plan" in plan and isinstance(plan["animation_plan"], dict):
            inner = plan["animation_plan"]
            if "objects" in inner and "operations" in inner:
                print(f"🩹 [PATCH] Using nested animation_plan (objects: {len(inner.get('objects', []))}, ops: {len(inner.get('operations', []))})")
                plan["objects"] = inner.get("objects", [])
                plan["operations"] = inner.get("operations", [])
                plan["elements"] = inner.get("objects", [])
                plan.pop("animation_plan", None)

        # ✅ Fallback only if truly empty
        if not plan.get("objects") and not plan.get("elements"):
            plan.update({"layout": "none", "theme": "transparent", "elements": []})
            print("🪶 [NOTE] Empty plan detected → skipping placeholder rendering.")

        # --- Return clean flattened plan ---
        return plan


    except Exception as e:
        print("[ANIM-MANAGER] ❌ Failed to build animation plan:", e)
        return {
            "animation_plan": {
                "layout": "linear",
                "theme": "softblue",
                "objects": [],
                "operations": [],
            }
        }
