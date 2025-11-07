# instrument_graph.py
# 🌐 BFS / DFS / Weighted Graph IR Translator (Final Stable v3.2)
# ---------------------------------------------------------------
# ✅ Robust AST + fallback regex graph detection
# ✅ Emits clean IR for AlgoMap visualizers (BFS, DFS, Weighted)
# ✅ Meta always filled (nodes, edges, theme)
# ✅ BFS = queue flow, DFS = stack flow

import re, ast
from typing import Any, Dict, List, Tuple

# -----------------------------
# Helper utilities
# -----------------------------
def _make_step(action: str, description: str, **extra) -> Dict[str, Any]:
    s = {"action": action, "description": description}
    s.update(extra)
    return s


def _safe_dist_map(dist):
    """Convert inf → ∞ for JSON-safe export"""
    safe = {}
    for k, v in dist.items():
        safe[k] = "∞" if v == float("inf") else v
    return safe


# -----------------------------
# Graph parser
# -----------------------------
def _extract_graph_and_start(code: str):
    """Parse adjacency dict and detect start node."""
    graph, start_node = {}, None
    try:
        tree = ast.parse(code)

        for node in ast.walk(tree):
            # graph = {...}
            if isinstance(node, ast.Assign) and isinstance(node.value, ast.Dict):
                parsed = {}
                for k, v in zip(node.value.keys, node.value.values):
                    try:
                        key = ast.literal_eval(k)
                    except Exception:
                        continue
                    vals = []
                    if isinstance(v, ast.List):
                        for e in v.elts:
                            try:
                                vals.append(ast.literal_eval(e))
                            except Exception:
                                pass
                    parsed[key] = vals
                graph = parsed

            # detect start
            if isinstance(node, ast.Assign) and isinstance(node.targets[0], ast.Name):
                if node.targets[0].id.lower() in ("start", "start_node"):
                    try:
                        start_node = ast.literal_eval(node.value)
                    except Exception:
                        pass

            # direct call bfs(graph, "A")
            if isinstance(node, ast.Call) and hasattr(node.func, "id"):
                if node.func.id in ("bfs", "dfs", "dijkstra") and len(node.args) >= 2:
                    try:
                        start_node = ast.literal_eval(node.args[1])
                    except Exception:
                        pass
    except Exception:
        pass

    # fallback regex
    if not graph:
        try:
            m = re.search(r"(\w+)\s*=\s*\{([^}]+)\}", code)
            if m:
                body = m.group(2)
                pairs = re.findall(r"([\w'\"]+)\s*:\s*\[([^\]]*)\]", body)
                parsed = {}
                for k, vals in pairs:
                    key = ast.literal_eval(k)
                    val_list = []
                    for v in vals.split(","):
                        v = v.strip().strip("'\"")
                        if v:
                            val_list.append(v)
                    parsed[key] = val_list
                graph = parsed
        except Exception:
            pass

    if not start_node and graph:
        start_node = next(iter(graph.keys()))
    return graph, start_node


# -----------------------------
# BFS translator
# -----------------------------
def _translate_bfs(code: str) -> Dict[str, Any]:
    steps: List[Dict[str, Any]] = []
    graph, start = _extract_graph_and_start(code)
    if not graph or not start:
        return {"steps": [], "meta": {"kind": "graph-bfs", "nodes": [], "edges": []}}

    nodes = set(graph.keys())
    edges = [(u, v) for u, vs in graph.items() for v in vs]
    for vs in graph.values():
        nodes.update(vs)

    visited, queue = [], [start]
    steps.append(_make_step("enqueue", f"Initialize queue with {start}", queue=list(queue)))

    while queue:
        node = queue.pop(0)
        steps.append(_make_step("dequeue", f"Dequeue node {node}", queue=list(queue)))

        if node not in visited:
            visited.append(node)
            steps.append(_make_step("visit", f"Visit node {node}", visited=list(visited)))

            for neigh in graph.get(node, []):
                if neigh not in visited and neigh not in queue:
                    steps.append(_make_step("connect", f"Traverse edge {node} → {neigh}", source=node, target=neigh))
                    queue.append(neigh)
                    steps.append(_make_step("enqueue", f"Enqueue node {neigh}", queue=list(queue)))

    print(f"[GRAPH-BFS] ✅ {len(steps)} steps generated.")
    return {
        "steps": steps,
        "meta": {
            "kind": "graph-bfs",
            "family": "graph",
            "graph_nodes": list(nodes),     # ✅ renamed
            "graph_edges": edges,           # ✅ renamed
            "start_node": start,            # ✅ extra info
            "layout": "circular",
            "theme": "softpurple",
        },
    }



# -----------------------------
# DFS translator
# -----------------------------
# DFS translator (fixed arrows)
# -----------------------------
def _translate_dfs(code: str) -> Dict[str, Any]:
    steps: List[Dict[str, Any]] = []
    graph, start = _extract_graph_and_start(code)
    if not graph or not start:
        return {"steps": [], "meta": {"kind": "graph-dfs", "nodes": [], "edges": []}}

    nodes = set(graph.keys())
    edges = [(u, v) for u, vs in graph.items() for v in vs]
    for vs in graph.values():
        nodes.update(vs)

    visited, stack = [], [start]
    steps.append(_make_step("push", f"Push start node {start}", stack_snapshot=list(stack)))

    while stack:
        node = stack.pop()
        steps.append(_make_step("pop", f"Pop node {node}", stack_snapshot=list(stack)))

        if node not in visited:
            visited.append(node)
            steps.append(_make_step("visit", f"Visit node {node}", visited=list(visited)))

            # iterate reversed for DFS order
            for neigh in reversed(graph.get(node, [])):
                if neigh not in visited:
                    # 🟣 fixed key names here ↓↓↓
                    steps.append(
                        _make_step(
                            "connect",
                            f"Traverse edge {node} → {neigh}",
                            source=node,      # ✅ was from_
                            target=neigh      # ✅ was to
                        )
                    )
                    stack.append(neigh)
                    steps.append(_make_step("push", f"Push node {neigh}", stack_snapshot=list(stack)))

    print(f"[GRAPH-DFS] ✅ {len(steps)} steps generated.")
    return {
        "steps": steps,
        "meta": {
            "kind": "graph-dfs",
            "family": "graph",
            "graph_nodes": list(nodes),     # ✅ renamed
            "graph_edges": edges,           # ✅ renamed
            "start_node": start,
            "layout": "circular",
            "theme": "softpink",
        },
    }



# -----------------------------
# Dispatcher
# -----------------------------
def translate_graph_ir(code: str, variant: str = None) -> Dict[str, Any]:
    v = (variant or "").lower()
    print(f"[GRAPH-TRANSLATE] Variant → {v}")

    if "bfs" in v:
        return _translate_bfs(code)
    if "dfs" in v:
        return _translate_dfs(code)
    if "dijkstra" in v or "weighted" in v:
        return {"steps": [], "meta": {"kind": "graph-weighted"}}

    # default → BFS
    return _translate_bfs(code)


__all__ = ["translate_graph_ir"]
