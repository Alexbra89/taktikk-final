import React from 'react';

export const SvgDefs: React.FC = () => (
  <defs>
    <filter id="dropShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.5"/>
    </filter>
    <filter id="jerseyDrop" x="-30%" y="-30%" width="160%" height="160%">
      <feDropShadow dx="0" dy="4" stdDeviation="6" floodOpacity="0.7"/>
    </filter>
    <filter id="glowBlue">
      <feGaussianBlur stdDeviation="3" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <pattern id="grass" patternUnits="userSpaceOnUse" width="50" height="50">
      <rect width="50" height="50" fill="#1a5c28"/>
      <rect width="50" height="25" fill="#1c6229"/>
    </pattern>
    <radialGradient id="vignette" cx="50%" cy="50%" r="70%">
      <stop offset="60%" stopColor="transparent"/>
      <stop offset="100%" stopColor="rgba(0,0,0,0.35)"/>
    </radialGradient>
  </defs>
);
