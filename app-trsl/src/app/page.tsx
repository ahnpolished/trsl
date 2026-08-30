"use client";

import { useState } from "react";
import { addId, SENT_IDS_KEY } from "@/lib/client-flags";

const MAX_CHARS = 1000;
const MAX_CONTEXT_CHARS = 200;

type Status = "idle" | "loading" | "declined" | "error";
type Tone = "gentle" | "direct" | "playful" | "honest" | "boundary";

const TONE_CHIPS: { value: Tone; label: string }[] = [
  { value: "gentle", label: "Gentle" },
  { value: "direct", label: "Direct but kind" },
  { value: "playful", label: "Playful" },
  { value: "honest", label: "Just being honest" },
  { value: "boundary", label: "Setting a boundary" },
];

export default function Home() {
  const [input, setInput] = useState("");
  const [context, setContext] = useState("");
  const [tone, setTone] = useState<Tone | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [result, setResult] = useState<{ id: string; translated: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const shareUrl = result && typeof window !== "undefined"
    ? `${window.location.origin}/m/${result.id}`
    : "";

  async function handleTranslate() {
    const text = input.trim();
    if (!text) return;
    if (text.length > MAX_CHARS) {
      setStatus("error");
      setErrorMsg(`Message is too long (max ${MAX_CHARS} characters).`);
      return;
    }

    setStatus("loading");
    setResult(null);
    setCopied(false);

    try {
      const res = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, context: context || undefined, tone: tone || undefined }),
      });
      const data = await res.json();

      if (!res.ok) {
        setStatus("error");
        setErrorMsg(data.error || "Something went wrong. Try again.");
        return;
      }
      if (data.declined) {
        setStatus("declined");
        return;
      }
      addId(SENT_IDS_KEY, data.id);
      setResult({ id: data.id, translated: data.translated });
      setStatus("idle");
    } catch {
      setStatus("error");
      setErrorMsg("Couldn't reach the server. Check your connection and try again.");
    }
  }

  async function handleShare() {
    if (!shareUrl) return;
    if (navigator.share) {
      try {
        await navigator.share({ title: "trsl", url: shareUrl });
        return;
      } catch {
        // user cancelled or share failed — fall through to clipboard
      }
    }
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <main style={{ maxWidth: 480, margin: "0 auto", padding: "24px 16px" }}>
      <h1 style={{ fontSize: 28, marginBottom: 4 }}>trsl</h1>
      <p style={{ color: "#999", marginTop: 0, marginBottom: 20 }}>
        Say what you actually mean. We&apos;ll soften it.
      </p>

      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        maxLength={MAX_CHARS}
        placeholder="Type it raw. We'll translate it."
        rows={6}
        style={{
          width: "100%",
          boxSizing: "border-box",
          fontSize: 16,
          padding: 12,
          borderRadius: 8,
          border: "1px solid #333",
          background: "#1a1a1a",
          color: "#eee",
          resize: "vertical",
        }}
      />
      <div style={{ textAlign: "right", fontSize: 12, color: "#666", marginTop: 4 }}>
        {input.length}/{MAX_CHARS}
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
        {TONE_CHIPS.map((chip) => {
          const selected = tone === chip.value;
          return (
            <button
              key={chip.value}
              type="button"
              onClick={() => setTone(selected ? null : chip.value)}
              style={{
                padding: "6px 12px",
                fontSize: 14,
                borderRadius: 8,
                border: "1px solid #4f46e5",
                background: selected ? "#4f46e5" : "transparent",
                color: selected ? "#fff" : "#eee",
                cursor: "pointer",
              }}
            >
              {chip.label}
            </button>
          );
        })}
      </div>

      <input
        type="text"
        value={context}
        onChange={(e) => setContext(e.target.value)}
        maxLength={MAX_CONTEXT_CHARS}
        placeholder="+ Add context (who it's to, what happened)"
        style={{
          width: "100%",
          boxSizing: "border-box",
          fontSize: 16,
          padding: "10px 12px",
          borderRadius: 8,
          border: "1px solid #333",
          background: "#1a1a1a",
          color: "#eee",
          marginTop: 12,
        }}
      />
      {context.length > 0 && (
        <div style={{ textAlign: "right", fontSize: 12, color: "#666", marginTop: 4 }}>
          {context.length}/{MAX_CONTEXT_CHARS}
        </div>
      )}

      <button
        onClick={handleTranslate}
        disabled={status === "loading" || !input.trim()}
        style={{
          width: "100%",
          marginTop: 12,
          padding: "14px 0",
          fontSize: 16,
          fontWeight: 600,
          borderRadius: 8,
          border: "none",
          background: status === "loading" ? "#555" : "#4f46e5",
          color: "#fff",
          cursor: status === "loading" ? "default" : "pointer",
        }}
      >
        {status === "loading" ? "Translating…" : "Translate"}
      </button>

      {status === "error" && (
        <p style={{ color: "#f87171", marginTop: 16 }}>{errorMsg}</p>
      )}

      {status === "declined" && (
        <p style={{ color: "#f87171", marginTop: 16 }}>
          This message can&apos;t be translated as written.
        </p>
      )}

      {result && (
        <div
          key={result.id}
          style={{ marginTop: 24, padding: 16, borderRadius: 8, background: "#1a1a1a" }}
        >
          <p className="trsl-result-enter" style={{ whiteSpace: "pre-wrap", marginTop: 0 }}>
            {result.translated}
          </p>
          <button
            onClick={handleShare}
            className={`trsl-share-enter${copied ? " trsl-copied-pulse" : ""}`}
            style={{
              width: "100%",
              padding: "12px 0",
              fontSize: 15,
              fontWeight: 600,
              borderRadius: 8,
              border: "1px solid #4f46e5",
              background: "transparent",
              color: "#a5b4fc",
              cursor: "pointer",
            }}
          >
            {copied ? "Copied!" : "Share"}
          </button>
        </div>
      )}
    </main>
  );
}
