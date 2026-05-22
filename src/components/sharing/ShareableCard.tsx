import { forwardRef, ReactNode } from "react";

export type ShareFormat = "square" | "story" | "landscape";

export const SHARE_FORMATS: Record<ShareFormat, { w: number; h: number; label: string; hint: string }> = {
  square: { w: 1080, h: 1080, label: "Square", hint: "Instagram post" },
  story: { w: 1080, h: 1920, label: "Story", hint: "IG / WhatsApp status" },
  landscape: { w: 1200, h: 630, label: "Landscape", hint: "Twitter / Link preview" },
};

interface ShareableCardProps {
  format: ShareFormat;
  orgName: string;
  orgLogoUrl: string | null;
  primaryColor: string | null;
  title: string;
  subtitle?: string;
  caption: string;
  children: ReactNode;
  showBranding: boolean;
}

/**
 * Fixed-resolution canvas rendered off-screen for PNG export.
 * The visible preview uses CSS transform: scale(...) to fit the dialog.
 */
export const ShareableCard = forwardRef<HTMLDivElement, ShareableCardProps>(
  ({ format, orgName, orgLogoUrl, primaryColor, title, subtitle, caption, children, showBranding }, ref) => {
    const { w, h } = SHARE_FORMATS[format];
    const accent = primaryColor || "hsl(217 91% 60%)";

    return (
      <div
        ref={ref}
        style={{
          width: w,
          height: h,
          background: "linear-gradient(180deg, #0b1220 0%, #111827 100%)",
          color: "#f8fafc",
          display: "flex",
          flexDirection: "column",
          fontFamily:
            'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial',
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Accent bar */}
        <div style={{ height: 8, background: accent, flexShrink: 0 }} />

        {/* Header */}
        {showBranding && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 18,
              padding: "28px 44px 0",
              flexShrink: 0,
            }}
          >
            {orgLogoUrl && (
              <img
                src={orgLogoUrl}
                alt=""
                crossOrigin="anonymous"
                style={{ width: 56, height: 56, objectFit: "contain", borderRadius: 8 }}
              />
            )}
            <div style={{ fontSize: 24, fontWeight: 600, letterSpacing: "-0.01em" }}>{orgName}</div>
          </div>
        )}

        {/* Title block */}
        <div style={{ padding: "20px 44px 12px", flexShrink: 0 }}>
          <div
            style={{
              fontSize: format === "landscape" ? 44 : 56,
              fontWeight: 800,
              lineHeight: 1.05,
              letterSpacing: "-0.02em",
            }}
          >
            {title}
          </div>
          {subtitle && (
            <div style={{ fontSize: 22, color: "#94a3b8", marginTop: 8 }}>{subtitle}</div>
          )}
        </div>

        {/* Visualization body — children rendered here */}
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "12px 44px",
            minHeight: 0,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: "100%",
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {children}
          </div>
        </div>

        {/* Caption */}
        <div style={{ padding: "0 44px 24px", flexShrink: 0 }}>
          <div
            style={{
              fontSize: 26,
              lineHeight: 1.35,
              color: "#e2e8f0",
              borderLeft: `4px solid ${accent}`,
              paddingLeft: 18,
            }}
          >
            {caption}
          </div>
        </div>

        {/* Footer / watermark */}
        <div
          style={{
            padding: "16px 44px 28px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: 18,
            color: "#64748b",
            flexShrink: 0,
            borderTop: "1px solid rgba(148, 163, 184, 0.15)",
          }}
        >
          <span>footymetrics.lovable.app</span>
          <span style={{ color: accent, fontWeight: 600 }}>FootyMetrics</span>
        </div>
      </div>
    );
  }
);
ShareableCard.displayName = "ShareableCard";
