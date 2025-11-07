// src/animators/ai/visual_component_map.js
// 🔮 AI Visual Component Bridge
// Connects Gemini-generated visuals to DNA core components

// --- new DNA imports ---
import DNABox from "../../animators_ai/DNABox";
import DNANodeCircle from "../../animators_ai/DNANodeCircle";
import DNAArrowStraight from "../../animators_ai/DNAArrowStraight";
import DNAArrowCurved from "../../animators_ai/DNAArrowCurved";
import DNAEdgeLine from "../../animators_ai/DNAEdgeLine";

// 🧩 Maps Gemini object types to DNA-based components
export const AI_COMPONENTS = {
  // basic boxes and cells
  box: DNABox,
  cell: DNABox,
  rect: DNABox,

  // circular nodes (trees, graphs, heaps)
  node: DNANodeCircle,
  node_box: DNANodeCircle,
  circle: DNANodeCircle,

  // arrow and edge visuals
  arrow: DNAArrowStraight,
  edge_arrow: DNAArrowStraight,
  curvedArrow: DNAArrowCurved,
  edge: DNAEdgeLine,

  // (optional) old ones still valid if Gemini outputs them
  label: DNABox,
  text: DNABox,
};

// 🪶 fallback when unknown type appears
export const DEFAULT_COMPONENT = DNABox;
