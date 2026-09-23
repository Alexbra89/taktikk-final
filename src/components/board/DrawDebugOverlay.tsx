'use client';
import React, { useEffect, useState, useSyncExternalStore } from 'react';
import { drawDebug, isDrawDebug } from '@/lib/drawDebug';

// MIDLERTIDIG: diagnose av tegning på iOS. Vises bare med ?debug=draw.
export const DrawDebugOverlay: React.FC = () => {
  // Leses etter montering, så server og klient rendrer det samme først.
  const [on, setOn] = useState(false);
  useEffect(() => setOn(isDrawDebug()), []);
  const s = useSyncExternalStore(drawDebug.subscribe, drawDebug.get, drawDebug.get);
  if (!on) return null;

  const rows: [string, string | number][] = [
    ['pointerdown', s.pointerdown],
    ['pointermove', s.pointermove],
    ['pointerup', s.pointerup],
    ['ptrcancel', s.pointercancel],
    ['touchstart', s.touchstart],
    ['touchmove', s.touchmove],
    ['touchend', s.touchend],
    ['touch-act', s.touchAction],
    ['capture', s.capture === null ? '–' : String(s.capture)],
    ['ptrType', s.pointerType],
    ['punkter', s.lastStrokePts],
    ['leave (ignorert)', s.leaveIgnored],
  ];

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 99999,
      background: 'rgba(0,0,0,0.85)', color: '#fff', pointerEvents: 'none',
      font: '600 15px/1.4 ui-monospace, Menlo, monospace',
      padding: 'calc(env(safe-area-inset-top) + 6px) 12px 8px',
    }}>
      {/* To kolonner, så overlayen dekker minst mulig av banen. */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr auto', columnGap: 10 }}>
        {rows.map(([k, v]) => (
          <React.Fragment key={k}><span>{k}</span><span style={{ textAlign: 'right' }}>{v}</span></React.Fragment>
        ))}
        <button onClick={drawDebug.reset}
          style={{ pointerEvents: 'auto', gridColumn: 'span 2', justifySelf: 'start', padding: '0 10px', background: '#fff', color: '#000', borderRadius: 4 }}>
          Nullstill
        </button>
      </div>
    </div>
  );
};
