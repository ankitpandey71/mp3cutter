"use client";

/**
 * Replaces the whole document when the root layout itself fails, so it has to
 * ship its own <html>/<body> and inline styling — global CSS is not applied here.
 */
const GlobalError = ({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) => (
  <html lang="en">
    <body
      style={{
        margin: 0,
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 20,
        padding: 24,
        textAlign: "center",
        background: "#07060b",
        color: "#fafafa",
        fontFamily: "system-ui, -apple-system, Segoe UI, sans-serif",
      }}
    >
      <title>Something went wrong | SnipAudio</title>
      <h1 style={{ fontSize: 28, fontWeight: 600, margin: 0 }}>
        SnipAudio couldn&apos;t load
      </h1>
      <p style={{ margin: 0, color: "#a1a1aa", fontSize: 14, maxWidth: 420 }}>
        An unexpected error stopped the page from rendering. Reloading usually fixes it.
      </p>
      {error.digest && (
        <p style={{ margin: 0, color: "#52525b", fontSize: 12, fontFamily: "monospace" }}>
          Reference: {error.digest}
        </p>
      )}
      <button
        onClick={() => retry()}
        style={{
          border: "none",
          cursor: "pointer",
          borderRadius: 12,
          padding: "12px 24px",
          fontSize: 14,
          fontWeight: 600,
          color: "white",
          background: "linear-gradient(135deg, #8b5cf6, #c026d3)",
        }}
      >
        Try again
      </button>
    </body>
  </html>
);

export default GlobalError;
