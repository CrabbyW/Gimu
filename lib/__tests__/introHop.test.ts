import { introHopPending, resetIntroHop, splashDone, splashShown, subscribeIntroHop, takeIntroHop } from '@/lib/introHop';

beforeEach(resetIntroHop);

describe('introHop (skok opice po splashi)', () => {
  it('bez splashe (NO_INTRO) se nikdy neskáče a opice nečeká', () => {
    splashDone(1000);
    expect(introHopPending(1000)).toBe(false);
    expect(takeIntroHop(1000)).toBe(false);
  });

  it('po splashi: posluchač dostane konec, skok jen jednou', () => {
    const l = jest.fn();
    const off = subscribeIntroHop(l);
    splashShown();
    expect(introHopPending(0)).toBe(true);
    splashDone(1000);
    expect(l).toHaveBeenCalledTimes(1);
    expect(takeIntroHop(1100)).toBe(true);
    expect(takeIntroHop(1100)).toBe(false);
    splashShown();
    splashDone(2000);
    expect(l).toHaveBeenCalledTimes(1);
    off();
  });

  it('mapa, která přijde pozdě (onboarding, /dev), už neskáče', () => {
    splashShown();
    splashDone(1000);
    expect(introHopPending(4000)).toBe(false);
    expect(takeIntroHop(4000)).toBe(false);
  });
});
