export default function Scoreboard({ score, attempts }) {
  if (attempts === 0) return null;

  return (
    <div className="border rounded p-4 bg-gray-50 mb-2">
      <h3 className="text-lg font-semibold mb-2 text-blue-700">Scoreboard</h3>
      <p>
        Score: {score} / {attempts}
      </p>
    </div>
  );
}
