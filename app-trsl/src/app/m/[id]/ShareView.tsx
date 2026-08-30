"use client";

import { useEffect, useState } from "react";
import { addId, hasId, SENT_IDS_KEY, UNLOCKED_IDS_KEY } from "@/lib/client-flags";

type Phase = "checking" | "locked" | "paywall" | "processing" | "exiting" | "revealed" | "failed";

const CARD_STYLE: React.CSSProperties = {
  padding: 16,
  borderRadius: 8,
  background: "#1a1a1a",
};

async function fetchOriginal(id: string): Promise<string> {
  const res = await fetch(`/api/reveal/${id}`);
  if (!res.ok) throw new Error("reveal failed");
  const data = await res.json();
  return data.original as string;
}

export default function ShareView({ id, translated }: { id: string; translated: string }) {
  const [phase, setPhase] = useState<Phase>("checking");
  const [original, setOriginal] = useState<string | null>(null);

  // On mount: sender's own link, or an already-unlocked device, skips the
  // paywall entirely — no button, no processing beat (FINAL.md criteria 5/6).
  useEffect(() => {
    const auto = hasId(SENT_IDS_KEY, id) || hasId(UNLOCKED_IDS_KEY, id);
    if (!auto) {
      setPhase("locked");
      return;
    }
    fetchOriginal(id)
      .then((o) => {
        setOriginal(o);
        setPhase("revealed");
      })
      .catch(() => setPhase("locked"));
  }, [id]);

  function handleViewOriginal() {
    setPhase("paywall");
  }

  async function handleUnlock() {
    setPhase("processing");
    try {
      // The ~1s beat is a UI pace-setter, not the gate on `original` — the
      // real gate is the fetch itself. Wait for both so a slow network never
      // shows the swap before the original is actually in hand.
      const [o] = await Promise.all([
        fetchOriginal(id),
        new Promise((resolve) => setTimeout(resolve, 1000)),
      ]);
      setOriginal(o);
      addId(UNLOCKED_IDS_KEY, id);
      setPhase("exiting");
      setTimeout(() => setPhase("revealed"), 220);
    } catch {
      setPhase("failed");
    }
  }

  if (phase === "checking") {
    return (
      <div style={CARD_STYLE}>
        <p style={{ whiteSpace: "pre-wrap", margin: 0, fontSize: 17 }}>{translated}</p>
      </div>
    );
  }

  if (phase === "revealed" && original) {
    return (
      <div style={CARD_STYLE}>
        <p
          className="trsl-unlock-enter"
          style={{ whiteSpace: "pre-wrap", margin: 0, fontSize: 17 }}
        >
          {original}
        </p>
        <p style={{ margin: "12px 0 0", fontSize: 13, color: "#888" }}>
          sent to you as: {translated}
        </p>
      </div>
    );
  }

  // Paywall confirmation screen: receiver has already tapped "View original"
  // and now sees the cost + confirm action.
  if (phase === "paywall") {
    return (
      <div style={CARD_STYLE} className="trsl-unlock-exit">
        <p style={{ whiteSpace: "pre-wrap", margin: 0, fontSize: 17 }}>{translated}</p>
        <button
          onClick={handleUnlock}
          style={{
            width: "100%",
            marginTop: 16,
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
          Unlock the original — $1
        </button>
      </div>
    );
  }

  // locked / processing / exiting / failed all show the translated text +
  // unlock affordance, differing only in the button's state.
  return (
    <div style={CARD_STYLE} className={phase === "exiting" ? "trsl-unlock-exit" : undefined}>
      <p style={{ whiteSpace: "pre-wrap", margin: 0, fontSize: 17 }}>{translated}</p>
      <button
        onClick={handleViewOriginal}
        disabled={phase === "processing"}
        className={phase === "processing" ? "trsl-processing" : undefined}
        style={{
          width: "100%",
          marginTop: 16,
          padding: "12px 0",
          fontSize: 15,
          fontWeight: 600,
          borderRadius: 8,
          border: "1px solid #4f46e5",
          background: "transparent",
          color: "#a5b4fc",
          cursor: phase === "processing" ? "default" : "pointer",
        }}
      >
        {phase === "processing" ? "Unlocking…" : "View original — $1"}
      </button>
      {phase === "failed" && (
        <p style={{ color: "#f87171", marginTop: 12, fontSize: 13 }}>
          Couldn&apos;t unlock. Try again.
        </p>
      )}
    </div>
  );
}
