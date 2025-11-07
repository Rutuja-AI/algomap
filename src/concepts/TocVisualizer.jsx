import { useState, useEffect, useRef } from "react";

/* ============================
   Shared Components
============================ */
function AnimatedButton({ children, onClick, disabled, variant = "primary" }) {
  const variants = {
    primary: "bg-blue-600 hover:bg-blue-700 text-white",
    success: "bg-green-600 hover:bg-green-700 text-white",
    warning: "bg-yellow-500 hover:bg-yellow-600 text-white",
    danger: "bg-red-600 hover:bg-red-700 text-white",
    secondary: "bg-gray-500 hover:bg-gray-600 text-white"
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-200 transform hover:scale-105 disabled:bg-gray-400 disabled:cursor-not-allowed disabled:transform-none ${
        disabled ? "bg-gray-400 text-gray-600" : variants[variant]
      }`}
    >
      {children}
    </button>
  );
}

function InputTape({ cells, headPosition, title, highlight = [] }) {
  return (
    <div className="flex flex-col items-center mb-6">
      <h3 className="text-sm font-medium mb-2 text-gray-700">{title}</h3>
      <div className="flex gap-1">
        {cells.map((cell, i) => (
          <div
            key={i}
            className={`w-12 h-12 border-2 flex items-center justify-center font-bold text-lg transition-all duration-300 ${
              headPosition === i 
                ? "border-blue-600 bg-blue-100 scale-110 shadow-lg" 
                : highlight.includes(i)
                ? "border-yellow-500 bg-yellow-100"
                : "border-gray-400 bg-white"
            }`}
          >
            {cell === "_" ? "ε" : cell}
          </div>
        ))}
      </div>
      {headPosition !== null && (
        <div className="flex gap-1 mt-1">
          {cells.map((_, i) => (
            <div key={i} className="w-12 text-center text-xs">
              {headPosition === i && "↑"}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StateGraph({ states, currentState, transitions, accepting, highlight = {} }) {
  const statePositions = {
    q0: { x: 100, y: 100 },
    q1: { x: 250, y: 100 },
    q2: { x: 400, y: 100 },
    q3: { x: 250, y: 200 },
    halt: { x: 400, y: 200 }
  };

  return (
    <div className="bg-gray-50 rounded-lg p-4 mb-4">
      <svg width="500" height="250" className="overflow-visible">
        {/* Draw transition arrows */}
        {Object.entries(transitions).map(([from, trans]) =>
          Object.entries(trans).map(([symbol, to]) => {
            const fromPos = statePositions[from];
            const toPos = statePositions[to];
            if (!fromPos || !toPos) return null;
            
            const isHighlighted = highlight.from === from && highlight.symbol === symbol;
            
            return (
              <g key={`${from}-${symbol}-${to}`}>
                <line
                  x1={fromPos.x + 20}
                  y1={fromPos.y + 20}
                  x2={toPos.x + 20}
                  y2={toPos.y + 20}
                  stroke={isHighlighted ? "#3B82F6" : "#6B7280"}
                  strokeWidth={isHighlighted ? "3" : "2"}
                  markerEnd="url(#arrowhead)"
                  className="transition-all duration-300"
                />
                <text
                  x={(fromPos.x + toPos.x) / 2 + 20}
                  y={(fromPos.y + toPos.y) / 2 + 15}
                  textAnchor="middle"
                  className={`text-sm font-bold transition-all duration-300 ${
                    isHighlighted ? "fill-blue-600" : "fill-gray-600"
                  }`}
                >
                  {symbol}
                </text>
              </g>
            );
          })
        )}
        
        {/* Arrow marker */}
        <defs>
          <marker id="arrowhead" markerWidth="10" markerHeight="7" 
                  refX="9" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="#6B7280" />
          </marker>
        </defs>
        
        {/* Draw states */}
        {states.map((state) => {
          const pos = statePositions[state];
          if (!pos) return null;
          
          const isActive = currentState === state;
          const isAccepting = accepting.includes(state);
          
          return (
            <g key={state}>
              <circle
                cx={pos.x + 20}
                cy={pos.y + 20}
                r="20"
                fill={isActive ? "#3B82F6" : "#FFFFFF"}
                stroke={isAccepting ? "#10B981" : "#374151"}
                strokeWidth={isAccepting ? "3" : "2"}
                className="transition-all duration-300"
              />
              {isAccepting && (
                <circle
                  cx={pos.x + 20}
                  cy={pos.y + 20}
                  r="15"
                  fill="none"
                  stroke="#10B981"
                  strokeWidth="2"
                />
              )}
              <text
                x={pos.x + 20}
                y={pos.y + 25}
                textAnchor="middle"
                className={`text-sm font-bold transition-all duration-300 ${
                  isActive ? "fill-white" : "fill-gray-800"
                }`}
              >
                {state}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function Stack({ items, title }) {
  return (
    <div className="flex flex-col items-center">
      <h3 className="text-sm font-medium mb-2 text-gray-700">{title}</h3>
      <div className="bg-gray-100 rounded-lg p-4 min-h-[200px] min-w-[80px] flex flex-col-reverse items-center justify-start">
        {items.length === 0 ? (
          <div className="text-gray-400 text-sm">Empty</div>
        ) : (
          items.map((item, i) => (
            <div
              key={i}
              className={`w-12 h-8 bg-blue-200 border-2 border-blue-400 rounded flex items-center justify-center font-bold text-sm mb-1 transition-all duration-300 ${
                i === items.length - 1 ? "bg-blue-400 text-white scale-105" : ""
              }`}
              style={{
                animationDelay: `${i * 0.1}s`
              }}
            >
              {item}
            </div>
          ))
        )}
      </div>
      <div className="text-xs text-gray-500 mt-1">Top ↑</div>
    </div>
  );
}

/* ============================
   Generic Automata Demo Wrapper
============================ */
function AutomataDemo({ name, generateSteps, defaultInput, speed = 1, renderVisualization }) {
  const [input, setInput] = useState(defaultInput);
  const [steps, setSteps] = useState([]);
  const [stepIndex, setStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const timerRef = useRef(null);

  const handleApply = () => {
    const newSteps = generateSteps(input);
    setSteps(newSteps);
    setStepIndex(0);
    setIsPlaying(false);
  };

  const handlePlay = () => setIsPlaying(true);
  const handlePause = () => setIsPlaying(false);
  
  const handleReset = () => {
    setStepIndex(0);
    setIsPlaying(false);
  };

  const handleReplay = () => {
    setStepIndex(0);
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
      }, 1500 / speed);
    }
    return () => clearInterval(timerRef.current);
  }, [isPlaying, steps, speed]);

  // Initialize steps on mount
  useEffect(() => {
    const newSteps = generateSteps(defaultInput);
    setSteps(newSteps);
    setStepIndex(0);
  }, []);

  const currentStep = steps[stepIndex] || {};

  return (
    <div className="flex flex-col items-center w-full">
      {/* Input */}
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="border border-gray-300 rounded px-3 py-1 w-32 text-sm"
          placeholder="e.g. aabb"
        />
        <AnimatedButton onClick={handleApply}>Apply</AnimatedButton>
      </div>

      {/* Visualization */}
      <div className="mb-4">
        {renderVisualization(currentStep)}
      </div>

      {/* Controls */}
      <div className="flex gap-2 mb-3">
        <AnimatedButton
          onClick={handlePlay}
          disabled={isPlaying || steps.length === 0}
          variant="success"
        >
          Play
        </AnimatedButton>
        <AnimatedButton
          onClick={handlePause}
          disabled={!isPlaying}
          variant="warning"
        >
          Pause
        </AnimatedButton>
        <AnimatedButton onClick={handleReset} variant="secondary">
          Reset
        </AnimatedButton>
        <AnimatedButton onClick={handleReplay} variant="primary">
          Replay
        </AnimatedButton>
      </div>

      {/* Narration */}
      <div className="text-center max-w-md">
        <p className="text-gray-700 text-sm mb-1">
          {currentStep.narration || "Enter input string and press Apply"}
        </p>
        <p className="text-xs text-gray-500">
          Step {stepIndex + 1} / {Math.max(steps.length, 1)}
        </p>
        {currentStep.accepted !== undefined && (
          <p className={`text-sm font-bold mt-2 ${
            currentStep.accepted ? "text-green-600" : "text-red-600"
          }`}>
            String {currentStep.accepted ? "ACCEPTED" : "REJECTED"}
          </p>
        )}
      </div>
    </div>
  );
}

/* ============================
   Finite Automata Demo (DFA)
============================ */
function FiniteAutomataDemo({ speed = 1 }) {
  const generateSteps = (inputString) => {
    const states = ["q0", "q1", "q2"];
    const accepting = ["q2"];
    const transitions = {
      q0: { a: "q1", b: "q0" },
      q1: { a: "q1", b: "q2" },
      q2: { a: "q2", b: "q2" }
    };

    const steps = [{
      states,
      currentState: "q0",
      transitions,
      accepting,
      input: inputString.split(""),
      currentIndex: -1,
      narration: `Starting DFA. Language: strings ending with 'ab'`
    }];

    let currentState = "q0";
    const inputArray = inputString.split("");

    inputArray.forEach((symbol, index) => {
      if (transitions[currentState] && transitions[currentState][symbol]) {
        const nextState = transitions[currentState][symbol];
        steps.push({
          states,
          currentState,
          transitions,
          accepting,
          input: inputArray,
          currentIndex: index,
          highlight: { from: currentState, symbol },
          narration: `Reading '${symbol}' from state ${currentState}, transitioning to ${nextState}`
        });
        
        currentState = nextState;
        
        steps.push({
          states,
          currentState,
          transitions,
          accepting,
          input: inputArray,
          currentIndex: index,
          narration: `Now in state ${currentState}`
        });
      } else {
        steps.push({
          states,
          currentState: "reject",
          transitions,
          accepting,
          input: inputArray,
          currentIndex: index,
          narration: `No transition for '${symbol}' from ${currentState}. String rejected.`,
          accepted: false
        });
        return;
      }
    });

    const finalAccepted = accepting.includes(currentState);
    steps.push({
      states,
      currentState,
      transitions,
      accepting,
      input: inputArray,
      currentIndex: inputArray.length,
      narration: `Input consumed. Final state: ${currentState}. String ${finalAccepted ? "accepted" : "rejected"}.`,
      accepted: finalAccepted
    });

    return steps;
  };

  const renderVisualization = (step) => (
    <div>
      <StateGraph
        states={step.states || ["q0", "q1", "q2"]}
        currentState={step.currentState || "q0"}
        transitions={step.transitions || {}}
        accepting={step.accepting || ["q2"]}
        highlight={step.highlight || {}}
      />
      <InputTape
        cells={step.input || []}
        headPosition={step.currentIndex}
        title="Input String"
      />
    </div>
  );

  return (
    <AutomataDemo
      name="Finite Automata"
      generateSteps={generateSteps}
      defaultInput="aabb"
      speed={speed}
      renderVisualization={renderVisualization}
    />
  );
}

/* ============================
   Pushdown Automata Demo (PDA)
============================ */
function PushdownAutomataDemo({ speed = 1 }) {
  const generateSteps = (inputString) => {
    const steps = [{
      input: inputString.split(""),
      currentIndex: -1,
      stack: [],
      state: "q0",
      narration: `Starting PDA. Language: {aⁿbⁿ | n ≥ 0} (equal a's and b's)`
    }];

    let stack = [];
    let state = "q0";
    const inputArray = inputString.split("");

    inputArray.forEach((symbol, index) => {
      if (state === "q0") {
        if (symbol === "a") {
          stack.push("A");
          steps.push({
            input: inputArray,
            currentIndex: index,
            stack: [...stack],
            state: "q0",
            narration: `Read 'a', push 'A' to stack, stay in q0`
          });
        } else if (symbol === "b" && stack.length > 0) {
          stack.pop();
          state = "q1";
          steps.push({
            input: inputArray,
            currentIndex: index,
            stack: [...stack],
            state: "q1",
            narration: `Read 'b', pop 'A' from stack, move to q1`
          });
        } else if (symbol === "b" && stack.length === 0) {
          state = "reject";
          steps.push({
            input: inputArray,
            currentIndex: index,
            stack: [...stack],
            state: "reject",
            narration: `Read 'b' but stack is empty. String rejected.`,
            accepted: false
          });
          return;
        } else {
          state = "reject";
          steps.push({
            input: inputArray,
            currentIndex: index,
            stack: [...stack],
            state: "reject",
            narration: `Invalid symbol '${symbol}' in current context. String rejected.`,
            accepted: false
          });
          return;
        }
      } else if (state === "q1") {
        if (symbol === "b" && stack.length > 0) {
          stack.pop();
          steps.push({
            input: inputArray,
            currentIndex: index,
            stack: [...stack],
            state: "q1",
            narration: `Read 'b', pop 'A' from stack, stay in q1`
          });
        } else {
          state = "reject";
          steps.push({
            input: inputArray,
            currentIndex: index,
            stack: [...stack],
            state: "reject",
            narration: `Unexpected symbol '${symbol}' or empty stack. String rejected.`,
            accepted: false
          });
          return;
        }
      }
    });

    const finalAccepted = (state === "q0" || state === "q1") && stack.length === 0;
    steps.push({
      input: inputArray,
      currentIndex: inputArray.length,
      stack: [...stack],
      state: state,
      narration: `Input consumed. Stack ${stack.length === 0 ? "empty" : "not empty"}. String ${finalAccepted ? "accepted" : "rejected"}.`,
      accepted: finalAccepted
    });

    return steps;
  };

  const renderVisualization = (step) => (
    <div className="flex gap-8 items-start">
      <div>
        <InputTape
          cells={step.input || []}
          headPosition={step.currentIndex}
          title="Input String"
        />
        <div className="text-center mt-4">
          <div className={`inline-block px-4 py-2 rounded-lg font-bold ${
            step.state === "q0" ? "bg-blue-500 text-white" :
            step.state === "q1" ? "bg-green-500 text-white" :
            step.state === "reject" ? "bg-red-500 text-white" : "bg-gray-300"
          }`}>
            State: {step.state}
          </div>
        </div>
      </div>
      <Stack items={step.stack || []} title="Stack" />
    </div>
  );

  return (
    <AutomataDemo
      name="Pushdown Automata"
      generateSteps={generateSteps}
      defaultInput="aabb"
      speed={speed}
      renderVisualization={renderVisualization}
    />
  );
}

/* ============================
   Turing Machine Demo (TM)
============================ */
function TuringMachineDemo({ speed = 1 }) {
  const generateSteps = (inputString) => {
    let tape = inputString.split("").concat(["_", "_", "_"]);
    let head = 0;
    let state = "q0";
    
    const steps = [{
      tape: [...tape],
      head,
      state,
      narration: `Starting Turing Machine. Task: Mark all 1's with X`
    }];

    while (state !== "halt" && head < tape.length) {
      const symbol = tape[head];
      
      if (state === "q0") {
        if (symbol === "1") {
          tape[head] = "X";
          state = "q0";
          head++;
          steps.push({
            tape: [...tape],
            head,
            state,
            narration: `Found '1', replaced with 'X', move right`
          });
        } else if (symbol === "0") {
          head++;
          steps.push({
            tape: [...tape],
            head,
            state,
            narration: `Found '0', skip, move right`
          });
        } else if (symbol === "_") {
          state = "halt";
          steps.push({
            tape: [...tape],
            head,
            state,
            narration: `Found blank, halt. All 1's marked with X.`
          });
        } else {
          head++;
          steps.push({
            tape: [...tape],
            head,
            state,
            narration: `Found '${symbol}', move right`
          });
        }
      }
      
      if (head >= 20) break; // Safety limit
    }

    return steps;
  };

  const renderVisualization = (step) => (
    <div>
      <InputTape
        cells={step.tape || []}
        headPosition={step.head}
        title="Turing Machine Tape"
      />
      <div className="text-center mt-4">
        <div className={`inline-block px-4 py-2 rounded-lg font-bold ${
          step.state === "q0" ? "bg-blue-500 text-white" :
          step.state === "halt" ? "bg-green-500 text-white" : "bg-gray-300"
        }`}>
          State: {step.state}
        </div>
      </div>
    </div>
  );

  return (
    <AutomataDemo
      name="Turing Machine"
      generateSteps={generateSteps}
      defaultInput="1101"
      speed={speed}
      renderVisualization={renderVisualization}
    />
  );
}

/* ============================
   Main TOC Visualizer
============================ */
export default function TOCVisualizer() {
  const [selected, setSelected] = useState("Finite Automata");
  const [speed, setSpeed] = useState(1);

  const DEMOS = {
    "Finite Automata": <FiniteAutomataDemo speed={speed} />,
    "Pushdown Automata": <PushdownAutomataDemo speed={speed} />,
    "Turing Machine": <TuringMachineDemo speed={speed} />,
  };

  const EXPLANATIONS = {
    "Finite Automata": "A computational model with finite states and deterministic transitions. Recognizes regular languages. This DFA accepts strings ending with 'ab'.",
    "Pushdown Automata": "Extends finite automata with a stack for memory. Recognizes context-free languages like {aⁿbⁿ} - equal numbers of a's followed by b's.",
    "Turing Machine": "Most powerful computational model with an infinite tape. Can simulate any algorithm. This TM marks all 1's with X while preserving other symbols.",
  };

  const COMPLEXITIES = {
    "Finite Automata": { time: "O(n)", space: "O(1)", note: "Linear scan, constant memory" },
    "Pushdown Automata": { time: "O(n)", space: "O(n)", note: "Stack can grow to input size" },
    "Turing Machine": { time: "O(n)", space: "O(n)", note: "Depends on specific algorithm" },
  };

  return (
    <div className="flex h-screen pt-16">
      {/* Sidebar Controls */}
      <div className="w-64 bg-white border-r p-6 flex flex-col">
        <h2 className="text-xl font-bold mb-4">TOC Models</h2>

        {/* Algorithm Dropdown */}
        <label className="block text-sm font-medium mb-1">Model:</label>
        <select
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
          className="w-full border rounded-md p-2 mb-4"
        >
          {Object.keys(DEMOS).map((model) => (
            <option key={model} value={model}>
              {model}
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
          <div className="space-y-2 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-600 rounded-full"></div>
              <span>Current State</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-white border-2 border-green-500 rounded-full"></div>
              <span>Accept State</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-100 border-2 border-blue-600"></div>
              <span>Current Input</span>
            </div>
            {selected === "Pushdown Automata" && (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-blue-400"></div>
                <span>Stack Top</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Visualization Center */}
      <div className="flex-1 flex flex-col items-center justify-center bg-white">
        <h2 className="text-2xl font-bold mb-4">{selected} Simulation</h2>
        <div className="bg-gray-50 rounded-xl shadow-md p-6 min-h-[400px] flex items-center justify-center w-[700px]">
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
          <h3 className="text-sm font-medium mb-2">Complexity:</h3>
          <div className="text-xs text-gray-600 space-y-1">
            <div>Time: {COMPLEXITIES[selected].time}</div>
            <div>Space: {COMPLEXITIES[selected].space}</div>
            <div className="text-gray-500">{COMPLEXITIES[selected].note}</div>
          </div>
        </div>

        <div className="mb-4">
          <h3 className="text-sm font-medium mb-2">Language Type:</h3>
          <div className="text-xs text-gray-600">
            {selected === "Finite Automata" && "Regular Languages (Type 3 in Chomsky Hierarchy)"}
            {selected === "Pushdown Automata" && "Context-Free Languages (Type 2 in Chomsky Hierarchy)"}
            {selected === "Turing Machine" && "Recursively Enumerable Languages (Type 0 in Chomsky Hierarchy)"}
          </div>
        </div>

        <div className="mb-4">
          <h3 className="text-sm font-medium mb-2">Example Strings:</h3>
          <div className="text-xs text-gray-600 space-y-1">
            {selected === "Finite Automata" && (
              <>
                <div>✓ "ab", "aab", "bab"</div>
                <div>✗ "a", "ba", "abb"</div>
              </>
            )}
            {selected === "Pushdown Automata" && (
              <>
                <div>✓ "ab", "aabb", "aaabbb"</div>
                <div>✗ "a", "abb", "aab"</div>
              </>
            )}
            {selected === "Turing Machine" && (
              <>
                <div>Input: "1101"</div>
                <div>Output: "XX0X"</div>
              </>
            )}
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
  );
}