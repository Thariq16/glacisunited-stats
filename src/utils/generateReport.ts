/**
 * Core report generation utility.
 * Builds a self-contained HTML document and triggers a browser download.
 */

export interface ReportSection {
  heading: string;
  html: string;
}

export interface ReportOptions {
  title: string;
  subtitle?: string;
  metadata?: Record<string, string>;
  sections: ReportSection[];
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export function buildReportHtml(options: ReportOptions): string {
  const { title, subtitle, metadata, sections } = options;
  const timestamp = new Date().toLocaleString();

  const metaRows = metadata
    ? Object.entries(metadata)
        .map(([k, v]) => `<tr><td style="padding:4px 12px 4px 0;color:#6b7280;font-size:13px;">${escapeHtml(k)}</td><td style="padding:4px 0;font-size:13px;font-weight:600;">${escapeHtml(v)}</td></tr>`)
        .join('')
    : '';

  const sectionBlocks = sections
    .map(
      (s) => `
      <div style="margin-bottom:28px;">
        <h2 style="font-size:16px;font-weight:700;color:#1e293b;margin:0 0 12px 0;padding-bottom:6px;border-bottom:2px solid #e2e8f0;">${escapeHtml(s.heading)}</h2>
        ${s.html}
      </div>`
    )
    .join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(title)}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1e293b; background: #fff; padding: 32px; max-width: 960px; margin: 0 auto; }
  @media print { body { padding: 16px; } }
  .report-header { background: linear-gradient(135deg, #1e3a5f 0%, #0f172a 100%); color: #fff; padding: 28px 32px; border-radius: 12px; margin-bottom: 24px; }
  .report-header h1 { font-size: 22px; font-weight: 800; margin-bottom: 4px; }
  .report-header .subtitle { font-size: 14px; opacity: 0.85; }
  .meta-table { margin-top: 12px; }
  .meta-table td { color: #cbd5e1; }
  .meta-table td:last-child { color: #fff; }
  table.stats { width: 100%; border-collapse: collapse; font-size: 13px; }
  table.stats th { background: #f1f5f9; color: #475569; text-align: left; padding: 8px 10px; font-weight: 600; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; }
  table.stats td { padding: 7px 10px; border-bottom: 1px solid #f1f5f9; }
  table.stats tr:nth-child(even) { background: #f8fafc; }
  table.stats tr:hover { background: #eff6ff; }
  .stat-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 12px; }
  .stat-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px; text-align: center; }
  .stat-box .value { font-size: 22px; font-weight: 800; color: #1e3a5f; }
  .stat-box .label { font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 4px; }
  .badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 700; }
  .badge-w { background: #dcfce7; color: #166534; }
  .badge-d { background: #fef3c7; color: #92400e; }
  .badge-l { background: #fee2e2; color: #991b1b; }
  .footer { margin-top: 32px; padding-top: 16px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #94a3b8; text-align: center; }
</style>
</head>
<body>
  <div class="report-header">
    <h1>${escapeHtml(title)}</h1>
    ${subtitle ? `<p class="subtitle">${escapeHtml(subtitle)}</p>` : ''}
    ${metaRows ? `<table class="meta-table">${metaRows}</table>` : ''}
  </div>
  ${sectionBlocks}
  <div class="footer">
    Generated on ${escapeHtml(timestamp)} &bull; Glacis United FC Analytics
  </div>
</body>
</html>`;
}

export function downloadHtmlFile(filename: string, html: string) {
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
