export default function Feedback({ score, attempts }) {
  if (attempts === 0) return null;

  const ratio = score / attempts;
  let message = "Keep going!";

  if (ratio === 1) message = "Perfect score! 🎉";
  else if (ratio >= 0.7) message = "Great job! 👍";
  else if (ratio >= 0.4) message = "Not bad, you can improve!";
  else message = "Don't give up, try again!";

  return (
    <div className="mt-2 p-3 border rounded bg-gray-50">
      <p className="text-sm">{message}</p>
    </div>
  );
}
