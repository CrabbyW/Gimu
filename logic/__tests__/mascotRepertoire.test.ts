import {
  eventToRepertoire, nextPause, pickMapIdle, POINT_START_AFTER_MS, REPERTOIRE_HAPTIC, STRAIN_LAST_MS,
  tapZone, timeOfDay, WAVE_RUN_AFTER_MS, type MapIdleInput,
} from '@/logic/mascotRepertoire';

const at = (h: number) => new Date(2026, 9, 13, h, 0, 0);
const base: MapIdleInput = { now: at(12), sinceInteractionMs: 0, streakAtRisk: false, hasNeighbour: true, last: null };

describe('timeOfDay', () => {
  it.each([[4, 'night'], [5, 'morning'], [9, 'morning'], [10, 'day'], [17, 'day'], [18, 'evening'], [22, 'evening'], [23, 'night']] as const)(
    '%i h → %s', (h, tod) => expect(timeOfDay(at(h))).toBe(tod));
});

describe('nextPause', () => {
  it('drží 20–40 s', () => {
    expect(nextPause(() => 0)).toBe(20_000);
    expect(nextPause(() => 0.999999)).toBe(40_000);
  });
});

describe('pickMapIdle', () => {
  it('série v ohrožení má přednost a neopakuje se', () => {
    expect(pickMapIdle(() => 0, { ...base, streakAtRisk: true })).toBe('streakAtRisk');
    expect(pickMapIdle(() => 0, { ...base, streakAtRisk: true, last: 'streakAtRisk' })).not.toBe('streakAtRisk');
  });
  it('dlouho bez akce → ukáže na Start', () => {
    expect(pickMapIdle(() => 0, { ...base, sinceInteractionMs: POINT_START_AFTER_MS })).toBe('pointStart');
    expect(pickMapIdle(() => 0, { ...base, sinceInteractionMs: POINT_START_AFTER_MS - 1 })).not.toBe('pointStart');
  });
  it('ráno / večer občas denní akce', () => {
    expect(pickMapIdle(() => 0.1, { ...base, now: at(7) })).toBe('morningStretch');
    expect(pickMapIdle(() => 0.1, { ...base, now: at(20) })).toBe('eveningTowel');
    expect(pickMapIdle(() => 0.9, { ...base, now: at(7) })).not.toBe('morningStretch');
  });
  it('bez souseda nepřeskakuje, poslední akci neopakuje', () => {
    for (let r = 0; r < 1; r += 0.05) {
      const id = pickMapIdle(() => r, { ...base, hasNeighbour: false, last: 'warmup' });
      expect(id).not.toBe('plateHop');
      expect(id).not.toBe('warmup');
    }
  });
});

describe('eventToRepertoire', () => {
  it('ťuknutí podle zóny', () => {
    expect(eventToRepertoire({ type: 'tapZone', zone: tapZone(0.2) })).toBe('headShake');
    expect(eventToRepertoire({ type: 'tapZone', zone: tapZone(0.7) })).toBe('giggle');
  });
  it('zatnutí jen v posledních 3 s výdrže', () => {
    expect(eventToRepertoire({ type: 'holdRemaining', ms: STRAIN_LAST_MS })).toBe('strain');
    expect(eventToRepertoire({ type: 'holdRemaining', ms: STRAIN_LAST_MS + 1 })).toBeNull();
    expect(eventToRepertoire({ type: 'holdRemaining', ms: 0 })).toBeNull();
  });
  it('návrat po pauze', () => {
    expect(eventToRepertoire({ type: 'appReturn', awayMs: WAVE_RUN_AFTER_MS })).toBe('waveRun');
    expect(eventToRepertoire({ type: 'appReturn', awayMs: WAVE_RUN_AFTER_MS - 1 })).toBeNull();
  });
  it.each([
    ['rest', 'wipeSweat'], ['exerciseActive', 'trainAlong'], ['lessonDone', 'liftBarbell'], ['streakRecord', 'flameJump'],
    ['leagueUp', 'climbPodium'], ['stageUp', 'grow'], ['streakLost', 'sadThenPoint'], ['offline', 'wifiShake'],
    ['error', 'ropeTangle'], ['empty', 'peekBox'], ['longPressDrag', 'hangFinger'],
  ] as const)('%s → %s', (type, id) => expect(eventToRepertoire({ type } as never)).toBe(id));
});

describe('haptika', () => {
  it('idle akce haptiku nemají', () => {
    for (const id of ['warmup', 'boredSit', 'pointStart', 'plateHop', 'morningStretch', 'streakAtRisk'] as const) {
      expect(REPERTOIRE_HAPTIC.has(id)).toBe(false);
    }
    expect(REPERTOIRE_HAPTIC.has('liftBarbell')).toBe(true);
  });
});
