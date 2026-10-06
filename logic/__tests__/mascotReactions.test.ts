import {
  degrade, eventToReaction, isIdle, pickReaction, REACTION_COOLDOWN_MS, shouldWave, tapKind, type ReactionState,
} from '../mascotReactions';

const fresh: ReactionState = { lastId: null, lastAt: -Infinity, taps: [] };

describe('tapKind', () => {
  it('jedno ťuknutí = poskok', () => expect(tapKind([1000], 1000)).toBe('hop'));
  it('tři ťuknutí do 600 ms = salto', () => expect(tapKind([1000, 1200, 1400], 1400)).toBe('flip'));
  it('tři ťuknutí roztažená přes okno = poskok', () => expect(tapKind([1000, 1400, 1800], 1800)).toBe('hop'));
});

describe('eventToReaction', () => {
  it.each([
    [{ type: 'longPress' } as const, 'cuddle'],
    [{ type: 'touchMove' } as const, 'gaze'],
    [{ type: 'scroll', velocity: 400 } as const, 'lookDown'],
    [{ type: 'scroll', velocity: -3000 } as const, 'dizzy'],
    [{ type: 'idle' } as const, 'sleep'],
    [{ type: 'appReturn', awayMs: 120000 } as const, 'wave'],
    [{ type: 'lessonStart' } as const, 'nod'],
    [{ type: 'lessonDone' } as const, 'celebrate'],
    [{ type: 'streakUp' } as const, 'proud'],
    [{ type: 'streakLost' } as const, 'sad'],
    [{ type: 'leagueUp' } as const, 'joyJump'],
    [{ type: 'leagueDown' } as const, 'shrug'],
    [{ type: 'plateSpin' } as const, 'spinFollow'],
  ])('%o → %s', (e, id) => expect(eventToReaction(e, [])).toBe(id));
  it('scroll nahoru pomalu nic', () => expect(eventToReaction({ type: 'scroll', velocity: -400 }, [])).toBeNull());
  it('krátký návrat nemává', () => expect(eventToReaction({ type: 'appReturn', awayMs: 30000 }, [])).toBeNull());
});

describe('pickReaction', () => {
  it('10 rychlých ťuknutí: poskok, pak nejvýš jedno salto, pak cooldown', () => {
    let s = fresh;
    const played: string[] = [];
    for (let i = 0; i < 10; i++) {
      const r = pickReaction({ type: 'tap', at: 1000 + i * 50 }, s, 1000 + i * 50);
      s = r.state;
      if (r.id) played.push(r.id);
    }
    expect(played).toEqual(['hop', 'flip']);
    // Salto ve 3. ťuknutí (1100 ms) spustilo nový cooldown.
    const after = pickReaction({ type: 'tap', at: 1100 + REACTION_COOLDOWN_MS + 1 }, s, 1100 + REACTION_COOLDOWN_MS + 1);
    expect(after.id).not.toBeNull();
  });
  it('trojité ťuknutí z klidu = poskok a hned salto', () => {
    let s = fresh;
    const ids: (string | null)[] = [];
    for (const t of [0, 150, 300]) { const r = pickReaction({ type: 'tap', at: t }, s, t); s = r.state; ids.push(r.id); }
    expect(ids).toEqual(['hop', null, 'flip']);
  });
  it('salto nepřebije nic jiného než poskok', () => {
    const a = pickReaction({ type: 'longPress' }, fresh, 0);
    const r = pickReaction({ type: 'tap', at: 300 }, { ...a.state, taps: [100, 200] }, 300);
    expect(r.id).toBeNull();
  });
  it('trojité ťuknutí po vypršení cooldownu = salto', () => {
    let s = pickReaction({ type: 'tap', at: 0 }, fresh, 0).state; // hop v 0
    s = pickReaction({ type: 'tap', at: 2000 }, s, 2000).state;   // hop ve 2000
    s = pickReaction({ type: 'tap', at: 2200 }, s, 2200).state;   // v cooldownu
    const r = pickReaction({ type: 'tap', at: 3300 }, { ...s, taps: [2900, 3100] }, 3300);
    expect(r.id).toBe('flip');
  });
  it('souběh: lessonDone a streakUp ve stejném ms → celebrate zůstane', () => {
    const a = pickReaction({ type: 'lessonDone' }, fresh, 5000);
    const b = pickReaction({ type: 'streakUp' }, a.state, 5000);
    expect(a.id).toBe('celebrate');
    expect(b.id).toBeNull();
  });
  it('důležitá reakce přeskočí cooldown nižší reakce', () => {
    const a = pickReaction({ type: 'tap', at: 0 }, fresh, 0);
    expect(pickReaction({ type: 'leagueUp' }, a.state, 100).id).toBe('joyJump');
  });
  it('po cooldownu projde i nižší priorita', () => {
    const a = pickReaction({ type: 'lessonDone' }, fresh, 0);
    expect(pickReaction({ type: 'streakUp' }, a.state, REACTION_COOLDOWN_MS + 1).id).toBe('proud');
  });
});

describe('degrade', () => {
  it('bez omezeného pohybu beze změny', () => expect(degrade('flip', false)).toBe('flip'));
  it.each([
    ['flip', 'celebrate'], ['hop', 'celebrate'], ['joyJump', 'celebrate'],
    ['dizzy', 'lookDown'], ['spinFollow', 'lookDown'],
    ['wave', 'gaze'], ['nod', 'gaze'], ['shrug', 'gaze'],
    ['sad', 'sad'], ['sleep', 'sleep'], ['cuddle', 'cuddle'],
  ] as const)('omezený pohyb: %s → %s', (id, to) => expect(degrade(id, true)).toBe(to));
});

it('shouldWave', () => { expect(shouldWave(30000)).toBe(false); expect(shouldWave(60000)).toBe(true); });

describe('isIdle', () => {
  it('po 20 s nečinnosti na zaostřené obrazovce', () => expect(isIdle(0, 20000, true)).toBe(true));
  it('ne dřív', () => expect(isIdle(0, 19999, true)).toBe(false));
  it('rozostřená obrazovka nikdy', () => expect(isIdle(0, 99999, false)).toBe(false));
});
