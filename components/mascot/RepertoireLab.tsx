import { useEffect, useRef, useState } from 'react';
import { Pressable, View } from 'react-native';
import { cancelAnimation, Easing, ReduceMotion, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { PillButton } from '@/components/ui/PillButton';
import { SectionLabel } from '@/components/ui/SectionLabel';
import { Text } from '@/components/ui/Text';
import { copy } from '@/data/copy';
import { motion, repertoire } from '@/lib/motion';
import { ACT_SPEC, type ActId } from '@/lib/repertoireMotion';
import { REACTION_COOLDOWN_MS } from '@/logic/mascotReactions';
import { useTheme } from '@/theme';
import type { SilhouetteId } from '@/types';
import { SvgMascot } from './SvgMascot';
import { MASCOT_SIZES, type MascotReaction } from './types';
import { useMascotAct } from './useMascotAct';

/** Položka laboratoře: akce repertoáru, stávající reakce (spánek, pohled, salto) nebo cvičení s tebou. */
type Item = { kind: 'act'; id: ActId } | { kind: 'reaction'; id: 'sleep' | 'gaze' | 'flip' };
const act = (id: ActId): Item => ({ kind: 'act', id });
/** 26 animací plánu v jeho pořadí (řádek 6 = přeskok a stojka, proto 27 tlačítek). */
export const LAB_ITEMS: readonly Item[] = [
  act('warmup'), act('boredSit'), { kind: 'reaction', id: 'sleep' }, { kind: 'reaction', id: 'gaze' }, act('pointStart'),
  act('plateHop'), act('handstandPlate'), act('headShake'), act('giggle'), { kind: 'reaction', id: 'flip' }, act('hangFinger'),
  act('trainAlong'), act('strain'), act('wipeSweat'), act('shrug'), act('liftBarbell'), act('flameJump'), act('climbPodium'),
  act('grow'), act('morningStretch'), act('eveningTowel'), act('waveRun'), act('streakAtRisk'), act('sadThenPoint'),
  act('wifiShake'), act('ropeTangle'), act('peekBox'),
];
const REACTION_MS = { sleep: 2400, gaze: motion.reactions.gaze.glanceMs * 2 + motion.reactions.gaze.holdMs, flip: 1200 } as const;
/** Cvičení s tebou: každé stisknutí ukáže další cvik (ve fázi smyčky siluety). */
const TRAIN_ORDER: readonly SilhouetteId[] = ['squat', 'pushup', 'pullup', 'plank', 'dip', 'jump', 'handstandWall', 'hang'];
const itemMs = (it: Item) => (it.kind === 'act' ? ACT_SPEC[it.id].ms : REACTION_MS[it.id]);
const itemKey = (it: Item) => it.id;

/**
 * Dev menu: všech 26 animací repertoáru živě na velké opici (tlačítko = přehrát, „Play all“ = postupně všechny).
 * Haptika jako ve hře (jen akce z `REPERTOIRE_HAPTIC`). Spánek: druhé stisknutí (nebo ťuknutí na opičku) probudí.
 */
export function RepertoireLab() {
  const { space, c, size } = useTheme();
  const acts = useMascotAct();
  const [reaction, setReaction] = useState<MascotReaction | null>(null);
  const [train, setTrain] = useState<{ silhouette: SilhouetteId; n: number } | null>(null);
  const [current, setCurrent] = useState<string | null>(null);
  const [auto, setAuto] = useState<number | null>(null);
  const rKey = useRef(0);
  const phase = useSharedValue(0);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const later = (ms: number, fn: () => void) => { timers.current.push(setTimeout(fn, ms)); };
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const run = (it: Item) => {
    timers.current.forEach(clearTimeout); timers.current = [];
    setCurrent(itemKey(it));
    if (it.kind === 'reaction') {
      acts.stop(); setTrain(null);
      if (it.id === 'sleep' && reaction?.id === 'sleep') { setReaction(null); return; }
      rKey.current += 1;
      setReaction({ id: it.id, key: rKey.current });
      // Salto = tři rychlá ťuknutí; tady rovnou výsledná reakce. Pohled se vrátí sám, spánek čeká na probuzení.
      return;
    }
    setReaction(null);
    if (it.id === 'trainAlong') {
      acts.stop();
      const n = ((train?.n ?? -1) + 1) % TRAIN_ORDER.length;
      setTrain({ silhouette: TRAIN_ORDER[n]!, n });
      // Fáze cviku jako smyčka siluety: tam a zpět s křivkou siluety.
      cancelAnimation(phase);
      phase.set(0);
      phase.set(withRepeat(withTiming(1, { duration: motion.silhouette.repsMs / 2, easing: Easing.inOut(Easing.sin), reduceMotion: ReduceMotion.Never }), -1, true));
      later(ACT_SPEC.trainAlong.ms, () => { cancelAnimation(phase); setTrain(null); });
      return;
    }
    setTrain(null);
    acts.play(it.id, 2);
  };

  // „Play all“: postupně všechny položky, mezi nimi `playAllGapMs` (a cooldown reakcí).
  const autoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (autoTimer.current) clearTimeout(autoTimer.current); }, []);
  const stopAuto = () => { if (autoTimer.current) clearTimeout(autoTimer.current); autoTimer.current = null; setAuto(null); };
  const step = (i: number) => {
    const it = LAB_ITEMS[i];
    if (!it) { stopAuto(); setCurrent(null); return; }
    setAuto(i);
    run(it);
    const wait = itemMs(it) + repertoire.playAllGapMs + (it.kind === 'reaction' ? REACTION_COOLDOWN_MS : 0);
    autoTimer.current = setTimeout(() => {
      if (it.kind === 'reaction' && it.id === 'sleep') setReaction(null);
      step(i + 1);
    }, wait);
  };

  const stage = MASCOT_SIZES.L;
  return (
    <View testID="mascot-actions" style={{ gap: space.s }}>
      <SectionLabel>{copy.dev.actions}</SectionLabel>
      {/* Jeviště: místo na přeskok (vpravo) a doběh (zleva), opice dole uprostřed. */}
      <View style={{ height: stage + space.xxl, alignItems: 'center', justifyContent: 'flex-end' }}>
        <Pressable
          testID="mascot-actions-stage"
          accessibilityRole="button"
          accessibilityLabel={copy.mascot.playHint}
          onPress={() => { if (reaction?.id === 'sleep') setReaction(null); }}
        >
          <SvgMascot
            stage={1} cosmetics={{}} mood="idle" size={stage} hop={false} decorative
            act={acts.act} reaction={reaction} train={train ? { silhouette: train.silhouette, phase } : null}
          />
        </Pressable>
      </View>
      <Text variant="label" tone="muted" testID="mascot-actions-now">
        {`${copy.dev.actionsNow} ${current ? (copy.dev.action[current] ?? current) : '—'}`}
      </Text>
      <View style={{ flexDirection: 'row', gap: space.s }}>
        <PillButton
          label={auto === null ? copy.dev.actionsPlayAll : copy.dev.actionsStop}
          variant="secondary"
          onPress={() => {
            if (auto === null) { step(0); return; }
            stopAuto(); acts.stop(); setReaction(null); setTrain(null); setCurrent(null);
          }}
        />
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.s }}>
        {LAB_ITEMS.map((it, i) => {
          const label = copy.dev.action[it.id] ?? it.id;
          const on = current === itemKey(it);
          return (
            <Pressable
              key={it.id}
              testID={`act-${it.id}`}
              accessibilityRole="button"
              accessibilityLabel={copy.dev.actionPlay(label)}
              accessibilityState={{ selected: on }}
              onPress={() => { stopAuto(); run(it); }}
              style={{
                minHeight: size.hit, justifyContent: 'center', paddingHorizontal: space.s,
                borderBottomWidth: 2, borderColor: on ? c.text : 'transparent',
              }}
            >
              <Text variant="label" tone={on ? 'text' : 'muted'}>{`${String(Math.min(26, i < 6 ? i + 1 : i)).padStart(2, '0')} ${label}`}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
