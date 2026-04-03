import { buildReportHtml, downloadHtmlFile, ReportSection } from '@/utils/generateReport';

interface SeasonReportData {
  seasonName: string;
  startDate: string;
  endDate: string;
  stats: {
    played: number;
    wins: number;
    draws: number;
    losses: number;
    goalsFor: number;
    goalsAgainst: number;
    goalDifference: number;
    points: number;
    winRate: number;
    cleanSheets: number;
    avgGoalsFor: string;
    avgGoalsAgainst: string;
    formData: { opponent: string; gf: number; ga: number; result: 'W' | 'D' | 'L'; date: string }[];
    topScorers: { name: string; jersey: number; goals: number; matches: number }[];
    topPassers: { name: string; jersey: number; passes: number; passAccuracy: number; matches: number }[];
    topDefenders: { name: string; jersey: number; tackles: number; clearances: number; matches: number }[];
  };
}

export function generateSeasonReport(data: SeasonReportData) {
  const { seasonName, startDate, endDate, stats } = data;
  const sections: ReportSection[] = [];

  // Overview KPIs
  sections.push({
    heading: 'Season Overview',
    html: `<div class="stat-grid">
      <div class="stat-box"><div class="value">${stats.played}</div><div class="label">Played</div></div>
      <div class="stat-box"><div class="value">${stats.wins}W ${stats.draws}D ${stats.losses}L</div><div class="label">Record</div></div>
      <div class="stat-box"><div class="value">${stats.points}</div><div class="label">Points</div></div>
      <div class="stat-box"><div class="value">${stats.goalsFor}-${stats.goalsAgainst}</div><div class="label">Goals F/A</div></div>
      <div class="stat-box"><div class="value">${stats.goalDifference > 0 ? '+' : ''}${stats.goalDifference}</div><div class="label">Goal Diff</div></div>
      <div class="stat-box"><div class="value">${stats.winRate}%</div><div class="label">Win Rate</div></div>
      <div class="stat-box"><div class="value">${stats.cleanSheets}</div><div class="label">Clean Sheets</div></div>
      <div class="stat-box"><div class="value">${stats.avgGoalsFor}</div><div class="label">Avg GF/Match</div></div>
    </div>`,
  });

  // Match results
  let matchHtml = `<table class="stats"><thead><tr><th>Date</th><th>Opponent</th><th>GF</th><th>GA</th><th>Result</th></tr></thead><tbody>`;
  stats.formData.forEach((f) => {
    const badgeClass = f.result === 'W' ? 'badge-w' : f.result === 'D' ? 'badge-d' : 'badge-l';
    matchHtml += `<tr><td>${f.date}</td><td>${f.opponent}</td><td>${f.gf}</td><td>${f.ga}</td><td><span class="badge ${badgeClass}">${f.result}</span></td></tr>`;
  });
  matchHtml += `</tbody></table>`;
  sections.push({ heading: 'Match Results', html: matchHtml });

  // Top Scorers
  if (stats.topScorers.length > 0) {
    let html = `<table class="stats"><thead><tr><th>#</th><th>Player</th><th>Goals</th><th>Matches</th><th>Per Match</th></tr></thead><tbody>`;
    stats.topScorers.forEach((p) => {
      html += `<tr><td>${p.jersey}</td><td>${p.name}</td><td style="font-weight:700;">${p.goals}</td><td>${p.matches}</td><td>${(p.goals / p.matches).toFixed(2)}</td></tr>`;
    });
    html += `</tbody></table>`;
    sections.push({ heading: 'Top Scorers', html });
  }

  // Top Passers
  if (stats.topPassers.length > 0) {
    let html = `<table class="stats"><thead><tr><th>#</th><th>Player</th><th>Completed</th><th>Accuracy</th><th>Matches</th></tr></thead><tbody>`;
    stats.topPassers.forEach((p) => {
      html += `<tr><td>${p.jersey}</td><td>${p.name}</td><td style="font-weight:700;">${p.passes}</td><td>${p.passAccuracy}%</td><td>${p.matches}</td></tr>`;
    });
    html += `</tbody></table>`;
    sections.push({ heading: 'Top Passers', html });
  }

  // Top Defenders
  if (stats.topDefenders.length > 0) {
    let html = `<table class="stats"><thead><tr><th>#</th><th>Player</th><th>Tackles</th><th>Clearances</th><th>Matches</th></tr></thead><tbody>`;
    stats.topDefenders.forEach((p) => {
      html += `<tr><td>${p.jersey}</td><td>${p.name}</td><td>${p.tackles}</td><td>${p.clearances}</td><td>${p.matches}</td></tr>`;
    });
    html += `</tbody></table>`;
    sections.push({ heading: 'Top Defenders', html });
  }

  const html = buildReportHtml({
    title: seasonName,
    subtitle: 'Season Report',
    metadata: {
      'Period': `${new Date(startDate).toLocaleDateString('en-GB')} — ${new Date(endDate).toLocaleDateString('en-GB')}`,
    },
    sections,
  });

  const safeName = `season-report-${seasonName.replace(/\s+/g, '-')}.html`;
  downloadHtmlFile(safeName, html);
}
