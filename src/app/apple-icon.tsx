import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          gap: 12,
          padding: "0 40px",
          background: "#F7F5F0",
        }}
      >
        <div style={{ height: 22, width: "70%", borderRadius: 11, background: "#7E9A76" }} />
        <div style={{ height: 40, width: "100%", borderRadius: 12, background: "#232220" }} />
        <div style={{ height: 22, width: "55%", borderRadius: 11, background: "#C4704F" }} />
      </div>
    ),
    size
  );
}
