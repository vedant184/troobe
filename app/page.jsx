"use client";

import { useEffect, useRef, useState } from "react";

const MODES = {
  combo: {
    label: "Combo",
    description:
      "Best of both worlds — balanced, accurate, and well-structured answers.",
  },
  chatgpt: {
    label: "ChatGPT style",
    description:
      "Conversational, creative, and friendly. Great for brainstorming and writing.",
  },
  gemini: {
    label: "Gemini style",
    description:
      "Concise, factual, and structured. Great for research and quick answers.",
  },
};

const SUGGESTIONS = [
  "Explain quantum computing in simple words",
  "Write a short poem about the monsoon",
  "Give me 5 business ideas for a college student",
  "Compare React vs Vue in 3 bullet points",
];

export default function Home() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState("combo");
  const [error, setError] = useState("");
  const scrollRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const autoResize = () => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 160) + "px";
  };

  const send = async (textOverride) => {
    const text = (textOverride ?? input).trim();
    if (!text || loading) return;

    setError("");
    const nextMessages = [...messages, { role: "user", content: text }];
    setMessages(nextMessages);
    setInput("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextMessages, mode }),
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody.error || `Request failed (${res.status})`);
      }

      const data = await res.json();
      setMessages((m) => [...m, { role: "assistant", content: data.reply }]);
    } catch (e) {
      setError(e.message || "Something went wrong. Please try again.");
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

  return (
    <div className="app">
      <header className="header">
        <div className="brand">
          <div className="logo">T</div>
          <div>
            <h1>Troobe</h1>
            <p>ChatGPT + Gemini ka combo, powered by Claude</p>
          </div>
        </div>

        <div className="mode-switch" role="tablist">
          {Object.entries(MODES).map(([key, val]) => (
            <button
              key={key}
              className={`mode-btn ${mode === key ? "active" : ""}`}
              onClick={() => setMode(key)}
              title={val.description}
            >
              {val.label}
            </button>
          ))}
        </div>
      </header>

      <div className="chat-wrap">
        <div className="messages" ref={scrollRef}>
          {messages.length === 0 && !loading && (
            <div className="empty-state">
              <h2>Welcome to Troobe</h2>
              <p>
                Ek hi jagah par ChatGPT aur Gemini jaisa experience — sawaal
                poocho, code likhwao, ideas maango, ya koi bhi topic samjho.
                Upar se mode bhi switch kar sakte ho.
              </p>
              <div className="suggestions">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    className="suggestion"
                    onClick={() => send(s)}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((m, i) => (
            <div key={i} className={`msg ${m.role === "user" ? "user" : "ai"}`}>
              <div className={`avatar ${m.role === "user" ? "user" : "ai"}`}>
                {m.role === "user" ? "U" : "AI"}
              </div>
              <div className="bubble">{m.content}</div>
            </div>
          ))}

          {loading && (
            <div className="msg ai">
              <div className="avatar ai">AI</div>
              <div className="bubble">
                <div className="typing">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          )}

          {error && <div className="error">{error}</div>}
        </div>

        <div className="input-bar">
          <textarea
            ref={textareaRef}
            className="input"
            placeholder="Apna sawaal yahan likho... (Enter to send, Shift+Enter for new line)"
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              autoResize();
            }}
            onKeyDown={handleKey}
            rows={1}
            disabled={loading}
          />
          <button
            className="send-btn"
            onClick={() => send()}
            disabled={loading || !input.trim()}
          >
            {loading ? "..." : "Send"}
          </button>
        </div>
      </div>

      <footer className="footer">
        troobe.com · Built with Next.js + Anthropic Claude API. Modes change
        the assistant's style, not the model.
      </footer>
    </div>
  );
}
