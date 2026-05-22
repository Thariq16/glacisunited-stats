import { toPng } from "html-to-image";

interface ExportOptions {
  title: string;
  subtitle?: string;
  orgName: string;
  orgLogoUrl?: string | null;
  accent?: string;
}

const COPYRIGHT = "© Copyrights reserved by FootyMetrics";
const ANALYST = "Analyst — Thariq Hamad";
const SITE = "footymetrics.lovable.app";

async function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/**
 * html-to-image (and html2canvas) frequently drops SVG <marker> elements
 * (the arrowheads on pass / shot lines). To work around that we serialize
 * every <svg> inside the node into a standalone data-URL image — the browser
 * renders markers natively when an SVG is loaded as an <img>. After capture
 * we restore the original SVGs.
 */
async function rasterizeSvgs(root: HTMLElement): Promise<() => void> {
  const svgs = Array.from(root.querySelectorAll("svg"));
  const restores: Array<() => void> = [];

  await Promise.all(
    svgs.map(async (svg) => {
      const rect = svg.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;

      const clone = svg.cloneNode(true) as SVGSVGElement;
      if (!clone.getAttribute("xmlns")) {
        clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
      }
      if (!clone.getAttribute("xmlns:xlink")) {
        clone.setAttribute("xmlns:xlink", "http://www.w3.org/1999/xlink");
      }
      clone.setAttribute("width", String(rect.width));
      clone.setAttribute("height", String(rect.height));

      const xml = new XMLSerializer().serializeToString(clone);
      const dataUrl =
        "data:image/svg+xml;charset=utf-8," + encodeURIComponent(xml);

      const img = document.createElement("img");
      img.src = dataUrl;
      img.width = rect.width;
      img.height = rect.height;
      img.style.width = `${rect.width}px`;
      img.style.height = `${rect.height}px`;
      img.style.display = "block";
      const origClass = svg.getAttribute("class");
      if (origClass) img.className = origClass;
      const origStyle = svg.getAttribute("style");
      if (origStyle) img.setAttribute("style", img.getAttribute("style") + ";" + origStyle);

      await new Promise<void>((res) => {
        if (img.complete && img.naturalWidth > 0) return res();
        img.onload = () => res();
        img.onerror = () => res();
      });

      const parent = svg.parentNode;
      if (!parent) return;
      parent.replaceChild(img, svg);
      restores.push(() => {
        if (img.parentNode === parent) parent.replaceChild(svg, img);
      });
    })
  );

  return () => restores.forEach((r) => r());
}

/**
 * Capture a DOM node and composite it onto a branded canvas with footer credits.
 * Returns a PNG data URL.
 */
export async function captureShareable(
  node: HTMLElement,
  { title, subtitle, orgName, orgLogoUrl, accent = "#3b82f6" }: ExportOptions
): Promise<string> {
  // Force a light backdrop for the captured viz so dark + light mode both export legibly
  // Pre-rasterize SVGs so arrowhead markers survive the snapshot
  const restoreSvgs = await rasterizeSvgs(node);
  let dataUrl: string;
  try {
    dataUrl = await toPng(node, {
      cacheBust: true,
      pixelRatio: 2,
      backgroundColor: getComputedStyle(document.body).backgroundColor || "#ffffff",
    });
  } finally {
    restoreSvgs();
  }
  const viz = await loadImage(dataUrl);

  const PADDING = 56;
  const HEADER_H = orgLogoUrl ? 140 : 120;
  const TITLE_H = subtitle ? 110 : 78;
  const FOOTER_H = 110;
  const ACCENT_H = 10;

  // Cap the viz at a sane max width while preserving aspect ratio
  const MAX_INNER_W = 1600;
  const innerW = Math.min(viz.width, MAX_INNER_W);
  const innerH = (viz.height * innerW) / viz.width;

  const W = innerW + PADDING * 2;
  const H = ACCENT_H + HEADER_H + TITLE_H + innerH + FOOTER_H + PADDING;

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  // Background gradient (dark)
  const grd = ctx.createLinearGradient(0, 0, 0, H);
  grd.addColorStop(0, "#0b1220");
  grd.addColorStop(1, "#111827");
  ctx.fillStyle = grd;
  ctx.fillRect(0, 0, W, H);

  // Accent bar
  ctx.fillStyle = accent;
  ctx.fillRect(0, 0, W, ACCENT_H);

  // Header (logo + org name)
  let y = ACCENT_H + 36;
  let textX = PADDING;
  if (orgLogoUrl) {
    try {
      const logo = await loadImage(orgLogoUrl);
      const logoSize = 64;
      ctx.drawImage(logo, PADDING, y, logoSize, logoSize);
      textX = PADDING + logoSize + 20;
    } catch {
      /* ignore logo load failure */
    }
  }
  ctx.fillStyle = "#f8fafc";
  ctx.font = "600 32px ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto";
  ctx.textBaseline = "top";
  ctx.fillText(orgName, textX, y + 16);

  // Title
  y = ACCENT_H + HEADER_H;
  ctx.fillStyle = "#f8fafc";
  ctx.font = "800 44px ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto";
  ctx.fillText(title, PADDING, y);
  if (subtitle) {
    ctx.fillStyle = "#94a3b8";
    ctx.font = "400 24px ui-sans-serif, system-ui";
    ctx.fillText(subtitle, PADDING, y + 56);
  }

  // White rounded panel behind the viz for legibility
  const vizY = ACCENT_H + HEADER_H + TITLE_H;
  const radius = 16;
  ctx.fillStyle = "#ffffff";
  roundedRect(ctx, PADDING - 12, vizY - 12, innerW + 24, innerH + 24, radius);
  ctx.fill();

  // Draw the visualization
  ctx.drawImage(viz, PADDING, vizY, innerW, innerH);

  // Footer separator
  const footerTop = vizY + innerH + 36;
  ctx.strokeStyle = "rgba(148, 163, 184, 0.2)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(PADDING, footerTop);
  ctx.lineTo(W - PADDING, footerTop);
  ctx.stroke();

  // Footer text — copyright (left) and analyst (right)
  ctx.fillStyle = "#cbd5e1";
  ctx.font = "600 22px ui-sans-serif, system-ui";
  ctx.textBaseline = "top";
  ctx.textAlign = "left";
  ctx.fillText(COPYRIGHT, PADDING, footerTop + 18);
  ctx.textAlign = "right";
  ctx.fillStyle = accent;
  ctx.fillText(ANALYST, W - PADDING, footerTop + 18);

  // Site URL
  ctx.fillStyle = "#64748b";
  ctx.font = "400 18px ui-sans-serif, system-ui";
  ctx.textAlign = "left";
  ctx.fillText(SITE, PADDING, footerTop + 52);

  ctx.textAlign = "left";
  return canvas.toDataURL("image/png");
}

function roundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export function downloadDataUrl(dataUrl: string, filename: string) {
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = filename;
  a.click();
}

export function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
}
