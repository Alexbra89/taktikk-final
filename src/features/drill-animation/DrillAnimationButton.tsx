'use client';
import dynamic from 'next/dynamic';
import React, { useState } from 'react';
import { Film } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { getDrillAnimation } from '@/data/drillAnimations';

// Visningen (og 3D) lastes først når treneren trykker «Se animert».
const DrillAnimationViewer = dynamic(() => import('./DrillAnimationViewer'), { ssr: false });

/** Liten knapp i øvelsesbiblioteket. Vises bare når øvelsen har en animasjon. */
export const DrillAnimationButton: React.FC<{ drillId: string; drillName: string }> = ({ drillId, drillName }) => {
  const [open, setOpen] = useState(false);
  const animation = getDrillAnimation(drillId);
  if (!animation) return null;
  return (
    <>
      <Button size="sm" icon={<Film size={14} strokeWidth={1.75} />} onClick={() => setOpen(true)}>Se animert</Button>
      {open && <DrillAnimationViewer animation={animation} drillName={drillName} onClose={() => setOpen(false)} />}
    </>
  );
};
