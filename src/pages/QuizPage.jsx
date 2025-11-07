// src/quiz/QuizPage.jsx
import React from "react";
import QuizContainer from "../quiz/QuizContainer";
import Chatbot from "../components/Chatbot";


export default function QuizPage() {
  return (
    <div className="pt-16 bg-gray-100 min-h-screen"> {/* 👈 Padding for Navbar */}
      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-3xl font-bold mb-4">Algomap Quiz Mode</h1>
        <QuizContainer />
      </div>
      <Chatbot />

    </div>
  );
}