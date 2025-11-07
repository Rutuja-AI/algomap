import { useState } from "react";
import QuestionCard from "./QuestionCard";
import Scoreboard from "./Scoreboard";
import Feedback from "./Feedback";

export default function QuizContainer() {
  // ✅ Full list of topics for algorithm visualizer + AI/ML
  const topics = [
    "Graphs",
    "BFS",
    "DFS",
    "Shortest Path Algorithms",
    "Minimum Spanning Tree",
    "Topological Sorting",
    "Sorting Algorithms",
    "Sorting Linked Lists",
    "Linked Lists",
    "Stacks",
    "Queues",
    "Binary Trees",
    "Binary Search Trees",
    "Heaps",
    "Hashing",
    "Trie",
    "Dynamic Programming",
    "Greedy Algorithms",
    "Recursion",
    "Backtracking",
    "Divide and Conquer",
    "Bit Manipulation",
    "Artificial Intelligence",
    "Machine Learning",
    "Deep Learning",
    "Neural Networks",
    "Supervised Learning",
    "Unsupervised Learning",
    "Reinforcement Learning"
  ];

  const [topic, setTopic] = useState("graphs");
  const [questionData, setQuestionData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [score, setScore] = useState(0);
  const [attempts, setAttempts] = useState(0);

  const generateQuestion = async () => {
    try {
      setLoading(true);
      setError("");
      setQuestionData(null);

      const prompt = `
You are QuizMaster, a friendly AI that generates ONE multiple-choice question about ${topic}.
Strict format:
Question: <text>
A) <option1>
B) <option2>
C) <option3>
D) <option4>
Answer: <correct option letter (A/B/C/D)>
Explanation: <one-sentence explanation>
Important: Randomly assign the correct answer to A, B, C, or D, 
and shuffle the other options so it is not always the same letter.
Respond only with this format.`;

      const response = await fetch("http://127.0.0.1:5000/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: prompt }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(
          errData.error || `Flask error: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();
      const botReply = data?.reply || "";

      if (!botReply) {
        setError("⚠️ Empty response from AI.");
        setQuestionData({
          question: "⚠️ Failed to parse question. Try again.",
          options: {},
        });
        return;
      }

      const lines = botReply.split(/\r?\n/).filter(Boolean);
      const qLine = lines.find((l) => l.toLowerCase().startsWith("question:"));
      const question = qLine ? qLine.replace(/question:\s*/i, "").trim() : null;

      const getOptionLine = (prefix) =>
        lines.find((l) => l.toLowerCase().startsWith(prefix.toLowerCase()));

      const aLine = getOptionLine("A)");
      const bLine = getOptionLine("B)");
      const cLine = getOptionLine("C)");
      const dLine = getOptionLine("D)");

      const answerLine = lines.find((l) => l.toLowerCase().startsWith("answer:"));
      const explanationLine = lines.find((l) =>
        l.toLowerCase().startsWith("explanation:")
      );

      const answer = answerLine
        ? answerLine.replace(/answer:\s*/i, "").trim()
        : null;
      const explanation = explanationLine
        ? explanationLine.replace(/explanation:\s*/i, "").trim()
        : "";

      if (question) {
        setQuestionData({
          question,
          options: {
            A: aLine ? aLine.replace(/^A\)\s*/i, "").trim() : "Option not available",
            B: bLine ? bLine.replace(/^B\)\s*/i, "").trim() : "Option not available",
            C: cLine ? cLine.replace(/^C\)\s*/i, "").trim() : "Option not available",
            D: dLine ? dLine.replace(/^D\)\s*/i, "").trim() : "Option not available",
          },
          answer,
          explanation,
        });
      } else {
        setError("Could not parse question.");
        setQuestionData({
          question: "⚠️ Failed to parse question. Try again.",
          options: {},
        });
      }
    } catch (err) {
      console.error("Quiz error:", err);
      setError(err.message || "⚠️ Could not connect to AI.");
      setQuestionData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleResult = (isCorrect) => {
    setAttempts((prev) => prev + 1);
    if (isCorrect) setScore((prev) => prev + 1);
  };

  return (
    <div className="p-4 max-w-2xl mx-auto flex flex-col gap-4">
      <h2 className="text-2xl font-bold mb-2">AI Quiz 🤖</h2>

      <div className="flex gap-2 mb-2">
        <select
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          className="border p-2 rounded flex-1"
        >
          {topics.map((t, idx) => (
            <option key={idx} value={t.toLowerCase()}>
              {t}
            </option>
          ))}
        </select>

        <button
          onClick={generateQuestion}
          disabled={loading}
          className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 disabled:opacity-50"
        >
          {loading ? "Generating..." : "Generate Question"}
        </button>
      </div>

      {error && <p className="text-red-500 font-semibold">{error}</p>}

      {questionData && questionData.question && (
        <QuestionCard
          question={questionData.question}
          options={questionData.options}
          correctAnswer={questionData.answer}
          explanation={questionData.explanation}
          onResult={handleResult}
          onNextQuestion={generateQuestion}
        />
      )}

      <div className="flex flex-col md:flex-row gap-4 justify-between">
        <Scoreboard score={score} attempts={attempts} />
        <Feedback score={score} attempts={attempts} />
      </div>
    </div>
  );
}
