import { ImageResponse } from "next/og";

export const alt = "SnipAudio — free online MP3 cutter that runs in your browser";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Decorative waveform bar heights (percent)
const BARS = [30, 55, 40, 75, 60, 90, 70, 100, 80, 65, 95, 50, 85, 60, 75, 45, 70, 55, 40, 30];

const OpengraphImage = () =>
  new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          color: "white",
          background:
            "radial-gradient(circle at 15% 0%, rgba(124,58,237,0.55), transparent 55%), radial-gradient(circle at 100% 10%, rgba(192,38,211,0.4), transparent 50%), #07060b",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18, fontSize: 36, fontWeight: 600 }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 18,
              background: "linear-gradient(135deg, #8b5cf6, #c026d3)",
              display: "flex",
            }}
          />
          SnipAudio
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ fontSize: 76, fontWeight: 700, letterSpacing: -2, lineHeight: 1.05 }}>
            Free online MP3 cutter
          </div>
          <div style={{ fontSize: 32, color: "#c4b5fd" }}>
            Trim, fade & export in your browser — no uploads, no signup.
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "flex-end", gap: 10, height: 120 }}>
          {BARS.map((h, i) => (
            <div
              key={i}
              style={{
                width: 18,
                height: `${h}%`,
                borderRadius: 9,
                background: "linear-gradient(180deg, #e879f9, #7c3aed)",
              }}
            />
          ))}
        </div>
      </div>
    ),
    size
  );

export default OpengraphImage;
