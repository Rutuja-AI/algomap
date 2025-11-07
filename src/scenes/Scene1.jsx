import React from "react";
import bgTexture from "../assets/scene_scroll_part_1_extended_v2_softwhite.png";

const FEATURES = [
  { icon: "⚡", title: "Live Visualizer", desc: "Every step animates in real time." },
  { icon: "📊", title: "Complexity Hints", desc: "Time & space alongside the run." },
  { icon: "🧠", title: "Multi-Algorithm", desc: "Sorts, graphs, trees, DP, TM/CFG." },
  { icon: "⏱️", title: "Step Engine", desc: "Scrub, pause, jump to key frames." },
  { icon: "✅", title: "Quiz Mode", desc: "Predict next step and score." },
  { icon: "🖥️", title: "Dual Pane", desc: "Code ↔ animation side by side." },
];

export default function Scene1() {
  return (
    <section
      id="scene-1"
      className="
        w-full min-h-[100svh]
        snap-start
        flex flex-col items-center justify-center
        relative
        py-0 md:py-0
      "
      style={{
        backgroundColor: "#F8F7F4",
        backgroundImage: `url(${bgTexture})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      {/* Soft overlay */}
      <div className="absolute inset-0 bg-[#F8F7F4]/75 pointer-events-none" />

      <div className="relative z-10 w-full max-w-screen-xl px-4 md:px-8">
        <header className="text-center mb-8 md:mb-10">
          <h2
            className="text-3xl md:text-5xl font-bold text-slate-900"
            style={{
              fontFamily: "'Irish Grover', cursive",
              WebkitTextStroke: "2px gold", // Golden stroke
              paintOrder: "stroke fill",
              textShadow: "0 0 10px rgba(255,215,0,0.8)", // Golden glow
            }}
          >
            AlgoMap Highlights
          </h2>
          <p className="mt-3 text-slate-600">
            Magical feel, polished cards — best of both worlds.
          </p>
        </header>

        {/* 2-row grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {FEATURES.map((f, i) => (
            <article
              key={i}
              className="
                relative
                bg-white/85 backdrop-blur
                border-4 border-[#0b1520]
                rounded-2xl
                shadow-[6px_8px_0_#0b1520]
                transition
                hover:-translate-y-1.5 hover:shadow-[10px_12px_0_#0b1520]
              "
              style={{ fontFamily: "'Irish Grover', cursive" }}
            >
              {/* Glow hover effect */}
              <div className="pointer-events-none absolute -inset-6 rounded-3xl opacity-0 hover:opacity-100 transition blur-3xl bg-gradient-to-r from-yellow-200/30 to-cyan-200/30" />

              {/* New badge */}
              <div className="absolute -top-3 -right-3 z-10 bg-amber-300 text-[#0b1520] text-xs font-bold px-2 py-1 rounded-md border-2 border-[#0b1520]">
                New
              </div>

              <div className="p-6 md:p-7">
                <div className="flex items-center gap-4 mb-3">
                  <div className="text-4xl md:text-5xl">{f.icon}</div>
                  <h3 className="text-2xl md:text-3xl font-bold text-slate-900">
                    {f.title}
                  </h3>
                </div>
                <p className="text-base md:text-lg leading-relaxed text-slate-700 font-normal not-italic">
                  {f.desc}
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
