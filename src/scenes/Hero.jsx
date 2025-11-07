import React from "react";
import homeVideo from "../assets/home.mp4";

function scrollToId(id) {
  const el = document.getElementById(id);
  if (!el) return;

  const scroller =
    el.closest('[data-scroll-container="true"], .overflow-y-auto, .overflow-auto') ||
    window;

  if (scroller === window) {
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  } else {
    const rect = el.getBoundingClientRect();
    const parentRect = scroller.getBoundingClientRect();
    const current = scroller.scrollTop;
    const offset = rect.top - parentRect.top + current;
    scroller.scrollTo({ top: offset, behavior: "smooth" });
  }
}

export default function Hero() {
  return (
    <section
      id="home"
      className="relative min-h-screen w-full overflow-hidden bg-black"
      aria-label="AlgoMap Hero"
    >
      {/* Background video */}
      <video
        className="absolute inset-0 h-full w-full object-cover"
        src={homeVideo}
        autoPlay
        loop
        muted
        playsInline
      />

      {/* Dark gradient overlay for better readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/80" />

      {/* Content */}
      <div className="relative z-10 mx-auto flex h-screen max-w-6xl flex-col items-center justify-center px-6 text-center">
        {/* Main Heading */}
        <h1
          className="text-4xl md:text-6xl font-extrabold tracking-tight text-white leading-tight"
          style={{
            fontFamily: "'Irish Grover', system-ui, sans-serif",
            WebkitTextStroke: "2px rgba(0,0,0,0.35)",
            paintOrder: "stroke fill",
            textShadow: "0 6px 28px rgba(0,0,0,0.35)",
          }}
        >
          Spellbook of <span className="text-teal-400">Algorithms</span>
        </h1>

        {/* Subheading */}
        <p className="mt-4 max-w-2xl text-base md:text-lg text-white/85 leading-relaxed">
          Watch your code transform into step-by-step animations.
          Understand every move, ace your viva, and share in a click.
        </p>

        {/* CTA Buttons */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <button
            onClick={() => scrollToId("scene-1")}
            className="rounded-xl bg-teal-500 px-6 py-3 text-sm md:text-base font-semibold text-white shadow-lg shadow-teal-500/20 ring-1 ring-teal-400 hover:bg-teal-400 hover:shadow-xl hover:shadow-teal-500/30 transition-all duration-300"
          >
            🚀 Start Exploring
          </button>
          <button
            onClick={() => scrollToId("scene-3")}
            className="rounded-xl bg-white/10 px-6 py-3 text-sm md:text-base font-semibold text-white ring-1 ring-white/30 hover:bg-white/20 hover:ring-white/50 transition-all duration-300"
          >
            🎥 Visualize Code
          </button>
        </div>
      </div>
    </section>
  );
}
