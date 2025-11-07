// src/components/VariableBoard.jsx
import React from "react";

export default function VariableBoard({ concept = "unknown", vars = {} }) {
  // 🧠 Predefined templates for each concept
  const conceptProfiles = {
    linear_search: ["target", "found", "index", "checked", "remaining"],
    binary_search: ["target", "low", "high", "mid", "found"],
    sort: ["array", "passes", "swaps", "i", "j"],
    stack: ["stack", "top", "last_action"],
    queue: ["queue", "front", "rear", "enqueued", "dequeued"],
    circular_queue: ["queue", "front", "rear", "size", "capacity"],
    tree: ["root", "current", "insert_key", "rotations"],
    graph: ["node", "visited", "frontier", "edges_checked"],
    bfs: ["queue", "visited", "current_node", "level"],
    dfs: ["stack", "visited", "current_node", "recursion_depth"],
    heap: ["heap", "inserted", "swaps", "size"],
    unknown: ["target", "array", "found", "index"], // default search pattern
  };

  // Pick which keys to show
  const displayKeys = conceptProfiles[concept] || conceptProfiles.unknown;

  return (
    <div className="p-2 bg-gray-50 rounded-lg border shadow-sm w-full max-w-sm">
      <h3 className="text-sm font-bold text-gray-700 mb-2">
        {concept.replace("_", " ").toUpperCase()} VARIABLES
      </h3>
      <div className="space-y-1">
        {displayKeys.map((key) => (
          <div
            key={key}
            className="flex justify-between text-xs font-medium text-gray-700"
          >
            <span>{key}</span>
            <span className="text-gray-900">
              {vars[key] !== undefined ? String(vars[key]) : "--"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
