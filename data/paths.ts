import type { PathId, PathMeta } from '@/types';

export const PATHS: Record<PathId, PathMeta> = {
  power: { id: 'power', name: 'Power', tagline: 'Výbušnost a\u00A0síla v\u00A0tahu. Shyby, dipy, první muscle-up.',
    sections: [{ index: 1, title: 'Základy tahu' }] },
  bodyControl: { id: 'bodyControl', name: 'Body control', tagline: 'Rovnováha a\u00A0kontrola těla. Plank, stojka, L-sit.',
    sections: [{ index: 1, title: 'Základy rovnováhy' }] },
  strength: { id: 'strength', name: 'Strength', tagline: 'Hrubá síla vlastní vahou. Kliky, dřepy, pistol.',
    sections: [{ index: 1, title: 'Základy síly' }] },
};
