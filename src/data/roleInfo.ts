import { PlayerRole, Sport } from '../types';

export interface RoleMeta {
  label: string;
  color: string;
  border: string;
  emoji: string;
  sports: Sport[];
  description: string;
  responsibilities: string[];
  tacticalTips: string[];
  examplePlayers?: string[];
}

export const ROLE_META: Record<PlayerRole, RoleMeta> = {
  // ─── FELLES BASIS-ROLLER ───────────────────────────────────
  keeper: {
    label: 'Keeper',
    color: '#f59e0b',
    border: '#d97706',
    emoji: '🧤',
    sports: ['football', 'football7', 'handball'],
    description: 'Siste skanse – hindrer mål og starter oppspill.',
    responsibilities: [
      'Redde skudd fra alle vinkler',
      'Styre forsvarslinjen',
      'Starte oppspill',
    ],
    tacticalTips: [
      'Les avslutternes kroppsspråk',
      'Alltid minste vinkel mot skytter',
      'Kommuniser konstant',
    ],
    examplePlayers: ['Manuel Neuer', 'Alisson Becker', 'Niklas Landin'],
  },

  defender: {
    label: 'Forsvarer',
    color: '#3b82f6',
    border: '#2563eb',
    emoji: '🛡️',
    sports: ['football', 'football7', 'handball'],
    description: 'Stopper motstanderens angrep.',
    responsibilities: [
      'Vinne defensive dueller',
      'Holde forsvarslinjen kompakt',
      'Dekke bakrom',
    ],
    tacticalTips: [
      'Posisjonering over takling',
      'Hold øye med ball OG motstander',
      'Tving motstanderen utover',
    ],
    examplePlayers: ['Virgil van Dijk', 'Rúben Dias', 'Magnus Jøndal'],
  },

  midfielder: {
    label: 'Midtbane',
    color: '#22c55e',
    border: '#16a34a',
    emoji: '⚙️',
    sports: ['football', 'football7'],
    description: 'Linken mellom forsvar og angrep.',
    responsibilities: [
      'Kontrollere tempoet',
      'Gjenvinne ball',
      'Skape sjanser',
    ],
    tacticalTips: [
      'Alltid ha pasningsalternativer',
      'Beveg deg uten ball',
      'Press høyt',
    ],
    examplePlayers: ["N'Golo Kanté", 'Rodri', 'Declan Rice'],
  },

  forward: {
    label: 'Angriper',
    color: '#ef4444',
    border: '#dc2626',
    emoji: '⚡',
    sports: ['football', 'football7', 'handball'],
    description: 'Skal score mål og skape rom.',
    responsibilities: [
      'Avslutte sjanser',
      'Holde ballen under press',
      'Presse motstanderen',
    ],
    tacticalTips: [
      'Bevegelse uten ball er avgjørende',
      'Avslutt alltid',
      'Press starter fra spissen',
    ],
    examplePlayers: ['Erling Haaland', 'Kylian Mbappé', 'Mikkel Hansen'],
  },

  // ─── FOTBALL-SPESIFIKKE ────────────────────────────────────
  winger: {
    label: 'Kantspiller',
    color: '#a855f7',
    border: '#9333ea',
    emoji: '🏃',
    sports: ['football', 'football7'],
    description: 'Skaper fart og ubalanse langs sidene.',
    responsibilities: [
      'Utfordre i 1v1',
      'Slå innlegg',
      'Samarbeide med back',
    ],
    tacticalTips: [
      'Fart er din X-faktor',
      'Kutt inn på sterk fot',
      'Forsvar fra kanten',
    ],
    examplePlayers: ['Vinícius Jr.', 'Bukayo Saka', 'Mohamed Salah'],
  },

  false9: {
    label: 'Falsk nier',
    color: '#f97316',
    border: '#ea580c',
    emoji: '🎭',
    sports: ['football'],
    description: 'Spiss som trekker ned i banen.',
    responsibilities: [
      'Skape hull i forsvaret',
      'Åpne rom for kantspillere',
      'Koble spill på midtbanen',
    ],
    tacticalTips: [
      'Timing er alt',
      'Trekk ned kun når det skaper rom',
      'Teknisk eksellens er et must',
    ],
    examplePlayers: ['Lionel Messi', 'Roberto Firmino'],
  },

  libero: {
    label: 'Libero',
    color: '#6366f1',
    border: '#4f46e5',
    emoji: '🌊',
    sports: ['football'],
    description: 'Fri forsvarer som rydder opp.',
    responsibilities: [
      'Dekke bakrom',
      'Starte angrep',
      'Styre forsvarslinjen',
    ],
    tacticalTips: [
      'Ingen fast motstander',
      'Alltid siste mann',
      'God med ball',
    ],
    examplePlayers: ['Franz Beckenbauer', 'Matthias Sammer'],
  },

  playmaker: {
    label: 'Playmaker',
    color: '#ec4899',
    border: '#db2777',
    emoji: '🧠',
    sports: ['football', 'handball'],
    description: 'Hjernen på laget.',
    responsibilities: [
      'Skape sjanser',
      'Styre tempo',
      'Finne riktig pasning',
    ],
    tacticalTips: [
      'Motta vendt',
      'Bruk kroppen til å skjule pasning',
      'Rolig under press',
    ],
    examplePlayers: ['Andrea Pirlo', 'Xavi Hernández', 'Martin Ødegaard'],
  },

  sweeper: {
    label: 'Sweeper',
    color: '#1d4ed8',
    border: '#1e40af',
    emoji: '🧹',
    sports: ['football'],
    description: 'Fri forsvarer bak backene.',
    responsibilities: [
      'Rydde opp ved gjennombrudd',
      'Starte angrep',
      'Lese spillet',
    ],
    tacticalTips: [
      'Ingen fast motstander',
      'Siste mann',
      'Starte oppspill',
    ],
    examplePlayers: ['Franz Beckenbauer', 'Franco Baresi'],
  },

  wingback: {
    label: 'Wingback',
    color: '#0891b2',
    border: '#0e7490',
    emoji: '↔️',
    sports: ['football'],
    description: 'Kombinerer back og kant.',
    responsibilities: [
      'Angripe langs siden',
      'Forsvare på egen halvdel',
      'Overlapping',
    ],
    tacticalTips: [
      'Kondis er nøkkelen',
      'Timing av overlapping',
      'Kommuniser med midtbane',
    ],
    examplePlayers: ['Trent Alexander-Arnold', 'Achraf Hakimi'],
  },

  box2box: {
    label: 'Box-to-box',
    color: '#059669',
    border: '#047857',
    emoji: '🔁',
    sports: ['football'],
    description: 'Midtbane aktiv i begge bokser.',
    responsibilities: [
      'Gjenvinne ball',
      'Ankomme boksen',
      'Høy løpsdistanse',
    ],
    tacticalTips: [
      'Timing av angrepsløp',
      'Spar krefter strategisk',
      'Uforutsigbar',
    ],
    examplePlayers: ['Luka Modrić', 'Kevin De Bruyne'],
  },

  trequartista: {
    label: 'Trequartista',
    color: '#d946ef',
    border: '#c026d3',
    emoji: '🎨',
    sports: ['football'],
    description: 'Kreativ spiller bak spissen.',
    responsibilities: [
      'Skape sjanser',
      'Drible',
      'Kombinere med spiss',
    ],
    tacticalTips: [
      'Finn rom mellom linjene',
      'Kreativitet er ditt våpen',
      'Kommuniser med spissen',
    ],
    examplePlayers: ['Francesco Totti', 'Paulo Dybala'],
  },

  targetman: {
    label: 'Targetman',
    color: '#b45309',
    border: '#92400e',
    emoji: '🏋️',
    sports: ['football'],
    description: 'Fysisk sterk spiss.',
    responsibilities: [
      'Vinne luftdueller',
      'Holde ballen',
      'Legge av til medspillere',
    ],
    tacticalTips: [
      'Bruk kroppen som skjold',
      'Kjennskap til medspilleres løp',
      'Enkle avlegg',
    ],
    examplePlayers: ['Romelu Lukaku', 'Olivier Giroud'],
  },

  pressforward: {
    label: 'Press-forward',
    color: '#dc2626',
    border: '#b91c1c',
    emoji: '🐺',
    sports: ['football'],
    description: 'Angriper som jager ballen.',
    responsibilities: [
      'Presse høyt',
      'Lede pressingstrukturen',
      'Utnytte feil',
    ],
    tacticalTips: [
      'Press på signal',
      'Blokker pasningsveier',
      'Kondis er viktigst',
    ],
    examplePlayers: ['Roberto Firmino', 'Sadio Mané'],
  },

  // ─── HÅNDBALL-SPESIFIKKE ───────────────────────────────────
  hb_keeper: {
    label: 'Keeper (HB)',
    color: '#f59e0b',
    border: '#d97706',
    emoji: '🧤',
    sports: ['handball'],
    description: 'Stopper skudd i håndballmålet.',
    responsibilities: [
      'Redde skudd',
      'Lese avslutteren',
      'Starte kontringer',
    ],
    tacticalTips: [
      'Minimer vinkelen',
      'Studer avslutterens arm',
      'Glem mål du slipper inn',
    ],
    examplePlayers: ['Niklas Landin', 'Andreas Wolff'],
  },

  hb_pivot: {
    label: 'Pivot',
    color: '#14b8a6',
    border: '#0d9488',
    emoji: '🔄',
    sports: ['handball'],
    description: 'Innerst i angrepet.',
    responsibilities: [
      'Binde forsvaret',
      'Motta ball i trange rom',
      'Avslutte nært mål',
    ],
    tacticalTips: [
      'Bruk kroppen som anker',
      'Timing er alt',
      'Vendt mot ballen',
    ],
    examplePlayers: ['Bertrand Gille'],
  },

  hb_backcourt: {
    label: 'Bakspiller',
    color: '#8b5cf6',
    border: '#7c3aed',
    emoji: '🎯',
    sports: ['handball'],
    description: 'Skyter fra distanse.',
    responsibilities: [
      'Skyte fra 8-10 meter',
      'Dirigere angrepet',
      'Gjennombrudd',
    ],
    tacticalTips: [
      'Gjennombruddsfinte',
      'Kjennskap til pivot',
      'Variasjon i skudd',
    ],
    examplePlayers: ['Mikkel Hansen', 'Sander Sagosen'],
  },

  hb_wing: {
    label: 'Fløyspiller',
    color: '#f43f5e',
    border: '#e11d48',
    emoji: '🦅',
    sports: ['handball'],
    description: 'Angriper fra ytterste posisjon.',
    responsibilities: [
      'Avslutte fra vanskelige vinkler',
      'Kontringer',
      'Dekke flanken',
    ],
    tacticalTips: [
      'Fart til siden',
      'Bruk kroppen',
      'Studer keeperens posisjon',
    ],
    examplePlayers: ['Luc Abalo'],
  },

  hb_center: {
    label: 'Midtback',
    color: '#06b6d4',
    border: '#0891b2',
    emoji: '👑',
    sports: ['handball'],
    description: 'Dirigent i angrepet.',
    responsibilities: [
      'Sette opp medspillere',
      'Gjennombrudd',
      'Styre tempoet',
    ],
    tacticalTips: [
      'Overblikk over angrepet',
      'Veksle mellom spill',
      'Kommuniser med pivot',
    ],
    examplePlayers: ['Filip Jícha'],
  },

  hb_playmaker: {
    label: 'Playmaker (HB)',
    color: '#ec4899',
    border: '#db2777',
    emoji: '🧠',
    sports: ['handball'],
    description: 'Kreatør i angrepet.',
    responsibilities: [
      'Lese forsvaret',
      'Presise pasninger',
      'Skape overtall',
    ],
    tacticalTips: [
      'Rolig spillfordeling',
      'Se alltid opp',
      'Timing til pivot',
    ],
    examplePlayers: ['Domagoj Duvnjak'],
  },
};

// ─── Hjelpefunksjoner ────────────────────────────────────────

export function getRolesForSport(sport: Sport): PlayerRole[] {
  const allRoles = Object.keys(ROLE_META) as PlayerRole[];
  return allRoles.filter(r => ROLE_META[r].sports.includes(sport));
}

export function getRoleMeta(role: PlayerRole): RoleMeta {
  return ROLE_META[role];
}