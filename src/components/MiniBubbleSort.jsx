import React, { useEffect, useMemo, useRef, useState } from "react";

/** Build the sequence of compare/swap states for a tiny bubble sort demo */
function buildBubbleSteps(values) {
  const a = values.slice();
  const steps = [];
  const n = a.length;

  steps.push({ arr: a.slice(), j: -1, swapped: false, done: false });

  for (let i = 0; i < n - 1; i++) {
    for (let j = 0; j < n - i - 1; j++) {
      // compare
      steps.push({ arr: a.slice(), j, swapped: false, done: false });
      if (a[j] > a[j + 1]) {
        const t = a[j];
        a[j] = a[j + 1];
        a[j + 1] = t;
        // after swap
        steps.push({ arr: a.slice(), j, swapped: true, done: false });
      }
    }
  }
  steps.push({ arr: a.slice(), j: -1, swapped: false, done: true });
  return steps;
}

export default function MiniBubbleSort({
  width = 520,
  height = 160,
  speedMs = 600,
  values = [5, 2, 7, 3, 9, 1, 6],
}) {
  const steps = useMemo(() => buildBubbleSteps(values), [values]);
  const [k, setK] = useState(0);
  const timerRef = useRef(null);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setK((p) => (p + 1) % steps.length);
    }, speedMs);
    return () => clearInterval(timerRef.current);
  }, [steps.length, speedMs]);

  const { arr, j, swapped, done } = steps[k];
  const max = Math.max(...arr);

  const pad = 14;
  const innerW = width - pad * 2;
  const innerH = height - pad * 2;
  const gap = 8;
  const bw = (innerW - gap * (arr.length - 1)) / arr.length;

  return (
    <div className="rounded-2xl bg-white/70 backdrop-blur shadow-lg p-4">
      <svg width={width} height={height} role="img" aria-label="Bubble sort mini demo">
        <g transform={`translate(${pad},${pad})`}>
          {arr.map((v, idx) => {
            const barH = (v / max) * (innerH - 20);
            const x = idx * (bw + gap);
            const y = innerH - barH;

            const active = idx === j || idx === j + 1;
            const fill = done
              ? "rgba(16,185,129,0.9)" // green when finished
              : active
              ? swapped
                ? "rgba(239,68,68,0.9)" // red during swap
                : "rgba(59,130,246,0.9)" // blue during compare
              : "rgba(31,41,55,0.9)";   // slate for idle

            return (
              <g key={idx} transform={`translate(${x},0)`}>
                <rect
                  x={0}
                  y={y}
                  width={bw}
                  height={barH}
                  rx={8}
                  style={{ transition: "all 420ms ease" }}
                  fill={fill}
                />
                <text
                  x={bw / 2}
                  y={innerH + 14}
                  textAnchor="middle"
                  fontSize="12"
                  fill="#111827"
                >
                  {v}
                </text>
              </g>
            );
          })}
        </g>
      </svg>

      <div className="flex items-center justify-between mt-2 text-xs">
        <span className="font-semibold">
          {done ? "Sorted!" : swapped ? "Swapped" : "Comparing…"}
        </span>
        <span className="text-gray-600">Bubble Sort • mini demo</span>
      </div>
    </div>
  );
}
