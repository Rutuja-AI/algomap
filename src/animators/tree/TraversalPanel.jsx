import React from "react";

/**
 * TraversalPanel
 * Shows narration + traversal path at the bottom of tree animators
 */
export default function TraversalPanel({ narration = "", path = [] }) {
  return (
    <div className="mt-2 text-center">
      <div className="text-base opacity-80 italic">
        🗣️ {narration || "tree"}
      </div>
      {path.length > 0 && (
        <div className="mt-1 text-sm text-gray-700">
          <span className="font-semibold">Traversal Path:</span>{" "}
          {path.join(" → ")}
        </div>
      )}
    </div>
  );
}
