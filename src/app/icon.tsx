import { ImageResponse } from "next/og";

// Replaces the default Next.js favicon with the brand mark — Hostinger
// violet rounded square + white chat-square glyph — matching the
// sidebar logo in `src/components/layout/sidebar.tsx`. Next.js renders
// this at build time and auto-injects <link rel="icon"> into <head>.
//
// This route takes precedence over src/app/favicon.ico, which is the
// Next.js default and can stay on disk harmlessly (or be removed).

export const runtime = "edge";
export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "radial-gradient(circle at 30% 20%, #2A2312 0%, #0D0C09 100%)",
          borderRadius: 8,
          border: "1px solid rgba(212, 175, 55, 0.6)",
        }}
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <polygon
            points="12,2 21,7 21,17 12,22 3,17 3,7"
            stroke="#F5CF68"
            strokeWidth="1.8"
            fill="rgba(14, 12, 8, 0.8)"
          />
          <circle cx="12" cy="12" r="3" fill="#D4AF37" />
          <circle cx="12" cy="7" r="1.2" fill="#F5CF68" />
          <circle cx="16.5" cy="14.5" r="1.2" fill="#F5CF68" />
          <circle cx="7.5" cy="14.5" r="1.2" fill="#F5CF68" />
        </svg>
      </div>
    ),
    { ...size },
  );
}
