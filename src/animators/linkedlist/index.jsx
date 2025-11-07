import React from "react";
import Singly from "./Singly";
import Doubly from "./Doubly";
import CircularSingly from "./CircularSingly";
import CircularDoubly from "./CircularDoubly";

export default function LinkedListRouter({ steps, meta }) {
  const kind = meta?.kind || "singly";
  if (kind === "doubly") return <Doubly steps={steps} meta={meta} />;
  if (kind === "circular_singly") return <CircularSingly steps={steps} meta={meta} />;
  if (kind === "circular_doubly") return <CircularDoubly steps={steps} meta={meta} />;
  return <Singly steps={steps} meta={meta} />;
}
