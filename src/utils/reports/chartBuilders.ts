/**
 * Inline SVG and HTML chart builders for self-contained HTML reports.
 * All charts are pure SVG/HTML strings with no external dependencies.
 */

// ─── Pitch Heatmap (for shot maps, possession loss, defensive events) ────────

interface PitchDot {
  x: number; // 0-100
  y: number; // 0-100
  color: string;
  label?: string; // jersey number or text
  radius?: number;
}

export function buildPitchHeatmapSvg(
  dots: PitchDot[],
  title?: string,
  width = 500,
  height = 340
): string {
  const pw = 100;
  const ph = 68;
  const mx = 40;
  const my = 20;
  const sw = width - mx * 2;
  const sh = height - my * 2;

  const pitchLines = `
    <rect x="${mx}" y="${my}" width="${sw}" height="${sh}" fill="#2d8a4e" rx="2"/>
    <rect x="${mx}" y="${my}" width="${sw}" height="${sh}" fill="none" stroke="white" stroke-width="1.5"/>
    <line x1="${mx + sw / 2}" y1="${my}" x2="${mx + sw / 2}" y2="${my + sh}" stroke="white" stroke-width="1" stroke-opacity="0.6"/>
    <circle cx="${mx + sw / 2}" cy="${my + sh / 2}" r="${sh * 0.14}" fill="none" stroke="white" stroke-width="1" stroke-opacity="0.6"/>
    <!-- Penalty areas -->
    <rect x="${mx}" y="${my + sh * 0.22}" width="${sw * 0.17}" height="${sh * 0.56}" fill="none" stroke="white" stroke-width="1" stroke-opacity="0.5"/>
    <rect x="${mx + sw - sw * 0.17}" y="${my + sh * 0.22}" width="${sw * 0.17}" height="${sh * 0.56}" fill="none" stroke="white" stroke-width="1" stroke-opacity="0.5"/>
  `;

  const dotsSvg = dots
    .map((d) => {
      const cx = mx + (d.x / pw) * sw;
      const cy = my + (d.y / ph) * sh;
      const r = d.radius || 6;
      return `
        <circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${r}" fill="${d.color}" opacity="0.8" stroke="white" stroke-width="1"/>
        ${d.label ? `<text x="${cx.toFixed(1)}" y="${(cy + 1).toFixed(1)}" text-anchor="middle" dominant-baseline="central" fill="white" font-size="7" font-weight="bold">${d.label}</text>` : ''}
      `;
    })
    .join('');

  return `
    ${title ? `<p style="font-weight:700;font-size:13px;margin-bottom:8px;">${title}</p>` : ''}
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="100%" style="max-width:${width}px;background:#1a472a;border-radius:6px;">
      ${pitchLines}
      ${dotsSvg}
    </svg>
  `;
}

// ─── Goal Mouth Map ──────────────────────────────────────────────────────────

interface GoalMouthShot {
  goalMouthX: number; // 0-100
  goalMouthY: number; // 0-100
  outcome: string; // goal, on_target, off_target, blocked
  jerseyNumber?: number;
}

export function buildGoalMouthSvg(shots: GoalMouthShot[], title?: string): string {
  const w = 360;
  const h = 180;
  const goalW = 280;
  const goalH = 120;
  const gx = (w - goalW) / 2;
  const gy = (h - goalH) / 2;

  const colorMap: Record<string, string> = {
    goal: '#22c55e',
    on_target: '#f59e0b',
    saved: '#f59e0b',
    off_target: '#ef4444',
    blocked: '#94a3b8',
  };

  const dotsSvg = shots
    .map((s) => {
      const cx = gx + (s.goalMouthX / 100) * goalW;
      const cy = gy + goalH - (s.goalMouthY / 100) * goalH;
      const color = colorMap[s.outcome] || '#94a3b8';
      return `
        <circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="8" fill="${color}" opacity="0.85" stroke="white" stroke-width="1.5"/>
        ${s.jerseyNumber != null ? `<text x="${cx.toFixed(1)}" y="${(cy + 1).toFixed(1)}" text-anchor="middle" dominant-baseline="central" fill="white" font-size="7" font-weight="bold">${s.jerseyNumber}</text>` : ''}
      `;
    })
    .join('');

  const legend = `
    <g transform="translate(${gx},${gy + goalH + 12})">
      <circle cx="0" cy="0" r="5" fill="#22c55e"/><text x="8" y="4" font-size="9" fill="#334155">Goal</text>
      <circle cx="50" cy="0" r="5" fill="#f59e0b"/><text x="58" y="4" font-size="9" fill="#334155">On Target</text>
      <circle cx="120" cy="0" r="5" fill="#ef4444"/><text x="128" y="4" font-size="9" fill="#334155">Off Target</text>
      <circle cx="195" cy="0" r="5" fill="#94a3b8"/><text x="203" y="4" font-size="9" fill="#334155">Blocked</text>
    </g>
  `;

  return `
    ${title ? `<p style="font-weight:700;font-size:13px;margin-bottom:8px;">${title}</p>` : ''}
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h + 30}" width="100%" style="max-width:${w}px;background:#f8fafc;border-radius:6px;border:1px solid #e2e8f0;">
      <rect x="${gx}" y="${gy}" width="${goalW}" height="${goalH}" fill="none" stroke="#1e293b" stroke-width="2.5" rx="2"/>
      <line x1="${gx}" y1="${gy + goalH / 2}" x2="${gx + goalW}" y2="${gy + goalH / 2}" stroke="#e2e8f0" stroke-dasharray="4"/>
      <line x1="${gx + goalW / 2}" y1="${gy}" x2="${gx + goalW / 2}" y2="${gy + goalH}" stroke="#e2e8f0" stroke-dasharray="4"/>
      ${dotsSvg}
      ${legend}
    </svg>
  `;
}

// ─── Radar Chart ─────────────────────────────────────────────────────────────

interface RadarPoint {
  category: string;
  value: number; // 0-100
}

export function buildRadarChartSvg(data: RadarPoint[], title?: string): string {
  const size = 300;
  const cx = size / 2;
  const cy = size / 2;
  const maxR = 110;
  const n = data.length;
  if (n < 3) return '';

  const angleStep = (2 * Math.PI) / n;
  const startAngle = -Math.PI / 2;

  // Grid rings
  const rings = [20, 40, 60, 80, 100];
  const ringsSvg = rings
    .map((pct) => {
      const r = (pct / 100) * maxR;
      const points = Array.from({ length: n }, (_, i) => {
        const a = startAngle + i * angleStep;
        return `${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`;
      }).join(' ');
      return `<polygon points="${points}" fill="none" stroke="#cbd5e1" stroke-width="0.5"/>`;
    })
    .join('');

  // Axis lines
  const axesSvg = Array.from({ length: n }, (_, i) => {
    const a = startAngle + i * angleStep;
    const ex = cx + maxR * Math.cos(a);
    const ey = cy + maxR * Math.sin(a);
    return `<line x1="${cx}" y1="${cy}" x2="${ex.toFixed(1)}" y2="${ey.toFixed(1)}" stroke="#e2e8f0" stroke-width="0.5"/>`;
  }).join('');

  // Data polygon
  const dataPoints = data.map((d, i) => {
    const r = (d.value / 100) * maxR;
    const a = startAngle + i * angleStep;
    return `${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`;
  }).join(' ');

  // Labels
  const labelsSvg = data
    .map((d, i) => {
      const a = startAngle + i * angleStep;
      const lx = cx + (maxR + 22) * Math.cos(a);
      const ly = cy + (maxR + 22) * Math.sin(a);
      return `<text x="${lx.toFixed(1)}" y="${ly.toFixed(1)}" text-anchor="middle" dominant-baseline="central" font-size="9" font-weight="600" fill="#475569">${d.category} (${Math.round(d.value)})</text>`;
    })
    .join('');

  return `
    ${title ? `<p style="font-weight:700;font-size:13px;margin-bottom:8px;">${title}</p>` : ''}
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="100%" style="max-width:${size}px;">
      ${ringsSvg}
      ${axesSvg}
      <polygon points="${dataPoints}" fill="rgba(30,58,95,0.25)" stroke="#1e3a5f" stroke-width="2"/>
      ${data.map((d, i) => {
        const r = (d.value / 100) * maxR;
        const a = startAngle + i * angleStep;
        return `<circle cx="${(cx + r * Math.cos(a)).toFixed(1)}" cy="${(cy + r * Math.sin(a)).toFixed(1)}" r="3.5" fill="#1e3a5f" stroke="white" stroke-width="1.5"/>`;
      }).join('')}
      ${labelsSvg}
    </svg>
  `;
}

// ─── Horizontal Bar Chart ────────────────────────────────────────────────────

interface BarItem {
  label: string;
  value: number;
  color?: string;
  subLabel?: string;
}

export function buildHorizontalBarChart(
  items: BarItem[],
  title?: string,
  maxValue?: number
): string {
  const max = maxValue || Math.max(...items.map((i) => i.value), 1);
  const rows = items
    .map((item) => {
      const pct = Math.min((item.value / max) * 100, 100);
      const color = item.color || '#1e3a5f';
      return `
        <div style="margin-bottom:8px;">
          <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:2px;">
            <span style="color:#475569;">${item.label}</span>
            <span style="font-weight:700;">${item.value}${item.subLabel ? ` <span style="color:#94a3b8;font-weight:400;">${item.subLabel}</span>` : ''}</span>
          </div>
          <div style="background:#f1f5f9;border-radius:4px;height:14px;overflow:hidden;">
            <div style="width:${pct.toFixed(1)}%;height:100%;background:${color};border-radius:4px;transition:width 0.3s;"></div>
          </div>
        </div>
      `;
    })
    .join('');

  return `
    ${title ? `<p style="font-weight:700;font-size:13px;margin-bottom:10px;">${title}</p>` : ''}
    ${rows}
  `;
}

// ─── Comparison Bar (Home vs Away side-by-side) ──────────────────────────────

interface ComparisonItem {
  label: string;
  homeValue: number;
  awayValue: number;
}

export function buildComparisonBars(
  items: ComparisonItem[],
  homeName: string,
  awayName: string,
  title?: string
): string {
  const max = Math.max(...items.flatMap((i) => [i.homeValue, i.awayValue]), 1);
  const rows = items
    .map((item) => {
      const hp = Math.min((item.homeValue / max) * 100, 100);
      const ap = Math.min((item.awayValue / max) * 100, 100);
      return `
        <div style="margin-bottom:10px;">
          <div style="font-size:11px;color:#64748b;text-align:center;margin-bottom:2px;">${item.label}</div>
          <div style="display:flex;align-items:center;gap:8px;">
            <span style="width:32px;text-align:right;font-size:12px;font-weight:700;">${item.homeValue}</span>
            <div style="flex:1;display:flex;gap:2px;">
              <div style="flex:1;display:flex;justify-content:flex-end;">
                <div style="width:${hp.toFixed(1)}%;height:12px;background:#1e3a5f;border-radius:3px 0 0 3px;"></div>
              </div>
              <div style="flex:1;">
                <div style="width:${ap.toFixed(1)}%;height:12px;background:#dc2626;border-radius:0 3px 3px 0;"></div>
              </div>
            </div>
            <span style="width:32px;font-size:12px;font-weight:700;">${item.awayValue}</span>
          </div>
        </div>
      `;
    })
    .join('');

  return `
    ${title ? `<p style="font-weight:700;font-size:13px;margin-bottom:10px;">${title}</p>` : ''}
    <div style="display:flex;justify-content:space-between;font-size:11px;color:#64748b;margin-bottom:6px;">
      <span>${homeName}</span><span>${awayName}</span>
    </div>
    ${rows}
  `;
}

// ─── Passes by Third (pitch zones) ──────────────────────────────────────────

interface ThirdData {
  defensive: number;
  middle: number;
  final: number;
}

export function buildPassesByThirdSvg(data: ThirdData, teamName?: string): string {
  const w = 400;
  const h = 200;
  const max = Math.max(data.defensive, data.middle, data.final, 1);

  const zones = [
    { label: 'Defensive', value: data.defensive, color: '#3b82f6' },
    { label: 'Middle', value: data.middle, color: '#f59e0b' },
    { label: 'Final', value: data.final, color: '#ef4444' },
  ];

  const zoneW = (w - 20) / 3;
  const zonesSvg = zones
    .map((z, i) => {
      const opacity = 0.2 + (z.value / max) * 0.6;
      const x = 10 + i * zoneW;
      return `
        <rect x="${x}" y="10" width="${zoneW - 4}" height="${h - 50}" rx="4" fill="${z.color}" opacity="${opacity.toFixed(2)}"/>
        <text x="${x + zoneW / 2 - 2}" y="${(h - 50) / 2 + 10}" text-anchor="middle" font-size="22" font-weight="800" fill="white">${z.value}</text>
        <text x="${x + zoneW / 2 - 2}" y="${h - 20}" text-anchor="middle" font-size="10" font-weight="600" fill="#475569">${z.label} Third</text>
      `;
    })
    .join('');

  return `
    ${teamName ? `<p style="font-weight:700;font-size:13px;margin-bottom:8px;">${teamName} — Passes by Third</p>` : ''}
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="100%" style="max-width:${w}px;background:#f8fafc;border-radius:6px;border:1px solid #e2e8f0;">
      ${zonesSvg}
    </svg>
  `;
}

// ─── Simple Line Chart (for trends) ─────────────────────────────────────────

interface LineChartSeries {
  name: string;
  values: number[];
  color: string;
}

export function buildLineChartSvg(
  series: LineChartSeries[],
  labels: string[],
  title?: string,
  yLabel?: string
): string {
  const w = 600;
  const h = 200;
  const px = 45;
  const py = 20;
  const pw = w - px - 20;
  const ph = h - py - 35;

  if (labels.length < 2) return '';

  const allVals = series.flatMap((s) => s.values);
  const minV = Math.min(...allVals, 0);
  const maxV = Math.max(...allVals, 1);
  const range = maxV - minV || 1;

  const xStep = pw / (labels.length - 1);

  const linesSvg = series
    .map((s) => {
      const points = s.values
        .map((v, i) => {
          const x = px + i * xStep;
          const y = py + ph - ((v - minV) / range) * ph;
          return `${x.toFixed(1)},${y.toFixed(1)}`;
        })
        .join(' ');
      const dotsSvg = s.values
        .map((v, i) => {
          const x = px + i * xStep;
          const y = py + ph - ((v - minV) / range) * ph;
          return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="3" fill="${s.color}" stroke="white" stroke-width="1"/>`;
        })
        .join('');
      return `<polyline points="${points}" fill="none" stroke="${s.color}" stroke-width="2"/>${dotsSvg}`;
    })
    .join('');

  // X-axis labels (show max ~10)
  const step = Math.max(1, Math.floor(labels.length / 10));
  const xLabels = labels
    .map((l, i) => {
      if (i % step !== 0 && i !== labels.length - 1) return '';
      const x = px + i * xStep;
      return `<text x="${x.toFixed(1)}" y="${py + ph + 15}" text-anchor="middle" font-size="8" fill="#94a3b8">${l}</text>`;
    })
    .join('');

  // Y-axis ticks
  const yTicks = 5;
  const yTicksSvg = Array.from({ length: yTicks + 1 }, (_, i) => {
    const v = minV + (range / yTicks) * i;
    const y = py + ph - (i / yTicks) * ph;
    return `
      <line x1="${px}" y1="${y.toFixed(1)}" x2="${px + pw}" y2="${y.toFixed(1)}" stroke="#f1f5f9" stroke-width="0.5"/>
      <text x="${px - 5}" y="${(y + 3).toFixed(1)}" text-anchor="end" font-size="8" fill="#94a3b8">${Math.round(v)}</text>
    `;
  }).join('');

  // Legend
  const legendSvg = series
    .map((s, i) => {
      const lx = px + i * 100;
      return `<circle cx="${lx}" cy="${h - 5}" r="4" fill="${s.color}"/><text x="${lx + 8}" y="${h - 1}" font-size="9" fill="#475569">${s.name}</text>`;
    })
    .join('');

  return `
    ${title ? `<p style="font-weight:700;font-size:13px;margin-bottom:8px;">${title}</p>` : ''}
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="100%" style="max-width:${w}px;background:#fff;border-radius:6px;border:1px solid #e2e8f0;">
      ${yTicksSvg}
      ${linesSvg}
      ${xLabels}
      ${legendSvg}
    </svg>
  `;
}

// ─── Progress Bar Row (for efficiency metrics) ──────────────────────────────

export function buildProgressBars(
  items: { label: string; value: number | string; percent: number }[],
  title?: string
): string {
  const rows = items
    .map((item) => {
      const pct = Math.min(Math.max(item.percent, 0), 100);
      const color = pct >= 70 ? '#22c55e' : pct >= 40 ? '#f59e0b' : '#ef4444';
      return `
        <div style="margin-bottom:10px;">
          <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:3px;">
            <span style="color:#475569;">${item.label}</span>
            <span style="font-weight:700;">${item.value}</span>
          </div>
          <div style="background:#f1f5f9;border-radius:4px;height:8px;overflow:hidden;">
            <div style="width:${pct.toFixed(1)}%;height:100%;background:${color};border-radius:4px;"></div>
          </div>
        </div>
      `;
    })
    .join('');

  return `
    ${title ? `<p style="font-weight:700;font-size:13px;margin-bottom:10px;">${title}</p>` : ''}
    ${rows}
  `;
}

// ─── Stat Grid (reusable KPI boxes) ─────────────────────────────────────────

export function buildStatGrid(
  items: { label: string; value: string | number }[]
): string {
  const boxes = items
    .map(
      (i) =>
        `<div class="stat-box"><div class="value">${i.value}</div><div class="label">${i.label}</div></div>`
    )
    .join('');
  return `<div class="stat-grid">${boxes}</div>`;
}

// ─── Zones of Control ────────────────────────────────────────────────────────

interface ZocCell {
  home: number;
  away: number;
  total: number;
  homeShare: number;
  awayShare: number;
}

function getZocInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '?';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}

export function buildZonesOfControlSvg(
  grid: ZocCell[][],
  homeTeamName: string,
  awayTeamName: string,
  threshold = 0.55,
  title?: string
): string {
  const rows = grid.length;
  const cols = grid[0]?.length || 6;
  const width = 600;
  const height = 380;
  const cellW = width / cols;
  const cellH = height / rows;
  const homeColor = '#3b82f6';
  const awayColor = '#ef4444';
  const homeInit = getZocInitials(homeTeamName);
  const awayInit = getZocInitials(awayTeamName);

  const cellsSvg = grid
    .map((row, r) =>
      row
        .map((cell, c) => {
          let fill = '#e5e7eb';
          let opacity = 0.4;
          let owner: 'home' | 'away' | 'contested' | 'none' = 'none';
          if (cell.total === 0) {
            owner = 'none';
          } else if (cell.homeShare >= threshold) {
            owner = 'home';
            fill = homeColor;
            opacity = 0.4 + ((cell.homeShare - threshold) / (1 - threshold)) * 0.55;
          } else if (cell.awayShare >= threshold) {
            owner = 'away';
            fill = awayColor;
            opacity = 0.4 + ((cell.awayShare - threshold) / (1 - threshold)) * 0.55;
          } else {
            owner = 'contested';
            fill = '#94a3b8';
            opacity = 0.3;
          }
          const cx = c * cellW + cellW / 2;
          const cy = r * cellH + cellH / 2;
          const rect = `<rect x="${c * cellW}" y="${r * cellH}" width="${cellW}" height="${cellH}" fill="${fill}" opacity="${opacity.toFixed(2)}" stroke="#cbd5e1" stroke-width="1" stroke-dasharray="3,3"/>`;
          let badge = '';
          if (owner === 'home' || owner === 'away') {
            const color = owner === 'home' ? homeColor : awayColor;
            const init = owner === 'home' ? homeInit : awayInit;
            const sharePct = Math.round((owner === 'home' ? cell.homeShare : cell.awayShare) * 100);
            badge = `
              <circle cx="${cx}" cy="${cy - 6}" r="14" fill="white" stroke="${color}" stroke-width="2"/>
              <text x="${cx}" y="${cy - 3}" text-anchor="middle" font-size="10" font-weight="700" fill="${color}">${init}</text>
              <text x="${cx}" y="${cy + 18}" text-anchor="middle" font-size="10" font-weight="600" fill="#1f2937">${sharePct}%</text>
            `;
          } else if (cell.total > 0) {
            badge = `<text x="${cx}" y="${cy + 4}" text-anchor="middle" font-size="11" font-weight="600" fill="#475569">${cell.total}</text>`;
          }
          return rect + badge;
        })
        .join('')
    )
    .join('');

  const pitch = `
    <rect x="0" y="0" width="${width}" height="${height}" fill="none" stroke="#1f2937" stroke-width="2" opacity="0.4"/>
    <line x1="${width / 2}" y1="0" x2="${width / 2}" y2="${height}" stroke="#1f2937" stroke-width="1.5" opacity="0.4"/>
    <circle cx="${width / 2}" cy="${height / 2}" r="48" fill="none" stroke="#1f2937" stroke-width="1.5" opacity="0.4"/>
    <rect x="0" y="${height * 0.2}" width="${width * 0.16}" height="${height * 0.6}" fill="none" stroke="#1f2937" stroke-width="1.5" opacity="0.4"/>
    <rect x="${width * 0.84}" y="${height * 0.2}" width="${width * 0.16}" height="${height * 0.6}" fill="none" stroke="#1f2937" stroke-width="1.5" opacity="0.4"/>
  `;

  const legend = `
    <div style="display:flex;gap:18px;justify-content:center;margin-top:10px;font-size:12px;">
      <div style="display:flex;align-items:center;gap:6px;"><span style="display:inline-block;width:14px;height:14px;background:${homeColor};opacity:0.7;border-radius:3px;"></span>${homeTeamName}</div>
      <div style="display:flex;align-items:center;gap:6px;"><span style="display:inline-block;width:14px;height:14px;background:${awayColor};opacity:0.7;border-radius:3px;"></span>${awayTeamName}</div>
      <div style="display:flex;align-items:center;gap:6px;color:#64748b;"><span style="display:inline-block;width:14px;height:14px;background:#94a3b8;opacity:0.4;border-radius:3px;"></span>Contested</div>
    </div>
  `;

  return `
    ${title ? `<p style="font-weight:700;font-size:13px;margin-bottom:8px;">${title}</p>` : ''}
    <p style="font-size:11px;color:#64748b;margin:0 0 8px 0;">A team owns a zone when they have more than ${Math.round(threshold * 100)}% of touches in it.</p>
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="100%" style="max-width:${width}px;background:#f8fafc;border-radius:6px;">
      ${cellsSvg}
      ${pitch}
    </svg>
    ${legend}
  `;
}
