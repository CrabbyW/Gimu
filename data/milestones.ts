import type { MilestoneUnit, PathId } from '@/types';

export interface MilestonePreset { id: string; label: string; target: number; unit: MilestoneUnit }
/** Předvolby milníků (rozhodnutí R37): aspoň 6 na cestu, realistické cíle kalisteniky pro začátečníka až mírně pokročilého. */
export const MILESTONE_PRESETS: Record<PathId | 'general', MilestonePreset[]> = {
  power: [
    { id: 'pullups-10', label: '10 shybů', target: 10, unit: 'reps' },
    { id: 'pushups-20', label: '20 kliků', target: 20, unit: 'reps' },
    { id: 'dips-10', label: '10 dipů', target: 10, unit: 'reps' },
    { id: 'first-muscleup', label: 'První muscle-up', target: 1, unit: 'done' },
    { id: 'clap-pushups-10', label: '10 tleskacích kliků', target: 10, unit: 'reps' },
    { id: 'chest-pullups-5', label: '5 shybů k hrudi', target: 5, unit: 'reps' },
    { id: 'jump-squats-20', label: '20 výskoků z dřepu', target: 20, unit: 'reps' },
  ],
  bodyControl: [
    { id: 'plank-60', label: '60 s plank', target: 60, unit: 'seconds' },
    { id: 'first-handstand', label: 'První stojka u zdi', target: 1, unit: 'done' },
    { id: 'lsit-10', label: 'L-sit 10 s', target: 10, unit: 'seconds' },
    { id: 'crow-15', label: 'Vrána 15 s', target: 15, unit: 'seconds' },
    { id: 'wall-handstand-30', label: 'Stojka u zdi 30 s', target: 30, unit: 'seconds' },
    { id: 'hollow-45', label: 'Hollow hold 45 s', target: 45, unit: 'seconds' },
    { id: 'first-bridge', label: 'První most z lehu', target: 1, unit: 'done' },
  ],
  strength: [
    { id: 'pushups-30', label: '30 kliků', target: 30, unit: 'reps' },
    { id: 'pistol-1', label: 'První pistol squat', target: 1, unit: 'done' },
    { id: 'dips-5', label: '5 dipů na bradlech', target: 5, unit: 'reps' },
    { id: 'pullups-8', label: '8 shybů', target: 8, unit: 'reps' },
    { id: 'squats-50', label: '50 dřepů', target: 50, unit: 'reps' },
    { id: 'dead-hang-60', label: 'Vis na hrazdě 60 s', target: 60, unit: 'seconds' },
    { id: 'archer-pushups-5', label: '5 archer kliků na stranu', target: 5, unit: 'reps' },
  ],
  general: [
    { id: 'minus-3kg', label: '-3 kg', target: 3, unit: 'kg' },
    { id: 'plus-3kg', label: '+3 kg svalů', target: 3, unit: 'kg' },
  ],
};
