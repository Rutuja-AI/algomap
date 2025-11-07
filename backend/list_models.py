# list_models.py
import os
import requests
from dotenv import load_dotenv

# load keys
load_dotenv()
keys = (os.getenv("GEMINI_KEYS") or "").split(",")
keys = [k.strip() for k in keys if k.strip()]

if not keys:
    raise RuntimeError("❌ No GEMINI_KEYS found in .env")

url = "https://generativelanguage.googleapis.com/v1/models"

for i, key in enumerate(keys, start=1):
    print(f"\n🔑 Checking Gemini key {i}...")
    try:
        r = requests.get(url, params={"key": key}, timeout=20)
        r.raise_for_status()
        data = r.json()
        models = [m["name"] for m in data.get("models", [])]
        for m in models:
            print("  -", m)
    except Exception as e:
        print(f"❌ Key {i} failed → {e}")
