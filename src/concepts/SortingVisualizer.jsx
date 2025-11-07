import { useState, useEffect, useRef } from "react";

/* ---------------- Shared Bar Component (Block Style) ---------------- */
function Bars({ arr, highlight = [] }) {
  return (
    <div className="flex gap-2 items-center justify-center">
      {arr.map((val, i) => (
        <div
          key={i}
          className={`w-12 h-12 border-2 border-gray-400 flex items-center justify-center font-bold text-lg transition-all duration-300 ${
            highlight.includes(i) 
              ? "bg-blue-400 text-white border-blue-600" 
              : "bg-white text-gray-800"
          }`}
        >
          {val}
        </div>
      ))}
    </div>
  );
}

/* ---------------- Generic Sorting Demo Wrapper ---------------- */
function SortingDemo({ name, generateSteps, defaultArray, speed = 1 }) {
  const [input, setInput] = useState(defaultArray.join(","));
  const [arr, setArr] = useState(defaultArray);
  const [steps, setSteps] = useState([]);
  const [stepIndex, setStepIndex] = useState(0);
  const [highlight, setHighlight] = useState([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const timerRef = useRef(null);

  const handleApply = () => {
    const numbers = input
      .split(",")
      .map((x) => parseInt(x.trim()))
      .filter((x) => !isNaN(x) && x > 0);
    if (!numbers.length) return;
    setArr(numbers);
    const newSteps = generateSteps(numbers);
    setSteps(newSteps);
    setStepIndex(0);
    setHighlight([]);
    setIsPlaying(false);
  };

  const handlePlay = () => setIsPlaying(true);
  const handlePause = () => setIsPlaying(false);
  
  const handleReset = () => {
    setStepIndex(0);
    if (steps.length > 0) {
      setArr(steps[0]?.arr || defaultArray);
      setHighlight(steps[0]?.highlight || []);
    }
    setIsPlaying(false);
  };

  const handleReplay = () => {
    setStepIndex(0);
    if (steps.length > 0) {
      setArr(steps[0]?.arr || defaultArray);
      setHighlight(steps[0]?.highlight || []);
    }
    setIsPlaying(true);
  };

  // Auto advance when playing
  useEffect(() => {
    if (isPlaying && steps.length > 0) {
      timerRef.current = setInterval(() => {
        setStepIndex((prev) => {
          if (prev < steps.length - 1) return prev + 1;
          setIsPlaying(false);
          return prev;
        });
      }, 1000 / speed);
    }
    return () => clearInterval(timerRef.current);
  }, [isPlaying, steps, speed]);

  // Update bars when step changes
  useEffect(() => {
    if (steps.length > 0 && steps[stepIndex]) {
      setArr(steps[stepIndex].arr);
      setHighlight(steps[stepIndex].highlight || []);
    }
  }, [stepIndex, steps]);

  // Initialize steps on mount
  useEffect(() => {
    const newSteps = generateSteps(defaultArray);
    setSteps(newSteps);
    setStepIndex(0);
  }, []);

  return (
    <div className="flex flex-col items-center w-full">
      {/* Input */}
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="border border-gray-300 rounded px-3 py-1 w-48 text-sm"
          placeholder="e.g. 5,3,8,1,6"
        />
        <button
          onClick={handleApply}
          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm transition-colors"
        >
          Apply
        </button>
      </div>

      {/* Blocks */}
      <div className="mb-4">
        <Bars arr={arr} highlight={highlight} />
      </div>

      {/* Controls */}
      <div className="flex gap-2 mb-3">
        <button
          onClick={handlePlay}
          disabled={isPlaying || steps.length === 0}
          className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-400 text-white px-3 py-1 rounded text-sm transition-colors"
        >
          Play
        </button>
        <button
          onClick={handlePause}
          disabled={!isPlaying}
          className="bg-yellow-500 hover:bg-yellow-600 disabled:bg-gray-400 text-white px-3 py-1 rounded text-sm transition-colors"
        >
          Pause
        </button>
        <button
          onClick={handleReset}
          className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded text-sm transition-colors"
        >
          Reset
        </button>
        <button
          onClick={handleReplay}
          className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded text-sm transition-colors"
        >
          Replay
        </button>
      </div>

      {/* Narration */}
      <div className="text-center">
        <p className="text-gray-700 text-sm mb-1">
          {steps[stepIndex]?.narration || "Enter array and press Apply"}
        </p>
        <p className="text-xs text-gray-500">
          Step {stepIndex + 1} / {Math.max(steps.length, 1)}
        </p>
      </div>
    </div>
  );
}

/* ---------------- Algorithm Components ---------------- */

// Bubble Sort
function BubbleSortDemo({ speed = 1 }) {
  const generateSteps = (numbers) => {
    const arr = [...numbers];
    const steps = [{ arr: [...arr], highlight: [], narration: "Starting Bubble Sort" }];
    
    for (let i = 0; i < arr.length; i++) {
      for (let j = 0; j < arr.length - i - 1; j++) {
        steps.push({ 
          arr: [...arr], 
          highlight: [j, j + 1], 
          narration: `Compare ${arr[j]} and ${arr[j+1]}` 
        });
        
        if (arr[j] > arr[j + 1]) {
          [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
          steps.push({ 
            arr: [...arr], 
            highlight: [j, j + 1], 
            narration: `Swapped ${arr[j]} and ${arr[j+1]}` 
          });
        }
      }
    }
    steps.push({ arr: [...arr], highlight: [], narration: "Bubble Sort Complete!" });
    return steps;
  };
  
  return <SortingDemo name="Bubble Sort" generateSteps={generateSteps} defaultArray={[5,3,8,1,6]} speed={speed} />;
}

// Selection Sort
function SelectionSortDemo({ speed = 1 }) {
  const generateSteps = (numbers) => {
    const arr = [...numbers];
    const steps = [{ arr: [...arr], highlight: [], narration: "Starting Selection Sort" }];
    
    for (let i = 0; i < arr.length; i++) {
      let minIdx = i;
      steps.push({ 
        arr: [...arr], 
        highlight: [i], 
        narration: `Finding minimum from position ${i}` 
      });
      
      for (let j = i + 1; j < arr.length; j++) {
        steps.push({ 
          arr: [...arr], 
          highlight: [minIdx, j], 
          narration: `Compare ${arr[j]} with current min ${arr[minIdx]}` 
        });
        if (arr[j] < arr[minIdx]) {
          minIdx = j;
        }
      }
      
      if (minIdx !== i) {
        [arr[i], arr[minIdx]] = [arr[minIdx], arr[i]];
        steps.push({ 
          arr: [...arr], 
          highlight: [i], 
          narration: `Placed ${arr[i]} at position ${i}` 
        });
      }
    }
    steps.push({ arr: [...arr], highlight: [], narration: "Selection Sort Complete!" });
    return steps;
  };
  
  return <SortingDemo name="Selection Sort" generateSteps={generateSteps} defaultArray={[7,2,9,1,5]} speed={speed} />;
}

// Insertion Sort
function InsertionSortDemo({ speed = 1 }) {
  const generateSteps = (numbers) => {
    const arr = [...numbers];
    const steps = [{ arr: [...arr], highlight: [], narration: "Starting Insertion Sort" }];
    
    for (let i = 1; i < arr.length; i++) {
      let key = arr[i];
      let j = i - 1;
      
      steps.push({ 
        arr: [...arr], 
        highlight: [i], 
        narration: `Inserting ${key} into sorted portion` 
      });
      
      while (j >= 0 && arr[j] > key) {
        arr[j + 1] = arr[j];
        steps.push({ 
          arr: [...arr], 
          highlight: [j, j+1], 
          narration: `Shifting ${arr[j+1]} right` 
        });
        j--;
      }
      arr[j + 1] = key;
      steps.push({ 
        arr: [...arr], 
        highlight: [j+1], 
        narration: `Inserted ${key} at correct position` 
      });
    }
    steps.push({ arr: [...arr], highlight: [], narration: "Insertion Sort Complete!" });
    return steps;
  };
  
  return <SortingDemo name="Insertion Sort" generateSteps={generateSteps} defaultArray={[4,3,2,10,5]} speed={speed} />;
}

// Merge Sort
function MergeSortDemo({ speed = 1 }) {
  const generateSteps = (numbers) => {
    const arr = [...numbers];
    const steps = [{ arr: [...arr], highlight: [], narration: "Starting Merge Sort" }];
    
    function mergeSort(l, r) {
      if (l >= r) return;
      const mid = Math.floor((l + r) / 2);
      
      steps.push({ 
        arr: [...arr], 
        highlight: Array.from({length: r - l + 1}, (_, i) => l + i), 
        narration: `Dividing array from ${l} to ${r}` 
      });
      
      mergeSort(l, mid);
      mergeSort(mid + 1, r);
      merge(l, mid, r);
    }
    
    function merge(l, m, r) {
      const left = arr.slice(l, m + 1);
      const right = arr.slice(m + 1, r + 1);
      let i = 0, j = 0, k = l;
      
      steps.push({ 
        arr: [...arr], 
        highlight: Array.from({length: r - l + 1}, (_, i) => l + i), 
        narration: `Merging subarrays` 
      });
      
      while (i < left.length && j < right.length) {
        if (left[i] <= right[j]) {
          arr[k] = left[i];
          i++;
        } else {
          arr[k] = right[j];
          j++;
        }
        k++;
      }
      
      while (i < left.length) {
        arr[k] = left[i];
        i++;
        k++;
      }
      
      while (j < right.length) {
        arr[k] = right[j];
        j++;
        k++;
      }
      
      steps.push({ 
        arr: [...arr], 
        highlight: Array.from({length: r - l + 1}, (_, i) => l + i), 
        narration: `Merged section from ${l} to ${r}` 
      });
    }
    
    mergeSort(0, arr.length - 1);
    steps.push({ arr: [...arr], highlight: [], narration: "Merge Sort Complete!" });
    return steps;
  };
  
  return <SortingDemo name="Merge Sort" generateSteps={generateSteps} defaultArray={[8,4,7,1,3,6]} speed={speed} />;
}

// Quick Sort
function QuickSortDemo({ speed = 1 }) {
  const generateSteps = (numbers) => {
    const arr = [...numbers];
    const steps = [{ arr: [...arr], highlight: [], narration: "Starting Quick Sort" }];
    
    function quickSort(l, r) {
      if (l >= r) return;
      const p = partition(l, r);
      quickSort(l, p - 1);
      quickSort(p + 1, r);
    }
    
    function partition(l, r) {
      const pivot = arr[r];
      steps.push({ 
        arr: [...arr], 
        highlight: [r], 
        narration: `Choosing pivot: ${pivot}` 
      });
      
      let i = l;
      for (let j = l; j < r; j++) {
        steps.push({ 
          arr: [...arr], 
          highlight: [j, r], 
          narration: `Compare ${arr[j]} with pivot ${pivot}` 
        });
        
        if (arr[j] < pivot) {
          [arr[i], arr[j]] = [arr[j], arr[i]];
          steps.push({ 
            arr: [...arr], 
            highlight: [i, j], 
            narration: `Moved ${arr[i]} to left partition` 
          });
          i++;
        }
      }
      
      [arr[i], arr[r]] = [arr[r], arr[i]];
      steps.push({ 
        arr: [...arr], 
        highlight: [i], 
        narration: `Pivot ${pivot} in final position` 
      });
      return i;
    }
    
    quickSort(0, arr.length - 1);
    steps.push({ arr: [...arr], highlight: [], narration: "Quick Sort Complete!" });
    return steps;
  };
  
  return <SortingDemo name="Quick Sort" generateSteps={generateSteps} defaultArray={[9,4,7,3,8,2]} speed={speed} />;
}

/* ---------------- Main Sorting Visualizer Component ---------------- */
export default function SortingVisualizer() {
  const [selected, setSelected] = useState("Bubble Sort");
  const [speed, setSpeed] = useState(1);

  const DEMOS = {
    "Bubble Sort": <BubbleSortDemo speed={speed} />,
    "Selection Sort": <SelectionSortDemo speed={speed} />,
    "Insertion Sort": <InsertionSortDemo speed={speed} />,
    "Merge Sort": <MergeSortDemo speed={speed} />,
    "Quick Sort": <QuickSortDemo speed={speed} />,
  };

  const EXPLANATIONS = {
    "Bubble Sort": "Repeatedly swaps adjacent elements if they are in wrong order. Simple but inefficient with O(n²) time complexity. Best for learning sorting concepts.",
    "Selection Sort": "Finds the minimum element and swaps it with the current position. Also O(n²) but makes fewer swaps than bubble sort.",
    "Insertion Sort": "Builds sorted array one element at a time by inserting each element in its correct position. Efficient for small arrays and nearly sorted data.",
    "Merge Sort": "Divide and conquer: recursively splits array, sorts halves, then merges them. Guaranteed O(n log n) time complexity and stable sorting.",
    "Quick Sort": "Picks a pivot, partitions array around it, then recursively sorts partitions. Average O(n log n), worst case O(n²). Very fast in practice.",
  };

  return (
    <div className="flex h-screen pt-16">
      {/* Sidebar Controls */}
      <div className="w-64 bg-white border-r p-6 flex flex-col">
        <h2 className="text-xl font-bold mb-4">Sorting Algorithms</h2>

        {/* Algorithm Dropdown */}
        <label className="block text-sm font-medium mb-1">Algorithm:</label>
        <select
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
          className="w-full border rounded-md p-2 mb-4"
        >
          {Object.keys(DEMOS).map((algo) => (
            <option key={algo} value={algo}>
              {algo}
            </option>
          ))}
        </select>

        {/* Visualize Button */}
        <button 
          onClick={() => window.location.reload()}
          className="bg-blue-600 text-white py-2 rounded mb-4 hover:bg-blue-700 transition"
        >
          Visualize
        </button>

        {/* Speed Slider */}
        <label className="block text-sm font-medium mb-2">Speed:</label>
        <input
          type="range"
          min="0.5"
          max="2"
          step="0.1"
          value={speed}
          onChange={(e) => setSpeed(parseFloat(e.target.value))}
          className="w-full"
        />
        <span className="text-xs mt-1">x{speed.toFixed(1)}</span>

        {/* Legend */}
        <div className="mt-6">
          <h3 className="text-sm font-medium mb-2">Legend:</h3>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-white border-2 border-gray-400"></div>
              <span className="text-xs">Normal</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-400 border-2 border-blue-600"></div>
              <span className="text-xs">Comparing</span>
            </div>
          </div>
        </div>
      </div>

      {/* Visualization Center */}
      <div className="flex-1 flex flex-col items-center justify-center bg-white">
        <h2 className="text-2xl font-bold mb-4">{selected} Animation</h2>
        <div className="bg-gray-50 rounded-xl shadow-md p-6 min-h-[300px] flex items-center justify-center w-[500px]">
          {DEMOS[selected]}
        </div>
      </div>

      {/* Explanation Right Panel */}
      <div className="w-80 bg-gray-50 border-l p-6">
        <h2 className="text-lg font-bold mb-3">How it Works</h2>
        <p className="text-sm text-gray-700 leading-relaxed mb-4">
          {EXPLANATIONS[selected]}
        </p>

        <div className="mb-4">
          <h3 className="text-sm font-medium mb-2">Time Complexity:</h3>
          <div className="text-xs text-gray-600">
            {selected === "Bubble Sort" && "Best: O(n), Average: O(n²), Worst: O(n²)"}
            {selected === "Selection Sort" && "Best: O(n²), Average: O(n²), Worst: O(n²)"}
            {selected === "Insertion Sort" && "Best: O(n), Average: O(n²), Worst: O(n²)"}
            {selected === "Merge Sort" && "Best: O(n log n), Average: O(n log n), Worst: O(n log n)"}
            {selected === "Quick Sort" && "Best: O(n log n), Average: O(n log n), Worst: O(n²)"}
          </div>
        </div>

        <div className="mb-4">
          <h3 className="text-sm font-medium mb-2">Space Complexity:</h3>
          <div className="text-xs text-gray-600">
            {(selected === "Bubble Sort" || selected === "Selection Sort" || selected === "Insertion Sort") && "O(1) - In-place sorting"}
            {selected === "Merge Sort" && "O(n) - Requires extra space"}
            {selected === "Quick Sort" && "O(log n) - Recursive stack space"}
          </div>
        </div>

        <button 
          onClick={() => window.location.reload()}
          className="mt-6 bg-gray-200 rounded px-4 py-2 hover:bg-gray-300 transition w-full"
        >
          Replay Animation
        </button>
      </div>
    </div>
  );
}