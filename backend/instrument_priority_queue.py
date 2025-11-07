# backend/instrument_priority_queue.py
# Priority Queue → IR translator with a SAFE evaluator that records real values.
import ast
from typing import Any, Dict, List, Tuple

PRIORITY_IR_TEMPLATE: Dict[str, Any] = {
    "mode": "queue",
    "variant": "priority",
    "initial": [],
    "meta": {},
    "steps": [],
    "final": []
}

def _jsonable(v: Any) -> Any:
    if isinstance(v, (int, float, str, bool)) or v is None:
        return v
    try:
        return str(v)
    except Exception:
        return "<val>"

def _split_item(item: Any) -> Tuple[Any, Any]:
    """
    Returns (priority, value) from an item.
    If item is a 2+-tuple -> (item[0], item[1]),
    else treat the whole item as both priority and value.
    """
    try:
        if isinstance(item, tuple) and len(item) >= 2:
            return (item[0], item[1])
    except Exception:
        pass
    return (item, item)

class WrapHeaps(ast.NodeTransformer):
    """
    Rewrites:  pq = []  into  pq = __pwrap([], "pq")
    so that we can intercept pq[0] peeks as well.
    """
    def visit_Assign(self, node: ast.Assign):
        self.generic_visit(node)
        if len(node.targets) == 1 and isinstance(node.targets[0], ast.Name):
            if isinstance(node.value, ast.List):
                name = node.targets[0].id
                node.value = ast.Call(
                    func=ast.Name(id="__pwrap", ctx=ast.Load()),
                    args=[node.value, ast.Constant(value=name)],
                    keywords=[]
                )
        return node

def translate_priority_ir(code: str) -> Dict[str, Any]:
    ir: Dict[str, Any] = {**PRIORITY_IR_TEMPLATE, "steps": []}

    # Parse & instrument
    try:
        tree = ast.parse(code)
    except SyntaxError:
        return ir
    tree = WrapHeaps().visit(tree)
    ast.fix_missing_locations(tree)
    compiled = compile(tree, filename="<priority>", mode="exec")

    steps: List[Dict[str, Any]] = []
    heaps_registry: List[Any] = []

    class PriorityTracer:
        """
        A tiny heap/list proxy that logs:
          - heappush(item)      -> enqueue (with priority)
          - heappop()           -> dequeue_highest (min priority first)
          - self[0]             -> peek_highest
        """
        __slots__ = ("name", "_h", "_init", "_steps")

        def __init__(self, name: str, init_list: List[Any], steps_ref: List[Dict[str, Any]]):
            self.name = name
            self._h = list(init_list)   # raw items as provided by user
            self._init = list(init_list)
            self._steps = steps_ref

        # make it look like a list for pq[0]
        def __getitem__(self, key):
            if isinstance(key, int) and key == 0:
                if not self._h:
                    val = None; pr = None
                else:
                    # min item by Python ordering
                    try:
                        m = min(self._h)
                    except Exception:
                        # fallback: compare by _split_item priority only
                        m = min(self._h, key=lambda x: _split_item(x)[0])
                    pr, val = _split_item(m)
                self._steps.append({
                    "action": "peek_highest",
                    "priority": _jsonable(pr),
                    "value": _jsonable(val),
                    "description": f"peek (highest priority)"
                })
                return val
            # other indexing just returns underlying value without logging
            try:
                return self._h[key]
            except Exception:
                return None

        def __len__(self): return len(self._h)
        def __iter__(self): return iter(self._h)
        def __repr__(self): return f"PriorityTracer({self.name}={self._h!r})"

        # we’ll be called by fake heapq below:
        def heappush(self, item):
            pr, val = _split_item(item)
            self._h.append(item)
            self._steps.append({
                "action": "enqueue",
                "priority": _jsonable(pr),
                "value": _jsonable(val),
                "description": f"enqueue { _jsonable(val) } (p={ _jsonable(pr) })"
            })

        def heappop(self):
            if not self._h:
                return None
            # pop the minimum by Python ordering
            try:
                m = min(self._h)
            except Exception:
                m = min(self._h, key=lambda x: _split_item(x)[0])
            self._h.remove(m)
            pr, val = _split_item(m)
            self._steps.append({
                "action": "dequeue_highest",
                "priority": _jsonable(pr),
                "value": _jsonable(val),
                "description": f"dequeue highest → { _jsonable(val) } (p={ _jsonable(pr) })"
            })
            return m

    def __pwrap(lst, name: str):
        t = PriorityTracer(name, lst, steps)
        heaps_registry.append(t)
        return t

    # fake heapq that works with our tracer or plain lists
    class _FakeHeapqModule:
        @staticmethod
        def heappush(heap, item):
            if isinstance(heap, PriorityTracer):
                return heap.heappush(item)
            # plain list fallback (no logging)
            heap.append(item)

        @staticmethod
        def heappop(heap):
            if isinstance(heap, PriorityTracer):
                return heap.heappop()
            if not heap:
                return None
            try:
                m = min(heap)
            except Exception:
                m = min(heap, key=lambda x: _split_item(x)[0])
            heap.remove(m)
            return m

    # import hook: allow "import heapq" to succeed
    def _fake_import(name, globals=None, locals=None, fromlist=(), level=0):
        if name == "heapq":
            return _FakeHeapqModule
        raise ImportError("Import blocked")

    SAFE_BUILTINS = {
        "__import__": _fake_import,
        "range": range, "len": len, "enumerate": enumerate,
        "min": min, "max": max, "abs": abs, "sum": sum,
        "any": any, "all": all, "print": (lambda *a, **k: None),
        "list": list, "tuple": tuple
    }

    g = {"__builtins__": SAFE_BUILTINS, "__pwrap": __pwrap, "heapq": _FakeHeapqModule}
    l: Dict[str, Any] = {}

    try:
        exec(compiled, g, l)
    except Exception:
        # Keep whatever was captured
        pass

    ir["steps"] = steps
    if heaps_registry:
        first = heaps_registry[0]
        ir["initial"] = list(first._init)
        ir["final"] = list(first._h)
    return ir
