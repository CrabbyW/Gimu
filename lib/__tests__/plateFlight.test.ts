import * as F from '@/lib/plateFlight';

const R = { x: 10, y: 20, width: 80, height: 80 };
const T = { x: 60, y: 40, width: 120, height: 8 };

beforeEach(() => F.__reset());

describe('plateFlight store', () => {
  it('launch → land → clear, posluchači dostanou každou změnu', () => {
    const seen: (F.Flight | null)[] = [];
    F.subscribe(() => seen.push(F.getFlight()));
    expect(F.launch({ from: R, kg: 5, state: 'current' })).toBe(true);
    expect(F.getFlight()).toMatchObject({ from: R, kg: 5, state: 'current', to: null });
    expect(F.land(T)).toBe(true);
    expect(F.getFlight()?.to).toEqual(T);
    F.clear();
    expect(F.getFlight()).toBeNull();
    expect(seen.map((f) => f?.to ?? (f ? 'flying' : null))).toEqual(['flying', T, null]);
  });

  it.each([
    ['nula', { ...R, width: 0 }],
    ['nulová výška', { ...R, height: 0 }],
    ['NaN', { ...R, x: NaN }],
    ['selhání (null)', null],
  ])('neplatný from (%s) let přeskočí', (_, from) => {
    expect(F.launch({ from, kg: 5, state: 'current' })).toBe(false);
    expect(F.getFlight()).toBeNull();
    expect(F.land(T)).toBe(false);
    expect(F.takeLastRect()).toBeNull();
  });

  it('neplatný cíl let ukončí, land bez letu nic nedělá', () => {
    expect(F.land(T)).toBe(false);
    F.launch({ from: R, kg: 5, state: 'current' });
    expect(F.land({ ...T, width: 0 })).toBe(false);
    expect(F.getFlight()).toBeNull();
  });

  it('druhý land stejný let nepřepíše; nový launch má nové id', () => {
    F.launch({ from: R, kg: 5, state: 'current' });
    const id = F.getFlight()!.id;
    F.land(T);
    expect(F.land({ ...T, x: 0 })).toBe(false);
    expect(F.getFlight()?.to).toEqual(T);
    F.launch({ from: R, kg: 10, state: 'done' });
    expect(F.getFlight()!.id).toBeGreaterThan(id);
  });

  it('lastRect pro oslavu: po land jednou, nový launch ho zahodí', () => {
    F.launch({ from: R, kg: 5, state: 'current' });
    F.land(T);
    F.clear();
    expect(F.takeLastRect()).toEqual(T);
    expect(F.takeLastRect()).toBeNull();
    F.launch({ from: R, kg: 5, state: 'current' });
    F.land(T);
    F.launch({ from: R, kg: 5, state: 'current' });
    expect(F.takeLastRect()).toBeNull();
  });

  it('measureRect: úspěch, nula, výjimka, bez odpovědi i bez view → null', async () => {
    const ok = { measureInWindow: (cb: (x: number, y: number, w: number, h: number) => void) => cb(1, 2, 3, 4) };
    const zero = { measureInWindow: (cb: (x: number, y: number, w: number, h: number) => void) => cb(0, 0, 0, 0) };
    const boom = { measureInWindow: () => { throw new Error('unmounted'); } };
    const silent = { measureInWindow: () => undefined };
    await expect(F.measureRect(ok, 50)).resolves.toEqual({ x: 1, y: 2, width: 3, height: 4 });
    await expect(F.measureRect(zero, 50)).resolves.toBeNull();
    await expect(F.measureRect(boom, 50)).resolves.toBeNull();
    await expect(F.measureRect(silent, 10)).resolves.toBeNull();
    await expect(F.measureRect(null, 10)).resolves.toBeNull();
  });

  it('registr kotoučů: launchFromPlate změří a odstartuje, po odregistrování let nevznikne', async () => {
    const v = { measureInWindow: (cb: (x: number, y: number, w: number, h: number) => void) => cb(5, 6, 70, 70) };
    const off = F.registerPlate('l1', v, 10, 'current');
    await expect(F.launchFromPlate('l1', 50)).resolves.toBe(true);
    expect(F.getFlight()).toMatchObject({ from: { x: 5, y: 6, width: 70, height: 70 }, kg: 10, state: 'current' });
    off();
    await expect(F.launchFromPlate('l1', 10)).resolves.toBe(false);
    expect(F.getFlight()).toBeNull();
  });

  it('launchFromPlate: measure vrátí 0 → bez letu', async () => {
    F.registerPlate('l2', { measureInWindow: (cb) => cb(0, 0, 0, 0) }, 5, 'done');
    await expect(F.launchFromPlate('l2', 50)).resolves.toBe(false);
    expect(F.getFlight()).toBeNull();
  });

  it('dvojí ťuknutí = jeden start; endStart odemkne', () => {
    expect(F.tryBeginStart(1000)).toBe(true);
    expect(F.tryBeginStart(1100)).toBe(false);
    expect(F.tryBeginStart(3000)).toBe(true);
    F.endStart();
    expect(F.tryBeginStart(3001)).toBe(true);
  });
});
