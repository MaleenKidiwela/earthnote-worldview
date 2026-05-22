import { useState } from "react";

/**
 * Side-drawer iframe that mounts the full salish-sea Cousin SPA shipped
 * as a single 545 KB static HTML at /cousin.html. Gives access to every
 * Cousin feature (Explorer, Research, Policy) without trying to import
 * the upstream React app into apps/web's component tree.
 */
export function CousinDrawer() {
  const [open, setOpen] = useState(false);
  // Use the same JupyterHub-prefix base as the rest of the app.
  const src = `${import.meta.env.BASE_URL}cousin.html`;

  return (
    <>
      <button
        onClick={() => setOpen((o) => !o)}
        title="Open the full Salish Sea Cousin app"
        style={{
          position: "absolute",
          top: 12,
          left: 12,
          padding: "6px 12px",
          background: "rgba(20, 25, 38, 0.85)",
          color: "#cbd5e0",
          border: "1px solid #4a5568",
          borderRadius: 4,
          cursor: "pointer",
          fontSize: 12,
          fontFamily: "JetBrains Mono, monospace",
          zIndex: 1000,
        }}
      >
        {open ? "Close" : "Open"} Cousin app
      </button>
      {open && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            bottom: 0,
            width: "min(900px, 60vw)",
            background: "#0f1419",
            borderRight: "1px solid #2d3748",
            zIndex: 999,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div
            style={{
              padding: "8px 14px 8px 110px",
              borderBottom: "1px solid #2d3748",
              color: "#cbd5e0",
              fontSize: 12,
              fontFamily: "JetBrains Mono, monospace",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span>Salish Sea Digital Cousin · v5</span>
            <a
              href={src}
              target="_blank"
              rel="noreferrer"
              style={{ color: "#7aa2f7", textDecoration: "none", fontSize: 11 }}
            >
              open in tab ↗
            </a>
          </div>
          <iframe
            src={src}
            title="Salish Sea Cousin"
            style={{ flex: 1, border: 0, background: "#0f1419" }}
          />
        </div>
      )}
    </>
  );
}
