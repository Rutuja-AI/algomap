import { useState, useEffect, useRef } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [messages, setMessages] = useState([
    { role: "bot", text: "👋 Hi, I’m your AlgoBot! Ask me about algorithms." },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [detailedMode, setDetailedMode] = useState(false);
  const [copiedMsgIndex, setCopiedMsgIndex] = useState(null);
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Copy helper
  const handleCopy = (text, index) => {
    navigator.clipboard.writeText(text);
    setCopiedMsgIndex(index);
    setTimeout(() => setCopiedMsgIndex(null), 1500);
  };

  // Render text + code blocks
  function renderMessageText(text, msgIndex) {
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = codeBlockRegex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(
          <div key={lastIndex}>
            <span>{text.slice(lastIndex, match.index)}</span>
          </div>
        );
      }

      const language = match[1] || "text";
      const code = match[2];

      parts.push(
        <div key={match.index} className="relative">
          <SyntaxHighlighter
            language={language}
            style={oneDark}
            wrapLongLines
            customStyle={{
              borderRadius: "8px",
              fontSize: "0.8rem",
              marginTop: "4px",
              marginBottom: "4px",
              padding: "10px 12px",
            }}
          >
            {code}
          </SyntaxHighlighter>
          <button
            onClick={() => handleCopy(code, msgIndex)}
            className="absolute top-0 right-1 text-xs hover:text-blue-500"
            title="Copy code"
          >
            📋
          </button>
          {copiedMsgIndex === msgIndex && (
            <span className="absolute top-5 right-2 text-xs text-green-600">
              Copied!
            </span>
          )}
        </div>
      );

      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < text.length) {
      parts.push(<span key={lastIndex}>{text.slice(lastIndex)}</span>);
    }

    return parts;
  }

  // Detect “step by step” request
  function isStepByStepRequest(text) {
    const keywords = [
      "step by step",
      "steps",
      "stepwise",
      "in steps",
      "show me steps",
      "walkthrough",
      "how to",
    ];
    const lowerText = text.toLowerCase();
    return keywords.some((kw) => lowerText.includes(kw));
  }

  // ✅ Gemini API integration
  const handleSend = async () => {
    if (!input.trim()) return;

    const typedInput = input.trim();
    setInput("");
    const userMsg = { role: "user", text: typedInput };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
        const stepByStep = isStepByStepRequest(typedInput);
        const systemPrompt = stepByStep
        ? `You are AlgoBot — the official assistant of AlgoMap, a platform that transforms Python code into visual algorithm animations. 
        Explain algorithms clearly in numbered steps, like a step-by-step guide, and mention AlgoMap naturally when it fits.`
        : detailedMode
        ? `You are AlgoBot — the smart AI inside AlgoMap, which visualizes algorithms and data structures. 
        Give clear and detailed explanations about algorithms, code logic, and how AlgoMap could visualize them.`
        : `You are AlgoBot — a friendly assistant within AlgoMap, a visual learning platform that converts Python code into animations. 
        Keep answers short, simple, and helpful (2–3 sentences max), but subtly tie explanations to AlgoMap’s learning style when possible.`;

      const fullConversation = [
        {
          role: "user",
          parts: [{ text: `${systemPrompt}\n\nConversation so far:` }],
        },
        ...messages.map((m) => ({
          role: m.role === "user" ? "user" : "model",
          parts: [{ text: m.text }],
        })),
        { role: "user", parts: [{ text: typedInput }] },
      ];

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${
          import.meta.env.VITE_GEMINI_API_KEY
        }`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contents: fullConversation }),
        }
      );

      const data = await response.json();
      if (data.error) throw new Error(data.error.message);

      const reply =
        data?.candidates?.[0]?.content?.parts?.[0]?.text ||
        "⚠️ No response from Gemini.";
      setMessages((prev) => [...prev, { role: "bot", text: reply }]);
    } catch (err) {
      console.error("Gemini API Error:", err);
      setMessages((prev) => [
        ...prev,
        { role: "bot", text: "⚠️ Gemini API Error: " + err.message },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* 🪄 Floating Bot Button */}
      {!isOpen && (
        <>
          <button
            onClick={() => setIsOpen(true)}
            className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-gradient-to-r from-indigo-500 to-blue-500 text-white flex items-center justify-center text-2xl shadow-[0_0_20px_rgba(99,102,241,0.6)] hover:scale-110 hover:shadow-[0_0_25px_rgba(99,102,241,0.8)] transition-all duration-300"
            title="Chat with AlgoBot 🤖"
          >
            🤖
          </button>
          <span className="fixed bottom-[4.3rem] right-9 bg-pink-500 w-3 h-3 rounded-full animate-pulse shadow-lg"></span>
        </>
      )}

      {/* 💬 Chat Window */}
      {isOpen && (
        <div
          className={`fixed backdrop-blur-md bg-white/80 border border-gray-200/70 shadow-2xl rounded-2xl flex flex-col overflow-hidden z-50 transition-all duration-300 ease-in-out ${
            isFullScreen ? "inset-4" : "bottom-6 right-6"
          }`}
          style={
            isFullScreen
              ? {}
              : {
                  width: "360px",
                  height: "470px",
                  minWidth: "280px",
                  minHeight: "300px",
                  maxWidth: "620px",
                  maxHeight: "700px",
                }
          }
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-3 flex justify-between items-center shadow-lg">
            <span className="font-semibold tracking-wide flex items-center gap-2">
              🤖 AlgoBot
            </span>
            <div className="flex gap-2 items-center text-sm">
              <button
                onClick={() => setDetailedMode((v) => !v)}
                className={`px-2 py-1 rounded-lg transition ${
                  detailedMode ? "bg-white/30" : "bg-white/10"
                } hover:bg-white/30`}
                title="Toggle answer length"
              >
                {detailedMode ? "📚 Detailed" : "⚡ Short"}
              </button>
              <button
                onClick={() => setIsFullScreen((v) => !v)}
                className="hover:scale-110 transition"
                title={isFullScreen ? "Restore" : "Expand"}
              >
                {isFullScreen ? "🗗" : "⛶"}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="hover:scale-110"
              >
                ✖
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 p-4 overflow-y-auto space-y-2 text-sm text-gray-800">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`p-3 rounded-xl max-w-[80%] whitespace-pre-wrap shadow-sm ${
                  msg.role === "user"
                    ? "bg-gradient-to-r from-blue-100 to-indigo-100 ml-auto"
                    : "bg-white/70 border border-gray-200"
                }`}
              >
                {renderMessageText(msg.text, idx)}
              </div>
            ))}
            {loading && (
              <div className="text-gray-400 italic text-xs animate-pulse">
                Bot is thinking…
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t border-gray-200 bg-white/70 backdrop-blur-md p-2 flex">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Ask AlgoBot anything..."
              className="flex-1 bg-transparent px-3 py-2 text-sm focus:outline-none placeholder-gray-500"
            />
            <button
              onClick={handleSend}
              className="bg-gradient-to-r from-indigo-500 to-blue-600 text-white px-4 py-2 rounded-lg hover:scale-105 transition"
            >
              Send
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
