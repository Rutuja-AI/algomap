import React from "react";
import { Link, useLocation } from "react-router-dom";

export default function Navbar() {
  const location = useLocation();

  return (
    <nav className="fixed top-0 inset-x-0 h-16 z-50">
      <div className="h-full backdrop-blur-md bg-white/60 border-b border-black/10">
        <div className="mx-auto max-w-screen-xl h-full px-4 flex items-center justify-between">
          {/* 🧭 Logo */}
          <Link
            to="/"
            className="text-2xl font-bold"
            style={{ fontFamily: "'Irish Grover', cursive" }}
          >
            AlgoMap
          </Link>

          {/* 🔗 Nav Links */}
          <div className="flex items-center gap-6 text-sm font-semibold">
            {/* Now 'Features' just routes to home */}
            <Link
              to="/"
              className={`hover:underline ${
                location.pathname === "/" ? "text-indigo-600" : "text-gray-700"
              }`}
            >
              Features
            </Link>

            <Link
              to="/visualize"
              className={`hover:underline ${
                location.pathname === "/visualize"
                  ? "text-purple-700"
                  : "text-gray-700"
              }`}
            >
              Visualize
            </Link>

            <Link
              to="/concepts"
              className={`hover:underline ${
                location.pathname.startsWith("/concepts")
                  ? "text-blue-700"
                  : "text-gray-700"
              }`}
            >
              Concept Visualizer
            </Link>

            <Link
              to="/quiz"
              className={`hover:underline ${
                location.pathname === "/quiz"
                  ? "text-green-700"
                  : "text-gray-700"
              }`}
            >
              Quiz
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
