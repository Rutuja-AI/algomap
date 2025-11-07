// src/animators/primitives/useMotionDNA.js
export const motionDNA = {
  initialize: { opacity: [0, 1], scale: [0.9, 1], transition: { duration: 0.4 } },
  enqueue: { y: [-20, 0], opacity: [0, 1], transition: { duration: 0.3 } },
  dequeue: { y: [0, 20], opacity: [1, 0], transition: { duration: 0.3 } },
  assign: { scale: [1, 1.05, 1], transition: { duration: 0.3 } },
  compare: { scale: [1, 1.1, 1], transition: { duration: 0.25 } },
  swap: { rotate: [0, 10, -10, 0], transition: { duration: 0.4 } },
  draw_heap: { scale: [0.8, 1], opacity: [0, 1], transition: { duration: 0.4 } },
  highlight_action: { scale: [1, 1.1, 1], transition: { duration: 0.3 } },
  finish: { opacity: [0.8, 1], transition: { duration: 0.3 } },
};
