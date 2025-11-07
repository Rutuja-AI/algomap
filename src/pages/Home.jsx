import React, { useEffect, useRef } from "react";
import Hero from "../scenes/Hero";
import Scene3 from "../scenes/Scene3";
import Scene4 from "../scenes/Scene4";
import Chatbot from "../components/Chatbot";

export default function Home() {
  const containerRef = useRef(null);

  useEffect(() => {
    // Prevent auto-jump if hash exists in URL
    if (window.location.hash) {
      const { pathname, search } = window.location;
      window.history.replaceState(null, "", pathname + search);
    }

    // Start at top safely
    requestAnimationFrame(() => {
      const scroller = containerRef.current;
      if (scroller) scroller.scrollTo({ top: 0, behavior: "auto" });
      else window.scrollTo({ top: 0, behavior: "auto" });
    });
  }, []);

  return (
    <main
      ref={containerRef}
      data-scroll-container="true"
      className="
        relative h-screen overflow-y-auto
        snap-y snap-proximity
        scroll-smooth
        bg-black
      "
    >
      {/* Hero Section */}
      <section id="home" className="snap-start">
        <Hero containerRef={containerRef} />
      </section>

      {/* Scene 3 - Visualize Code */}
      <section id="scene-3" className="snap-start bg-zinc-50">
        <Scene3 />
      </section>

      {/* Scene 4 - Features */}
      <section id="features" className="snap-start bg-[#F8F7F4]">
        <Scene4 />
      </section>
      <Chatbot />

    </main>
  );
}
