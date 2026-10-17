import React from 'react';
import type { DrillExercise } from '@/types';
import { AI_DRILL_LABEL } from '@/lib/customDrills';

export function DrillOrigin({ drill }: { drill: DrillExercise }) {
  if (!drill.isCustom && !drill.aiGenerated) return null;
  return <span className="block text-meta text-ink-subtle mt-1">
    {drill.isCustom && <span>Min øvelse</span>}
    {drill.aiGenerated && <span className="block text-warn-300">{AI_DRILL_LABEL}</span>}
  </span>;
}
