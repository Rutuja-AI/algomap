export default function GraphBFSAnimator({ info }) {
  return (
    <div className="p-4 border rounded">
      <div className="text-lg">🕸️ Graph BFS mode</div>
      <div className="text-sm opacity-70">{info}</div>
      <div className="mt-3 flex gap-4">
        {["S","A","B","C"].map((n,i) => (
          <div key={i} className="w-12 h-12 border rounded-full grid place-items-center">{n}</div>
        ))}
      </div>
    </div>
  );
}