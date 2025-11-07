# instrument_sorting.py
# Hybrid IR translator for sorting algorithms
# ✅ Emits consistent IR: init, compare, swap, shift, merge, partition, mark_sorted
# ✅ Supports Bubble, Insertion, Selection, Merge, Quick

import re
from typing import Any, Dict, List

# -----------------------------
# Helper
# -----------------------------
def _make_step(action: str, line: int, description: str, **extra) -> Dict[str, Any]:
    step = {"action": action, "line": line, "description": description}
    step.update(extra)
    return step

# -----------------------------
# Bubble Sort
# -----------------------------
def bubble_sort_steps(arr: List[int]) -> List[Dict[str, Any]]:
    steps: List[Dict[str, Any]] = []
    n = len(arr)
    steps.append(_make_step("init", 0, "Initial array", arr=list(arr)))

    for i in range(n):
        for j in range(0, n - i - 1):
            steps.append(_make_step(
                "compare", 0,
                f"Pass {i+1}, compare arr[{j}]={arr[j]} and arr[{j+1}]={arr[j+1]}",
                pass_num=i+1, i=i, j=j
            ))
            if arr[j] > arr[j+1]:
                arr[j], arr[j+1] = arr[j+1], arr[j]
                steps.append(_make_step(
                    "swap", 0,
                    f"Swap arr[{j}] and arr[{j+1}]",
                    pass_num=i+1, i=i, j=j, arr=list(arr)
                ))
        steps.append(_make_step(
            "pass", 0,
            f"✅ End of pass {i+1}",
            pass_num=i+1, arr=list(arr)
        ))
    return steps

# -----------------------------
# Merge Sort
# -----------------------------
def merge_sort_steps(arr: List[int]) -> List[Dict[str, Any]]:
    steps: List[Dict[str, Any]] = []

    def merge_sort(arr, l, r, depth=0):
        if l >= r:
            return
        mid = (l + r) // 2
        steps.append(_make_step(
            "split", 0,
            f"Split [{l}:{r}] into [{l}:{mid}] and [{mid+1}:{r}]",
            left=arr[l:mid+1],
            right=arr[mid+1:r+1],
            range=[l, r],
            depth=depth
        ))
        merge_sort(arr, l, mid, depth+1)
        merge_sort(arr, mid+1, r, depth+1)
        merge(arr, l, mid, r, depth)

    def merge(arr, l, mid, r, depth):
        left = arr[l:mid+1]
        right = arr[mid+1:r+1]
        i = j = 0
        k = l
        while i < len(left) and j < len(right):
            steps.append(_make_step(
                "compare", 0,
                f"Compare {left[i]} and {right[j]}",
                i=l+i, j=mid+1+j, depth=depth
            ))
            if left[i] <= right[j]:
                arr[k] = left[i]
                steps.append(_make_step(
                    "merge", 0,
                    f"Take {left[i]} from left",
                    from_side="left", value=left[i], index=k,
                    arr=list(arr), depth=depth
                ))
                i += 1
            else:
                arr[k] = right[j]
                steps.append(_make_step(
                    "merge", 0,
                    f"Take {right[j]} from right",
                    from_side="right", value=right[j], index=k,
                    arr=list(arr), depth=depth
                ))
                j += 1
            k += 1
        while i < len(left):
            arr[k] = left[i]
            steps.append(_make_step(
                "merge", 0,
                f"Take {left[i]} (remaining left)",
                from_side="left", value=left[i], index=k,
                arr=list(arr), depth=depth
            ))
            i += 1; k += 1
        while j < len(right):
            arr[k] = right[j]
            steps.append(_make_step(
                "merge", 0,
                f"Take {right[j]} (remaining right)",
                from_side="right", value=right[j], index=k,
                arr=list(arr), depth=depth
            ))
            j += 1; k += 1

    steps.append(_make_step("init", 0, "Initial array", arr=list(arr)))
    merge_sort(arr, 0, len(arr)-1, depth=0)
    steps.append(_make_step("set_array", 0, "Final sorted array", array=list(arr)))
    return steps

# -----------------------------
# Quick Sort
# -----------------------------
def quick_sort_steps(arr: List[int]) -> List[Dict[str, Any]]:
    steps: List[Dict[str, Any]] = []

    def quick_sort(l, r):
        if l >= r:
            return
        pivot = arr[r]
        steps.append(_make_step("choose_pivot", 0, f"Choose pivot {pivot} at index {r}", pivot=pivot, index=r))
        p = partition(l, r)
        steps.append(_make_step("partition_done", 0, f"Partition done, pivot {arr[p]} placed at {p}", pivot_index=p, arr=list(arr)))
        quick_sort(l, p-1)
        quick_sort(p+1, r)

    def partition(l, r):
        pivot = arr[r]
        i = l - 1
        for j in range(l, r):
            steps.append(_make_step("compare", 0, f"Compare {arr[j]} with pivot {pivot}", i=j, pivot=pivot))
            if arr[j] <= pivot:
                i += 1
                arr[i], arr[j] = arr[j], arr[i]
                steps.append(_make_step("swap", 0, f"Swap arr[{i}] and arr[{j}]", i=i, j=j, arr=list(arr)))
        arr[i+1], arr[r] = arr[r], arr[i+1]
        steps.append(_make_step("swap", 0, f"Place pivot {pivot} at index {i+1}", i=i+1, j=r, arr=list(arr)))
        return i+1

    steps.append(_make_step("init", 0, "Initial array", arr=list(arr)))
    quick_sort(0, len(arr)-1)
    return steps

# -----------------------------
# Insertion Sort
# -----------------------------
def insertion_sort_steps(arr: List[int]) -> List[Dict[str, Any]]:
    steps: List[Dict[str, Any]] = []
    steps.append(_make_step("init", 0, "Initial array", arr=list(arr)))

    for i in range(1, len(arr)):
        key = arr[i]
        j = i - 1
        steps.append(_make_step("select", 0, f"Select key {key} at index {i}", i=i, value=key))
        while j >= 0 and arr[j] > key:
            steps.append(_make_step("compare", 0, f"Compare {arr[j]} and {key}", i=j, j=i))
            arr[j+1] = arr[j]
            steps.append(_make_step("shift", 0, f"Shift {arr[j]} right", i=j, arr=list(arr)))
            j -= 1
        arr[j+1] = key
        steps.append(_make_step("insert", 0, f"Insert key {key} at index {j+1}", i=j+1, arr=list(arr)))
    return steps

# -----------------------------
# Selection Sort
# -----------------------------
def selection_sort_steps(arr: List[int]) -> List[Dict[str, Any]]:
    steps: List[Dict[str, Any]] = []
    n = len(arr)
    steps.append(_make_step("init", 0, "Initial array", arr=list(arr)))

    for i in range(n):
        min_idx = i
        for j in range(i+1, n):
            steps.append(_make_step("compare", 0, f"Compare {arr[j]} and {arr[min_idx]}", i=j, j=min_idx))
            if arr[j] < arr[min_idx]:
                min_idx = j
        if min_idx != i:
            arr[i], arr[min_idx] = arr[min_idx], arr[i]
            steps.append(_make_step("swap", 0, f"Swap {arr[i]} and {arr[min_idx]}", i=i, j=min_idx, arr=list(arr)))
        steps.append(_make_step("mark_sorted", 0, f"Element {arr[i]} fixed at index {i}", i=i, arr=list(arr)))
    return steps

# -----------------------------
# Dispatcher
# -----------------------------
def extract_array_from_code(code: str) -> List[int]:
    match = re.search(r"arr\s*=\s*\[([0-9,\s]+)\]", code)
    if match:
        try:
            return [int(x.strip()) for x in match.group(1).split(",")]
        except:
            return [5, 2, 4, 1, 3]
    return [5, 2, 4, 1, 3]

def translate_sorting_ir(code: str) -> Dict[str, Any]:
    arr = extract_array_from_code(code)
    algo = "unknown"

    cl = code.lower()
    if "for j in range(0, len(arr) - i - 1)" in cl:
        algo = "bubble"
    elif "while j >=" in cl and "key" in cl:
        algo = "insertion"
    elif "min_idx" in cl or "minindex" in cl:
        algo = "selection"
    elif "merge" in cl:
        algo = "merge"
    elif "pivot" in cl or "quick" in cl:
        algo = "quick"

    steps = []
    if algo == "bubble":
        steps = bubble_sort_steps(list(arr))
    elif algo == "insertion":
        steps = insertion_sort_steps(list(arr))
    elif algo == "selection":
        steps = selection_sort_steps(list(arr))
    elif algo == "merge":
        steps = merge_sort_steps(list(arr))
    elif algo == "quick":
        steps = quick_sort_steps(list(arr))

    return {
        "algorithm": algo,
        "initial": arr,
        "steps": steps
    }

__all__ = ["translate_sorting_ir"]
