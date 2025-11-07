import { motion } from "framer-motion";

export default function GraphEdge({
  x1,
  y1,
  x2,
  y2,
  directed = false,
  highlight = false,
}) {
  // ✅ offset arrows so they stop at circle border
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.sqrt(dx * dx + dy * dy);
  const offset = 20; // node radius

  const adjX1 = x1 + (dx / len) * offset;
  const adjY1 = y1 + (dy / len) * offset;
  const adjX2 = x2 - (dx / len) * offset;
  const adjY2 = y2 - (dy / len) * offset;

  // ✅ compute arrowhead manually if directed
  let arrow = null;
  if (directed) {
    const angle = Math.atan2(dy, dx);
    const headlen = 10;

    const arrowX1 = adjX2 - headlen * Math.cos(angle - Math.PI / 6);
    const arrowY1 = adjY2 - headlen * Math.sin(angle - Math.PI / 6);

    const arrowX2 = adjX2 - headlen * Math.cos(angle + Math.PI / 6);
    const arrowY2 = adjY2 - headlen * Math.sin(angle + Math.PI / 6);

    arrow = (
      <polygon
        points={`${adjX2},${adjY2} ${arrowX1},${arrowY1} ${arrowX2},${arrowY2}`}
        fill={highlight ? "red" : "black"}
      />
    );
  }

  return (
    <>
      <motion.line
        x1={adjX1}
        y1={adjY1}
        x2={adjX2}
        y2={adjY2}
        stroke={highlight ? "red" : "black"}
        strokeWidth="2.5"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.8 }}
      />
      {arrow}
    </>
  );
}
