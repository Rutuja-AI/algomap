# backend/complexity_checker.py
"""
🧠 Simplified Complexity Checker for AlgoMap
--------------------------------------------
Keeps only minimal sanity checks so any valid DSA code can run smoothly.
Rejects only empty, invalid, or clearly irrelevant scripts.
"""

import ast, re
from typing import Dict, Any


def analyze_complexity(code: str) -> Dict[str, Any]:
    if not code.strip():
        return {"safe": False, "reason": "Empty code", "category": "invalid"}

    # 1️⃣ Line guard — prevent runaway huge files
    lines = code.strip().splitlines()
    if len(lines) > 1000:
        return {"safe": False, "reason": "Code too long for visualization", "category": "too_long"}

    # 2️⃣ Try parsing for syntax
    try:
        tree = ast.parse(code)
    except SyntaxError as e:
        return {"safe": False, "reason": f"Syntax error: {e}", "category": "invalid"}

    # 3️⃣ Small loop guard (avoid 100 nested loops)
    loop_count = sum(isinstance(n, (ast.For, ast.While)) for n in ast.walk(tree))
    if loop_count > 10:
        return {"safe": False, "reason": "Too many loops for animation", "category": "too_deep"}

    # 4️⃣ Quick DSA relevance keywords
    if not re.search(r"(stack|queue|linked|list|tree|graph|sort|search|insert|delete|enqueue|dequeue|push|pop)", code, re.I):
        return {"safe": True, "reason": "Generic code — allowed for universal parser", "category": "generic"}

    # ✅ Default success
    return {"safe": True, "reason": "Code suitable for AlgoMap visualization", "category": "valid"}
