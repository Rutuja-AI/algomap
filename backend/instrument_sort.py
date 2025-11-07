# backend/instrument_sort.py
import re
from typing import List, Dict, Any

ARR_PATTERNS = [
    r'\barr\s*=\s*\[([^\]]+)\]',
    r'\ba\s*=\s*\[([^\]]+)\]',
    r'\bnums?\s*=\s*\[([^\]]+)\]',
]
def _with_vars(step, a, i=None, j=None, n=None):
    step["vars"] = {
        "arr": a[:],
        "i": i,
        "j": j,
        "n": n,
    }
    return step

def _extract_array(code: str) -> List[int]:
    for pat in ARR_PATTERNS:
        m = re.search(pat, code)
        if m:
            raw = m.group(1)
            out = []
            for tok in raw.split(','):
                t = tok.strip()
                if not t:
                    continue
                try:
                    out.append(int(t))
                except ValueError:
                    try:
                        out.append(int(float(t)))
                    except Exception:
                        pass
            if out:
                return out
    return [5, 3, 8, 1, 2]

# ---------- step builders ----------
def _bubble_sort_steps(arr: List[int]) -> List[Dict[str, Any]]:
    a = arr[:]; steps = []; n = len(a)
    for i in range(n):
        for j in range(0, n - 1 - i):
            steps.append(_with_vars({
                "action":"compare",
                "i": j,
                "j": j+1,
                "description":f"compare a[{j}] and a[{j+1}]"
            }, a, j, j+1, n))
            if a[j] > a[j+1]:
                a[j], a[j+1] = a[j+1], a[j]
                steps.append(_with_vars({
                    "action":"swap",
                    "i": j,
                    "j": j+1,
                    "description":f"swap a[{j}] and a[{j+1}]"
                }, a, j, j+1, n))
                steps.append(_with_vars({
                    "action":"set_array",
                    "array": a[:],
                    "description": f"array becomes {a}"
                }, a, j, j+1, n))
        steps.append(_with_vars({
            "action": "mark_sorted",
            "index": n-1-i,
            "description": f"a[{n-1-i}] is in final position"
        }, a, None, None, n))
    return steps


def _selection_sort_steps(arr: List[int]) -> List[Dict[str, Any]]:
    a = arr[:]; steps: List[Dict[str, Any]] = []; n = len(a)
    for i in range(n):
        min_idx = i
        for j in range(i+1, n):
            steps.append({"action":"compare","i":min_idx,"j":j,"description":f"compare a[{min_idx}] and a[{j}]"})
            if a[j] < a[min_idx]:
                min_idx = j
        if min_idx != i:
            a[i], a[min_idx] = a[min_idx], a[i]
            steps.append({"action":"swap","i":i,"j":min_idx,"description":f"swap a[{i}] and a[{min_idx}]"})
            steps.append({"action":"set_array","array":a[:],"description":f"array becomes {a}"})
        steps.append({"action":"mark_sorted","index":i,"description":f"a[{i}] is in final position"})
    return steps


def _insertion_sort_steps(arr: List[int]) -> List[Dict[str, Any]]:
    a = arr[:]; steps: List[Dict[str, Any]] = []; n = len(a)
    for i in range(1, n):
        key = a[i]; j = i - 1
        steps.append({"action":"compare","i":i,"j":i,"description":f"pick key a[{i}] = {key}"})
        while j >= 0 and a[j] > key:
            steps.append({"action":"compare","i":j,"j":i,"description":f"compare a[{j}] > key"})
            a[j+1] = a[j]
            steps.append({"action":"set_array","array":a[:],"description":f"shift a[{j}] → a[{j+1}]"})
            j -= 1
        a[j+1] = key
        steps.append({"action":"set_array","array":a[:],"description":f"place key at a[{j+1}] = {key}"})
        steps.append({"action":"mark_sorted","index":i,"description":f"positions ≤ {i} are in order"})
    for k in range(n):
        steps.append({"action":"mark_sorted","index":k,"description":f"a[{k}] confirmed sorted"})
    return steps

def translate_sort_ir(code: str, algorithm: str = "bubble") -> Dict[str, Any]:
    array = _extract_array(code)
    algo = (algorithm or "bubble").lower().strip()
    if algo == "selection":
        steps = _selection_sort_steps(array)
    elif algo == "insertion":
        steps = _insertion_sort_steps(array)
    elif algo == "merge":
        steps = _merge_sort_steps(array)
    elif algo == "merge":
        steps = _merge_sort_steps(array)
    elif algo == "quick":
        steps = _quick_sort_steps(array)
    elif algo == "heap":
        steps = _heap_sort_steps(array)

    else:
        algo = "bubble"
        steps = _bubble_sort_steps(array)
    return {"mode":"sort","algorithm":algo,"initial":array,"steps":steps,"meta":{"n":len(array)}}


# ---------- code → algorithm detection ----------
def _detect_algorithm_from_code(code: str) -> str:
    c = code.lower()

    # Insertion sort
    if ("key" in c and "while j >=" in c and "[j+1] = " in c):
        return "insertion"

    # Selection sort
    if "min_idx" in c:
        return "selection"

    # Merge sort (recursive + mid split)
    if "merge_sort(" in c and ("mid" in c or ":mid" in c):
        return "merge"

    # Quick sort (partition + pivot + recursive calls)
    if "partition(" in c or "pivot" in c or "quick_sort(" in c:
        return "quick"

    # Heap sort (heapify + extract)
    if "heapify(" in c or "heapsort(" in c or "heapq" in c:
        return "heap"

    # Bubble sort
    if "arr[j]" in c and "arr[j+1]" in c and "arr[j], arr[j+1]" in c:
        return "bubble"

    # Default fallback
    return "bubble"



def translate_sort_from_code(code: str) -> Dict[str, Any]:
    array = _extract_array(code)
    algo = _detect_algorithm_from_code(code)
    if algo == "selection":
        steps = _selection_sort_steps(array)
    elif algo == "insertion":
        steps = _insertion_sort_steps(array)
    elif algo == "merge":
        steps = _merge_sort_steps(array)
    elif algo == "merge":
        steps = _merge_sort_steps(array)
    elif algo == "quick":
        steps = _quick_sort_steps(array)
    elif algo == "heap":
        steps = _heap_sort_steps(array)

    else:
        steps = _bubble_sort_steps(array)
    return {"mode":"sort","algorithm":algo,"initial":array,"steps":steps,"meta":{"n":len(array),"source":"code"}}


def _merge_sort_steps(arr: List[int]) -> List[Dict[str, Any]]:
    steps: List[Dict[str, Any]] = []
    a = arr[:]

    def merge_sort(sub, left_index):
        if len(sub) <= 1:
            return sub
        mid = len(sub) // 2
        left = merge_sort(sub[:mid], left_index)
        right = merge_sort(sub[mid:], left_index + mid)

        merged = []
        i = j = 0
        while i < len(left) and j < len(right):
            li = left_index + i
            rj = left_index + mid + j
            steps.append({
                "action": "compare",
                "i": li,
                "j": rj,
                "description": f"compare a[{li}] and a[{rj}]"
            })
            if left[i] <= right[j]:
                merged.append(left[i])
                i += 1
            else:
                merged.append(right[j])
                j += 1
            # record array state after each merge step
            merged_state = a[:]
            merged_state[left_index:left_index+len(merged)] = merged
            steps.append({
                "action": "set_array",
                "array": merged_state[:],
                "description": f"array becomes {merged_state}"
            })

        merged.extend(left[i:])
        merged.extend(right[j:])
        # place back into a
        for k, val in enumerate(merged):
            a[left_index + k] = val
        steps.append({
            "action": "set_array",
            "array": a[:],
            "description": f"merged segment {merged} into array"
        })
        return merged

    merge_sort(a, 0)
    for k in range(len(a)):
        steps.append({"action":"mark_sorted","index":k,"description":f"a[{k}] confirmed sorted"})
    return steps


def _quick_sort_steps(arr: List[int]) -> List[Dict[str, Any]]:
    steps: List[Dict[str, Any]] = []
    a = arr[:]

    def partition(low, high):
        pivot = a[high]
        steps.append({"action": "pivot", "index": high, "description": f"choose pivot a[{high}] = {pivot}"})
        i = low - 1
        for j in range(low, high):
            steps.append({"action": "compare", "i": j, "j": high, "description": f"compare a[{j}] with pivot {pivot}"})
            if a[j] <= pivot:
                i += 1
                a[i], a[j] = a[j], a[i]
                steps.append({"action": "swap", "i": i, "j": j, "description": f"swap a[{i}] and a[{j}]"})
                steps.append({"action": "set_array", "array": a[:], "description": f"array becomes {a}"})
        a[i+1], a[high] = a[high], a[i+1]
        steps.append({"action": "swap", "i": i+1, "j": high, "description": f"place pivot at position {i+1}"})
        steps.append({"action": "set_array", "array": a[:], "description": f"array becomes {a}"})
        return i+1

    def quick_sort(low, high):
        if low < high:
            pi = partition(low, high)
            quick_sort(low, pi - 1)
            quick_sort(pi + 1, high)

    quick_sort(0, len(a) - 1)
    for k in range(len(a)):
        steps.append({"action": "mark_sorted", "index": k, "description": f"a[{k}] confirmed sorted"})
    return steps


def _heap_sort_steps(arr: List[int]) -> List[Dict[str, Any]]:
    steps: List[Dict[str, Any]] = []
    a = arr[:]
    n = len(a)

    def heapify(n, i):
        largest = i
        l = 2 * i + 1
        r = 2 * i + 2

        if l < n:
            steps.append({"action": "compare", "i": l, "j": largest, "description": f"compare a[{l}] and a[{largest}]"})
        if l < n and a[l] > a[largest]:
            largest = l

        if r < n:
            steps.append({"action": "compare", "i": r, "j": largest, "description": f"compare a[{r}] and a[{largest}]"})
        if r < n and a[r] > a[largest]:
            largest = r

        if largest != i:
            a[i], a[largest] = a[largest], a[i]
            steps.append({"action": "swap", "i": i, "j": largest, "description": f"swap a[{i}] and a[{largest}]"})
            steps.append({"action": "set_array", "array": a[:], "description": f"array becomes {a}"})
            heapify(n, largest)

    # Build max heap
    for i in range(n//2 - 1, -1, -1):
        heapify(n, i)

    # Extract elements one by one
    for i in range(n-1, 0, -1):
        a[0], a[i] = a[i], a[0]
        steps.append({"action": "swap", "i": 0, "j": i, "description": f"move max to end (swap a[0] and a[{i}])"})
        steps.append({"action": "set_array", "array": a[:], "description": f"array becomes {a}"})
        heapify(i, 0)

    for k in range(n):
        steps.append({"action": "mark_sorted", "index": k, "description": f"a[{k}] confirmed sorted"})
    return steps
