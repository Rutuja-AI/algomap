import { useState } from "react";

export default function QuestionCard({
  question,
  options,
  correctAnswer,      
  explanation,        
  onResult,
  onNextQuestion
}) {
  const [selected, setSelected] = useState("");
  const [answered, setAnswered] = useState(false);

  const handleSubmit = () => {
    if (!selected) return;
    const isCorrect = selected === correctAnswer;
    onResult(isCorrect);
    setAnswered(true);
  };

  const handleNext = () => {
    setSelected("");
    setAnswered(false);
    onNextQuestion();
  };

  return (
    <div className="border rounded p-3 mb-3 bg-white shadow-sm">
      <h3 className="text-base font-semibold mb-2">{question}</h3>

      <ul className="mb-2">
        {Object.entries(options).map(([key, value]) => {
          let bg = "";
          if (answered) {
            if (key === correctAnswer) bg = "bg-green-100 border-green-400";
            if (selected === key && selected !== correctAnswer) bg = "bg-red-100 border-red-400";
          }

          return (
            <li key={key} className="mb-2">
              <label
                className={`flex items-center gap-2 p-2 border rounded cursor-pointer ${bg}`}
              >
                <input
                  type="radio"
                  name="option"
                  value={key}
                  checked={selected === key}
                  disabled={answered}
                  onChange={() => setSelected(key)}
                  className="w-4 h-4"
                />
                <span className="text-sm">{key}) {value}</span>
              </label>
            </li>
          );
        })}
      </ul>

      <div className="flex gap-2">
        {!answered ? (
          <button
            onClick={handleSubmit}
            disabled={!selected}
            className="bg-green-600 text-white px-3 py-1 text-sm rounded disabled:opacity-50"
          >
            Submit
          </button>
        ) : (
          <button
            onClick={handleNext}
            className="bg-blue-600 text-white px-3 py-1 text-sm rounded"
          >
            Next
          </button>
        )}
      </div>

      {answered && (
        <div className="mt-2 p-2 bg-gray-100 rounded text-sm">
          <strong>Explanation:</strong> {explanation || "No explanation provided."}
        </div>
      )}
    </div>
  );
}
