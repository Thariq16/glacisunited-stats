import { PlayerStats } from '@/utils/parseCSV';
import { buildReportHtml, downloadHtmlFile, ReportSection } from '@/utils/generateReport';
import { calculateAdvancedMetrics } from '@/utils/playerMetrics';

interface PlayerReportData {
  player: PlayerStats;
  teamName: string;
  playerProfile?: {
    nationality?: string | null;
    date_of_birth?: string | null;
    height_cm?: number | null;
    weight_kg?: number | null;
    preferred_foot?: string | null;
  } | null;
  matchFilter?: string;
}

export function generatePlayerReport(data: PlayerReportData) {
  const { player, teamName, playerProfile, matchFilter } = data;
  const metrics = calculateAdvancedMetrics(player);
  const sections: ReportSection[] = [];

  // Bio section
  if (playerProfile) {
    const items: string[] = [];
    if (playerProfile.nationality) items.push(`<strong>Nationality:</strong> ${playerProfile.nationality}`);
    if (playerProfile.date_of_birth) items.push(`<strong>DOB:</strong> ${new Date(playerProfile.date_of_birth).toLocaleDateString('en-GB')}`);
    if (playerProfile.height_cm) items.push(`<strong>Height:</strong> ${playerProfile.height_cm}cm`);
    if (playerProfile.weight_kg) items.push(`<strong>Weight:</strong> ${playerProfile.weight_kg}kg`);
    if (playerProfile.preferred_foot) items.push(`<strong>Foot:</strong> ${playerProfile.preferred_foot}`);
    if (items.length > 0) {
      sections.push({ heading: 'Profile', html: `<p style="font-size:13px;line-height:1.8;">${items.join(' &bull; ')}</p>` });
    }
  }

  // Key metrics
  sections.push({
    heading: 'Key Metrics',
    html: `<div class="stat-grid">
      <div class="stat-box"><div class="value">${player.minutesPlayed}</div><div class="label">Minutes</div></div>
      <div class="stat-box"><div class="value">${player.goals}</div><div class="label">Goals</div></div>
      <div class="stat-box"><div class="value">${player.successPassPercent}</div><div class="label">Pass Accuracy</div></div>
      <div class="stat-box"><div class="value">${player.tackles}</div><div class="label">Tackles</div></div>
      <div class="stat-box"><div class="value">${metrics.performanceRating}</div><div class="label">Rating</div></div>
      <div class="stat-box"><div class="value">${player.saves}</div><div class="label">Saves</div></div>
    </div>`,
  });

  // Attacking
  const atkRows = [
    ['Shots', `${player.shotsOnTarget}/${player.shotsAttempted}`],
    ['Shot Accuracy', player.shotsAttempted > 0 ? `${((player.shotsOnTarget / player.shotsAttempted) * 100).toFixed(1)}%` : '0%'],
    ['Conversion Rate', player.shotsAttempted > 0 ? `${((player.goals / player.shotsAttempted) * 100).toFixed(1)}%` : '0%'],
    ['PA Passes', String(player.penaltyAreaPass)],
    ['PA Entries', String(player.penaltyAreaEntry)],
    ['Run in Behind', String(player.runInBehind)],
    ['Overlaps', String(player.overlaps)],
    ['Crosses', String(player.crosses)],
    ['Cut Backs', String(player.cutBacks)],
    ['Offside', String(player.offside)],
  ];
  sections.push({
    heading: 'Attacking',
    html: `<table class="stats"><thead><tr><th>Metric</th><th>Value</th></tr></thead><tbody>${atkRows.map(([l, v]) => `<tr><td>${l}</td><td style="font-weight:600;">${v}</td></tr>`).join('')}</tbody></table>`,
  });

  // Passing
  const passRows = [
    ['Total Passes', String(player.passCount)],
    ['Successful', String(player.successfulPass)],
    ['Accuracy', player.successPassPercent],
    ['Forward', `${player.forwardPass} (${player.forwardPassPercent})`],
    ['Backward', `${player.backwardPass} (${player.backwardPassPercent})`],
  ];
  sections.push({
    heading: 'Passing',
    html: `<table class="stats"><thead><tr><th>Metric</th><th>Value</th></tr></thead><tbody>${passRows.map(([l, v]) => `<tr><td>${l}</td><td style="font-weight:600;">${v}</td></tr>`).join('')}</tbody></table>`,
  });

  // Defensive
  const defRows = [
    ['Tackles', String(player.tackles)],
    ['Clearances', String(player.clearance)],
    ['Aerial Duels Won', String(player.aerialDuelsWon)],
    ['Aerial Duels Lost', String(player.aerialDuelsLost)],
    ['Fouls', String(player.fouls)],
    ['Fouls Won', String(player.foulWon)],
    ['Defensive Errors', String(player.defensiveErrors)],
  ];
  sections.push({
    heading: 'Defensive',
    html: `<table class="stats"><thead><tr><th>Metric</th><th>Value</th></tr></thead><tbody>${defRows.map(([l, v]) => `<tr><td>${l}</td><td style="font-weight:600;">${v}</td></tr>`).join('')}</tbody></table>`,
  });

  // Set Pieces
  const spRows = [
    ['Corners', `${player.cornerSuccess}/${player.corners} successful`],
    ['Throw-ins', `${player.tiSuccess}/${player.throwIns} successful`],
    ['Free Kicks', String(player.freeKicks)],
  ];
  sections.push({
    heading: 'Set Pieces',
    html: `<table class="stats"><thead><tr><th>Metric</th><th>Value</th></tr></thead><tbody>${spRows.map(([l, v]) => `<tr><td>${l}</td><td style="font-weight:600;">${v}</td></tr>`).join('')}</tbody></table>`,
  });

  const filterLabel = matchFilter === 'all' ? 'All Matches' : matchFilter === 'last1' ? 'Last Match' : matchFilter === 'last3' ? 'Last 3 Matches' : matchFilter === 'last5' ? 'Last 5 Matches' : 'Selected Match';

  const html = buildReportHtml({
    title: `${player.playerName} — #${player.jerseyNumber}`,
    subtitle: 'Player Report',
    metadata: {
      'Team': teamName,
      'Position': player.role || 'N/A',
      'Filter': filterLabel,
    },
    sections,
  });

  const safeName = `player-report-${player.playerName.replace(/\s+/g, '-')}.html`;
  downloadHtmlFile(safeName, html);
}
