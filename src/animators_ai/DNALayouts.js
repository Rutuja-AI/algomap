// /animators_ai/DNALayouts.js
/**
 * 📐 DNALayouts — reusable coordinate layout generators
 */

export function linearLayout(n, boxW = 64, gap = 80, padX = 32, H = 200) {
  return Array.from({ length: n }, (_, i) => ({
    x: padX + i * (boxW + gap) + boxW / 2,
    y: H / 2,
  }));
}

export function ringLayout(n, radius = 120, W = 320, H = 320) {
  const positions = [];
  for (let i = 0; i < Math.max(n, 1); i++) {
    const ang = (2 * Math.PI * i) / Math.max(n, 1) - Math.PI / 2;
    positions.push({
      x: W / 2 + Math.cos(ang) * radius,
      y: H / 2 + Math.sin(ang) * radius,
    });
  }
  return positions;
}

export function treeLayout(tree, depth = 0, x = 0, arr = []) {
  if (!tree) return arr;
  treeLayout(tree.left, depth + 1, x, arr);
  arr.push({ value: tree.value, x: arr.length * 90, y: depth * 100 });
  treeLayout(tree.right, depth + 1, x, arr);
  return arr;
}
