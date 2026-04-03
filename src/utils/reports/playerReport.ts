import { PlayerStats } from '@/utils/parseCSV';
import { buildReportHtml, downloadHtmlFile, ReportSection } from '@/utils/generateReport';
import { calculateAdvancedMetrics, calculateTacticalProfile, analyzePositioning } from '@/utils/playerMetrics';
import {
  buildRadarChartSvg,
  buildPitchHeatmapSvg,
  buildProgressBars,
  buildLineChartSvg,
  buildHorizontalBarChart,
  buildStatGrid,
} from './chartBuilders';
import type { PlayerMatchTrendPoint } from '@/hooks/usePlayerMatchTrends';
import type { PlayerAdvancedStats } from '@/hooks/usePlayerAdvancedStats';

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
  // NEW: Additional chart data
  trendData?: PlayerMatchTrendPoint[] | null;
  advancedStats?: PlayerAdvancedStats | null;
  playerShots?: Array<{
    x: number;
    y: number;
    shot_outcome: string | null;
    goal_mouth_x: number | null;
    goal_mouth_y: number | null;
    player?: { jersey_number: number } | null;
  }> | null;
  defensiveEvents?: Array<{
    x: number;
    y: number;
    event_type: string;
    player?: { jersey_number: number } | null;
  }> | null;
  xgStats?: {
    totalXG: number;
    xGPerShot: number;
    overperformance: number;
    actualGoals: number;
    shotCount: number;
  } | null;
}

export function generatePlayerReport(data: PlayerReportData) {
  const { player, teamName, playerProfile, matchFilter, trendData, advancedStats, playerShots, defensiveEvents, xgStats } = data;
  const metrics = calculateAdvancedMetrics(player);
  const tacticalProfile = calculateTacticalProfile(player, metrics);
  const positioning = analyzePositioning(player);
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
    html: buildStatGrid([
      { label: 'Minutes', value: player.minutesPlayed },
      { label: 'Goals', value: player.goals },
      { label: 'Pass Accuracy', value: player.successPassPercent },
      { label: 'Tackles', value: player.tackles },
      { label: 'Rating', value: metrics.performanceRating },
      { label: 'Saves', value: player.saves },
    ]),
  });

  // xG Stats
  if (xgStats && xgStats.shotCount > 0) {
    sections.push({
      heading: 'Expected Goals (xG)',
      html: buildStatGrid([
        { label: 'xG', value: xgStats.totalXG.toFixed(2) },
        { label: 'xG/Shot', value: xgStats.xGPerShot.toFixed(2) },
        { label: 'Goals vs xG', value: `${xgStats.overperformance >= 0 ? '+' : ''}${xgStats.overperformance.toFixed(2)}` },
        { label: 'Finishing', value: `${xgStats.actualGoals}/${xgStats.shotCount}` },
      ]),
    });
  }

  // Tactical Radar Chart
  const radarData = [
    { category: 'Attack', value: tacticalProfile.attacking },
    { category: 'Passing', value: tacticalProfile.passing },
    { category: 'Defense', value: tacticalProfile.defending },
    { category: 'Set Pieces', value: tacticalProfile.setPieces },
    { category: 'Discipline', value: tacticalProfile.discipline },
    { category: 'Workrate', value: tacticalProfile.workRate },
  ];
  sections.push({
    heading: 'Tactical Profile',
    html: `<div style="display:flex;flex-wrap:wrap;gap:20px;align-items:flex-start;">
      <div style="flex:1;min-width:280px;">${buildRadarChartSvg(radarData)}</div>
      <div style="flex:1;min-width:200px;">${buildProgressBars([
        { label: 'Shot Conversion', value: `${metrics.shotConversionRate}%`, percent: metrics.shotConversionRate },
        { label: 'Pass Accuracy', value: `${metrics.passAccuracy}%`, percent: metrics.passAccuracy },
        { label: 'Aerial Success', value: `${metrics.aerialDuelSuccessRate}%`, percent: metrics.aerialDuelSuccessRate },
        { label: 'Discipline', value: `${metrics.disciplineScore}%`, percent: metrics.disciplineScore },
        { label: 'Performance Rating', value: `${metrics.performanceRating}%`, percent: metrics.performanceRating },
      ], 'Efficiency Metrics')}</div>
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

  // Shot Map
  if (playerShots && playerShots.length > 0) {
    const outcomeColor: Record<string, string> = {
      goal: '#22c55e', on_target: '#f59e0b', saved: '#f59e0b',
      off_target: '#ef4444', blocked: '#94a3b8', miss: '#ef4444',
    };
    sections.push({
      heading: 'Shot Map',
      html: buildPitchHeatmapSvg(
        playerShots.map(s => ({
          x: s.x,
          y: s.y,
          color: outcomeColor[s.shot_outcome || 'off_target'] || '#94a3b8',
          label: s.player?.jersey_number != null ? String(s.player.jersey_number) : undefined,
          radius: s.shot_outcome === 'goal' ? 8 : 6,
        }))
      ),
    });
  }

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

  // Defensive Heatmap
  if (defensiveEvents && defensiveEvents.length > 0) {
    const typeColor: Record<string, string> = {
      tackle: '#3b82f6', clearance: '#22c55e', interception: '#8b5cf6',
      block: '#f59e0b', aerial_duel: '#06b6d4',
    };
    sections.push({
      heading: 'Defensive Actions Map',
      html: buildPitchHeatmapSvg(
        defensiveEvents.map(e => ({
          x: e.x,
          y: e.y,
          color: typeColor[e.event_type] || '#64748b',
          label: e.player?.jersey_number != null ? String(e.player.jersey_number) : undefined,
          radius: 5,
        }))
      ),
    });
  }

  // Attacking Threat (from advanced stats)
  if (advancedStats && advancedStats.attackingThreat.all.length > 0) {
    sections.push({
      heading: 'Attacking Threat by Lane',
      html: buildHorizontalBarChart(
        advancedStats.attackingThreat.all.map(lane => ({
          label: lane.lane,
          value: lane.passCount,
          subLabel: `${lane.threatPercent}%`,
          color: lane.lane === 'Center' ? '#1e3a5f' : '#3b82f6',
        }))
      ),
    });
  }

  // Possession Loss Heatmap
  if (advancedStats && advancedStats.possessionLossEvents.length > 0) {
    sections.push({
      heading: 'Possession Losses',
      html: buildPitchHeatmapSvg(
        advancedStats.possessionLossEvents.map(l => ({
          x: l.x,
          y: l.y,
          color: l.zone === 'defensive' ? '#ef4444' : l.zone === 'middle' ? '#f59e0b' : '#3b82f6',
          radius: 5,
        })),
        undefined,
        500,
        340
      ),
    });
  }

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

  // Performance Trends
  if (trendData && trendData.length >= 2) {
    const labels = trendData.map(t => t.opponent.substring(0, 8));

    // Attacking trends
    sections.push({
      heading: 'Performance Trends — Attacking',
      html: buildLineChartSvg(
        [
          { name: 'Goals', values: trendData.map(t => t.goals), color: '#22c55e' },
          { name: 'xG', values: trendData.map(t => t.xG || 0), color: '#3b82f6' },
          { name: 'Shots', values: trendData.map(t => t.shotsAttempted), color: '#f59e0b' },
        ],
        labels
      ),
    });

    // Passing trends
    sections.push({
      heading: 'Performance Trends — Passing',
      html: buildLineChartSvg(
        [
          { name: 'Pass Acc %', values: trendData.map(t => t.passAccuracy), color: '#8b5cf6' },
          { name: 'Passes', values: trendData.map(t => t.passCount), color: '#06b6d4' },
        ],
        labels
      ),
    });

    // Defensive trends
    sections.push({
      heading: 'Performance Trends — Defensive',
      html: buildLineChartSvg(
        [
          { name: 'Tackles', values: trendData.map(t => t.tackles), color: '#1e3a5f' },
          { name: 'Clearances', values: trendData.map(t => t.clearance), color: '#22c55e' },
          { name: 'Aerial Won', values: trendData.map(t => t.aerialDuelsWon), color: '#f59e0b' },
        ],
        labels
      ),
    });
  }

  // Foul distribution
  if (positioning.foulDistribution) {
    const fd = positioning.foulDistribution;
    const total = fd.defensive + fd.middle + fd.final;
    if (total > 0) {
      sections.push({
        heading: 'Positional Intelligence — Foul Distribution',
        html: buildHorizontalBarChart([
          { label: 'Defensive Third', value: fd.defensive, color: '#ef4444' },
          { label: 'Middle Third', value: fd.middle, color: '#f59e0b' },
          { label: 'Final Third', value: fd.final, color: '#22c55e' },
        ]),
      });
    }
  }

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
