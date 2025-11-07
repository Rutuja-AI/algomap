// src/scenes/Scene2.jsx
import React from "react";
import { Link } from "react-router-dom";
import MiniBubbleSort from "../components/MiniBubbleSort";
import bgTexture from "../assets/scene_scroll_part_2_extended_v2_softwhite.png";

export default function Scene2() {
  return (
    <section
      id="concepts"
      className="relative min-h-screen flex items-center py-24 md:py-28 pb-0 mb-0"
      style={{
        backgroundColor: "#F8F7F4",
        backgroundImage: `url(${bgTexture})`,
        backgroundSize: "cover",
        backgroundPosition: "center top",
        backgroundRepeat: "no-repeat",
      }}
    >
      {/* ✅ Unified overlay with Scene3 */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#F6FAFE]/85 via-[#F8F9FB]/85 to-[#F8F7F4]/85"></div>

      <div className="relative z-10 max-w-6xl mx-auto px-6 w-full">
        {/* Header */}
        <div className="text-center mb-12">
          <h2
            className="text-4xl md:text-5xl font-bold text-slate-900"
            style={{
              fontFamily: "'Irish Grover', cursive",
              WebkitTextStroke: "2px #f5e27a",
              paintOrder: "stroke fill",
              textShadow:
                "0 2px 0 rgba(0,0,0,0.08), 0 0 12px rgba(245,226,122,0.35)",
            }}
          >
            Concept Visualizations
          </h2>
          <p className="mt-3 text-slate-700">
            Try one live demo here. Explore the rest on their dedicated pages.
          </p>
        </div>

        {/* Cards layout */}
        <div className="grid md:grid-cols-2 gap-12 items-center md:items-stretch">
          {/* Left Card */}
          <div className="rounded-2xl bg-white/70 backdrop-blur-md border border-white/60 ring-1 ring-black/5 p-6 md:p-8 shadow-[0_8px_24px_rgba(2,18,33,0.12)] flex flex-col justify-between">
            <div>
              <div className="inline-flex items-center gap-2 text-sm bg-amber-100 px-3 py-1 rounded-full mb-4">
                ✨ Featured Demo
              </div>
              <h3 className="text-3xl font-bold mb-3 text-slate-900">Sorting</h3>
              <p className="text-gray-700 mb-6">
                Watch arrays transform step-by-step — comparisons, swaps, and
                that satisfying final lineup. This tiny preview loops a Bubble
                Sort to instantly give the AlgoMap vibe.
              </p>
            </div>

            <div className="flex flex-wrap gap-3 mt-4">
              <a
                href="/concepts/sorting"
                className="px-5 py-3 rounded-xl bg-emerald-600 text-white font-semibold shadow hover:opacity-90 transition"
              >
               Explore Sorting
              
              </a>
              <Link
                to="/concepts"
                className="px-5 py-3 rounded-xl bg-white/80 text-gray-900 font-semibold shadow border border-white/70"
              >
                Explore All Concepts
              </Link>
            </div>
          </div>

          {/* Right Card */}
          <div className="rounded-2xl bg-white/70 backdrop-blur-md border border-white/60 ring-1 ring-black/5 p-6 md:p-8 shadow-[0_8px_24px_rgba(2,18,33,0.12)] flex items-center justify-center min-h-[300px] overflow-hidden">
            <div className="w-full max-w-[400px]">
              <MiniBubbleSort />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}