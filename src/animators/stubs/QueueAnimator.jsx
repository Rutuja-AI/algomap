import { useEffect, useState } from "react";
import { motion } from "framer-motion";

export default function QueueAnimator({ info, codeForTranslate }) {
  const [items, setItems] = useState([]);
  const [steps, setSteps] = useState([]);
  const [playing, setPlaying] = useState(false);
  const [hi, setHi] = useState(null); // "head" | "tail" | null

  async function fetchSteps() {
    const res = await fetch("http://127.0.0.1:5000/translate_queue", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: codeForTranslate || "" })
    });
    const j = await res.json();
    setSteps(j.steps || []);
    setItems([]); // fresh replay
  }
  useEffect(()=>{ fetchSteps(); },[]);

  useEffect(()=>{
    if (!playing || !steps.length) return;
    let i = 0;
    const id = setInterval(()=>{
      const st = steps[i];
      if (!st) { clearInterval(id); setPlaying(false); setHi(null); return; }
      if (st.action === "enqueue") { setHi("tail"); setItems(p=>[...p, st.value]); }
      if (st.action === "dequeue") { setHi("head"); setItems(p=>p.slice(1)); }
      if (st.action === "done") { setHi(null); clearInterval(id); setPlaying(false); }
      i++;
    }, 700);
    return ()=>clearInterval(id);
  },[playing, steps]);

  return (
    <div className="p-4 border rounded">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-lg">🧱 Queue mode</div>
          <div className="text-sm opacity-70">{info}</div>
        </div>
        <button onClick={()=>setPlaying(true)} className="px-3 py-1 rounded bg-black text-white">Play</button>
      </div>
      <div className="mt-4 flex gap-3">
        {items.map((v, i)=>(
          <motion.div key={`${i}-${v}`} layout
            className={`w-12 h-12 grid place-items-center rounded border
              ${i===0 && hi==='head' ? 'ring-2 ring-black' : ''}
              ${i===items.length-1 && hi==='tail' ? 'ring-2 ring-black' : ''}`}>
            {String(v)}
          </motion.div>
        ))}
      </div>
    </div>
  );
}
