import React from "react";

// Simple stub for Priority Queue animation
export default function PriorityStage({ steps, upto }) {
  return (
    <div className="w-full h-full flex items-center justify-center text-gray-500">
      <div>
        <div className="text-lg font-semibold mb-2">Priority Queue Animation</div>
        <div>Steps: {steps ? steps.length : 0}</div>
        <div>Current step: {upto}</div>
        <div className="mt-2">(Stub: Implement visualization here)</div>
      </div>
    </div>
  );
}
