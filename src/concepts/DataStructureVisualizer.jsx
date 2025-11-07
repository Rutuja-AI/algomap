import { useState, useEffect } from "react";
import { motion } from "framer-motion";

// Demo Components
function StackDemo({ initial = [1, 2] }) {
  const [stack, setStack] = useState(initial);
  const [step, setStep] = useState(0);
  const [pushValue, setPushValue] = useState("");

  useEffect(() => {
    const actions = [
      () => setStack((s) => [...s, 3]),
      () => setStack((s) => [...s, 4]),
      () => setStack((s) => s.slice(0, -1)),
    ];
    if (step < actions.length) {
      const t = setTimeout(() => {
        actions[step]();
        setStep(step + 1);
      }, 1000);
      return () => clearTimeout(t);
    }
  }, [step]);

  const push = () => {
    if (pushValue.trim() !== "") {
      setStack([...stack, pushValue]);
      setPushValue("");
    }
  };
  const pop = () => setStack(stack.slice(0, -1));
  const clear = () => setStack([]);

  return (
    <DemoContainer>
      <div className="flex flex-col-reverse items-center gap-1 mb-4">
        {stack.map((val, i) => (
          <motion.div key={i} layout className="box bg-emerald-500">{val}</motion.div>
        ))}
      </div>
      <Controls>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={pushValue}
            onChange={(e) => setPushValue(e.target.value)}
            placeholder="Value"
            className="border rounded px-2 py-1 text-sm w-20"
          />
          <button onClick={push} className="btn btn-primary">Push</button>
        </div>
        <button onClick={pop} className="btn btn-secondary">Pop</button>
        <button onClick={clear} className="btn btn-secondary">Clear</button>
      </Controls>
    </DemoContainer>
  );
}

function QueueLinearDemo({ initial = [1, 2] }) {
  const [queue, setQueue] = useState(initial);
  const [step, setStep] = useState(0);
  const [enqueueValue, setEnqueueValue] = useState("");

  useEffect(() => {
    const actions = [
      () => setQueue((q) => [...q, 3]),
      () => setQueue((q) => [...q, 4]),
      () => setQueue((q) => q.slice(1)),
    ];
    if (step < actions.length) {
      const t = setTimeout(() => {
        actions[step]();
        setStep(step + 1);
      }, 1000);
      return () => clearTimeout(t);
    }
  }, [step]);

  const enqueue = () => {
    if (enqueueValue.trim() !== "") {
      setQueue([...queue, enqueueValue]);
      setEnqueueValue("");
    }
  };
  const dequeue = () => setQueue(queue.slice(1));
  const clear = () => setQueue([]);

  return (
    <DemoContainer>
      <div className="flex items-center gap-2 mb-4">
        <span className="text-sm text-gray-600">Front →</span>
        {queue.map((val, i) => (
          <motion.div key={i} layout className="box bg-blue-500">{val}</motion.div>
        ))}
        <span className="text-sm text-gray-600">← Rear</span>
      </div>
      <Controls>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={enqueueValue}
            onChange={(e) => setEnqueueValue(e.target.value)}
            placeholder="Value"
            className="border rounded px-2 py-1 text-sm w-20"
          />
          <button onClick={enqueue} className="btn btn-primary">Enqueue</button>
        </div>
        <button onClick={dequeue} className="btn btn-secondary">Dequeue</button>
        <button onClick={clear} className="btn btn-secondary">Clear</button>
      </Controls>
    </DemoContainer>
  );
}

function QueueCircularDemo({ initial = [1, 2, null, null] }) {
  const [queue, setQueue] = useState(initial);
  const [front, setFront] = useState(0);
  const [rear, setRear] = useState(1);
  const [step, setStep] = useState(0);
  const [enqueueValue, setEnqueueValue] = useState("");

  useEffect(() => {
    const actions = [() => enqueue(), () => dequeue()];
    if (step < actions.length) {
      const t = setTimeout(() => {
        actions[step]();
        setStep(step + 1);
      }, 1200);
      return () => clearTimeout(t);
    }
  }, [step, front, rear]);

  const enqueue = () => {
    if (enqueueValue.trim() !== "") {
      const newQueue = [...queue];
      const nextRear = (rear + 1) % queue.length;
      if (newQueue[nextRear] === null) {
        newQueue[nextRear] = enqueueValue;
        setQueue(newQueue);
        setRear(nextRear);
        setEnqueueValue("");
      }
    }
  };

  const dequeue = () => {
    if (queue[front] !== null) {
      const newQueue = [...queue];
      newQueue[front] = null;
      setQueue(newQueue);
      setFront((front + 1) % queue.length);
    }
  };

  const clear = () => setQueue([null, null, null, null]);

  return (
    <DemoContainer>
      <div className="grid grid-cols-4 gap-2 mb-4">
        {queue.map((val, i) => (
          <motion.div
            key={i}
            layout
            className={`box ${
              val !== null ? "bg-purple-500" : "bg-gray-300"
            } ${i === front ? "ring-2 ring-red-400" : ""} ${
              i === rear ? "ring-2 ring-green-400" : ""
            }`}
          >
            {val ?? ""}
          </motion.div>
        ))}
      </div>
      <div className="flex gap-4 text-xs mb-2">
        <span className="text-red-600">Red: Front ({front})</span>
        <span className="text-green-600">Green: Rear ({rear})</span>
      </div>
      <Controls>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={enqueueValue}
            onChange={(e) => setEnqueueValue(e.target.value)}
            placeholder="Value"
            className="border rounded px-2 py-1 text-sm w-20"
          />
          <button onClick={enqueue} className="btn btn-primary">Enqueue</button>
        </div>
        <button onClick={dequeue} className="btn btn-secondary">Dequeue</button>
        <button onClick={clear} className="btn btn-secondary">Clear</button>
      </Controls>
    </DemoContainer>
  );
}

function DequeDemo({ initial = [1, 2] }) {
  const [deque, setDeque] = useState(initial);
  const [pushFrontValue, setPushFrontValue] = useState("");
  const [pushBackValue, setPushBackValue] = useState("");

  const pushFront = () => {
    if (pushFrontValue.trim() !== "") {
      setDeque([pushFrontValue, ...deque]);
      setPushFrontValue("");
    }
  };
  const pushBack = () => {
    if (pushBackValue.trim() !== "") {
      setDeque([...deque, pushBackValue]);
      setPushBackValue("");
    }
  };
  const popFront = () => setDeque(deque.slice(1));
  const popBack = () => setDeque(deque.slice(0, -1));
  const clear = () => setDeque([]);

  return (
    <DemoContainer>
      <div className="flex items-center gap-2 mb-4">
        {deque.map((val, i) => (
          <motion.div key={i} layout className="box bg-teal-500">{val}</motion.div>
        ))}
      </div>
      <Controls>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={pushFrontValue}
            onChange={(e) => setPushFrontValue(e.target.value)}
            placeholder="Front Value"
            className="border rounded px-2 py-1 text-sm w-20"
          />
          <button onClick={pushFront} className="btn btn-primary">Push Front</button>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={pushBackValue}
            onChange={(e) => setPushBackValue(e.target.value)}
            placeholder="Back Value"
            className="border rounded px-2 py-1 text-sm w-20"
          />
          <button onClick={pushBack} className="btn btn-primary">Push Back</button>
        </div>
        <button onClick={popFront} className="btn btn-secondary">Pop Front</button>
        <button onClick={popBack} className="btn btn-secondary">Pop Back</button>
        <button onClick={clear} className="btn btn-secondary">Clear</button>
      </Controls>
    </DemoContainer>
  );
}

function PriorityQueueDemo({ initial = [4, 2] }) {
  const [queue, setQueue] = useState(initial.sort((a, b) => a - b));
  const [insertValue, setInsertValue] = useState("");

  const insert = () => {
    if (insertValue.trim() !== "" && !isNaN(insertValue)) {
      const val = parseInt(insertValue);
      setQueue((q) => [...q, val].sort((a, b) => a - b));
      setInsertValue("");
    }
  };
  const extractMin = () => setQueue((q) => q.slice(1));
  const clear = () => setQueue([]);

  return (
    <DemoContainer>
      <div className="flex items-center gap-2 mb-4">
        <span className="text-sm text-gray-600">Min →</span>
        {queue.map((val, i) => (
          <motion.div key={i} layout className="box bg-pink-500">{val}</motion.div>
        ))}
      </div>
      <Controls>
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={insertValue}
            onChange={(e) => setInsertValue(e.target.value)}
            placeholder="Priority Value"
            className="border rounded px-2 py-1 text-sm w-24"
          />
          <button onClick={insert} className="btn btn-primary">Insert</button>
        </div>
        <button onClick={extractMin} className="btn btn-secondary">Extract Min</button>
        <button onClick={clear} className="btn btn-secondary">Clear</button>
      </Controls>
    </DemoContainer>
  );
}

function LinkedListSinglyDemo({ initial = [5, 10, 15] }) {
  const [list, setList] = useState(initial);
  const [insertValue, setInsertValue] = useState("");
  const [insertIndex, setInsertIndex] = useState("");

  const insertHead = () => {
    if (insertValue.trim() !== "") {
      setList([insertValue, ...list]);
      setInsertValue("");
    }
  };
  const insertTail = () => {
    if (insertValue.trim() !== "") {
      setList([...list, insertValue]);
      setInsertValue("");
    }
  };
  const insertAtIndex = () => {
    const index = parseInt(insertIndex);
    if (insertValue.trim() !== "" && !isNaN(index) && index >= 0 && index <= list.length) {
      setList([...list.slice(0, index), insertValue, ...list.slice(index)]);
      setInsertValue("");
      setInsertIndex("");
    }
  };
  const deleteHead = () => setList(list.slice(1));
  const clear = () => setList([]);

  return (
    <DemoContainer>
      <div className="flex items-center gap-2 mb-4">
        {list.map((val, i) => (
          <div key={i} className="flex items-center">
            <motion.div layout className="box bg-indigo-500">{val}</motion.div>
            {i < list.length - 1 && <span className="mx-2">→</span>}
          </div>
        ))}
        <span className="mx-2">∅</span>
      </div>
      <Controls>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={insertValue}
            onChange={(e) => setInsertValue(e.target.value)}
            placeholder="Value"
            className="border rounded px-2 py-1 text-sm w-20"
          />
          <button onClick={insertHead} className="btn btn-primary">Insert Head</button>
          <button onClick={insertTail} className="btn btn-primary">Insert Tail</button>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={insertIndex}
            onChange={(e) => setInsertIndex(e.target.value)}
            placeholder="Index"
            className="border rounded px-2 py-1 text-sm w-16"
          />
          <button onClick={insertAtIndex} className="btn btn-primary">Insert at Index</button>
        </div>
        <button onClick={deleteHead} className="btn btn-secondary">Delete Head</button>
        <button onClick={clear} className="btn btn-secondary">Clear</button>
      </Controls>
    </DemoContainer>
  );
}

function LinkedListDoublyDemo({ initial = [1, 2, 3] }) {
  const [list, setList] = useState(initial);
  const [insertValue, setInsertValue] = useState("");
  const [insertIndex, setInsertIndex] = useState("");

  const insertHead = () => {
    if (insertValue.trim() !== "") {
      setList([insertValue, ...list]);
      setInsertValue("");
    }
  };
  const insertTail = () => {
    if (insertValue.trim() !== "") {
      setList([...list, insertValue]);
      setInsertValue("");
    }
  };
  const insertAtIndex = () => {
    const index = parseInt(insertIndex);
    if (insertValue.trim() !== "" && !isNaN(index) && index >= 0 && index <= list.length) {
      setList([...list.slice(0, index), insertValue, ...list.slice(index)]);
      setInsertValue("");
      setInsertIndex("");
    }
  };
  const deleteHead = () => setList(list.slice(1));
  const deleteTail = () => setList(list.slice(0, -1));
  const clear = () => setList([]);

  return (
    <DemoContainer>
      <div className="flex items-center gap-2 mb-4">
        <span className="mx-2">∅</span>
        {list.map((val, i) => (
          <div key={i} className="flex items-center">
            <motion.div layout className="box bg-yellow-600">{val}</motion.div>
            {i < list.length - 1 && <span className="mx-2">↔</span>}
          </div>
        ))}
        <span className="mx-2">∅</span>
      </div>
      <Controls>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={insertValue}
            onChange={(e) => setInsertValue(e.target.value)}
            placeholder="Value"
            className="border rounded px-2 py-1 text-sm w-20"
          />
          <button onClick={insertHead} className="btn btn-primary">Insert Head</button>
          <button onClick={insertTail} className="btn btn-primary">Insert Tail</button>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={insertIndex}
            onChange={(e) => setInsertIndex(e.target.value)}
            placeholder="Index"
            className="border rounded px-2 py-1 text-sm w-16"
          />
          <button onClick={insertAtIndex} className="btn btn-primary">Insert at Index</button>
        </div>
        <button onClick={deleteHead} className="btn btn-secondary">Delete Head</button>
        <button onClick={deleteTail} className="btn btn-secondary">Delete Tail</button>
        <button onClick={clear} className="btn btn-secondary">Clear</button>
      </Controls>
    </DemoContainer>
  );
}

function LinkedListCircularDemo({ initial = [7, 14, 21] }) {
  const [list, setList] = useState(initial);
  const [insertValue, setInsertValue] = useState("");
  const [insertIndex, setInsertIndex] = useState("");

  const insertHead = () => {
    if (insertValue.trim() !== "") {
      setList([insertValue, ...list]);
      setInsertValue("");
    }
  };
  const insertTail = () => {
    if (insertValue.trim() !== "") {
      setList([...list, insertValue]);
      setInsertValue("");
    }
  };
  const insertAtIndex = () => {
    const index = parseInt(insertIndex);
    if (insertValue.trim() !== "" && !isNaN(index) && index >= 0 && index <= list.length) {
      setList([...list.slice(0, index), insertValue, ...list.slice(index)]);
      setInsertValue("");
      setInsertIndex("");
    }
  };
  const deleteHead = () => setList(list.slice(1));
  const deleteTail = () => setList(list.slice(0, -1));
  const clear = () => setList([]);

  return (
    <DemoContainer>
      <div className="flex items-center justify-center mb-4">
        <div className="relative">
          <div className="flex items-center gap-2">
            {list.map((val, i) => (
              <motion.div key={i} layout className="box bg-yellow-500">{val}</motion.div>
            ))}
          </div>
          <div className="absolute -top-6 left-1/2 transform -translate-x-1/2">
            <span className="text-2xl">↻</span>
          </div>
        </div>
      </div>
      <p className="text-sm text-gray-600 mb-4">Circular: Last node points to first</p>
      <Controls>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={insertValue}
            onChange={(e) => setInsertValue(e.target.value)}
            placeholder="Value"
            className="border rounded px-2 py-1 text-sm w-20"
          />
          <button onClick={insertHead} className="btn btn-primary">Insert Head</button>
          <button onClick={insertTail} className="btn btn-primary">Insert Tail</button>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={insertIndex}
            onChange={(e) => setInsertIndex(e.target.value)}
            placeholder="Index"
            className="border rounded px-2 py-1 text-sm w-16"
          />
          <button onClick={insertAtIndex} className="btn btn-primary">Insert at Index</button>
        </div>
        <button onClick={deleteHead} className="btn btn-secondary">Delete Head</button>
        <button onClick={deleteTail} className="btn btn-secondary">Delete Tail</button>
        <button onClick={clear} className="btn btn-secondary">Clear</button>
      </Controls>
    </DemoContainer>
  );
}

function HashTableDemo() {
  const TABLE_SIZE = 7;
  const [buckets, setBuckets] = useState(Array(TABLE_SIZE).fill().map(() => []));
  const [insertKey, setInsertKey] = useState("");
  const [insertValue, setInsertValue] = useState("");
  const [searchKey, setSearchKey] = useState("");
  const [searchResult, setSearchResult] = useState(null);
  const [lastCalculation, setLastCalculation] = useState(null);

  // Hash function: Converts a string key to an index (0-6)
  // Steps: 1. Sum ASCII values of each character
  //        2. Take modulo TABLE_SIZE to get index
  // Example: "abc" -> a(97) + b(98) + c(99) = 294, 294 % 7 = 6
  const hashFunction = (key) => {
    let hash = 0;
    let steps = [];
    for (let i = 0; i < key.length; i++) {
      const charCode = key.charCodeAt(i);
      hash += charCode;
      steps.push(`${key[i]}(${charCode})`);
    }
    const index = hash % TABLE_SIZE;
    setLastCalculation({
      key,
      steps: steps.join(" + "),
      sum: hash,
      index
    });
    return index;
  };

  const insert = () => {
    if (insertKey.trim() !== "" && insertValue.trim() !== "") {
      const index = hashFunction(insertKey);
      setBuckets((prev) => {
        const newBuckets = [...prev];
        // Remove existing key if present
        newBuckets[index] = newBuckets[index].filter(([k]) => k !== insertKey);
        // Add new key-value pair
        newBuckets[index].push([insertKey, insertValue]);
        return newBuckets;
      });
      setInsertKey("");
      setInsertValue("");
    }
  };

  const remove = () => {
    if (searchKey.trim() !== "") {
      const index = hashFunction(searchKey);
      setBuckets((prev) => {
        const newBuckets = [...prev];
        newBuckets[index] = newBuckets[index].filter(([k]) => k !== searchKey);
        return newBuckets;
      });
      setSearchKey("");
      setSearchResult(null);
    }
  };

  const search = () => {
    if (searchKey.trim() !== "") {
      const index = hashFunction(searchKey);
      const bucket = buckets[index];
      const found = bucket.find(([k]) => k === searchKey);
      setSearchResult(found ? { index, value: found[1] } : { index, found: false });
    }
  };

  const clear = () => {
    setBuckets(Array(TABLE_SIZE).fill().map(() => []));
    setSearchResult(null);
  };

  return (
    <DemoContainer>
      <div className="mb-4">
        <div className="grid grid-cols-7 gap-1 mb-2">
          {buckets.map((bucket, i) => (
            <div key={i} className="text-center">
              <div className="text-xs text-gray-600 mb-1">[{i}]</div>
              <div className="min-h-[60px] border rounded p-1 bg-gray-50">
                {bucket.map(([k, v], j) => (
                  <motion.div
                    key={j}
                    layout
                    className="box bg-orange-500 text-xs mb-1"
                  >
                    {k}:{v}
                  </motion.div>
                ))}
              </div>
            </div>
          ))}
        </div>
        {lastCalculation && (
          <div className="text-xs text-center bg-blue-50 p-2 rounded mb-2">
            <div className="font-medium">Hash Calculation for "{lastCalculation.key}":</div>
            <div>{lastCalculation.steps} = {lastCalculation.sum}, {lastCalculation.sum} % 7 = {lastCalculation.index}</div>
          </div>
        )}
        {searchResult && (
          <div className="text-sm text-center">
            {searchResult.found ?
              `Found "${searchKey}" at index ${searchResult.index}: ${searchResult.value}` :
              `"${searchKey}" not found (would be at index ${searchResult.index})`
            }
          </div>
        )}
      </div>
      <Controls>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={insertKey}
            onChange={(e) => setInsertKey(e.target.value)}
            placeholder="Key"
            className="border rounded px-2 py-1 text-sm w-16"
          />
          <input
            type="text"
            value={insertValue}
            onChange={(e) => setInsertValue(e.target.value)}
            placeholder="Value"
            className="border rounded px-2 py-1 text-sm w-16"
          />
          <button onClick={insert} className="btn btn-primary">Insert</button>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={searchKey}
            onChange={(e) => setSearchKey(e.target.value)}
            placeholder="Search Key"
            className="border rounded px-2 py-1 text-sm w-20"
          />
          <button onClick={search} className="btn btn-secondary">Search</button>
          <button onClick={remove} className="btn btn-secondary">Remove</button>
        </div>
        <button onClick={clear} className="btn btn-secondary">Clear</button>
      </Controls>
    </DemoContainer>
  );
}




// Helper Components
function DemoContainer({ children }) {
  return (
    <div className="flex flex-col items-center justify-center p-6">
      {children}
    </div>
  );
}

function Controls({ children }) {
  return <div className="flex gap-2 mt-4 flex-wrap justify-center">{children}</div>;
}

// Data Structure Descriptions
const DESCRIPTIONS = {
  "Stack": {
    title: "Stack (LIFO)",
    description: "A Last-In-First-Out data structure where elements are added and removed from the top only. Think of it like a stack of plates - you can only add or remove from the top.",
    operations: ["Push: Add element to top", "Pop: Remove element from top", "Peek: View top element", "IsEmpty: Check if stack is empty"],
    complexity: { time: "O(1)", space: "O(n)", note: "All operations are constant time" },
    useCase: "Function calls, undo operations, expression evaluation, backtracking algorithms"
  },
  "Queue (Linear)": {
    title: "Linear Queue (FIFO)",
    description: "A First-In-First-Out data structure where elements are added at the rear and removed from the front. Like a line of people waiting - first person in line is first to be served.",
    operations: ["Enqueue: Add element to rear", "Dequeue: Remove element from front", "Front: View front element", "IsEmpty: Check if queue is empty"],
    complexity: { time: "O(1)", space: "O(n)", note: "All operations are constant time" },
    useCase: "Task scheduling, breadth-first search, handling requests in servers, print queue management"
  },
  "Queue (Circular)": {
    title: "Circular Queue",
    description: "An optimized queue where the last position connects back to the first, allowing efficient space reuse. Eliminates the problem of unused space in linear queues.",
    operations: ["Enqueue: Add at rear position", "Dequeue: Remove from front position", "IsFull: Check if queue is full", "IsEmpty: Check if queue is empty"],
    complexity: { time: "O(1)", space: "O(n)", note: "Fixed size array implementation" },
    useCase: "Buffer implementations, resource scheduling, CPU scheduling, memory management"
  },
  "Deque": {
    title: "Double-Ended Queue",
    description: "A linear data structure that allows insertion and deletion at both ends. Combines the functionality of both stacks and queues, providing maximum flexibility.",
    operations: ["Push Front/Back: Add elements", "Pop Front/Back: Remove elements", "Peek Front/Back: View elements"],
    complexity: { time: "O(1)", space: "O(n)", note: "All operations at ends are constant time" },
    useCase: "Sliding window problems, palindrome checking, implementing undo-redo functionality, A* pathfinding"
  },
  "Priority Queue": {
    title: "Priority Queue",
    description: "Elements are served based on priority rather than insertion order. Higher priority elements are dequeued before lower priority ones, regardless of their arrival time.",
    operations: ["Insert: Add with priority", "Extract: Remove highest priority", "Peek: View highest priority", "ChangePriority: Update element priority"],
    complexity: { time: "O(log n)", space: "O(n)", note: "Using binary heap implementation" },
    useCase: "Task scheduling, Dijkstra's shortest path, A* search algorithm, Huffman coding, event simulation"
  },
  "Linked List (Singly)": {
    title: "Singly Linked List",
    description: "A linear collection where elements (nodes) are linked in one direction. Each node contains data and a reference to the next node, allowing dynamic memory allocation.",
    operations: ["Insert: Add new node", "Delete: Remove node", "Search: Find node", "Traverse: Visit all nodes"],
    complexity: { time: "O(n)", space: "O(n)", note: "Insert/Delete at head: O(1)" },
    useCase: "Dynamic memory allocation, implementation of other data structures, undo functionality, music playlist"
  },
  "Linked List (Doubly)": {
    title: "Doubly Linked List",
    description: "Each node has references to both next and previous nodes, enabling bidirectional traversal. Provides more flexibility than singly linked lists at the cost of extra memory.",
    operations: ["Insert/Delete: At any position", "Traverse: Forward/backward", "Search: Bidirectional search"],
    complexity: { time: "O(n)", space: "O(n)", note: "Insert/Delete: O(1) if position known" },
    useCase: "Browser history navigation, undo/redo functionality, LRU cache implementation, music players"
  },
  "Linked List (Circular)": {
    title: "Circular Linked List",
    description: "The last node points back to the first node, forming a circular structure. Useful when you need to cycle through elements continuously.",
    operations: ["Insert/Delete: Anywhere in circle", "Traverse: Continuous loop", "Split: Break into linear list"],
    complexity: { time: "O(n)", space: "O(n)", note: "Similar to singly linked list" },
    useCase: "Round-robin CPU scheduling, circular buffers, multiplayer games, Josephus problem"
  },
  "Hash Table": {
    title: "Hash Table (Hash Map)",
    description: "Stores key-value pairs using a hash function to compute index locations. Provides very fast average-case access times for insertions, deletions, and lookups.",
    operations: ["Insert: Add key-value pair", "Delete: Remove by key", "Search: Find by key", "Update: Modify value"],
    complexity: { time: "O(1) avg", space: "O(n)", note: "O(n) worst case with many collisions" },
    useCase: "Database indexing, caching systems, symbol tables in compilers, implementing sets and dictionaries"
  }
};

// Main Component
export default function DataStructureVisualizer() {
  const [selectedDemo, setSelectedDemo] = useState("Stack");
  const [speed, setSpeed] = useState(1);

  const demos = {
    "Stack": <StackDemo />,
    "Queue (Linear)": <QueueLinearDemo />,
    "Queue (Circular)": <QueueCircularDemo />,
    "Deque": <DequeDemo />,
    "Priority Queue": <PriorityQueueDemo />,
    "Linked List (Singly)": <LinkedListSinglyDemo />,
    "Linked List (Doubly)": <LinkedListDoublyDemo />,
    "Linked List (Circular)": <LinkedListCircularDemo />,
    "Hash Table": <HashTableDemo />
  };

  const currentDescription = DESCRIPTIONS[selectedDemo];

  const getLegendItems = () => {
    const legends = {
      "Stack": [
        { color: "bg-emerald-500", label: "Stack Elements" },
        { color: "bg-gray-200", label: "Empty Space" }
      ],
      "Queue (Linear)": [
        { color: "bg-blue-500", label: "Queue Elements" },
        { color: "bg-gray-200", label: "Direction: Front → Rear" }
      ],
      "Queue (Circular)": [
        { color: "bg-purple-500", label: "Filled Positions" },
        { color: "bg-gray-300", label: "Empty Positions" },
        { color: "ring-red-400", label: "Front Pointer" },
        { color: "ring-green-400", label: "Rear Pointer" }
      ],
      "Deque": [
        { color: "bg-teal-500", label: "Deque Elements" },
        { color: "bg-gray-200", label: "Both Ends Accessible" }
      ],
      "Priority Queue": [
        { color: "bg-pink-500", label: "Elements (Sorted)" },
        { color: "bg-gray-200", label: "Min → Higher Priority" }
      ],
      "Linked List (Singly)": [
        { color: "bg-indigo-500", label: "Node Data" },
        { label: "→ Next Pointer" },
        { label: "∅ Null Reference" }
      ],
      "Linked List (Doubly)": [
        { color: "bg-yellow-600", label: "Node Data" },
        { label: "↔ Bidirectional Pointers" },
        { label: "∅ Null References" }
      ],
      "Linked List (Circular)": [
        { color: "bg-yellow-500", label: "Node Data" },
        { label: "↻ Circular Connection" }
      ],
      "Hash Table": [
        { color: "bg-orange-500", label: "Key:Value Pairs" },
        { color: "bg-gray-200", label: "Hash Function Mapping" }
      ],
      "Tree": [
        { color: "bg-green-600", label: "Root Node" },
        { color: "bg-green-400", label: "Child Nodes" },
        { label: "Hierarchical Structure" }
      ]
    };
    return legends[selectedDemo] || [];
  };

  return (
    <>
      <style jsx>{`
        .box {
          width: 3rem;
          height: 3rem;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 0.5rem;
          color: white;
          font-weight: bold;
          font-size: 0.875rem;
        }
        .btn {
          padding: 0.5rem 1rem;
          border-radius: 0.375rem;
          font-size: 0.875rem;
          font-weight: 500;
          border: none;
          cursor: pointer;
          transition: all 0.2s;
        }
        .btn-primary {
          background-color: #059669;
          color: white;
        }
        .btn-primary:hover {
          background-color: #047857;
        }
        .btn-secondary {
          background-color: #6b7280;
          color: white;
        }
        .btn-secondary:hover {
          background-color: #4b5563;
        }
      `}</style>
      
      <div className="flex h-screen pt-16">
        {/* Sidebar Controls */}
        <div className="w-64 bg-white border-r p-6 flex flex-col">
          <h2 className="text-xl font-bold mb-4">Data Structure Visualizer</h2>

          {/* Data Structure Dropdown */}
          <label className="block text-sm font-medium mb-1">Data Structure:</label>
          <select
            value={selectedDemo}
            onChange={(e) => setSelectedDemo(e.target.value)}
            className="w-full border rounded-md p-2 mb-4"
          >
            {Object.keys(demos).map((demo) => (
              <option key={demo} value={demo}>
                {demo}
              </option>
            ))}
          </select>

          {/* Reset Button */}
          <button 
            onClick={() => window.location.reload()}
            className="bg-blue-600 text-white py-2 rounded mb-4 hover:bg-blue-700 transition"
          >
            Reset All
          </button>

          {/* Speed Slider */}
          <label className="block text-sm font-medium mb-2">Animation Speed:</label>
          <input
            type="range"
            min="0.5"
            max="2"x
            step="0.1"
            value={speed}
            onChange={(e) => setSpeed(parseFloat(e.target.value))}
            className="w-full"
          />
          <span className="text-xs mt-1">x{speed.toFixed(1)}</span>

          {/* Legend */}
          <div className="mt-6">
            <h3 className="text-sm font-medium mb-2">Legend:</h3>
            <div className="space-y-2 text-xs">
              {getLegendItems().map((item, i) => (
                <div key={i} className="flex items-center gap-2">
                  {item.color && (
                    <div className={`w-4 h-4 ${item.color} ${item.color.includes('ring') ? 'border-2 border-current' : ''} rounded-sm`}></div>
                  )}
                  <span>{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Visualization Center */}
        <div className="flex-1 flex flex-col items-center justify-center bg-white">
          <h2 className="text-2xl font-bold mb-4">{currentDescription.title}</h2>
          <div className="bg-gray-50 rounded-xl shadow-md p-6 min-h-[400px] flex items-center justify-center w-[600px]">
            {demos[selectedDemo]}
          </div>
        </div>

        {/* Explanation Right Panel */}
        <div className="w-80 bg-gray-50 border-l p-6">
          <h2 className="text-lg font-bold mb-3">How it Works</h2>
          <p className="text-sm text-gray-700 leading-relaxed mb-4">
            {currentDescription.description}
          </p>

          <div className="mb-4">
            <h3 className="text-sm font-medium mb-2">Key Operations:</h3>
            <div className="text-xs text-gray-600 space-y-1">
              {currentDescription.operations.map((op, i) => (
                <div key={i} className="flex items-start">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mt-1 mr-2 flex-shrink-0"></span>
                  {op}
                </div>
              ))}
            </div>
          </div>

          <div className="mb-4">
            <h3 className="text-sm font-medium mb-2">Complexity:</h3>
            <div className="text-xs text-gray-600 space-y-1">
              <div>Time: {currentDescription.complexity.time}</div>
              <div>Space: {currentDescription.complexity.space}</div>
              <div className="text-gray-500">{currentDescription.complexity.note}</div>
            </div>
          </div>

          <div className="mb-4">
            <h3 className="text-sm font-medium mb-2">Use Cases:</h3>
            <div className="text-xs text-gray-600 leading-relaxed">
              {currentDescription.useCase}
            </div>
          </div>

          <button 
            onClick={() => window.location.reload()}
            className="mt-6 bg-gray-200 rounded px-4 py-2 hover:bg-gray-300 transition w-full"
          >
            Restart Demo
          </button>
        </div>
      </div>
    </>
  );
}

