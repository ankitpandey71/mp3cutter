import { ImageResponse } from "next/og";

export const size = { width: 512, height: 512 };
export const contentType = "image/png";

// Scissor-blade mark on the brand gradient; mirrors the opengraph-image palette.
const Icon = () =>
  new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "center",
          gap: 26,
          padding: 96,
          background: "linear-gradient(135deg, #8b5cf6, #c026d3)",
        }}
      >
        {[45, 80, 100, 65, 35].map((h, i) => (
          <div
            key={i}
            style={{
              width: 44,
              height: `${h}%`,
              borderRadius: 22,
              background: "white",
            }}
          />
        ))}
      </div>
    ),
    size
  );

export default Icon;
