import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Hero from "./scenes/Hero";
import Scene1 from "./scenes/Scene1";
import Scene2 from "./scenes/Scene2";
import Scene3 from "./scenes/Scene3";
import Visualize from "./pages/Visualize";
import MascotTest from "./pages/MascotTest";
import ConceptVisualization from "./concepts/ConceptVisualization";
import DataStructureVisualizer from "./concepts/DataStructureVisualizer";
import SortingVisualizer from "./concepts/SortingVisualizer";
import GraphVisualizer from "./concepts/GraphVisualizer";
import TocVisualizer from "./concepts/TocVisualizer";
import AIMLVisualizer from "./concepts/AimlVisualizer";
import QuizPage from "./pages/QuizPage";   // 👈 added import
import Chatbot from "./components/Chatbot";
function Home() {
  return (
    <main
      className="
        snap-y snap-mandatory
        h-screen w-full overflow-y-scroll
        pt-16
      "
    >
      <section id="hero" className="snap-start h-screen w-full">
        <Hero />
      </section>
      <section id="scene-1" className="snap-start h-screen w-full">
        <Scene1 />
      </section>
      <section id="scene-2" className="snap-start h-screen w-full">
        <Scene2 />
      </section>
      <section id="scene-3" className="snap-start h-screen w-full">
        <Scene3 />
      </section>
    </main>
  );
}

export default function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/visualize" element={<Visualize />} />
        <Route path="/mascot" element={<MascotTest />} />
        <Route path="/concepts" element={<ConceptVisualization />} />
        <Route path="/concepts/data-structures" element={<DataStructureVisualizer />} />
        <Route path="/concepts/sorting" element={<SortingVisualizer />} />
        <Route path="/concepts/graphs" element={<GraphVisualizer />} /> 
        <Route path="/concepts/toc" element={<TocVisualizer />} />
        <Route path="/concepts/aiml" element={<AIMLVisualizer/>}/>
        <Route path="/quiz" element={<QuizPage />} />  {/* 👈 Quiz route added */}
        
      </Routes> 
      <Chatbot />
    </Router>
  );
}