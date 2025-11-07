export default function LabelVisual({ data = {} }) {
  const { x = 0, y = 0, text = "", color = "#374151" } = data;
  return (
    <div
      className="absolute text-xs font-medium select-none opacity-90"
      style={{
        color,
        left: x,
        top: y,
        translateX: "-50%",
        translateY: "-50%",
      }}
    >
      {text}
    </div>
  );
}
