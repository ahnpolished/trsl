"use client";

import { useEffect, useState, useRef } from "react";
import { addId, hasId, SENT_IDS_KEY, UNLOCKED_IDS_KEY } from "@/lib/client-flags";

type Phase = "gacha" | "locked" | "paywall" | "processing" | "revealed";

async function fetchOriginal(id: string): Promise<string> {
  const res = await fetch(`/api/reveal/${id}`);
  if (!res.ok) throw new Error("reveal failed");
  const data = await res.json();
  return data.original as string;
}

export default function ShareView({ id, translated }: { id: string; translated: string }) {
  const [phase, setPhase] = useState<Phase>("gacha");
  const [original, setOriginal] = useState<string | null>(null);
  const [muted, setMuted] = useState(true);
  const [showMessage, setShowMessage] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Start with gacha animation, then show message on card
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleVideoEnd = () => {
      // Keep video visible and show message overlay
      setShowMessage(true);
      
      // Check if this is the sender or already unlocked
      const auto = hasId(SENT_IDS_KEY, id) || hasId(UNLOCKED_IDS_KEY, id);
      if (auto) {
        fetchOriginal(id)
          .then((o) => {
            setOriginal(o);
            setPhase("revealed");
          })
          .catch(() => setPhase("locked"));
      } else {
        setPhase("locked");
      }
    };

    video.addEventListener("ended", handleVideoEnd);
    return () => video.removeEventListener("ended", handleVideoEnd);
  }, [id]);

  function handleViewOriginal() {
    setPhase("paywall");
  }

  async function handleUnlock() {
    setPhase("processing");
    try {
      const [o] = await Promise.all([
        fetchOriginal(id),
        new Promise((resolve) => setTimeout(resolve, 1000)),
      ]);
      setOriginal(o);
      addId(UNLOCKED_IDS_KEY, id);
      setPhase("revealed");
    } catch {
      setPhase("locked");
    }
  }

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
      onClick={() => setMuted(false)}
    >
      {/* Video background - stays visible throughout */}
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

      {/* Sound hint - only during gacha phase */}
      {muted && !showMessage && (
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

      {/* Message overlay on the card */}
      {showMessage && (
        <div
          className="trsl-gacha-enter"
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "min(80%, 400px)",
            textAlign: "center",
            color: "#fff",
            pointerEvents: "none",
          }}
        >
          <p
            style={{
              whiteSpace: "pre-wrap",
              margin: 0,
              fontSize: 18,
              lineHeight: 1.6,
              textShadow: "0 2px 12px rgba(0,0,0,0.8), 0 0 20px rgba(0,0,0,0.6)",
              fontWeight: 400,
            }}
          >
            {phase === "revealed" && original ? original : translated}
          </p>
          
          {phase === "revealed" && original && (
            <p
              style={{
                margin: "16px 0 0",
                fontSize: 14,
                color: "rgba(255,255,255,0.7)",
                textShadow: "0 2px 8px rgba(0,0,0,0.8)",
              }}
            >
              sent to you as: {translated}
            </p>
          )}
        </div>
      )}

      {/* Bottom controls */}
      {showMessage && (
        <div
          style={{
            position: "absolute",
            bottom: 60,
            left: "50%",
            transform: "translateX(-50%)",
            textAlign: "center",
          }}
        >
          {phase === "locked" && (
            <button
              onClick={handleViewOriginal}
              style={{
                background: "transparent",
                border: "none",
                color: "rgba(255,255,255,0.6)",
                fontSize: 14,
                cursor: "pointer",
                textDecoration: "underline",
                padding: "8px 16px",
                fontFamily: "system-ui, sans-serif",
                pointerEvents: "auto",
              }}
            >
              view original
            </button>
          )}

          {phase === "paywall" && (
            <div style={{ pointerEvents: "auto" }}>
              <button
                onClick={handleUnlock}
                style={{
                  background: "rgba(255,255,255,0.1)",
                  border: "1px solid rgba(255,255,255,0.3)",
                  color: "#fff",
                  fontSize: 16,
                  fontWeight: 500,
                  cursor: "pointer",
                  padding: "12px 32px",
                  borderRadius: 8,
                  backdropFilter: "blur(10px)",
                  fontFamily: "system-ui, sans-serif",
                }}
              >
                Unlock original — $1
              </button>
            </div>
          )}

          {phase === "processing" && (
            <div
              style={{
                color: "rgba(255,255,255,0.6)",
                fontSize: 14,
                fontFamily: "system-ui, sans-serif",
              }}
            >
              unlocking…
            </div>
          )}
        </div>
      )}
    </div>
  );
}
