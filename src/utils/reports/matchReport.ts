import { PlayerStats } from '@/utils/parseCSV';
import { buildReportHtml, downloadHtmlFile, ReportSection } from '@/utils/generateReport';
import {
  buildPitchHeatmapSvg,
  buildGoalMouthSvg,
  buildComparisonBars,
  buildPassesByThirdSvg,
  buildHorizontalBarChart,
  buildStatGrid,
  buildZonesOfControlSvg,
} from './chartBuilders';
import type { SetPieceAnalyticsData } from '@/hooks/useSetPieceAnalytics';
import type { TeamEventStats, TeamPassesByThird, ZonesOfControlData } from '@/hooks/useMatchVisualizationData';

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
  // NEW: Set piece data
  setPieceData?: SetPieceAnalyticsData | null;
  opponentSetPieceData?: SetPieceAnalyticsData | null;
  // NEW: Visualization data
  matchEventStats?: { home: TeamEventStats; away: TeamEventStats } | null;
  homePassesByThird?: TeamPassesByThird | null;
  awayPassesByThird?: TeamPassesByThird | null;
  shots?: Array<{
    team_id: string;
    x: number;
    y: number;
    goal_mouth_x: number | null;
    goal_mouth_y: number | null;
    shot_outcome: string | null;
    player?: { jersey_number: number } | null;
  }> | null;
  homeTeamId?: string;
  awayTeamId?: string;
  zonesOfControl?: ZonesOfControlData | null;
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
  const {
    homeTeamName, awayTeamName, homeScore, awayScore, matchDate,
    competition, venue, homePlayers, awayPlayers, xgStats,
    setPieceData, opponentSetPieceData, matchEventStats,
    homePassesByThird, awayPassesByThird, shots, homeTeamId, awayTeamId,
    zonesOfControl,
  } = data;

  const home = aggregateTeam(homePlayers);
  const away = aggregateTeam(awayPlayers);

  const sections: ReportSection[] = [];

  // 1. Team stats comparison
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

  // 2. Match Event Stats (Visualization tab comparison bars)
  if (matchEventStats) {
    const h = matchEventStats.home;
    const a = matchEventStats.away;
    const html = buildComparisonBars(
      [
        { label: 'Corners (Success)', homeValue: h.cornerSuccess, awayValue: a.cornerSuccess },
        { label: 'Corners (Failed)', homeValue: h.cornerFailed, awayValue: a.cornerFailed },
        { label: 'Throw-ins (Success)', homeValue: h.throwInSuccess, awayValue: a.throwInSuccess },
        { label: 'Throw-ins (Failed)', homeValue: h.throwInFailed, awayValue: a.throwInFailed },
        { label: 'Aerial Duels Won', homeValue: h.aerialDuelsWon, awayValue: a.aerialDuelsWon },
        { label: 'Aerial Duels Lost', homeValue: h.aerialDuelsLost, awayValue: a.aerialDuelsLost },
        { label: 'Backward Passes', homeValue: h.backwardPass, awayValue: a.backwardPass },
        { label: 'Incomplete Passes', homeValue: h.incompletePass, awayValue: a.incompletePass },
      ],
      homeTeamName,
      awayTeamName
    );
    sections.push({ heading: 'Match Event Comparison', html });
  }

  // 3. Goal Mouth Maps
  if (shots && shots.length > 0) {
    const buildShotSection = (teamId: string | undefined, teamName: string) => {
      if (!teamId) return '';
      const teamShots = shots.filter(s => s.team_id === teamId && s.goal_mouth_x != null && s.goal_mouth_y != null);
      if (teamShots.length === 0) return '';
      return buildGoalMouthSvg(
        teamShots.map(s => ({
          goalMouthX: s.goal_mouth_x!,
          goalMouthY: s.goal_mouth_y!,
          outcome: s.shot_outcome || 'off_target',
          jerseyNumber: s.player?.jersey_number,
        })),
        `${teamName} — Shot Placement`
      );
    };
    const homeGM = buildShotSection(homeTeamId, homeTeamName);
    const awayGM = buildShotSection(awayTeamId, awayTeamName);
    if (homeGM || awayGM) {
      sections.push({ heading: 'Goal Mouth Maps', html: `<div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;">${homeGM}${awayGM}</div>` });
    }
  }

  // 4. Passes by Third
  if (homePassesByThird || awayPassesByThird) {
    let html = '<div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;">';
    if (homePassesByThird) {
      const totals = homePassesByThird.halves.reduce((a, h) => ({ defensive: a.defensive + h.defensive, middle: a.middle + h.middle, final: a.final + h.final }), { defensive: 0, middle: 0, final: 0 });
      html += buildPassesByThirdSvg(totals, homeTeamName);
    }
    if (awayPassesByThird) {
      const totals = awayPassesByThird.halves.reduce((a, h) => ({ defensive: a.defensive + h.defensive, middle: a.middle + h.middle, final: a.final + h.final }), { defensive: 0, middle: 0, final: 0 });
      html += buildPassesByThirdSvg(totals, awayTeamName);
    }
    html += '</div>';
    sections.push({ heading: 'Passes by Third', html });
  }

  // 5. Set Piece Analytics
  const buildSetPieceSection = (spData: SetPieceAnalyticsData, teamName: string): string => {
    let html = '';

    // Overview stats
    const overview = spData.overview;
    html += buildStatGrid(
      overview.map(o => ({
        label: o.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
        value: `${o.successful}/${o.total} (${o.successRate}%)`,
      }))
    );

    // Throw-in zone breakdown
    if (spData.throwInsByZone.some(z => z.total > 0)) {
      html += buildHorizontalBarChart(
        spData.throwInsByZone
          .filter(z => z.total > 0)
          .map(z => ({
            label: `${z.zone.charAt(0).toUpperCase() + z.zone.slice(1)} (${z.side})`,
            value: z.total,
            subLabel: `${z.successRate}% success`,
            color: z.zone === 'final' ? '#ef4444' : z.zone === 'middle' ? '#f59e0b' : '#3b82f6',
          })),
        'Throw-ins by Zone'
      );
    }

    // Possession losses heatmap
    if (spData.possessionLosses.length > 0) {
      html += buildPitchHeatmapSvg(
        spData.possessionLosses.map(l => ({
          x: l.x,
          y: l.y,
          color: l.zone === 'defensive' ? '#ef4444' : l.zone === 'middle' ? '#f59e0b' : '#3b82f6',
          label: String(l.jerseyNumber),
          radius: 5,
        })),
        'Possession Losses'
      );

      // Zone summary
      html += `<div style="display:flex;gap:16px;margin-top:8px;">`;
      spData.possessionLossByZone.forEach(z => {
        html += `<div style="font-size:12px;"><strong>${z.zone}:</strong> ${z.count} (${z.percentage}%)</div>`;
      });
      html += `</div>`;
    }

    // Player accountability table
    if (spData.playerStats.length > 0) {
      html += `<table class="stats" style="margin-top:12px;"><thead><tr><th>#</th><th>Player</th><th>Throw-ins</th><th>TI Rate</th><th>Corners</th><th>C Rate</th><th>Free Kicks</th></tr></thead><tbody>`;
      spData.playerStats.forEach(p => {
        html += `<tr><td>${p.jerseyNumber}</td><td>${p.playerName}</td><td>${p.throwIns.successful}/${p.throwIns.total}</td><td>${p.throwIns.rate}%</td><td>${p.corners.successful}/${p.corners.total}</td><td>${p.corners.rate}%</td><td>${p.freeKicks.total}</td></tr>`;
      });
      html += `</tbody></table>`;
    }

    return html;
  };

  if (setPieceData) {
    sections.push({ heading: `${homeTeamName} — Set Piece Analysis`, html: buildSetPieceSection(setPieceData, homeTeamName) });
  }

  if (opponentSetPieceData) {
    sections.push({ heading: `${awayTeamName} — Set Piece Analysis`, html: buildSetPieceSection(opponentSetPieceData, awayTeamName) });
  }

  // 6. Player performances for each team
  const buildPlayerTable = (players: PlayerStats[]): string => {
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

  sections.push({ heading: `${homeTeamName} — Player Performances`, html: buildPlayerTable(homePlayers) });
  sections.push({ heading: `${awayTeamName} — Player Performances`, html: buildPlayerTable(awayPlayers) });

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
