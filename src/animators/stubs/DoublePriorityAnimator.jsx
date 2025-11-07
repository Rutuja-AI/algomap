import { useMemo } from "react";

/**
 * Visualizes a min–max queue as a sorted row:
 *  - insert(x)
 *  - delete_min(), delete_max()
 *  - peek_min(), peek_max() (no structural change; we highlight narratively)
 * We keep items sorted ascending so leftmost is min, rightmost is max.
 */
export default function DoublePriorityAnimator({ steps = [], initial = [] }) {
  const { arr, narration, lastPeek } = useMemo(() => {
    let a = [];
    let narr = "";
    let peek = null;
    const sortAsc = (u, v) => {
      const x = Number(u); const y = Number(v);
      if (Number.isFinite(x) && Number.isFinite(y)) return x - y;
      return String(u).localeCompare(String(v));
    };

    for (let i = 0; i < steps.length; i++) {
      const st = steps[i] || {};
      const act = st.action;
      narr = st.description || act || "";
      if (act === "insert") {
        const v = Object.prototype.hasOwnProperty.call(st, "value") ? st.value : `v${i + 1}`;
        a = [...a, String(v)].sort(sortAsc);
      } else if (act === "delete_min") {
        if (a.length) a = a.slice(1);
      } else if (act === "delete_max") {
        if (a.length) a = a.slice(0, -1);
      } else if (act === "peek_min") {
        peek = "min";
      } else if (act === "peek_max") {
        peek = "max";
      }
    }
    return { arr: a, narration: narr, lastPeek: peek };
  }, [steps]);

  return (
    <div className="w-full flex flex-col gap-4">
      <div className="flex items-center gap-6 justify-center">
        <div className="text-sm font-semibold">min ⟶ left • max ⟶ right</div>
      </div>

      <div className="w-full overflow-x-auto">
        <div className="flex items-center gap-8 py-6 justify-center">
          {arr.length === 0 ? (
            <div className="text-gray-400 text-sm">∅ empty</div>
          ) : (
            arr.map((v, i) => (
              <div
                key={`mm-${i}-${String(v)}`}
                className={`px-4 py-3 rounded-2xl shadow-md border text-lg font-semibold select-none ${
                  i === 0 && lastPeek === "min" ? "ring-2 ring-blue-500" :
                  i === arr.length - 1 && lastPeek === "max" ? "ring-2 ring-emerald-500" : ""
                }`}
                style={{ minWidth: 56, textAlign: "center" }}
                title={i === 0 ? "min" : i === arr.length - 1 ? "max" : ""}
              >
                {String(v)}
              </div>
            ))
          )}
        </div>
      </div>

      <div className="text-base opacity-80 text-center">🗣️ {narration || "Ready"}</div>
    </div>
  );
}
