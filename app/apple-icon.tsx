import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

// iOS masks and never adds padding, so this keeps a solid opaque background.
const AppleIcon = () =>
  new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "center",
          gap: 9,
          padding: 34,
          background: "linear-gradient(135deg, #8b5cf6, #c026d3)",
        }}
      >
        {[45, 80, 100, 65, 35].map((h, i) => (
          <div
            key={i}
            style={{ width: 15, height: `${h}%`, borderRadius: 8, background: "white" }}
          />
        ))}
      </div>
    ),
    size
  );

export default AppleIcon;
