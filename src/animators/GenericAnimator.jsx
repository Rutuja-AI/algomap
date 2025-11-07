// src/animators/GenericAnimator.jsx
export default function GenericAnimator({ steps = [], currentIndex = 0 }) {
  if (!steps.length) return <div>No actions detected.</div>;
  return (
    <div className="flex flex-col gap-2 items-center justify-center text-lg font-semibold text-gray-700">
      {steps.slice(0, currentIndex + 1).map((s, i) => (
        <div
          key={i}
          className="px-4 py-2 rounded-2xl bg-gray-100 border shadow-sm w-fit transition-all"
        >
          🧩 {s.action}: {s.description}
        </div>
      ))}
    </div>
  );
}
