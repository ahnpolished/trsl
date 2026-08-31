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

export default function Home() {
  const [input, setInput] = useState("");
  const [context, setContext] = useState("");
  const [tone, setTone] = useState<Tone | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [translation, setTranslation] = useState<{ variants: string[]; sourceText: string } | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [shareUrl, setShareUrl] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [editedText, setEditedText] = useState<string>("");
  const [isEditing, setIsEditing] = useState(false);

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const contextRef = useRef<HTMLInputElement>(null);
  const editRef = useRef<HTMLTextAreaElement>(null);

  function currentInput(): { text: string; context: string; tone: Tone | null } {
    return {
      text: inputRef.current?.value ?? input,
      context: contextRef.current?.value ?? context,
      tone,
    };
  }

  function handleCardSelect(index: number) {
    setSelectedIndex(index);
    setEditedText("");
    setIsEditing(false);
  }

  function handleEdit() {
    if (!translation) return;
    setEditedText(translation.variants[selectedIndex]);
    setIsEditing(true);
    setTimeout(() => editRef.current?.focus(), 0);
  }

  function handleEditChange(value: string) {
    if (value.length <= MAX_CHARS) {
      setEditedText(value);
    }
  }

  function handleResetEdit() {
    setEditedText("");
    setIsEditing(false);
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
    
    // Use edited text if available, otherwise use the original variant
    const translated = isEditing && editedText ? editedText : variants[selectedIndex];
    const original = translation!.sourceText;

    setStatus("loading");

    let url: string;
    try {
      const res = await fetch("/api/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          translated, 
          original,
          variants, // Send all variants so server can check if text was edited
          selectedIndex // So server knows which variant was selected
        }),
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

    try {
      if (navigator.share) {
        await navigator.share({ title: "trsl", url });
      } else {
        await navigator.clipboard.writeText(url);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // user cancelled share, or clipboard permission denied
    }
  }

  const isBusy = status === "loading";

  return (
    <main style={{ maxWidth: 480, margin: "0 auto", padding: "32px 20px" }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: "-0.02em", lineHeight: 1, marginBottom: 8 }}>trsl</h1>
      <p style={{ color: "#888", fontSize: 15, lineHeight: 1.4, marginTop: 0, marginBottom: 32 }}>
        Say what you actually mean. We&apos;ll soften it.
      </p>

      <textarea
        ref={inputRef}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        maxLength={MAX_CHARS}
        placeholder="Type it raw. We'll translate it."
        rows={6}
        className="trsl-textarea"
        style={{
          width: "100%",
          boxSizing: "border-box",
          fontSize: 16,
          lineHeight: 1.5,
          padding: 16,
          borderRadius: 8,
          border: "1px solid #262626",
          background: "#161616",
          color: "#eee",
          resize: "vertical",
        }}
      />
      <div style={{ textAlign: "right", fontSize: 12, color: "#666", letterSpacing: "0.3px", marginTop: 4 }}>
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
                padding: "8px 14px",
                fontSize: 14,
                fontWeight: 500,
                letterSpacing: "0.2px",
                borderRadius: 8,
                border: selected ? "1px solid #4f46e5" : "1px solid #333",
                background: selected ? "#4f46e5" : "transparent",
                color: selected ? "#fff" : "#888",
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
        className="trsl-input"
        style={{
          width: "100%",
          boxSizing: "border-box",
          fontSize: 16,
          lineHeight: 1.5,
          padding: "10px 16px",
          borderRadius: 8,
          border: "1px solid #262626",
          background: "#161616",
          color: "#eee",
          marginTop: 12,
        }}
      />
      {context.length > 0 && (
        <div style={{ textAlign: "right", fontSize: 12, color: "#666", letterSpacing: "0.3px", marginTop: 4 }}>
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
            fontSize: 15,
            fontWeight: 500,
            letterSpacing: "0.2px",
            borderRadius: 8,
            border: "none",
            background: isBusy ? "#2a2a2a" : "#4f46e5",
            color: isBusy ? "#666" : "#fff",
            cursor: isBusy || !input.trim() ? "default" : "pointer",
            opacity: isBusy || !input.trim() ? 0.6 : 1,
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
              const cardText = isEditing && selected ? editedText : variant;
              return (
                <div
                  key={`${variant}-${index}`}
                  style={{
                    padding: 16,
                    borderRadius: 8,
                    background: selected ? "#1c1a2e" : "#1a1a1a",
                    border: selected ? "2px solid #4f46e5" : "1px solid transparent",
                    lineHeight: 1.6,
                  }}
                >
                  {/* Label wraps only static text - never the textarea (ARIA: no focusable descendant in radio) */}
                  <label style={{ display: "block", cursor: isEditing && selected ? "default" : "pointer" }}>
                    <input
                      type="radio"
                      name="variant-selection"
                      checked={selected}
                      onChange={() => handleCardSelect(index)}
                      style={{
                        position: "absolute",
                        opacity: 0,
                        width: 0,
                        height: 0,
                        pointerEvents: "none",
                      }}
                    />
                    {/* Don't render static text when editing — textarea replaces it */}
                    {!(isEditing && selected) && (
                      <p style={{ whiteSpace: "pre-wrap", margin: 0, fontSize: 17, color: "#eee" }}>
                        {variant}
                      </p>
                    )}
                  </label>
                  {/* Textarea sits OUTSIDE the label, visually replacing the text when editing */}
                  {isEditing && selected && (
                    <textarea
                      ref={editRef}
                      value={editedText}
                      onChange={(e) => handleEditChange(e.target.value)}
                      maxLength={MAX_CHARS}
                      className="trsl-textarea"
                      style={{
                        width: "100%",
                        boxSizing: "border-box",
                        fontSize: 17,
                        lineHeight: 1.6,
                        padding: 0,
                        borderRadius: 0,
                        border: "none",
                        background: "transparent",
                        color: "#eee",
                        resize: "vertical",
                        minHeight: "3em",
                      }}
                    />
                  )}
                  {selected && (
                    <div style={{ textAlign: "right", marginTop: 8 }}>
                      {isEditing ? (
                        <button
                          type="button"
                          onClick={handleResetEdit}
                          style={{
                            background: "none",
                            border: "none",
                            color: "#888",
                            fontSize: 13,
                            cursor: "pointer",
                            padding: 0,
                          }}
                        >
                          Reset to AI draft
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={handleEdit}
                          style={{
                            background: "none",
                            border: "none",
                            color: "#888",
                            fontSize: 13,
                            cursor: "pointer",
                            padding: 0,
                          }}
                        >
                          Edit
                        </button>
                      )}
                    </div>
                  )}
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
              fontWeight: 500,
              letterSpacing: "0.2px",
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
            disabled={isBusy || (isEditing && !editedText.trim())}
            className={`${isBusy ? "trsl-processing" : ""}${copied ? " trsl-copied-pulse" : ""}`}
            style={{
              width: "100%",
              marginTop: 12,
              padding: "12px 0",
              fontSize: 15,
              fontWeight: 500,
              letterSpacing: "0.2px",
              borderRadius: 8,
              border: "none",
              background: isBusy || (isEditing && !editedText.trim()) ? "#2a2a2a" : "#4f46e5",
              color: isBusy || (isEditing && !editedText.trim()) ? "#666" : "#fff",
              cursor: isBusy || (isEditing && !editedText.trim()) ? "default" : "pointer",
              opacity: isBusy || (isEditing && !editedText.trim()) ? 0.6 : 1,
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
