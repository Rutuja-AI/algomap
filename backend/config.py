# backend/config.py
import json
from gemini_manager import GeminiKeyManager

# =========================================================
# Gemini setup
# =========================================================
GEMINI_MODEL = "gemini-1.5-flash"   # ✅ default model, can override with env if needed
GEMINI_TIMEOUT = 45                 # not used directly now, requests handled in manager

# Initialize key manager (rotates through GEMINI_KEYS)
manager = GeminiKeyManager()

def gemma_chat(system: str, user: str, model: str = GEMINI_MODEL, temperature: float = 0.1) -> str:
    """
    Send a prompt to Gemini through GeminiKeyManager and return the raw response string.
    """
    prompt = f"[SYSTEM]\n{system}\n[USER]\n{user}"
    raw_text = manager.ask(prompt)
    return raw_text

def gemma_json(system: str, user: str, model: str = GEMINI_MODEL, temperature: float = 0.1) -> dict:
    """
    Same as gemma_chat but returns a parsed JSON object.
    Defensively extracts the first {...} block if extra text appears.
    """
    txt = gemma_chat(system, user, model=model, temperature=temperature)
    print("📩 [GEMINI RAW RESPONSE TEXT]", txt)

    try:
        s, e = txt.find("{"), txt.rfind("}")
        if s != -1 and e != -1:
            txt = txt[s:e+1]
        return json.loads(txt)
    except Exception as e:
        print("❌ [GEMINI ERROR in gemma_json]", repr(e))
        raise
