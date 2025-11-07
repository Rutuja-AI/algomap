import { useEffect, useState } from "react";

export default function CircularQueueAnimator({ steps }) {
  const [currStep, setCurrStep] = useState(0);
  const [state, setState] = useState({ buf: [], size: 0, front: -1, rear: -1 });

  // Reset on new steps
  useEffect(() => {
    if (!steps || steps.length === 0) return;
    setCurrStep(0);
  }, [steps]);

  // Recompute state on step change
  useEffect(() => {
    if (!steps || steps.length === 0) return;

    let sz = steps[0]?.size || 5;
    let buf = new Array(sz).fill(null);

    for (let i = 0; i <= currStep && i < steps.length; i++) {
      const st = steps[i];
      if (!st) continue;

      // dynamic resize if step carries new size
      if (typeof st.size === "number" && st.size !== sz) {
        sz = st.size;
        buf = new Array(sz).fill(null);
      }

      if (st.action === "enqueue") {
        buf[st.rear] = st.value; // backend tells us where rear is
      } else if (st.action === "dequeue") {
        buf[st.front] = null; // backend tells us which front is dequeued
      }
    }

    // sync pointers directly from current step (backend truth)
    const f = steps[currStep]?.front ?? -1;
    const r = steps[currStep]?.rear ?? -1;

    setState({ buf, size: sz, front: f, rear: r });
  }, [currStep, steps]);

  if (!steps || steps.length === 0) return <div>No steps to animate</div>;

  return (
    <div className="flex flex-col items-center gap-4">
      <h3 className="font-semibold">{steps[currStep].description}</h3>
      <div className="flex gap-2">
        {state.buf.map((v, i) => (
          <div
            key={i}
            className={`w-12 h-12 border flex items-center justify-center rounded-lg shadow 
              ${i === state.front ? "bg-blue-200" : i === state.rear ? "bg-green-200" : "bg-white"}`}
          >
            {v ?? ""}
          </div>
        ))}
      </div>
      <div className="flex gap-2 mt-2">
        <button
          disabled={currStep === 0}
          onClick={() => setCurrStep((c) => c - 1)}
          className="px-2 py-1 border rounded bg-gray-200"
        >
          Prev
        </button>
        <button
          disabled={currStep === steps.length - 1}
          onClick={() => setCurrStep((c) => c + 1)}
          className="px-2 py-1 border rounded bg-gray-200"
        >
          Next
        </button>
      </div>
    </div>
  );
}
