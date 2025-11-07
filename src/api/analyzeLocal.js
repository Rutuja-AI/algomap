export async function analyzeLocal(code) {
  const res = await fetch("http://127.0.0.1:5001/execute", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error || "Local analyze failed");
  return Array.isArray(data?.steps) ? data.steps : [];
}
