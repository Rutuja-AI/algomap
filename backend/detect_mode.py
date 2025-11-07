# backend/detect_mode.py
import ast
from dataclasses import dataclass
from typing import List

@dataclass
class Guess:
    mode: str
    confidence: float
    reasons: List[str]

SORT_HINTS  = {"swap", "sorted", "sort", "bubble", "quicksort", "selection", "insertion"}

def detect_mode(code: str) -> Guess:
    """Lightweight Python detector: queue | stack | sort | tree | graph-bfs | graph-dfs | generic"""
    text = code.lower()

    # quick text probes
    saw_dfs = any(k in text for k in ["dfs(", "def dfs", "depth first"])
    saw_bfs = any(k in text for k in ["bfs(", "def bfs", "breadth first"])
    saw_graph_terms = any(k in text for k in ["graph", "adj", "edges", "neighbors"])
    saw_tree = any(k in text for k in ["treenode", ".left", ".right"])

    has_append = (".append(" in text)
    pop0 = (".pop(0)" in text) or ("popleft(" in text)
    pop_empty = (".pop()" in text) or (".pop( )" in text)

    # basic AST checks for nested loops + swap pattern
    nested_loops = 0
    saw_swap_like = any(k in text for k in SORT_HINTS)
    try:
        tree = ast.parse(code)
        class V(ast.NodeVisitor):
            depth = 0
            def visit_For(self, node):
                self.depth += 1
                nonlocal nested_loops
                nested_loops = max(nested_loops, self.depth)
                self.generic_visit(node)
                self.depth -= 1
            def visit_While(self, node):
                self.depth += 1
                nonlocal nested_loops
                nested_loops = max(nested_loops, self.depth)
                self.generic_visit(node)
                self.depth -= 1
            def visit_Assign(self, node):
                # a[i], a[j] = a[j], a[i]
                nonlocal saw_swap_like
                if (len(node.targets)==1 and
                    isinstance(node.targets[0], (ast.Tuple, ast.List)) and
                    isinstance(node.value, (ast.Tuple, ast.List)) and
                    len(node.targets[0].elts)==2 and len(node.value.elts)==2):
                    saw_swap_like = True
                self.generic_visit(node)
        V().visit(tree)
    except Exception:
        pass

    # score candidates
    candidates: List[Guess] = []
    reasons: List[str] = []

    if has_append and pop0:
        candidates.append(Guess("queue", 0.85, ["append + pop(0)/popleft pattern"]))
    if has_append and pop_empty and not pop0:
        candidates.append(Guess("stack", 0.80, ["append + pop() pattern"]))
    if saw_tree:
        candidates.append(Guess("tree", 0.75, ["Tree-like attributes .left/.right or TreeNode"]))
    if saw_bfs or (saw_graph_terms and pop0):
        candidates.append(Guess("graph-bfs", 0.72, ["Graph terms + queue-like ops"]))
    if saw_dfs or (saw_graph_terms and not pop0):
        candidates.append(Guess("graph-dfs", 0.70, ["DFS keywords / graph terms"]))
    if nested_loops >= 2 and saw_swap_like:
        candidates.append(Guess("sort", 0.80, ["Nested loops + swap-like pattern"]))
    if not candidates:
        if nested_loops >= 2:
            candidates.append(Guess("sort", 0.55, ["Nested loops heuristic"]))
        else:
            candidates.append(Guess("generic", 0.40, ["No strong signals"]))

    best = max(candidates, key=lambda g: g.confidence)
    return best