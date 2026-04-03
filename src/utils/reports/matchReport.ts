import { PlayerStats } from '@/utils/parseCSV';
import { buildReportHtml, downloadHtmlFile, ReportSection } from '@/utils/generateReport';

interface MatchReportData {
  homeTeamName: string;
  awayTeamName: string;
  homeScore: number;
  awayScore: number;
  matchDate: string;
  competition?: string | null;
  venue?: string | null;
  homePlayers: PlayerStats[];
  awayPlayers: PlayerStats[];
  xgStats?: {
    home: { totalXG: number; shotCount: number };
    away: { totalXG: number; shotCount: number } | null;
  } | null;
}

function buildTeamStatsRow(label: string, home: string | number, away: string | number): string {
  return `<tr><td style="text-align:right;padding:6px 12px;font-weight:600;">${home}</td><td style="text-align:center;padding:6px 12px;color:#64748b;font-size:12px;">${label}</td><td style="text-align:left;padding:6px 12px;font-weight:600;">${away}</td></tr>`;
}

function aggregateTeam(players: PlayerStats[]) {
  return players.reduce(
    (acc, p) => ({
      goals: acc.goals + p.goals,
      passes: acc.passes + p.passCount,
      completedPasses: acc.completedPasses + p.successfulPass,
      shots: acc.shots + p.shotsAttempted,
      shotsOnTarget: acc.shotsOnTarget + p.shotsOnTarget,
      tackles: acc.tackles + p.tackles,
      fouls: acc.fouls + p.fouls,
      corners: acc.corners + p.corners,
      saves: acc.saves + p.saves,
      clearances: acc.clearances + p.clearance,
      aerialWon: acc.aerialWon + p.aerialDuelsWon,
      aerialLost: acc.aerialLost + p.aerialDuelsLost,
    }),
    { goals: 0, passes: 0, completedPasses: 0, shots: 0, shotsOnTarget: 0, tackles: 0, fouls: 0, corners: 0, saves: 0, clearances: 0, aerialWon: 0, aerialLost: 0 }
  );
}

function pct(num: number, den: number): string {
  return den > 0 ? `${((num / den) * 100).toFixed(1)}%` : '0%';
}

export function generateMatchReport(data: MatchReportData) {
  const { homeTeamName, awayTeamName, homeScore, awayScore, matchDate, competition, venue, homePlayers, awayPlayers, xgStats } = data;

  const home = aggregateTeam(homePlayers);
  const away = aggregateTeam(awayPlayers);

  const sections: ReportSection[] = [];

  // Team stats comparison
  let statsHtml = `<table class="stats" style="text-align:center;">
    <thead><tr><th style="text-align:right;">${homeTeamName}</th><th style="text-align:center;">Statistic</th><th style="text-align:left;">${awayTeamName}</th></tr></thead><tbody>`;
  statsHtml += buildTeamStatsRow('Passes', `${home.completedPasses}/${home.passes}`, `${away.completedPasses}/${away.passes}`);
  statsHtml += buildTeamStatsRow('Pass Accuracy', pct(home.completedPasses, home.passes), pct(away.completedPasses, away.passes));
  statsHtml += buildTeamStatsRow('Shots', home.shots, away.shots);
  statsHtml += buildTeamStatsRow('Shots on Target', home.shotsOnTarget, away.shotsOnTarget);
  statsHtml += buildTeamStatsRow('Tackles', home.tackles, away.tackles);
  statsHtml += buildTeamStatsRow('Clearances', home.clearances, away.clearances);
  statsHtml += buildTeamStatsRow('Aerial Duels Won', home.aerialWon, away.aerialWon);
  statsHtml += buildTeamStatsRow('Corners', home.corners, away.corners);
  statsHtml += buildTeamStatsRow('Fouls', home.fouls, away.fouls);
  statsHtml += buildTeamStatsRow('Saves', home.saves, away.saves);
  if (xgStats) {
    statsHtml += buildTeamStatsRow('xG', xgStats.home.totalXG.toFixed(2), xgStats.away?.totalXG.toFixed(2) ?? '-');
  }
  statsHtml += `</tbody></table>`;
  sections.push({ heading: 'Team Statistics', html: statsHtml });

  // Player performances for each team
  const buildPlayerTable = (players: PlayerStats[], teamName: string): string => {
    const sorted = [...players].sort((a, b) => {
      const sa = a.goals * 10 + a.shotsOnTarget * 2 + a.tackles * 2 + (a.passCount > 0 ? (a.successfulPass / a.passCount) * 5 : 0);
      const sb = b.goals * 10 + b.shotsOnTarget * 2 + b.tackles * 2 + (b.passCount > 0 ? (b.successfulPass / b.passCount) * 5 : 0);
      return sb - sa;
    });
    let html = `<table class="stats"><thead><tr><th>#</th><th>Player</th><th>Mins</th><th>Goals</th><th>Passes</th><th>Acc%</th><th>Shots</th><th>Tackles</th><th>Clearances</th></tr></thead><tbody>`;
    sorted.forEach((p) => {
      html += `<tr><td>${p.jerseyNumber}</td><td>${p.playerName}</td><td>${p.minutesPlayed}</td><td>${p.goals}</td><td>${p.successfulPass}/${p.passCount}</td><td>${p.successPassPercent}</td><td>${p.shotsOnTarget}/${p.shotsAttempted}</td><td>${p.tackles}</td><td>${p.clearance}</td></tr>`;
    });
    html += `</tbody></table>`;
    return html;
  };

  sections.push({ heading: `${homeTeamName} — Player Performances`, html: buildPlayerTable(homePlayers, homeTeamName) });
  sections.push({ heading: `${awayTeamName} — Player Performances`, html: buildPlayerTable(awayPlayers, awayTeamName) });

  const dateStr = new Date(matchDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

  const html = buildReportHtml({
    title: `${homeTeamName} ${homeScore} - ${awayScore} ${awayTeamName}`,
    subtitle: 'Match Report',
    metadata: {
      'Date': dateStr,
      ...(competition ? { 'Competition': competition } : {}),
      ...(venue ? { 'Venue': venue } : {}),
    },
    sections,
  });

  const safeName = `match-report-${matchDate}-${homeTeamName.replace(/\s+/g, '-')}-vs-${awayTeamName.replace(/\s+/g, '-')}.html`;
  downloadHtmlFile(safeName, html);
}
