import React from 'react';

// Kalk: banen er flat, så gressmønster og vignett er borte.
// Igjen står bare den myke skyggen under ballen.

export const SvgDefs: React.FC = () => (
  <defs>
    <filter id="dropShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="1" stdDeviation="2" floodOpacity="0.35"/>
    </filter>
  </defs>
);
