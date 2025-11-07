import { useMemo } from "react";

/**
 * Supports actions:
 *  - enqueue_front / enqueue_back
 *  - dequeue_front / dequeue_back
 *  - error (renders a red badge line)
 * Uses a simple row of boxes. Front is on the LEFT, Back on the RIGHT.
 */
export default function DequeAnimator({ steps = [], initial = [], variant = "deque" }) {
  const { arr, narration } = useMemo(() => {
    let a = [];
    let narr = "";
    for (let i = 0; i < steps.length; i++) {
      const st = steps[i] || {};
      const act = st.action;
      narr = st.description || act || "";
      if (act === "enqueue_front") {
        const v = Object.prototype.hasOwnProperty.call(st, "value") ? st.value : `v${i + 1}`;
        a = [String(v), ...a];
      } else if (act === "enqueue_back") {
        const v = Object.prototype.hasOwnProperty.call(st, "value") ? st.value : `v${i + 1}`;
        a = [...a, String(v)];
      } else if (act === "dequeue_front") {
        if (a.length) a = a.slice(1);
      } else if (act === "dequeue_back") {
        if (a.length) a = a.slice(0, -1);
      } else if (act === "clear") {
        a = [];
      } else if (act === "error") {
        // no structural change; narration shows the error
      }
    }
    return { arr: a, narration: narr };
  }, [steps]);

  const frontIdx = arr.length ? 0 : null;
  const backIdx = arr.length ? arr.length - 1 : null;

  return (
    <div className="w-full flex flex-col gap-4">
      <div className="flex items-center gap-6 justify-center">
        <div className="text-sm font-semibold">variant ⟶ {variant}</div>
        <div className="text-sm font-semibold">front ⟶ {frontIdx === null ? "∅" : 0}</div>
        <div className="text-sm font-semibold">back ⟶ {backIdx === null ? "∅" : backIdx}</div>
      </div>

      <div className="w-full overflow-x-auto">
        <div className="flex items-center gap-8 py-6 justify-center">
          {arr.length === 0 ? (
            <div className="text-gray-400 text-sm">∅ empty deque</div>
          ) : (
            arr.map((v, i) => (
              <div
                key={`dq-${i}-${String(v)}`}
                className={`px-4 py-3 rounded-2xl shadow-md border text-lg font-semibold select-none transition-all ${
                  i === 0 ? "ring-2 ring-blue-500" : i === arr.length - 1 ? "ring-2 ring-emerald-500" : ""
                }`}
                style={{ minWidth: 56, textAlign: "center" }}
                title={i === 0 ? "front" : i === arr.length - 1 ? "back" : ""}
              >
                {String(v)}
              </div>
            ))
          )}
        </div>
      </div>

      <div className="text-base opacity-80 text-center">
        🗣️ {narration || "Ready"}{" "}
        {steps.at(-1)?.action === "error" && (
          <span className="ml-2 inline-block px-2 py-0.5 text-xs rounded bg-red-100 text-red-700">
            rule blocked
          </span>
        )}
      </div>
    </div>
  );
}
