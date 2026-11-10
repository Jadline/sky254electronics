import { ImageResponse } from "next/og";

// The picture shown when a page without its own photo is shared on WhatsApp, Facebook or X.
// Product pages use the product's photo instead.

export const alt = "Sky254 Electronics: phones, TVs and electronics in Nairobi";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "0 96px",
          background: "#0b1b33",
          color: "#ffffff",
        }}
      >
        <div style={{ display: "flex", fontSize: 150, fontWeight: 700, letterSpacing: -4 }}>
          Sky<span style={{ color: "#ffb020" }}>254</span>
        </div>
        <div style={{ display: "flex", fontSize: 50, marginTop: 8, color: "#c9d4e5" }}>Electronics in Nairobi</div>
        <div style={{ display: "flex", gap: 20, marginTop: 64, fontSize: 32 }}>
          {["Phones & TVs", "Pay with M-Pesa", "Delivery across Kenya"].map((text) => (
            <div key={text} style={{ display: "flex", padding: "14px 28px", borderRadius: 999, background: "#0669d6" }}>
              {text}
            </div>
          ))}
        </div>
      </div>
    ),
    size,
  );
}
