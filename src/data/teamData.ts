import europaPoint1st from './europa-point-1st.csv?raw';
import europaPoint2nd from './europa-point-2nd.csv?raw';
import glacisUnited1st from './glacis-united-1st.csv?raw';
import glacisUnited2nd from './glacis-united-2nd.csv?raw';
import { parseCSV, combineHalves, PlayerStats } from '@/utils/parseCSV';

export interface Team {
  id: string;
  name: string;
  players: PlayerStats[];
}

const europaPointPlayers = combineHalves(
  parseCSV(europaPoint1st),
  parseCSV(europaPoint2nd)
);

const glacisUnitedPlayers = combineHalves(
  parseCSV(glacisUnited1st),
  parseCSV(glacisUnited2nd)
);

export const teams: Team[] = [
  {
    id: 'europa-point',
    name: 'Europa Point FC',
    players: europaPointPlayers,
  },
  {
    id: 'glacis-united',
    name: 'Glacis United',
    players: glacisUnitedPlayers,
  },
];

export function getTeamById(id: string): Team | undefined {
  return teams.find(team => team.id === id);
}

export function getPlayerByName(teamId: string, playerName: string): PlayerStats | undefined {
  const team = getTeamById(teamId);
  return team?.players.find(player => player.playerName === playerName);
}
