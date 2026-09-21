import React from 'react';
import type { Player } from '../../../types';

// Hvor spilleren kom fra: stiplet linje fra posisjonen i forrige fase til
// der brikken står nå, med en prikk der den startet. Utledes av fasene –
// ingenting lagres på spilleren.
//
// Signalfarge med lav opasitet: samme familie som brikkene, men tydelig
// svakere enn tegningene, så banene leses som avledet og ikke tegnet.

const SIGNAL = 'rgb(var(--k-signal))';

/** Kortere flytt enn dette ville ligget helt under brikken (radius 17). */
const MIN_MOVE = 20;

export const PlayerTrails = React.memo<{ from: Player[]; to: Player[] }>(({ from, to }) => {
  const prev = new Map(from.map(p => [p.id, p.position]));
  return (
    <g aria-hidden style={{ pointerEvents: 'none' }}>
      {to.map(p => {
        const a = prev.get(p.id);
        if (!a) return null;
        const b = p.position;
        if (Math.hypot(b.x - a.x, b.y - a.y) < MIN_MOVE) return null;
        return (
          <g key={p.id} data-trail={p.id}>
            <line x1={a.x} y1={a.y} x2={b.x} y2={b.y}
              strokeWidth={2} strokeDasharray="6,6" strokeLinecap="round"
              style={{ stroke: SIGNAL }} opacity={0.45}/>
            <circle cx={a.x} cy={a.y} r={4} style={{ fill: SIGNAL }} opacity={0.6}/>
          </g>
        );
      })}
    </g>
  );
});
PlayerTrails.displayName = 'PlayerTrails';
