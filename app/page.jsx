"use client";

import { useEffect, useRef, useState } from "react";

const MODES = {
  combo: {
    label: "Combo",
    description: "Best of both worlds — balanced, accurate answers.",
  },
  chatgpt: {
    label: "ChatGPT",
    description: "Conversational, creative, and friendly.",
  },
  gemini: {
    label: "Gemini",
    description: "Concise, factual, and structured.",
  },
  image: {
    label: "Image",
    description: "Generate AI images from a text prompt (free).",
  },
};

const SUGGESTIONS = {
  chat: [
    "Explain quantum computing in simple words",
    "Who won the latest cricket world cup?",
    "Give me 5 business ideas for a college student",
    "What's the difference between AI and ML?",
  ],
  image: [
    "A cute cat astronaut on the moon, digital art",
    "A traditional Indian palace at sunset, photorealistic",
    "Futuristic cyberpunk city with neon lights",
    "A peaceful Japanese garden with cherry blossoms",
  ],
};

export default function Home() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState("combo");
  const [error, setError] = useState("");
  const scrollRef = useRef(null);
  const textareaRef = useRef(null);

  const isImageMode = mode === "image";

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
      if (isImageMode) {
        const res = await fetch("/api/image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: text }),
        });
        if (!res.ok) {
          const errBody = await res.json().catch(() => ({}));
          throw new Error(errBody.error || `Request failed (${res.status})`);
        }
        const data = await res.json();
        setMessages((m) => [
          ...m,
          {
            role: "assistant",
            content: data.reply || "Image generated:",
            imageUrl: data.imageUrl,
          },
        ]);
      } else {
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
        setMessages((m) => [
          ...m,
          { role: "assistant", content: data.reply },
        ]);
      }
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

  const placeholder = isImageMode
    ? "Describe the image you want to create... (e.g. 'cat on the moon')"
    : "Apna sawaal yahan likho... (Enter to send, Shift+Enter for new line)";

  const suggestions = isImageMode ? SUGGESTIONS.image : SUGGESTIONS.chat;

  return (
    <div className="app">
      <header className="header">
        <div className="brand">
          <div className="logo">T</div>
          <div>
            <h1>Troobe</h1>
            <p>ChatGPT + Gemini ka combo + free image generation</p>
          </div>
        </div>

        <div className="mode-switch" role="tablist">
          {Object.entries(MODES).map(([key, val]) => (
            <button
              key={key}
              className={`mode-btn ${mode === key ? "active" : ""}`}
              onClick={() => {
                setMode(key);
                setError("");
              }}
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
              <h2>{isImageMode ? "Generate AI Images" : "Welcome to Troobe"}</h2>
              <p>
                {isImageMode
                  ? "Free image generation — no API key needed. Describe what you want and Troobe will create it."
                  : "Sawaal poocho, code likhwao, ideas maango, ya koi bhi topic samjho. Mode switch karke alag style mein answer milega. Image mode mein AI images bhi bana sakte ho — bilkul free."}
              </p>
              <div className="suggestions">
                {suggestions.map((s) => (
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
              <div className="bubble">
                {m.content}
                {m.imageUrl && (
                  <img
                    src={m.imageUrl}
                    alt={m.content}
                    className="generated-image"
                    loading="lazy"
                  />
                )}
              </div>
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
                {isImageMode && (
                  <div className="image-loading-text">
                    Generating image... (10-30 sec)
                  </div>
                )}
              </div>
            </div>
          )}

          {error && <div className="error">{error}</div>}
        </div>

        <div className="input-bar">
          <textarea
            ref={textareaRef}
            className="input"
            placeholder={placeholder}
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
            {loading ? "..." : isImageMode ? "Generate" : "Send"}
          </button>
        </div>
      </div>

      <footer className="footer">
        troobe.com · Built with Next.js + Gemini + Pollinations.ai · 100% free
      </footer>
    </div>
  );
}
