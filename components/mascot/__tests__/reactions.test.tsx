import { forwardRef, useImperativeHandle } from 'react';
import TestRenderer, { act, type ReactTestInstance } from 'react-test-renderer';
import { Path } from 'react-native-svg';
import { buildTheme } from '@/theme';
import { ThemeContext } from '@/theme/ThemeProvider';
import { IDLE_MS, REACTION_COOLDOWN_MS, type ReactionId } from '@/logic/mascotReactions';
import { motion } from '@/lib/motion';
import { Mascot, MonkeyBack, MonkeyFront } from '..';
import { useMascotReactions, type MascotReactions } from '../useMascotReactions';
import type { MascotProps } from '../types';

/* eslint-disable @typescript-eslint/no-require-imports -- oficiální jest mocky knihoven */
jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));
jest.mock('react-native-worklets', () => require('react-native-worklets/src/mock'));
/* eslint-enable @typescript-eslint/no-require-imports */
let mockReduced = false;
jest.mock('@/lib/motion', () => ({ ...jest.requireActual('@/lib/motion'), useMotionSafe: () => ({ reduced: mockReduced }) }));
const mockFeedback = jest.fn();
jest.mock('@/lib/feedback', () => ({ feedback: (id: string) => mockFeedback(id) }));

const ALL: ReactionId[] = [
  'hop', 'flip', 'cuddle', 'gaze', 'lookDown', 'dizzy', 'sleep', 'wave', 'nod', 'celebrate', 'proud', 'sad', 'joyJump', 'shrug', 'spinFollow',
];
const theme = buildTheme('dark', null);
const AMBER = theme.c.accentGraphic;
const base: MascotProps = { stage: 1, mood: 'idle', size: 'M', cosmetics: {} };

let renderer: TestRenderer.ReactTestRenderer | null = null;
const unmount = () => { act(() => { renderer?.unmount(); }); renderer = null; };
const mount = (el: React.ReactElement) => {
  unmount();
  act(() => { renderer = TestRenderer.create(<ThemeContext.Provider value={theme}>{el}</ThemeContext.Provider>); });
  return renderer!;
};
const amberEdges = (root: ReactTestInstance) => root.findAllByType(Path).filter((p) => p.props.stroke === AMBER);

beforeEach(() => { jest.useFakeTimers(); mockReduced = false; mockFeedback.mockClear(); });
afterEach(() => { unmount(); jest.useRealTimers(); });

describe('přehrání reakce (prop `reaction`)', () => {
  test.each(ALL)('%s se přehraje bez pádu, i ve vrstvách pro sezení a s omezeným pohybem', (id) => {
    for (const reduced of [false, true]) {
      mockReduced = reduced;
      const r = mount(<Mascot {...base} reaction={{ id, key: 1 }} />);
      act(() => { jest.advanceTimersByTime(3000); });
      act(() => { r.update(<ThemeContext.Provider value={theme}><Mascot {...base} reaction={{ id, key: 2 }} /></ThemeContext.Provider>); });
      act(() => { jest.advanceTimersByTime(3000); });
      mount(<><MonkeyBack {...base} reaction={{ id, key: 1 }} /><MonkeyFront {...base} reaction={{ id, key: 1 }} /></>);
      act(() => { jest.advanceTimersByTime(3000); });
    }
  });

  test('celebrate na chvíli přebije náladu: jantarová hrana šálu, po `holdMs` zmizí', () => {
    const r = mount(<Mascot {...base} reaction={{ id: 'celebrate', key: 1 }} />);
    expect(amberEdges(r.root)).toHaveLength(1);
    act(() => { jest.advanceTimersByTime(motion.reactions.celebrate.holdMs + 1); });
    expect(amberEdges(r.root)).toHaveLength(0);
  });

  test('omezený pohyb: salto se přehraje jako oslava (nálada), bez omezení zůstane pohybem bez přebití nálady', () => {
    expect(amberEdges(mount(<Mascot {...base} reaction={{ id: 'flip', key: 1 }} />).root)).toHaveLength(0);
    mockReduced = true;
    expect(amberEdges(mount(<Mascot {...base} reaction={{ id: 'flip', key: 1 }} />).root)).toHaveLength(1);
  });

  test('popisek pro čtečku sleduje přebitou náladu (smutek)', () => {
    const r = mount(<Mascot {...base} reaction={{ id: 'sad', key: 1 }} />);
    const label = () => r.root.findAll((n) => n.props.accessibilityRole === 'image')[0]?.props.accessibilityLabel;
    expect(label()).toBe('Your monkey is sad');
    act(() => { jest.advanceTimersByTime(motion.reactions.sad.holdMs + 1); });
    expect(label()).toBe('Your monkey');
  });
});

describe('useMascotReactions', () => {
  const Probe = forwardRef<MascotReactions, { focused: boolean }>(({ focused }, ref) => {
    const r = useMascotReactions(focused);
    useImperativeHandle(ref, () => r, [r]);
    return null;
  });
  Probe.displayName = 'Probe';
  const setup = (focused = true) => {
    const ref: { current: MascotReactions | null } = { current: null };
    mount(<Probe ref={ref} focused={focused} />);
    return ref;
  };

  test('10 ťuknutí po 50 ms: poskok, pak jedno salto (trojité ťuknutí), žádná fronta', () => {
    const ref = setup();
    const played: (ReactionId | null)[] = [];
    for (let i = 0; i < 10; i++) {
      act(() => { played.push(ref.current!.tap()); });
      act(() => { jest.advanceTimersByTime(50); });
    }
    expect(played.filter(Boolean)).toEqual(['hop', 'flip']);
    expect(ref.current!.reaction).toEqual({ id: 'flip', key: 2 });
    expect(mockFeedback.mock.calls).toEqual([['mascotTap'], ['mascotJoy']]);
  });

  test('po cooldownu trojité ťuknutí = salto s haptikou success', () => {
    const ref = setup();
    act(() => { ref.current!.tap(); });
    act(() => { jest.advanceTimersByTime(REACTION_COOLDOWN_MS - 400); });
    act(() => { ref.current!.tap(); });
    act(() => { jest.advanceTimersByTime(200); });
    act(() => { ref.current!.tap(); });
    act(() => { jest.advanceTimersByTime(201); });
    let id: ReactionId | null = null;
    act(() => { id = ref.current!.tap(); });
    expect(id).toBe('flip');
    expect(mockFeedback).toHaveBeenLastCalledWith('mascotJoy');
  });

  test('omezený pohyb: reakce se předá zdegradovaná (salto → celebrate, závrať → lookDown)', () => {
    mockReduced = true;
    const ref = setup();
    act(() => { ref.current!.report({ type: 'scroll', velocity: 4000 }); });
    expect(ref.current!.reaction?.id).toBe('lookDown');
    act(() => { ref.current!.report({ type: 'leagueUp' }); });
    expect(ref.current!.reaction?.id).toBe('celebrate');
  });

  test('nečinnost: usne jen na zaostřené obrazovce; dotek ji probudí', () => {
    const away = setup(false);
    act(() => { jest.advanceTimersByTime(IDLE_MS * 2); });
    expect(away.current!.reaction).toBeNull();

    const ref = setup(true);
    act(() => { jest.advanceTimersByTime(IDLE_MS + 10); });
    expect(ref.current!.reaction?.id).toBe('sleep');
    act(() => { ref.current!.poke(); });
    expect(ref.current!.reaction).toBeNull();
  });

  test('souběh: lessonDone a streakUp najednou → celebrate, proud se zahodí', () => {
    const ref = setup();
    act(() => { ref.current!.report({ type: 'lessonDone' }); ref.current!.report({ type: 'streakUp' }); });
    expect(ref.current!.reaction?.id).toBe('celebrate');
  });
});
