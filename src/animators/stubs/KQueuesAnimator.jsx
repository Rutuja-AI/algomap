import { useMemo } from "react";

/**
 * Visualizes k queues in parallel lanes.
 * Actions:
 *   - enqueue (with st.queue index, st.value)
 *   - dequeue (with st.queue index)
 * Expects meta.k if available; defaults to 3.
 */
export default function KQueuesAnimator({ steps = [], initial = [], meta = {} }) {
  const { lanes, k, narration } = useMemo(() => {
    const kk = meta?.k || 3;
    const qs = Array.from({ length: kk }, () => []);
    let narr = "";

    for (let i = 0; i < steps.length; i++) {
      const st = steps[i] || {};
      const act = st.action;
      narr = st.description || act || "";
      const idx = typeof st.queue === "number" ? st.queue : null;

      if (act === "enqueue" && idx !== null && idx >= 0 && idx < kk) {
        const v = Object.prototype.hasOwnProperty.call(st, "value") ? st.value : `v${i + 1}`;
        qs[idx] = [...qs[idx], String(v)];
      } else if (act === "dequeue" && idx !== null && idx >= 0 && idx < kk) {
        if (qs[idx].length) qs[idx] = qs[idx].slice(1);
      }
    }
    return { lanes: qs, k: kk, narration: narr };
  }, [steps, meta]);

  return (
    <div className="w-full flex flex-col gap-6">
      {lanes.map((arr, qi) => (
        <div key={`lane-${qi}`} className="w-full">
          <div className="text-xs font-semibold mb-2 text-center">Queue {qi}</div>
          <div className="w-full overflow-x-auto">
            <div className="flex items-center gap-6 py-2 justify-center">
              {arr.length === 0 ? (
                <div className="text-gray-400 text-sm">∅ empty</div>
              ) : (
                arr.map((v, i) => (
                  <div
                    key={`kq-${qi}-${i}-${String(v)}`}
                    className={`px-4 py-2 rounded-2xl shadow-md border text-base font-semibold select-none ${
                      i === 0 ? "ring-2 ring-blue-500" : ""
                    }`}
                    style={{ minWidth: 56, textAlign: "center" }}
                    title={i === 0 ? "front" : ""}
                  >
                    {String(v)}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      ))}
      <div className="text-base opacity-80 text-center">🗣️ {narration || "Ready"}</div>
    </div>
  );
}
