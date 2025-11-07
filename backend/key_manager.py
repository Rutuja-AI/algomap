# backend/key_manager.py
import os

class GeminiKeyManager:
    """Manages multiple Gemini API keys with rotation."""

    def __init__(self, env_var_name: str):
        keys = os.getenv(env_var_name, "")
        self.keys = [k.strip() for k in keys.split(",") if k.strip()]
        self.idx = 0

    def get_key(self, return_meta=False):
        if not self.keys:
            raise ValueError("No Gemini API keys found in environment.")
        key = self.keys[self.idx]
        if return_meta:
            idx = self.idx
            total = len(self.keys)
            count = 1
        self.idx = (self.idx + 1) % len(self.keys)
        return (key, idx, total, count) if return_meta else key