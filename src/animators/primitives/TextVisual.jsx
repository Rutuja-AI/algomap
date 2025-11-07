export default function TextVisual({ data = {} }) {
  const { text = "", emphasis = false } = data;
  return (
    <div
      className={`text-sm text-center ${emphasis ? "font-bold text-indigo-600" : "text-gray-700"}`}
    >
      {text}
    </div>
  );
}
