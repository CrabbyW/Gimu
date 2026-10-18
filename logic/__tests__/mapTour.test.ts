import { controlsAt, mascotSide, nextTourStep, spotlightRect, tourPlacement, tourSteps, TOUR_SEEN_IDS } from '@/logic/mapTour';
import { nextGuide } from '@/logic/guide';
import type { UserProfile } from '@/types';

const prof = (guideSeen?: string[]) => ({ guideSeen } as unknown as UserProfile);

describe('mapTour', () => {
  it('4 kroky s aktuální lekcí, 2 bez ní', () => {
    expect(tourSteps(true)).toEqual(['plate', 'streak', 'progress', 'start']);
    expect(tourSteps(false)).toEqual(['streak', 'progress']);
  });
  it('další krok a konec', () => {
    expect(nextTourStep(0, 4)).toBe(1);
    expect(nextTourStep(3, 4)).toBeNull();
  });
  it('výřez s odsazením oříznutý do obrazovky', () => {
    expect(spotlightRect({ x: 4, y: 100, width: 50, height: 20 }, 8, 390, 844)).toEqual({ x: 0, y: 92, width: 62, height: 36 });
    expect(spotlightRect({ x: 0, y: 100, width: 390, height: 20 }, 8, 390, 844, 4)).toEqual({ x: 4, y: 92, width: 382, height: 36 });
    expect(spotlightRect({ x: 350, y: 830, width: 40, height: 20 }, 8, 390, 844)).toEqual({ x: 342, y: 822, width: 48, height: 22 });
  });
  it('umístění opičky a ovládání', () => {
    expect(tourPlacement({ x: 0, y: 50, width: 10, height: 10 }, 800)).toBe('below');
    expect(tourPlacement({ x: 0, y: 700, width: 10, height: 10 }, 800)).toBe('above');
    expect(controlsAt({ x: 0, y: 40, width: 10, height: 10 }, 844, 100)).toBe('bottom');
    expect(controlsAt({ x: 0, y: 650, width: 390, height: 90 }, 844, 100)).toBe('bottom');
    expect(controlsAt({ x: 0, y: 700, width: 390, height: 90 }, 844, 100)).toBe('top');
    expect(mascotSide({ x: 142, y: 0, width: 106, height: 10 }, 390, 104)).toBe('right');
    expect(mascotSide({ x: 290, y: 0, width: 90, height: 10 }, 390, 104)).toBe('left');
    expect(mascotSide({ x: 16, y: 0, width: 358, height: 10 }, 390, 104)).toBeNull();
  });
  it('nový profil: mapa ukáže tutorial, po něm nic (ani stará bublina mapStart)', () => {
    expect(nextGuide('map', prof([]))).toBe('mapTour');
    expect(nextGuide('map', prof([...TOUR_SEEN_IDS]))).toBeNull();
    expect(nextGuide('map', prof(['mapTour']))).toBeNull();
    expect(nextGuide('map', prof(undefined))).toBeNull();
    expect(nextGuide('map', null)).toBeNull();
  });
});
