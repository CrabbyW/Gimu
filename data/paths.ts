import type { PathId, PathMeta } from '@/types';

export const PATHS: Record<PathId, PathMeta> = {
  power: { id: 'power', name: 'Power', tagline: 'Explosive pulling power. Pull-ups, dips, your first muscle-up.',
    sections: [{ index: 1, title: 'Pulling basics' }] },
  bodyControl: { id: 'bodyControl', name: 'Body control', tagline: 'Balance and body control. Plank, handstand, L-sit.',
    sections: [{ index: 1, title: 'Balance basics' }] },
  strength: { id: 'strength', name: 'Strength', tagline: 'Raw bodyweight strength. Push-ups, squats, pistols.',
    sections: [{ index: 1, title: 'Strength basics' }] },
};
