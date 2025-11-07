// 🧭 AlgoMap Narration Dictionary
// Converts raw IR actions into clear, educational narration lines.

export const BFS_NARRATION = {
  initialize: (v) => `Start the traversal by adding node ${v} to the queue.`,
  dequeue: (v) => `Remove node ${v} from the front of the queue to process it.`,
  visit: (v) => `Visit node ${v} and mark it as explored.`,
  traverse: (s, t) => `Traverse the edge from ${s} → ${t} to discover neighbor ${t}.`,
  enqueue: (v) => `Add node ${v} to the back of the queue for later processing.`,
  complete: () => `The queue is empty — BFS traversal is complete.`,
};

export const DFS_NARRATION = {
  initialize: (v) => `Start the traversal by pushing node ${v} onto the stack.`,
  pop: (v) => `Pop node ${v} from the top of the stack to process it.`,
  visit: (v) => `Visit node ${v} and mark it as explored.`,
  traverse: (s, t) => `Move along the edge from ${s} → ${t} to explore neighbor ${t}.`,
  push: (v) => `Push node ${v} onto the stack for deeper exploration.`,
  backtrack: (v) => `No unvisited neighbors — backtrack from node ${v}.`,
  complete: () => `The stack is empty — DFS traversal is complete.`,
};
