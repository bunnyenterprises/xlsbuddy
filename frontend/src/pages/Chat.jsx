import React, { useEffect, useRef, useState } from "react";
import { Header } from "@/components/Header";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { PaperPlaneRight, Plus, Trash, ChatCircleDots, Sparkle } from "@phosphor-icons/react";

function renderInlineMarkdown(text) {
  if (!text) return "";
  let html = text.replace(/[<>&]/g, c => ({"<":"&lt;",">":"&gt;","&":"&amp;"}[c]));
  html = html.replace(/```([a-z]*)\n([\s\S]*?)```/g, (_, l, code) => `<pre><code>${code}</code></pre>`);
  html = html.replace(/`([^`]+)`/g, "<code>$1</code>");
  html = html.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/^### (.*)$/gm, "<h3>$1</h3>");
  html = html.replace(/^## (.*)$/gm, "<h2>$1</h2>");
  html = html.replace(/(?:^- .*(?:\n|$))+/gm, (block) => {
    const items = block.trim().split("\n").map(l => `<li>${l.replace(/^- /, "")}</li>`).join("");
    return `<ul>${items}</ul>`;
  });
  html = html.replace(/(?:^\d+\. .*(?:\n|$))+/gm, (block) => {
    const items = block.trim().split("\n").map(l => `<li>${l.replace(/^\d+\. /, "")}</li>`).join("");
    return `<ol>${items}</ol>`;
  });
  html = html.split(/\n{2,}/).map(c =>
    /^<(h\d|ul|ol|pre)/.test(c.trim()) ? c : `<p>${c.replace(/\n/g, "<br/>")}</p>`
  ).join("\n");
  return html;
}

const SUGGESTIONS = [
  "How do I fix #N/A in VLOOKUP?",
  "Difference between SUMIF and SUMIFS?",
  "How do I build a pivot table from scratch?",
  "Best way to split full names into first/last?",
];

export default function Chat() {
  const [sessions, setSessions] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef(null);

  const loadSessions = async () => {
    const { data } = await api.get("/chat/sessions");
    setSessions(data);
    return data;
  };

  useEffect(() => { loadSessions(); }, []);

  useEffect(() => {
    if (activeSession) {
      api.get(`/chat/sessions/${activeSession}/messages`).then((r) => setMessages(r.data));
    } else {
      setMessages([]);
    }
  }, [activeSession]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, sending]);

  const send = async (text) => {
    const content = (text ?? input).trim();
    if (!content || sending) return;
    setSending(true);
    setInput("");
    // optimistic user message
    const optimistic = { id: "tmp", role: "user", content, created_at: new Date().toISOString() };
    setMessages((m) => [...m, optimistic]);
    try {
      const { data } = await api.post("/chat/message", { content, session_id: activeSession });
      setActiveSession(data.session_id);
      // refresh messages from server (replaces optimistic)
      const msgs = await api.get(`/chat/sessions/${data.session_id}/messages`);
      setMessages(msgs.data);
      await loadSessions();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to send");
      setMessages((m) => m.filter((x) => x.id !== "tmp"));
    } finally {
      setSending(false);
    }
  };

  const newChat = () => { setActiveSession(null); setMessages([]); };

  const removeSession = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm("Delete this conversation?")) return;
    await api.delete(`/chat/sessions/${id}`);
    if (activeSession === id) newChat();
    await loadSessions();
  };

  return (
    <div className="min-h-screen bg-white dark:bg-[#030712] flex flex-col">
      <Header />
      <main className="flex-1 max-w-[1400px] mx-auto w-full px-0 lg:px-10 py-0 lg:py-6 grid grid-cols-1 lg:grid-cols-12 gap-0 lg:gap-6" data-testid="chat-page">

        {/* Sidebar */}
        <aside className="lg:col-span-3 border-r lg:border border-foreground/15 bg-secondary/50 flex flex-col" data-testid="chat-sidebar">
          <div className="p-4 border-b border-foreground/15">
            <Button onClick={newChat} className="w-full rounded-none bg-klein hover:bg-[#002FA7]/90 text-white h-11" data-testid="new-chat-button">
              <Plus size={16} className="mr-2" /> New chat
            </Button>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-2">
              {sessions.length === 0 ? (
                <div className="overline text-muted-foreground p-4">NO CONVERSATIONS</div>
              ) : sessions.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setActiveSession(s.id)}
                  data-testid={`session-${s.id}`}
                  className={`group w-full text-left px-3 py-2 mb-1 border flex items-center justify-between gap-2 transition-colors ${
                    activeSession === s.id ? "bg-klein text-white border-klein" : "border-transparent hover:border-foreground/20"
                  }`}
                >
                  <span className="truncate text-sm">{s.title}</span>
                  <Trash
                    size={14}
                    onClick={(e) => removeSession(s.id, e)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0 cursor-pointer"
                  />
                </button>
              ))}
            </div>
          </ScrollArea>
        </aside>

        {/* Conversation */}
        <section className="lg:col-span-9 flex flex-col h-[calc(100vh-64px)] lg:h-[calc(100vh-64px-3rem)] border border-foreground/15">
          <div className="px-6 py-4 border-b border-foreground/15 flex items-center gap-2 bg-white dark:bg-[#111827]">
            <ChatCircleDots size={20} className="klein" weight="duotone" />
            <div>
              <div className="font-bold tracking-tight">XLSBuddy AI</div>
              <div className="text-xs text-muted-foreground">Powered by Groq (Llama 3.3)</div>
            </div>
          </div>

          <ScrollArea className="flex-1 bg-white">
            <div ref={scrollRef} className="p-6 space-y-6 max-w-3xl mx-auto" data-testid="chat-messages">
              {messages.length === 0 && !sending && (
                <div className="py-10">
                  <Sparkle size={36} weight="duotone" className="klein mb-4" />
                  <h2 className="text-2xl font-extrabold tracking-tight mb-2">Ask anything Excel.</h2>
                  <p className="text-muted-foreground mb-8">Formulas, errors, pivot tables, charts — your AI sidekick is ready.</p>
                  <div className="overline mb-3">TRY</div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {SUGGESTIONS.map((s, i) => (
                      <button
                        key={i}
                        onClick={() => send(s)}
                        data-testid={`suggestion-${i}`}
                        className="text-left text-sm border border-foreground/15 p-3 hover:border-klein hover:bg-secondary transition-colors"
                      >{s}</button>
                    ))}
                  </div>
                </div>
              )}
              {messages.map((m) => (
                <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[85%] px-4 py-3 ${
                    m.role === "user" ? "bg-klein text-white" : "bg-secondary text-foreground border border-foreground/10"
                  }`}>
                    {m.role === "user" ? (
                      <p className="whitespace-pre-wrap leading-relaxed">{m.content}</p>
                    ) : (
                      <div className="markdown" dangerouslySetInnerHTML={{ __html: renderInlineMarkdown(m.content) }} />
                    )}
                  </div>
                </div>
              ))}
              {sending && (
                <div className="flex justify-start">
                  <div className="bg-secondary border border-foreground/10 px-4 py-3 flex items-center gap-2">
                    <span className="w-2 h-2 bg-klein animate-pulse" />
                    <span className="w-2 h-2 bg-klein animate-pulse" style={{ animationDelay: "0.15s" }} />
                    <span className="w-2 h-2 bg-klein animate-pulse" style={{ animationDelay: "0.3s" }} />
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          <div className="border-t border-foreground/15 p-4 bg-white dark:bg-[#111827]">
            <div className="max-w-3xl mx-auto flex gap-2 items-end">
              <Textarea
                data-testid="chat-input"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
                }}
                placeholder="Ask anything about Excel… (Shift+Enter for newline)"
                className="rounded-none border-foreground/30 min-h-[48px] max-h-[160px] resize-none"
              />
              <Button
                onClick={() => send()}
                disabled={sending || !input.trim()}
                data-testid="chat-send-button"
                className="rounded-none bg-klein hover:bg-[#002FA7]/90 text-white h-12 w-12 p-0 shrink-0"
              >
                <PaperPlaneRight size={18} weight="bold" />
              </Button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
