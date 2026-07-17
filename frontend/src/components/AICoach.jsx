import { useState, useRef, useEffect } from "react";
import { PaperPlaneTilt, Robot, X, CaretDown, SpinnerGap } from "@phosphor-icons/react";
import api from "@/lib/api";

const QUICK_PROMPTS = [
  "Explain this with a simple example",
  "What are common mistakes?",
  "How do I use this at work?",
  "Show me the formula syntax again",
];

function Message({ msg }) {
  const isUser = msg.role === "user";
  return (
    <div className={`flex gap-2.5 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
      {!isUser && (
        <div className="w-7 h-7 rounded-full bg-[#002FA7] flex items-center justify-center shrink-0 mt-0.5">
          <Robot size={14} weight="fill" className="text-white" />
        </div>
      )}
      <div
        className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
          isUser
            ? "bg-[#002FA7] text-white rounded-tr-sm"
            : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-tl-sm"
        }`}
      >
        {/* Render code blocks in AI replies */}
        {msg.content.split(/(`[^`]+`)/g).map((part, i) =>
          part.startsWith("`") && part.endsWith("`") ? (
            <code
              key={i}
              className={`font-mono text-xs px-1.5 py-0.5 rounded ${
                isUser
                  ? "bg-blue-800 text-blue-100"
                  : "bg-gray-200 dark:bg-gray-700 text-[#002FA7] dark:text-blue-300"
              }`}
            >
              {part.slice(1, -1)}
            </code>
          ) : (
            <span key={i}>{part}</span>
          )
        )}
      </div>
    </div>
  );
}

export default function AICoach({ lessonId, lessonTitle, defaultOpen = false, className = "" }) {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: lessonTitle
        ? `Hi! I'm your Excel Coach 👋 I'm here to help with "${lessonTitle}". Ask me anything — a concept, a formula, or how to use this at work!`
        : "Hi! I'm your Excel Coach 👋 Ask me anything about Excel — formulas, functions, or how to fix an error!",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(defaultOpen);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (open) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [messages, open]);

  const send = async (text) => {
    const msg = (text || input).trim();
    if (!msg || loading) return;
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: msg }]);
    setLoading(true);
    try {
      const res = await api.post("/coach/chat", {
        message: msg,
        lesson_id: lessonId || null,
      });
      setMessages((prev) => [...prev, { role: "assistant", content: res.data.reply }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Sorry, I couldn't connect. Please try again in a moment." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  // ── MOBILE: collapsible bottom panel ──────────────────────────────
  // ── DESKTOP: always visible sidebar panel (controlled by parent) ──
  return (
    <div className={`flex flex-col h-full bg-white dark:bg-[#111d36] ${className}`}>
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700 cursor-pointer select-none"
        onClick={() => setOpen((o) => !o)}
      >
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-[#002FA7] flex items-center justify-center">
            <Robot size={14} weight="fill" className="text-white" />
          </div>
          <span className="font-bold text-sm text-gray-900 dark:text-white">AI Coach</span>
          <span className="text-xs text-[#2BAD9E] font-semibold">Online</span>
        </div>
        <CaretDown
          size={15}
          className={`text-gray-400 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </div>

      {open && (
        <>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 min-h-0">
            {messages.map((m, i) => (
              <Message key={i} msg={m} />
            ))}
            {loading && (
              <div className="flex gap-2.5">
                <div className="w-7 h-7 rounded-full bg-[#002FA7] flex items-center justify-center shrink-0">
                  <Robot size={14} weight="fill" className="text-white" />
                </div>
                <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl rounded-tl-sm px-4 py-3">
                  <SpinnerGap size={16} className="text-[#002FA7] animate-spin" />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Quick prompts */}
          {messages.length <= 2 && (
            <div className="px-4 pb-3 flex flex-wrap gap-1.5">
              {QUICK_PROMPTS.map((q) => (
                <button
                  key={q}
                  onClick={() => send(q)}
                  className="text-xs px-2.5 py-1.5 rounded-full bg-blue-50 dark:bg-blue-900/30 text-[#002FA7] dark:text-blue-300 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors font-medium"
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="px-4 pb-4 border-t border-gray-200 dark:border-gray-700 pt-3">
            <div className="flex gap-2 items-end">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKey}
                placeholder="Ask me anything about this lesson..."
                rows={1}
                className="flex-1 resize-none rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#002FA7] focus:border-transparent placeholder-gray-400 dark:placeholder-gray-500 leading-5"
                style={{ maxHeight: "96px", overflowY: "auto" }}
                onInput={(e) => {
                  e.target.style.height = "auto";
                  e.target.style.height = Math.min(e.target.scrollHeight, 96) + "px";
                }}
              />
              <button
                onClick={() => send()}
                disabled={!input.trim() || loading}
                className="w-9 h-9 rounded-xl bg-[#002FA7] hover:bg-blue-800 disabled:opacity-40 flex items-center justify-center transition-colors shrink-0"
              >
                <PaperPlaneTilt size={15} weight="fill" className="text-white" />
              </button>
            </div>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1.5 text-center">
              Enter to send · Shift+Enter for new line
            </p>
          </div>
        </>
      )}
    </div>
  );
}
