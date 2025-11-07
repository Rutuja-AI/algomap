# backend/gemini_manager.py
import os
import itertools
import requests
from dotenv import load_dotenv

# -------------------------------------------------
# Load environment variables
# -------------------------------------------------
load_dotenv()

# -------------------------------------------------
# Primary Key Manager — for Detection / Concept Analysis
# -------------------------------------------------
class GeminiKeyManager:
    

    def __init__(self):
        # Get detection keys from .env
        keys_raw = os.getenv("GEMINI_KEYS", "")
        self.keys = [k.strip() for k in keys_raw.split(",") if k.strip()]
        if not self.keys:
            raise ValueError("❌ No Gemini API keys found in .env (GEMINI_KEYS)")

        self.key_cycle = itertools.cycle(range(len(self.keys)))
        self.current_index = next(self.key_cycle)
    
    def next_key(self):
        """Return the next Gemini API key (round-robin rotation)."""
        if not self.keys:
            raise RuntimeError("No Gemini API keys loaded.")
        key = self.keys[self.current_index]
        # move pointer for next call
        self.current_index = next(self.key_cycle)
        return key


    def _call_gemini(self, prompt, key, hint=None):
        """
        Low-level API call to Gemini for detection tasks.
        Uses Gemini 2.5 Flash endpoint.
        """
        url = "https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent"
        headers = {"Content-Type": "application/json"}
        params = {"key": key}

        # Optional hint handling
        if hint:
            full_prompt = f"Hint: {hint}\n\n{prompt}"
        else:
            full_prompt = prompt

        body = {
            "contents": [
                {"parts": [{"text": full_prompt}]}
            ]
        }

        resp = requests.post(url, headers=headers, params=params, json=body)
        if resp.status_code != 200:
            raise RuntimeError(f"Gemini API error {resp.status_code}: {resp.text}")

        data = resp.json()
        try:
            return data["candidates"][0]["content"]["parts"][0]["text"]
        except Exception as e:
            raise RuntimeError(f"Unexpected Gemini response: {data}") from e

    def ask(self, prompt, hint=None):
        """
        Try current detection key. If it fails, rotate to the next one.
        """
        for _ in range(len(self.keys)):
            key = self.keys[self.current_index]
            try:
                print(f"[KEY-MANAGER] Using Gemini key {self.current_index + 1}")
                result = self._call_gemini(prompt, key, hint=hint)
                return result
            except Exception as e:
                print(f"[KEY-MANAGER] Key {self.current_index + 1} failed → {e}")
                self.current_index = next(self.key_cycle)

        raise RuntimeError("❌ All Gemini keys exhausted. Please refresh keys.")


# -------------------------------------------------
# Secondary Key Manager — for IR Refinement / Reconstruction
# -------------------------------------------------
class GeminiIRKeyManager:
    def __init__(self):
        # Get IR refinement keys from .env
        keys_raw = os.getenv("GEMINI_IR_KEYS", "")
        self.keys = [k.strip() for k in keys_raw.split(",") if k.strip()]
        if not self.keys:
            raise ValueError("❌ No Gemini IR API keys found in .env (GEMINI_IR_KEYS)")

        self.key_cycle = itertools.cycle(range(len(self.keys)))
        self.current_index = next(self.key_cycle)

    def _call_gemini_ir(self, prompt, key, hint=None):
        """
        Low-level call for IR refinement / reconstruction.
        Uses Gemini 2.5 Flash endpoint.
        """
        url = "https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent"
        headers = {"Content-Type": "application/json"}
        params = {"key": key}

        body = {
            "contents": [
                {"parts": [{"text": prompt}]}
            ]
        }

        resp = requests.post(url, headers=headers, params=params, json=body)
        if resp.status_code != 200:
            raise RuntimeError(f"Gemini IR API error {resp.status_code}: {resp.text}")

        data = resp.json()
        try:
            return data["candidates"][0]["content"]["parts"][0]["text"]
        except Exception:
            raise RuntimeError(f"Unexpected Gemini IR response: {data}")

    def ask(self, prompt, hint=None):
        """
        Try current IR key. If it fails, rotate to next one.
        """
        for _ in range(len(self.keys)):
            key = self.keys[self.current_index]
            try:
                print(f"[IR-KEY-MANAGER] Using IR key {self.current_index + 1}")
                result = self._call_gemini_ir(prompt, key, hint=hint)
                return result
            except Exception as e:
                print(f"[IR-KEY-MANAGER] IR key {self.current_index + 1} failed → {e}")
                self.current_index = next(self.key_cycle)

        raise RuntimeError("❌ All Gemini IR keys exhausted. Please refresh keys.")

# -------------------------------------------------
# Animation Key Manager — for Framer Motion Layout Generation
# -------------------------------------------------
class GeminiAnimateKeyManager:
    def __init__(self):
        # Get animation keys from .env
        keys_raw = os.getenv("GEMINI_ANIMATE_KEYS", "")
        self.keys = [k.strip() for k in keys_raw.split(",") if k.strip()]
        if not self.keys:
            raise ValueError("❌ No Gemini animation keys found in .env (GEMINI_ANIMATE_KEYS)")

        self.key_cycle = itertools.cycle(range(len(self.keys)))
        self.current_index = next(self.key_cycle)

    def _call_gemini_animate(self, prompt, key, hint=None):
        """
        Low-level call for Framer Motion animation schema generation.
        Uses Gemini 2.5 Flash endpoint.
        """
        url = "https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent"
        headers = {"Content-Type": "application/json"}
        params = {"key": key}

        # optional hint like "Framer Motion layout plan"
        if hint:
            prompt = f"Hint: {hint}\n\n{prompt}"

        body = {
            "contents": [
                {"parts": [{"text": prompt}]}
            ]
        }

        resp = requests.post(url, headers=headers, params=params, json=body)
        if resp.status_code != 200:
            raise RuntimeError(f"Gemini ANIMATE API error {resp.status_code}: {resp.text}")

        data = resp.json()
        try:
            return data["candidates"][0]["content"]["parts"][0]["text"]
        except Exception as e:
            raise RuntimeError(f"Unexpected Gemini ANIMATE response: {data}") from e

    def ask(self, prompt, hint=None):
        """
        Try current animation key. If it fails, rotate to the next one.
        """
        for _ in range(len(self.keys)):
            key = self.keys[self.current_index]
            try:
                print(f"[ANIMATE-KEY-MANAGER] Using Animation key {self.current_index + 1}")
                result = self._call_gemini_animate(prompt, key, hint=hint)
                return result
            except Exception as e:
                print(f"[ANIMATE-KEY-MANAGER] Animation key {self.current_index + 1} failed → {e}")
                self.current_index = next(self.key_cycle)

        raise RuntimeError("❌ All Gemini ANIMATE keys exhausted. Please refresh keys.")

# -------------------------------------------------
# Global Pool Instances
# -------------------------------------------------
# Primary pool → used for concept detection / open analysis
DETECT_POOL = GeminiKeyManager()

# Secondary pool → used for IR reconstruction / animation refinement
IR_POOL = GeminiIRKeyManager()



# Animation pool → used for generating visual layout and motion schema
ANIMATE_POOL = GeminiAnimateKeyManager()
