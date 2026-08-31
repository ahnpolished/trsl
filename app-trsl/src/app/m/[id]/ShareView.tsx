"use client";

import { useEffect, useState, useRef } from "react";
import { addId, hasId, SENT_IDS_KEY, UNLOCKED_IDS_KEY } from "@/lib/client-flags";

type Phase = "gacha" | "checking" | "locked" | "paywall" | "processing" | "exiting" | "revealed" | "failed";

const CARD_STYLE: React.CSSProperties = {
  padding: 16,
  borderRadius: 8,
  background: "#1a1a1a",
  lineHeight: 1.6,
};

const SECONDARY_BUTTON_TEXT = "#eeeeee";

async function fetchOriginal(id: string): Promise<string> {
  const res = await fetch(`/api/reveal/${id}`);
  if (!res.ok) throw new Error("reveal failed");
  const data = await res.json();
  return data.original as string;
}

export default function ShareView({ id, translated }: { id: string; translated: string }) {
  const [phase, setPhase] = useState<Phase>("gacha");
  const [original, setOriginal] = useState<string | null>(null);
  const [gachaFading, setGachaFading] = useState(false);
  const [muted, setMuted] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Start with gacha animation, then proceed to normal flow
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleVideoEnd = () => {
      // Fade out video, then show content
      setGachaFading(true);
      setTimeout(() => {
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
      }, 400);
    };

    video.addEventListener("ended", handleVideoEnd);
    return () => video.removeEventListener("ended", handleVideoEnd);
  }, [id]);

  function handleViewOriginal() {
    setPhase("exiting");
    setTimeout(() => setPhase("paywall"), 220);
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

  if (phase === "gacha") {
    return (
      <div
        style={{
          position: "fixed",
          inset: 0,
          width: "100vw",
          height: "100vh",
          zIndex: 9999,
          background: "#000",
        }}
        className={gachaFading ? "trsl-gacha-exit" : undefined}
        onClick={() => setMuted(false)}
      >
        <video
          ref={videoRef}
          src="/gacha-reveal.mp4"
          autoPlay
          playsInline
          muted={muted}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            display: "block",
          }}
        />
        {muted && (
          <div
            style={{
              position: "absolute",
              bottom: 40,
              left: "50%",
              transform: "translateX(-50%)",
              color: "rgba(255,255,255,0.5)",
              fontSize: 12,
              fontFamily: "system-ui, sans-serif",
              letterSpacing: "0.5px",
              pointerEvents: "none",
            }}
          >
            tap for sound
          </div>
        )}
      </div>
    );
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
  // and now sees the cost + confirm action. The locked card softens out while
  // this paywall card resolves in underneath, same position.
  if (phase === "paywall") {
    return (
      <div style={CARD_STYLE} className="trsl-unlock-enter">
        <p style={{ whiteSpace: "pre-wrap", margin: 0, fontSize: 17 }}>{translated}</p>
        <button
          onClick={handleUnlock}
          style={{
            width: "100%",
            marginTop: 16,
            padding: "12px 0",
            fontSize: 15,
            fontWeight: 500,
            letterSpacing: "0.2px",
            borderRadius: 8,
            border: "1px solid #4f46e5",
            background: "transparent",
            color: SECONDARY_BUTTON_TEXT,
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
    <div
      style={CARD_STYLE}
      className={phase === "exiting" ? "trsl-unlock-exit" : phase === "locked" ? "trsl-gacha-enter" : undefined}
    >
      <p style={{ whiteSpace: "pre-wrap", margin: 0, fontSize: 17 }}>{translated}</p>
      <button
        onClick={handleViewOriginal}
        disabled={phase === "processing"}
        className={phase === "processing" ? "trsl-processing" : undefined}
        style={{
          marginTop: 12,
          fontSize: 12,
          fontWeight: 400,
          background: "transparent",
          border: "none",
          color: "#666",
          cursor: phase === "processing" ? "default" : "pointer",
          textDecoration: "underline",
          padding: 0,
        }}
      >
        {phase === "processing" ? "unlocking…" : "view original"}
      </button>
      {phase === "failed" && (
        <p style={{ color: "#f87171", marginTop: 12, fontSize: 13 }}>
          Couldn&apos;t unlock. Try again.
        </p>
      )}
    </div>
  );
}
