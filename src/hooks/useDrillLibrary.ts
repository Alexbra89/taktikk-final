import { useMemo } from 'react';
import { ALL_DRILLS } from '@/data/drills';
import { useAppStore } from '@/store/useAppStore';

export function useDrillLibrary() {
  const customDrills = useAppStore(s => s.customDrills);
  return useMemo(() => [...customDrills, ...ALL_DRILLS], [customDrills]);
}
