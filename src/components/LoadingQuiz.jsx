// src/components/LoadingQuiz.jsx
import React, { useState, useEffect } from "react";
import getShuffledBank from "../data/quiz_data";
import { motion, AnimatePresence } from "framer-motion";

export default function LoadingQuiz() {
  const [phase, setPhase] = useState("loading"); // loading → quiz → break
  const [bank, setBank] = useState([]);
  const [qIndex, setQIndex] = useState(0);
  const [question, setQuestion] = useState(null);
  const [selected, setSelected] = useState(null);
  const [round, setRound] = useState(0);

  // 🧠 load quiz bank once
  useEffect(() => {
    setBank(getShuffledBank());
  }, []);

  // 🌊 phase transitions
  useEffect(() => {
    let timer;
    if (phase === "loading") {
      timer = setTimeout(() => setPhase("quiz"), 3000);
    } else if (phase === "quiz" && selected) {
      timer = setTimeout(() => setPhase("break"), 1800); // let user see result
    } else if (phase === "break") {
      timer = setTimeout(() => {
        setRound((r) => r + 1);
        if (round % 4 === 3) setPhase("loading");
        else {
          setQIndex((i) => (i + 1) % bank.length);
          setSelected(null);
          setPhase("quiz");
        }
      }, 2000);
    }
    return () => clearTimeout(timer);
  }, [phase, selected, round, bank.length]);

  useEffect(() => {
    if (bank.length > 0) setQuestion(bank[qIndex]);
  }, [bank, qIndex]);

  // 💜 animation variants
  const popVariants = {
    hidden: { opacity: 0, scale: 0.85 },
    visible: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.85 },
  };

  return (
    <div className="flex items-center justify-center w-full h-full text-center">
      <AnimatePresence mode="wait">
        {phase === "loading" && (
          <motion.div
            key="load"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col items-center text-gray-400"
          >
            <p className="text-5xl animate-pulse mb-3">⏳✨</p>
            <p className="text-sm font-medium">
              Just a little while… AlgoMap is preparing your animation
            </p>
          </motion.div>
        )}

        {phase === "quiz" && question && (
          <motion.div
            key="quiz"
            variants={popVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{ type: "spring", stiffness: 120, damping: 12 }}
            className="relative bg-white/90 backdrop-blur-lg border border-indigo-300 shadow-2xl rounded-2xl p-8 max-w-lg w-[90%] flex flex-col items-center text-gray-800 ring-2 ring-indigo-200/70"
          >
            {/* 🌟 Label Header */}
            <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-xs font-semibold px-3 py-1 rounded-full shadow-md">
              🎮 Quick Quiz While AlgoMap Thinks
            </div>

            <p className="text-lg font-semibold mb-4 mt-2">
              🧠 {question.question}
            </p>

            <div className="flex flex-wrap justify-center gap-3 mb-3">
              {question.options.map((opt) => (
                <motion.button
                  whileTap={{ scale: 0.92 }}
                  key={opt}
                  onClick={() => setSelected(opt)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    selected === opt
                      ? opt === question.answer
                        ? "bg-green-600 text-white"
                        : "bg-red-600 text-white"
                      : "bg-indigo-100 text-indigo-700 hover:bg-indigo-200"
                  }`}
                  disabled={!!selected}
                >
                  {opt}
                </motion.button>
              ))}
            </div>

            {selected && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={`mt-2 text-sm font-medium ${
                  selected === question.answer
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                {selected === question.answer
                  ? "✅ Correct!"
                  : `❌ Nope! It’s ${question.answer}`}
              </motion.p>
            )}
          </motion.div>
        )}

        {phase === "break" && (
          <motion.div
            key="break"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col items-center text-gray-400"
          >
            <p className="text-3xl mb-2">⚙️💭</p>
            <p className="text-sm font-medium">
              Ohh big code — AlgoMap’s still thinking!
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
