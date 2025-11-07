import { useMemo } from "react";

/**
 * useTraversalTracker
 * Parses steps to build narration + traversal path.
 * Works for all tree variants.
 */
export default function useTraversalTracker(steps = []) {
  return useMemo(() => {
    let narr = "";
    let path = [];

    for (const st of steps) {
      const act = st?.action;
      narr = st?.description || act || "";

      // collect traversal path
      if (
        act?.startsWith("traverse-") ||
        act === "visit" ||
        act === "search"
      ) {
        if (st.value !== undefined) path.push(String(st.value));
      }
    }

    return { narration: narr, traversalPath: path };
  }, [steps]);
}
