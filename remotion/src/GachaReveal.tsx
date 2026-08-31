import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";

export const GachaReveal: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // 0.0s - 0.8s: 정적 → 긴장감 (frame 0-24)
  // 0.8s - 1.0s: 암시 (frame 24-30)
  // 1.0s - 2.0s: 빛 폭발 (frame 30-60)
  // 2.0s - 3.5s: 빛 수그러들며 형태 형성 (frame 60-105)
  // 3.5s - 5.0s: 카드 안착 + shimmer (frame 105-150)
  // 5.0s - 6.0s: 잔여 shimmer (frame 150-180)

  // 배경 어둠 (초반)
  const backgroundOpacity = interpolate(frame, [0, 30, 60], [0, 0, 0.3], {
    extrapolateRight: "clamp",
  });

  // 빛 폭발 (frame 30-60)
  const lightBurstScale = spring({
    frame: frame - 30,
    fps,
    config: { damping: 50, stiffness: 100, mass: 0.5 },
  });
  const lightBurstOpacity = interpolate(frame, [30, 45, 60], [0, 1, 0.6], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // 카드 형성 (frame 60-105)
  const cardScale = spring({
    frame: frame - 60,
    fps,
    config: { damping: 80, stiffness: 120, mass: 0.8 },
  });
  const cardOpacity = interpolate(frame, [60, 90], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Legendary 뱃지 (frame 105-120)
  const badgeOpacity = interpolate(frame, [105, 120], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Shimmer 효과 (frame 105-180, 반복)
  const shimmerPosition = interpolate(frame % 60, [0, 30, 60], [-100, 100, 200], {
    extrapolateRight: "extend",
  });

  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      {/* 배경 어둠 레이어 */}
      <AbsoluteFill
        style={{
          backgroundColor: "#000",
          opacity: backgroundOpacity,
        }}
      />

      {/* 빛 폭발 효과 */}
      <AbsoluteFill
        style={{
          opacity: lightBurstOpacity,
          transform: `scale(${lightBurstScale})`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* God ray (수직) */}
        <div
          style={{
            position: "absolute",
            width: "200%",
            height: "20px",
            background: "linear-gradient(90deg, transparent, #ffd700, transparent)",
            transform: "rotate(90deg)",
            filter: "blur(10px)",
          }}
        />
        {/* God ray (수평) */}
        <div
          style={{
            position: "absolute",
            width: "200%",
            height: "20px",
            background: "linear-gradient(90deg, transparent, #ffd700, transparent)",
            filter: "blur(10px)",
          }}
        />
        {/* 중앙 빛 */}
        <div
          style={{
            width: "600px",
            height: "600px",
            borderRadius: "50%",
            background: "radial-gradient(circle, #ffd700 0%, transparent 70%)",
            filter: "blur(40px)",
          }}
        />
      </AbsoluteFill>

      {/* 카드 */}
      <AbsoluteFill
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          opacity: cardOpacity,
          transform: `scale(${cardScale})`,
        }}
      >
        <div
          style={{
            width: "600px",
            height: "800px",
            background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)",
            border: "8px solid #ffd700",
            borderRadius: "20px",
            boxShadow: "0 0 60px rgba(255, 215, 0, 0.6), 0 0 100px rgba(255, 215, 0, 0.4)",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Shimmer 효과 */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: `${shimmerPosition}%`,
              width: "100%",
              height: "100%",
              background: "linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent)",
              transform: "skewX(-20deg)",
            }}
          />
        </div>
      </AbsoluteFill>

      {/* Legendary 뱃지 */}
      <AbsoluteFill
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "flex-start",
          padding: "420px 0 0 240px",
          opacity: badgeOpacity,
        }}
      >
        <div
          style={{
            background: "linear-gradient(135deg, #ffd700 0%, #ffed4e 100%)",
            padding: "12px 24px",
            borderRadius: "8px",
            fontFamily: "Arial, sans-serif",
            fontSize: "32px",
            fontWeight: "bold",
            color: "#000",
            boxShadow: "0 4px 20px rgba(255, 215, 0, 0.8)",
          }}
        >
          ★ LEGENDARY
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
