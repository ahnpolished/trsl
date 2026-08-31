"use client";

import { useRef, useState } from "react";
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

const CARD_BASE: React.CSSProperties = {
  padding: 16,
  borderRadius: 8,
  background: "#1a1a1a",
  cursor: "pointer",
};

export default function Home() {
  const [input, setInput] = useState("");
  const [context, setContext] = useState("");
  const [tone, setTone] = useState<Tone | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  // Pinned together so the shared "original" can never drift from the raw
  // text that actually produced these variants, even if the composer is
  // edited afterward. Do not read the composer/DOM for share — read this.
  const [translation, setTranslation] = useState<{ variants: string[]; sourceText: string } | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [shareUrl, setShareUrl] = useState<string>("");
  const [copied, setCopied] = useState(false);

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const contextRef = useRef<HTMLInputElement>(null);

  function currentInput(): { text: string; context: string; tone: Tone | null } {
    // Read directly from DOM refs to guarantee we use the values that are
    // actually in the inputs at the moment of interaction, not a potentially
    // stale closure over React state.
    return {
      text: inputRef.current?.value ?? input,
      context: contextRef.current?.value ?? context,
      tone,
    };
  }

  async function requestTranslate() {
    const { text: rawText, context: ctx, tone: t } = currentInput();
    const text = rawText.trim();
    if (!text) return;
    if (text.length > MAX_CHARS) {
      setStatus("error");
      setErrorMsg(`Message is too long (max ${MAX_CHARS} characters).`);
      return;
    }

    setStatus("loading");
    setTranslation(null);
    setSelectedIndex(0);
    setShareUrl("");
    setCopied(false);

    try {
      const res = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, context: ctx || undefined, tone: t || undefined }),
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
      if (!Array.isArray(data.variants) || data.variants.length !== 3) {
        setStatus("error");
        setErrorMsg("Unexpected response from server.");
        return;
      }
      setTranslation({ variants: data.variants, sourceText: text });
      setSelectedIndex(0);
      setStatus("idle");
    } catch {
      setStatus("error");
      setErrorMsg("Couldn't reach the server. Check your connection and try again.");
    }
  }

  async function handleShare() {
    const variants = translation?.variants;
    if (!variants || selectedIndex < 0 || selectedIndex >= variants.length) return;
    const translated = variants[selectedIndex];
    // Pinned to the exact raw text that produced these variants — never the
    // composer's live value, which may have been edited since translating.
    const original = translation.sourceText;

    setStatus("loading");

    let url: string;
    try {
      const res = await fetch("/api/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ translated, original }),
      });
      const data = await res.json();

      if (!res.ok) {
        setStatus("error");
        setErrorMsg(data.error || "Something went wrong. Try again.");
        return;
      }

      addId(SENT_IDS_KEY, data.id);
      url = `${window.location.origin}/m/${data.id}`;
      setShareUrl(url);
      setStatus("idle");
    } catch {
      setStatus("error");
      setErrorMsg("Couldn't reach the server. Check your connection and try again.");
      return;
    }

    // Share already succeeded and the link is on screen via `shareUrl`
    // (rendered below) — a native-share/clipboard hiccup past this point is
    // not a server error and must never be reported as one.
    try {
      if (navigator.share) {
        await navigator.share({ title: "trsl", url });
      } else {
        await navigator.clipboard.writeText(url);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // user cancelled share, or clipboard permission denied — the link
      // text/copy button below still gets it to the user.
    }
  }

  const isBusy = status === "loading";

  return (
    <main style={{ maxWidth: 480, margin: "0 auto", padding: "24px 16px" }}>
      <h1 style={{ fontSize: 28, marginBottom: 4 }}>trsl</h1>
      <p style={{ color: "#999", marginTop: 0, marginBottom: 20 }}>
        Say what you actually mean. We&apos;ll soften it.
      </p>

      <textarea
        ref={inputRef}
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
              disabled={isBusy}
              style={{
                padding: "6px 12px",
                fontSize: 14,
                borderRadius: 8,
                border: "1px solid #4f46e5",
                background: selected ? "#4f46e5" : "transparent",
                color: selected ? "#fff" : "#eee",
                cursor: isBusy ? "default" : "pointer",
              }}
            >
              {chip.label}
            </button>
          );
        })}
      </div>

      <input
        ref={contextRef}
        type="text"
        value={context}
        onChange={(e) => setContext(e.target.value)}
        maxLength={MAX_CONTEXT_CHARS}
        placeholder="+ Add context (who it's to, what happened)"
        disabled={isBusy}
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

      {!translation && (
        <button
          onClick={requestTranslate}
          disabled={isBusy || !input.trim()}
          className={isBusy ? "trsl-processing" : undefined}
          style={{
            width: "100%",
            marginTop: 12,
            padding: "14px 0",
            fontSize: 16,
            fontWeight: 600,
            borderRadius: 8,
            border: "none",
            background: isBusy ? "#555" : "#4f46e5",
            color: "#fff",
            cursor: isBusy || !input.trim() ? "default" : "pointer",
          }}
        >
          {isBusy ? "Translating…" : "Translate"}
        </button>
      )}

      {status === "error" && (
        <p style={{ color: "#f87171", marginTop: 16 }}>{errorMsg}</p>
      )}

      {status === "declined" && (
        <p style={{ color: "#f87171", marginTop: 16 }}>
          This message can&apos;t be translated as written.
        </p>
      )}

      {translation && (
        <div style={{ marginTop: 24 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }} role="radiogroup" aria-label="Choose a translation">
            {translation.variants.map((variant, index) => {
              const selected = index === selectedIndex;
              return (
                <div
                  key={`${variant}-${index}`}
                  role="radio"
                  aria-checked={selected}
                  tabIndex={0}
                  onClick={() => setSelectedIndex(index)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setSelectedIndex(index);
                    }
                  }}
                  style={{
                    ...CARD_BASE,
                    border: selected ? "2px solid #4f46e5" : "1px solid #333",
                    lineHeight: 1.5,
                  }}
                >
                  <p style={{ whiteSpace: "pre-wrap", margin: 0, fontSize: 16, color: "#eee" }}>
                    {variant}
                  </p>
                </div>
              );
            })}
          </div>

          <button
            onClick={requestTranslate}
            disabled={isBusy}
            className={isBusy ? "trsl-processing" : undefined}
            style={{
              width: "100%",
              marginTop: 12,
              padding: "12px 0",
              fontSize: 15,
              fontWeight: 600,
              borderRadius: 8,
              border: "1px solid #4f46e5",
              background: "transparent",
              color: "#eee",
              cursor: isBusy ? "default" : "pointer",
            }}
          >
            {isBusy ? "Regenerating…" : "Regenerate"}
          </button>

          <button
            onClick={handleShare}
            disabled={isBusy}
            className={`${isBusy ? "trsl-processing" : ""}${copied ? " trsl-copied-pulse" : ""}`}
            style={{
              width: "100%",
              marginTop: 12,
              padding: "12px 0",
              fontSize: 15,
              fontWeight: 600,
              borderRadius: 8,
              border: "none",
              background: isBusy ? "#555" : "#4f46e5",
              color: "#fff",
              cursor: isBusy ? "default" : "pointer",
            }}
          >
            {isBusy ? "Sharing…" : copied ? "Copied!" : "Share"}
          </button>

          {shareUrl && (
            <div style={{ marginTop: 12 }}>
              <p style={{ fontSize: 13, color: "#888", wordBreak: "break-all", margin: "0 0 8px" }}>
                {shareUrl}
              </p>
              <button
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(shareUrl);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  } catch {
                    // clipboard unavailable — the link text above is still there to copy by hand
                  }
                }}
                style={{
                  width: "100%",
                  padding: "12px 0",
                  fontSize: 15,
                  fontWeight: 600,
                  borderRadius: 8,
                  border: "1px solid #4f46e5",
                  background: "transparent",
                  color: "#eee",
                  cursor: "pointer",
                }}
              >
                {copied ? "Copied!" : "Copy link"}
              </button>
            </div>
          )}
        </div>
      )}
    </main>
  );
}
