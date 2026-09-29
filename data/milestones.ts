import type { MilestoneUnit, PathId } from '@/types';

export interface MilestonePreset { id: string; label: string; target: number; unit: MilestoneUnit }
export const MILESTONE_PRESETS: Record<PathId | 'general', MilestonePreset[]> = {
  power: [
    { id: 'pullups-10', label: '10 shybů', target: 10, unit: 'reps' },
    { id: 'pushups-20', label: '20 kliků', target: 20, unit: 'reps' },
    { id: 'dips-10', label: '10 dipů', target: 10, unit: 'reps' },
    { id: 'first-muscleup', label: 'První muscle-up', target: 1, unit: 'done' },
  ],
  bodyControl: [
    { id: 'plank-60', label: '60s plank', target: 60, unit: 'seconds' },
    { id: 'first-handstand', label: 'První stojka u zdi', target: 1, unit: 'done' },
    { id: 'lsit-10', label: 'L-sit 10 s', target: 10, unit: 'seconds' },
    { id: 'crow-15', label: 'Vrána 15 s', target: 15, unit: 'seconds' },
  ],
  strength: [
    { id: 'pushups-30', label: '30 kliků', target: 30, unit: 'reps' },
    { id: 'pistol-1', label: 'První pistol squat', target: 1, unit: 'done' },
    { id: 'dips-5', label: '5 dipů na bradlech', target: 5, unit: 'reps' },
  ],
  general: [{ id: 'minus-3kg', label: '-3 kg', target: 3, unit: 'kg' }],
};
