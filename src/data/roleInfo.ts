import { PlayerRole, Position } from '../types';

// Rollefamilie – brukes til å oppdage spillere som står ute av posisjon på brettet.
export type RoleFamily = 'gk' | 'def' | 'mid' | 'att';

export const ROLE_INFO: Record<PlayerRole, { name: string; short: string; family: RoleFamily; color: string }> = {
  keeper:       { name: 'Keeper',       short: 'KV',   family: 'gk',  color: '#f59e0b' },
  defender:     { name: 'Stopper',      short: 'MS',   family: 'def', color: '#3b82f6' },
  wingback:     { name: 'Vingback',     short: 'VB',   family: 'def', color: '#06b6d4' },
  sweeper:      { name: 'Sweeper',      short: 'SV',   family: 'def', color: '#1d4ed8' },
  midfielder:   { name: 'Midtbane',     short: 'SM',   family: 'mid', color: '#22c55e' },
  box2box:      { name: 'Box-to-box',   short: 'BBM',  family: 'mid', color: '#10b981' },
  playmaker:    { name: 'Playmaker',    short: 'OM',   family: 'mid', color: '#8b5cf6' },
  winger:       { name: 'Kantspiller',  short: 'KANT', family: 'att', color: '#f97316' },
  forward:      { name: 'Spiss',        short: 'SP',   family: 'att', color: '#ef4444' },
  false9:       { name: 'Falsk 9er',    short: 'F9',   family: 'att', color: '#ec4899' },
  trequartista: { name: 'Trequartista', short: 'TQ',   family: 'att', color: '#a855f7' },
  targetman:    { name: 'Targetman',    short: 'TM',   family: 'att', color: '#dc2626' },
};

// Formasjonsdataene har ikke venstre og høyre, men sloten har en posisjon.
// Laget angriper mot høyre, så venstre side er toppen av banen (y lav).
const LEFT_Y = 180;
const RIGHT_Y = 380;
const DEFENSIVE_MID_X = 300;

/** Etikett som «VB», «MS» eller «DM», utledet fra rolle + slotens posisjon. */
export function getSlotLabel(role: PlayerRole, pos: Position): string {
  const left = pos.y < LEFT_Y;
  const right = pos.y > RIGHT_Y;
  switch (role) {
    case 'keeper':    return 'KV';
    case 'defender':  return left ? 'VB' : right ? 'HB' : 'MS';
    case 'wingback':  return pos.y < 280 ? 'VVB' : 'HVB';
    case 'midfielder':
      if (left) return 'VM';
      if (right) return 'HM';
      return pos.x < DEFENSIVE_MID_X ? 'DM' : 'SM';
    case 'playmaker': return 'OM';
    case 'winger':    return pos.y < 280 ? 'VK' : 'HK';
    case 'forward':   return 'SP';
    default:          return ROLE_INFO[role]?.short ?? String(role).slice(0, 4).toUpperCase();
  }
}
