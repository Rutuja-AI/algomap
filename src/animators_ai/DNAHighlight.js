// /animators_ai/DNAHighlight.js
export function pulseGlow(id, color = "blue", duration = 900) {
  const el = document.getElementById(id);
  if (!el) return;
  const cls = `ring-2 ring-${color}-500 scale-[1.05]`;
  el.classList.add(cls);
  setTimeout(() => el.classList.remove(cls), duration);
}
