import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom"; // ✅ use Link instead of <a>

const TOPICS = [
  { name: "Data Structures", path: "/concepts/data-structures" },
  { name: "Sorting Algorithms", path: "/concepts/sorting" },
  { name: "Graph Fundamentals", path: "/concepts/graphs" },
  { name: "Theory of Computation", path: "/concepts/toc" },
  { name: "AI / ML Intros", path: "/concepts/aiml" },
];

export default function ConceptVisualization() {
  const [hovered, setHovered] = useState(null);

  return (
    <div className="flex h-screen bg-gray-50 pt-10">
      {/* 📚 Sidebar */}
      <div className="w-64 bg-white p-6 border border-gray-300 rounded-lg shadow-lg m-4 flex-shrink-0">
        <h2 className="text-xl font-bold mb-4">Concepts</h2>
        <ul className="space-y-0">
          {TOPICS.map((topic, index) => (
            <li
              key={topic.name}
              className={
                index !== TOPICS.length - 1 ? "border-b border-gray-300" : ""
              }
            >
              <Link
                to={topic.path}
                onMouseEnter={() => setHovered(topic.name)}
                onMouseLeave={() => setHovered(null)}
                className="block px-3 py-2 rounded hover:bg-emerald-600 hover:text-white transition"
              >
                {topic.name}
              </Link>
            </li>
          ))}
        </ul>
      </div>

      {/* 🌟 Center Panel */}
      <div className="flex-1 flex items-center justify-center p-6">
        <motion.div
          key={hovered || "default"}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", duration: 0.4 }}
          className="text-center max-w-md bg-white p-6 rounded-lg shadow-md border border-gray-200"
        >
          {hovered ? (
            <>
              <h3 className="text-3xl font-bold mb-3">{hovered}</h3>
              <p className="text-gray-600">
                Click the topic to open its dedicated visualization page.
              </p>
            </>
          ) : (
            <>
              <h3 className="text-3xl font-bold mb-3">Explore Concepts</h3>
              <p className="text-gray-600">
                Hover a topic from the sidebar to preview, click to explore.
              </p>
            </>
          )}
        </motion.div>
      </div>

      {/* 🧠 Right Info Panel */}
      <div className="w-72 bg-white p-6 border border-gray-300 rounded-lg shadow-lg m-4 flex-shrink-0">
        <h2 className="font-bold text-lg mb-2">How it works</h2>
        <p className="text-sm text-gray-600">
          Choose a concept from the sidebar. You’ll be taken to a page where a
          teaching-mode demo plays automatically, followed by interactive mode
          where you can try inputs yourself.
        </p>
      </div>
    </div>
  );
}
