export interface Match {
  id: string;
  homeTeam: string;
  awayTeam: string;
  homeTeamId: string;
  awayTeamId: string;
  date: string;
  score: {
    home: number;
    away: number;
  };
  venue: string;
  competition: string;
}

export const matches: Match[] = [
  {
    id: 'match-1',
    homeTeam: 'Europa Point FC',
    awayTeam: 'Glacis United',
    homeTeamId: 'europa-point',
    awayTeamId: 'glacis-united',
    date: '2024-03-15',
    score: { home: 2, away: 1 },
    venue: 'Victoria Stadium',
    competition: 'League',
  },
  {
    id: 'match-2',
    homeTeam: 'Glacis United',
    awayTeam: 'Europa Point FC',
    homeTeamId: 'glacis-united',
    awayTeamId: 'europa-point',
    date: '2024-03-22',
    score: { home: 1, away: 3 },
    venue: 'Glacis Stadium',
    competition: 'League',
  },
];

export function getMatchById(id: string): Match | undefined {
  return matches.find(match => match.id === id);
}

export function getMatchesByTeam(teamId: string): Match[] {
  return matches.filter(
    match => match.homeTeamId === teamId || match.awayTeamId === teamId
  );
}
