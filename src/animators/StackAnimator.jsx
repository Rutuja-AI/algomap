import React, { useMemo } from "react";

function Node({ value, glow, peek, isTop, stepDuration, nodeW, nodeH }) {
  let base = `flex items-center justify-center rounded-lg shadow-md border font-semibold transition-all flex-shrink-0`;
  let classes = "";

  if (peek) {
    // 🔍 Peek highlight
    classes += ` ring-2 ring-blue-500 scale-105 bg-blue-100 duration-[${stepDuration}]`;
  } else if (glow) {
    // ✅ Push highlight
    classes += ` ring-2 ring-green-500 scale-105 bg-green-200 duration-[${stepDuration}]`;
  } else {
    classes += " bg-gray-200 ";
  }

  return (
    <div className="relative flex flex-col items-center">
      <div
        className={base + classes}
        style={{
          width: nodeW,
          height: nodeH,
          fontSize: Math.min(nodeH * 0.4, 18),
        }}
      >
        {String(value)}
      </div>
      {isTop && (
        <span className="absolute -top-5 text-xs font-bold text-blue-600 animate-pulse">
          ⬆ TOP
        </span>
      )}
    </div>
  );
}

export default function StackAnimator({
  steps = [],
  currStep = 0,
  stepDuration = 2000,
  containerWidth = 600,
  containerHeight = 400,
}) {
  const { stack, narration } = useMemo(() => {
    let narr = "";
    let peekIndex = null;
    let lastPushIndex = -1;
    let currentStack = [];

    for (let i = 0; i <= currStep && i < steps.length; i++) {


      const s = steps[i];
      narr = s.description || s.action || "";

      // Always trust backend snapshot
      let snap = s.vars?.stack;

      // 🧠 If Gemini IR doesn’t provide full snapshot, build stack manually
      if (!snap || snap.length === 0) {
        // clone current state
        snap = [...currentStack.map(n => n.value)];

        const val =
          s.value ||
          s.vars?.value ||
          s.vars?.popped_value ||
          s.vars?.stack_id ||
          s.vars?.var_name ||
          null;

        if (s.action === "push" && val !== null) snap.push(val);
        if (s.action === "pop" && snap.length > 0) snap.pop();
      }

      // update current stack
      currentStack = snap.map((val) => ({
        value: val,
        glow: false,
        peek: false,
      }));

      if (s.action === "push") lastPushIndex = snap.length - 1;
      if (s.action === "peek") peekIndex = snap.length - 1;
    }

    currentStack = currentStack.map((n, i) => ({
      ...n,
      peek: peekIndex === i,
      glow: i === lastPushIndex,
    }));

    return { stack: currentStack, narration: narr };
  }, [steps, currStep]);


  // 🔹 dynamic node size based on container
  const nodeW = Math.min(100, containerWidth / 6);
  const nodeH = Math.min(70, containerHeight / 10);

  return (
    <div className="w-full h-full flex flex-col items-center justify-center">
      <div
        className="flex flex-col-reverse items-center gap-2 py-4 relative border-2 border-gray-400 rounded-lg p-2"
        style={{
          minHeight: containerHeight * 0.7,
          minWidth: containerWidth * 0.5,
          maxHeight: containerHeight * 0.9,
        }}
      >
        {stack.length === 0 ? (
          <div className="text-gray-400 text-sm">∅ empty stack</div>
        ) : (
          stack.map((node, i) => (
            <Node
              key={i}
              value={node.value}
              glow={node.glow}
              peek={node.peek}
              isTop={i === stack.length - 1}
              stepDuration={stepDuration}
              nodeW={nodeW}
              nodeH={nodeH}
            />
          ))
        )}
      </div>

      <div className="text-base opacity-80 text-center italic mt-2">
        🗣️ {narration || "stack"}
      </div>
    </div>
  );
}
