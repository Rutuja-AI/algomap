// src/api/analyzeCode.js
// Auto-detects algorithm family from arbitrary code and returns
// a visualization spec the UI can render. Rock-solid fallbacks.

const API_KEY = import.meta.env.VITE_OPENAI_API_KEY ?? "";

// Dev convenience: set VITE_MOCK_STEPS=true to use local mock steps.
// (Keeps product clean — no hardcoded demos in UI.)
const USE_MOCK = String(import.meta.env.VITE_MOCK_STEPS || "").toLowerCase() === "true";

const SYSTEM = `
You convert arbitrary source code into step-by-step visualization events.

Return ONLY valid JSON:

{
  "steps": [{
    "vis": {
      "type": "bars" | "graph" | "tree" | "automaton" | "text",
      "data": {}
    },
    "codeLines": number[],
    "note": string,
    "meta"?: object
  }]
}

/* Emit the best-fitting vis.type based on the code:
- Sorting/array passes -> "bars"
  data: { "array": number[], "highlights": number[], "pointers"?: { "i"?: number, "j"?: number }, "sorted"?: number[], "state"?: "compare"|"swap"|"idle" }
- Graph traversals (BFS/DFS, Dijkstra, MST) -> "graph"
  data: { "nodes":[{"id":string,"label"?:string}], "edges":[{"from":string,"to":string}], "highlights"?:{ "nodes":string[], "edges":[[string,string]] } }
- Trees (BST ops/traversals) -> "tree"
  data: { "nodes":[{"id":string,"label"?:string,"parent":null|string}], "highlights"?:{ "node":string|null } }
- DFAs/PDAs/TMs -> "automaton"
  data: { "states":[{"id":string,"label"?:string,"accepting":boolean}], "transitions":[{"from":string,"to":string,"symbol":string}], "current":string, "tape"?:string, "head"?:number }
- Unknown/other -> "text"
  data: { "message": string }

Rules:
- JSON only (no markdown). No prose outside JSON.
- Produce small, meaningful steps (≤200).
- If the code lacks runtime data, choose a tiny illustrative input (e.g., [5,2,9,1] for sorts).
- Always include a correct "vis" object with "type".
`;

function buildPrompt(code) {
  return `
Analyze the user code and infer the algorithm family (sort/graph/tree/automaton/other).
Choose one visualization type per the schema and produce step events.

User code (first line = 1):
---
${code}
---

Requirements:
- If array/sorting logic present: choose a small demo array and emit bars steps with compares/swaps and pointers (i/j).
- If graph logic (adjacency, queue/stack, distances) present: emit graph steps highlighting visited/frontier edges/nodes.
- If tree logic (left/right, parent, insert/delete, traversal): emit tree nodes with parent links.
- If finite automaton logic (states, transitions): emit automaton steps moving current state along transitions; include a short tape if helpful.
- If unsure: return one "text" step explaining what the code does.

Return STRICT JSON only.`;
}

// Local mock — used only when VITE_MOCK_STEPS=true (never user-facing in prod)
function mockSteps() {
  return [
    {
      vis: { type: "bars", data: { array: [1, 3, 2, 5, 8], highlights: [1, 2], pointers: { i: 1, j: 2 }, state: "compare", sorted: [] } },
      codeLines: [1],
      note: "Compare a[1] & a[2]",
      meta: { pass: 1, step: 1, C: 1, S: 0 }
    },
    {
      vis: { type: "bars", data: { array: [1, 2, 3, 5, 8], highlights: [1, 2], pointers: { i: 1, j: 2 }, state: "swap", sorted: [] } },
      codeLines: [1],
      note: "Swap 3 and 2",
      meta: { pass: 1, step: 2, C: 1, S: 1 }
    },
    {
      vis: { type: "bars", data: { array: [1, 2, 3, 5, 8], highlights: [], pointers: {}, state: "idle", sorted: [4] } },
      codeLines: [1],
      note: "Pass complete",
      meta: { pass: 1, step: 3, C: 1, S: 1 }
    }
  ];
}

export async function analyzeCodeToSteps(code) {
  // If no key and not explicitly mocking, still attempt a graceful text step
  if (!API_KEY && !USE_MOCK) {
    return [
      {
        vis: { type: "text", data: { message: "Missing API key. Add VITE_OPENAI_API_KEY to your .env." } },
        codeLines: [],
        note: "Cannot call model without API key."
      }
    ];
  }
  if (USE_MOCK) return mockSteps();

  let res;
  try {
    res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.2,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SYSTEM },
          { role: "user", content: buildPrompt(code) }
        ]
      })
    });
  } catch (networkErr) {
    console.error("Network error:", networkErr);
    return [
      { vis: { type: "text", data: { message: "Network error. Check your connection." } }, codeLines: [], note: "Network error." }
    ];
  }

  if (!res.ok) {
    let body = "";
    try { body = await res.text(); } catch {}
    console.error("OpenAI error:", res.status, body);
    return [
      { vis: { type: "text", data: { message: `OpenAI error ${res.status}.` } }, codeLines: [], note: "API error." }
    ];
  }

  let data;
  try {
    data = await res.json();
  } catch (e) {
    console.error("Bad JSON envelope:", e);
    return [
      { vis: { type: "text", data: { message: "Bad JSON from API." } }, codeLines: [], note: "Parse error." }
    ];
  }

  const content = data?.choices?.[0]?.message?.content || "{}";
  try {
    const parsed = JSON.parse(content);
    if (Array.isArray(parsed?.steps)) return parsed.steps;
  } catch (strictErr) {
    try {
      const start = content.indexOf("{");
      const end = content.lastIndexOf("}");
      const salvaged = JSON.parse(content.slice(start, end + 1));
      if (Array.isArray(salvaged?.steps)) return salvaged.steps;
    } catch (salvageErr) {
      console.error("Could not parse steps JSON:", content);
    }
  }

  return [
    { vis: { type: "text", data: { message: "Could not parse steps JSON." } }, codeLines: [], note: "Parse error." }
  ];
}
