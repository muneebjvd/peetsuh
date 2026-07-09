"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { Send } from "lucide-react";
import Nav from "@/components/Nav";
import { ALL_ITEMS } from "@/lib/menu-data";

interface Message {
  id: string;
  role: "bot" | "user";
  text: string;
  suggestions?: string[];
}

// ── Session ID (tab-scoped, not page-reload-scoped) ──────────────
const SESSION_KEY = "peetsuh_chat_session";
const MESSAGES_KEY = "peetsuh_chat_messages";

function getSessionId(): string {
  if (typeof window === "undefined") return "ssr";
  let id = localStorage.getItem(SESSION_KEY);
  if (!id) {
    id = `sess_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    localStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

const WELCOME: Message = {
  id: "welcome",
  role: "bot",
  text: "Welcome to peetsuh! I can help you place an order, tell you about our deals, or book a table.\n\nWhat would you like to do?",
  suggestions: ["Place an order", "See deals", "Book a table", "Show menu"],
};

// ── Hover popup: sort items longest-name-first to avoid partial matches ──
const SORTED_ITEMS = [...ALL_ITEMS].sort((a, b) => b.name.length - a.name.length);

// Escape special regex chars in item names
const escapeRe = (s: string) => s.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&");

// Build a single regex that matches any item name (case-insensitive)
const ITEM_RE = new RegExp(
  `(${SORTED_ITEMS.map((i) => escapeRe(i.name)).join("|")})`,
  "gi"
);

interface HoverState {
  image: string;
  name: string;
}

function MessageContent({
  text,
  onHover,
}: {
  text: string;
  onHover: (state: HoverState | null) => void;
}) {
  const parts = text.split(ITEM_RE);
  if (parts.length === 1) {
    return <span style={{ whiteSpace: "pre-wrap" }}>{text}</span>;
  }

  return (
    <span style={{ whiteSpace: "pre-wrap" }}>
      {parts.map((part, i) => {
        const matched = SORTED_ITEMS.find(
          (item) => item.name.toLowerCase() === part.toLowerCase()
        );
        if (matched) {
          return (
            <span
              key={i}
              className="hoverable-item"
              onMouseEnter={() =>
                onHover({ image: matched.image, name: matched.name })
              }
              onMouseLeave={() => onHover(null)}
            >
              {part}
            </span>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </span>
  );
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [hovered, setHovered] = useState<HoverState | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // ── Hydrate from localStorage on mount ──
  useEffect(() => {
    const stored = localStorage.getItem(MESSAGES_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as Message[];
        if (parsed.length > 0) {
          setMessages(parsed);
          return;
        }
      } catch {
        /* ignore parse errors */
      }
    }
    setMessages([WELCOME]);
  }, []);

  // ── Persist messages to localStorage whenever they change ──
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem(MESSAGES_KEY, JSON.stringify(messages));
    }
  }, [messages]);

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const send = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || loading) return;

      const userMsg: Message = { id: `u_${Date.now()}`, role: "user", text: trimmed };
      setMessages((prev) => [...prev, userMsg]);
      setInput("");
      setLoading(true);

      try {
        const sessionId = getSessionId();
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId, message: trimmed }),
        });
        const data = await res.json();

        if (data.response) {
          const { text: botText, suggestions, finalOrder } = data.response;

          if (finalOrder) {
            try {
              const orderRes = await fetch("/api/orders", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  contact: finalOrder.contact,
                  items: finalOrder.cart,
                  total: finalOrder.total,
                  channel: "chat",
                  sessionId,
                }),
              });
              const orderData = await orderRes.json();
              const ref = orderData.orderRef ?? "N/A";

              const confirmMsg: Message = {
                id: `b_${Date.now()}`,
                role: "bot",
                text: `${botText}\n\nYour order reference: ${ref}\nKeep this safe — we may ask for it on delivery.`,
                suggestions: ["New order", "See deals"],
              };
              setMessages((prev) => [...prev, confirmMsg]);
              // Clear messages after order so next visit starts fresh
              localStorage.removeItem(MESSAGES_KEY);
              localStorage.removeItem(SESSION_KEY);
            } catch {
              setMessages((prev) => [
                ...prev,
                { id: `b_${Date.now()}`, role: "bot", text: botText, suggestions },
              ]);
            }
          } else {
            setMessages((prev) => [
              ...prev,
              { id: `b_${Date.now()}`, role: "bot", text: botText, suggestions },
            ]);
          }
        }
      } catch {
        setMessages((prev) => [
          ...prev,
          { id: `b_${Date.now()}`, role: "bot", text: "Something went wrong. Please try again." },
        ]);
      } finally {
        setLoading(false);
        inputRef.current?.focus();
      }
    },
    [loading]
  );

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send(input);
    }
  };

  return (
    <>
      <Nav />
      {/* Hover image popup — fixed, right side, vertically centred */}
      {hovered && (
        <div className="item-hover-popup">
          <img src={hovered.image} alt={hovered.name} />
          <div className="item-hover-popup__label">{hovered.name}</div>
        </div>
      )}

      <div className="chat-page">
        {/* Sidebar */}
        <aside className="chat-sidebar">
          <div className="chat-sidebar__badge">Rule-based engine</div>
          <h2 className="chat-sidebar__title">peetsuh Chat</h2>
          <p className="chat-sidebar__sub">Order by conversation — no AI, no LLM.</p>
          <div className="chat-sidebar__info">
            <p>Try saying:</p>
            <p style={{ marginTop: "0.75rem", color: "var(--white)", fontSize: "0.82rem" }}>&ldquo;I want a large BBQ chicken pizza&rdquo;</p>
            <p style={{ color: "var(--white)", fontSize: "0.82rem" }}>&ldquo;lanch deel&rdquo; (typos work)</p>
            <p style={{ color: "var(--white)", fontSize: "0.82rem" }}>&ldquo;show me the buffet&rdquo;</p>
            <p style={{ color: "var(--white)", fontSize: "0.82rem" }}>&ldquo;order frize&rdquo;</p>
          </div>
        </aside>

        {/* Chat main */}
        <main className="chat-main">
          <div className="chat-messages">
            {messages.map((msg) => (
              <div key={msg.id} className={`chat-msg chat-msg--${msg.role}`}>
                {msg.role === "bot" && (
                  <div className="chat-msg__avatar">P</div>
                )}
                <div>
                  <div className="chat-msg__bubble">
                    {msg.role === "bot" ? (
                      <MessageContent text={msg.text} onHover={setHovered} />
                    ) : (
                      msg.text
                    )}
                  </div>
                  {msg.suggestions && msg.role === "bot" && (
                    <div className="chat-suggestions">
                      {msg.suggestions.map((s) => (
                        <button key={s} className="chat-suggestion-btn" onClick={() => send(s)}>
                          {s}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="chat-msg chat-msg--bot">
                <div className="chat-msg__avatar">P</div>
                <div className="chat-msg__bubble">
                  <div className="chat-typing">
                    <span /><span /><span />
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <div className="chat-input-row">
            <input
              ref={inputRef}
              className="chat-input"
              placeholder="Type your message..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              disabled={loading}
              aria-label="Chat message input"
            />
            <button
              className="chat-send-btn"
              onClick={() => send(input)}
              disabled={loading || !input.trim()}
              aria-label="Send message"
            >
              <Send size={18} />
            </button>
          </div>
        </main>
      </div>
    </>
  );
}
