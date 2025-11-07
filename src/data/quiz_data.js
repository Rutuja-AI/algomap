// src/data/funBank.js

/**
 * 🔄 Utility: Shuffle an array randomly
 * @param {Array} array
 * @returns {Array} Shuffled array
 */
function shuffleArray(array) {
  return array.sort(() => Math.random() - 0.5);
}

// ----------------------------------------------------------------------
// 🧠 1. Sassy + Smart FunBank (50 handpicked questions)
// ----------------------------------------------------------------------

const funBank = [
  { question: "💡 Which structure politely waits its turn (FIFO)?", options: ["Stack", "Queue", "Tree", "Graph"], answer: "Queue" },
  { question: "🧠 Which sort is slow but loyal — the turtle of DSA?", options: ["Bubble Sort", "Quick Sort", "Merge Sort", "Heap Sort"], answer: "Bubble Sort" },
  { question: "💔 Which algorithm believes breakups solve everything?", options: ["Quick Sort", "Merge Sort", "Insertion Sort", "Selection Sort"], answer: "Quick Sort" },
  { question: "🤯 Which traversal keeps calling itself like an over-thinker?", options: ["DFS", "BFS", "Inorder", "Level Order"], answer: "DFS" },
  { question: "🤔 Who’s recursion’s ride-or-die data structure?", options: ["Stack", "Queue", "Tree", "Graph"], answer: "Stack" },
  { question: "🤣 Which topic causes 90 % of interview trauma?", options: ["Stack", "Queue", "Linked List", "All of the above"], answer: "All of the above" },
  { question: "🎢 Which structure lives by the motto ‘last in first out’?", options: ["Queue", "Stack", "Tree", "Graph"], answer: "Stack" },
  { question: "🎯 Which algorithm always takes the shortest route home?", options: ["Dijkstra", "Kruskal", "Prim", "Bellman-Ford"], answer: "Dijkstra" },
  { question: "🕹️ Who catches loops in a Linked List like a detective?", options: ["Two Pointers", "Recursion", "DFS", "Stack"], answer: "Two Pointers" },
  { question: "🧩 What defines a Red-Black Tree’s personality?", options: ["Self-balancing", "Lazy", "Sorted", "Colorful"], answer: "Self-balancing" },
  { question: "🔑 Average lookup time for a Hash Map (when life is good)?", options: ["O(1)", "O(n)", "O(log n)", "O(n²)"], answer: "O(1)" },
  { question: "🌲 Where does the king of a Max-Heap sit?", options: ["Root node", "Leaf node", "Left child", "Right child"], answer: "Root node" },
  { question: "📐 A perfectly balanced tree has what depth vibe?", options: ["O(log N)", "O(N)", "O(N²)", "O(1)"], answer: "O(log N)" },
  { question: "🔢 How many pointers does a Doubly Linked List flaunt?", options: ["2", "1", "3", "0"], answer: "2" },
  { question: "🧱 Which structure thrives on key-value drama?", options: ["Hash Map", "Queue", "Stack", "Tree"], answer: "Hash Map" },
  { question: "🕸️ A graph is basically a collection of…?", options: ["Vertices and Edges", "Leaves and Roots", "Classes and Objects", "Nodes and Pointers"], answer: "Vertices and Edges" },
  { question: "🧠 LRU Cache ships with what iconic duo?", options: ["Hash Map + Linked List", "Queue + Stack", "Array + Tree", "Set + Graph"], answer: "Hash Map + Linked List" },
  { question: "🛑 A collision in Hash Tables means…?", options: ["Two keys → same index", "Memory leak", "Infinite loop", "Seg fault"], answer: "Two keys → same index" },
  { question: "🧮 Counting Sort is the overachiever when…?", options: ["Range is small", "Data is random", "Memory is infinite", "Array is sorted"], answer: "Range is small" },
  { question: "⏱️ Amortized time to append at Array’s end?", options: ["O(1)", "O(n)", "O(log n)", "O(n²)"], answer: "O(1)" },
  { question: "📊 BFS walks through life how?", options: ["Level by level", "Depth first", "Randomly", "Recursively"], answer: "Level by level" },
  { question: "⚔️ Merge Sort’s weakness is…?", options: ["Extra space", "Slow pivot", "Unstable", "Laziness"], answer: "Extra space" },
  { question: "💰 Greedy algorithms believe in…?", options: ["Instant gratification", "Divide and Conquer", "Dynamic plans", "Backtracking"], answer: "Instant gratification" },
  { question: "🧭 Floyd-Warshall is the map for…?", options: ["All-pairs shortest path", "Single source shortest", "Cycle detection", "MST"], answer: "All-pairs shortest path" },
  { question: "🎨 A Trie shows off mostly when…?", options: ["Searching prefixes", "Sorting arrays", "Balancing trees", "Hashing strings"], answer: "Searching prefixes" },
  { question: "🌳 A Binary Tree node can have how many children before chaos?", options: ["2", "1", "3", "Unlimited"], answer: "2" },
  { question: "🔁 The base case in recursion exists to stop…?", options: ["Infinite loop", "Stack overflow (just the bad kind)", "Recursion inception", "Memory explosion"], answer: "Infinite loop" },
  { question: "🕵️ A* search algorithm aims for…?", options: ["Optimal path", "Longest path", "Any path", "Random path"], answer: "Optimal path" },
  { question: "🏗️ Topological Sorting is basically…?", options: ["Scheduling tasks like a pro", "Sorting numbers", "Graph coloring", "Cycle breaker"], answer: "Scheduling tasks like a pro" },
  { question: "💾 An in-place algorithm’s space vibe?", options: ["O(1)", "O(n)", "O(n log n)", "O(n²)"], answer: "O(1)" },
  { question: "📈 Time complexity of Binary Search?", options: ["O(log n)", "O(n)", "O(n²)", "O(1)"], answer: "O(log n)" },
  { question: "⚙️ What do we call the art of rehashing?", options: ["Hash glow-up session", "Collision therapy", "Load balancing", "Index rejuvenation"], answer: "Collision therapy" },
  { question: "🧮 Dynamic Programming solves problems by…?", options: ["Remembering everything like an elephant", "Guessing", "Dividing randomly", "Looping blindly"], answer: "Remembering everything like an elephant" },
  { question: "🚧 Backtracking’s real-life equivalent?", options: ["Ctrl+Z on life choices", "Multithreading", "Hashing", "Sorting"], answer: "Ctrl+Z on life choices" },
  { question: "📏 O(n!) complexity means your algorithm is…?", options: ["Dramatic AF (NP-hard)", "Efficient", "Chill", "Linear"], answer: "Dramatic AF (NP-hard)" },
  { question: "🎯 Which algorithm always picks a pivot like it’s dating?", options: ["Quick Sort", "Merge Sort", "Heap Sort", "Radix Sort"], answer: "Quick Sort" },
  { question: "🧠 The Knapsack problem prefers…?", options: ["Dynamic Programming", "Guesswork", "Greedy blindly", "Sorting"], answer: "Dynamic Programming" },
  { question: "👑 Merge Sort never goes below what bound?", options: ["O(n log n)", "O(n)", "O(n²)", "O(1)"], answer: "O(n log n)" },
  { question: "🕸️ Adjacency Matrix fails at…?", options: ["Sparse graphs", "Dense graphs", "Trees", "Stacks"], answer: "Sparse graphs" },
  { question: "🧩 Segment Tree is the introvert of DSA because…?", options: ["It answers range queries quietly", "It stores neighbors", "It hates updates", "It loves recursion"], answer: "It answers range queries quietly" },
  { question: "🛠️ Refactoring code means…?", options: ["Tidying your room without changing furniture", "Adding features", "Translating languages", "Running tests"], answer: "Tidying your room without changing furniture" },
  { question: "🐛 The programmer named their boat…?", options: ["The Syntax Error", "Null Pointer", "Infinite Loop", "Titanic"], answer: "The Syntax Error" },
  { question: "☕ Best fuel for debugging marathons?", options: ["Caffeine ☕", "Hope", "Water", "Sleep (if you’re boring)"], answer: "Caffeine ☕" },
  { question: "📝 DRY stands for…?", options: ["Don’t Repeat Yourself (seriously)", "Debug Right Yesterday", "Do Run Yourself", "Data Reuse Yield"], answer: "Don’t Repeat Yourself (seriously)" },
  { question: "🧱 Library in programming is basically…?", options: ["Pre-written superpowers", "Hardware", "Compiler", "Folder of dreams"], answer: "Pre-written superpowers" },
  { question: "📜 JSON is the language of…?", options: ["Data peace talks 🕊️", "Sorting", "Encryption", "Chaos"], answer: "Data peace talks 🕊️" },
  { question: "🦆 Rubber Duck Debugging means…?", options: ["Explaining code to a toy therapist 🦆", "AI debugger", "IDE feature", "Waterproof coding"], answer: "Explaining code to a toy therapist 🦆" },
  { question: "🎨 SASS or LESS are tools for…?", options: ["Making CSS fabulous ✨", "Database design", "Backend", "Security"], answer: "Making CSS fabulous ✨" },
  { question: "🧠 Boolean variables are basically…?", options: ["Tiny truth machines (✅/❌)", "Strings", "Numbers", "Lists"], answer: "Tiny truth machines (✅/❌)" },
  { question: "⚙️ Version Control systems exist to…?", options: ["Undo chaos with commit magic", "Compile", "Deploy", "Cache"], answer: "Undo chaos with commit magic" }
];

// ----------------------------------------------------------------------
// 🎲 2. Export Function: Shuffled funBank
// ----------------------------------------------------------------------

export default function getShuffledBank() {
  return shuffleArray(funBank);
}
