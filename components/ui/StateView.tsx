import { useEffect, useState, type ReactNode } from 'react';
import { View } from 'react-native';
import Animated, { Easing, ReduceMotion, cancelAnimation, useAnimatedStyle, useSharedValue, withRepeat, withTiming, type SharedValue } from 'react-native-reanimated';
import type { Edge } from 'react-native-safe-area-context';
import { Mascot } from '@/components/mascot';
import { copy } from '@/data/copy';
import { ease, motion, useMotionSafe } from '@/lib/motion';
import { opacity, useTheme } from '@/theme';
import { Button } from './Button';
import { Screen } from './Screen';
import { Text } from './Text';

/*
 * Jednotné stavy obrazovky (elite fáze 4, spec §4):
 * - loading = statický tečkový skeleton ve tvaru obsahu (titulek + dlaždice), ne spinner. Objeví se až po
 *   `motion.stateView.skeletonDelayMs`, takže rychlé načtení nebliká. Vstup = krátké prolnutí s posunem, pak řady teček dýchají vlnou
 *   shora dolů (`skeletonRowOpacity`). Omezený pohyb: statický skeleton.
 * - error = smutná opička + věta „co se pokazilo“ + věta „co udělat“ + [ZKUSIT ZNOVU].
 * - empty = pozvánka (co se tu objeví a čím), volitelně s akcí. `inline` = jen věta uvnitř sekce.
 */

const NO_COSMETICS = {} as const;

type Props =
  | { kind: 'loading'; edges?: readonly Edge[] }
  | {
      kind: 'error';
      /** Co se nepodařilo načíst, ve 4. pádě (`copy.common.loadTarget.*`). */
      what?: string;
      /** Vlastní zpráva (např. zamčená lekce); pak se nepřidá věta o ztrátě dat. */
      message?: string;
      actionLabel?: string;
      onRetry(): void;
      edges?: readonly Edge[];
    }
  | { kind: 'empty'; message: string; title?: string; actionLabel?: string; onAction?(): void; inline?: boolean; edges?: readonly Edge[] };

export function StateView(props: Props) {
  if (props.kind === 'loading') return <LoadingSkeleton edges={props.edges} />;
  if (props.kind === 'error') return <ErrorBody {...props} />;
  return <EmptyBody {...props} />;
}

function ErrorBody({ what, message, actionLabel, onRetry, edges }: Extract<Props, { kind: 'error' }>) {
  const { space, size } = useTheme();
  const title = message ?? copy.common.loadError(what ?? '');
  return (
    <Screen edges={edges}>
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'flex-start', gap: space.l }}>
        <Mascot stage={1} mood="sad" size={size.stateMascot} cosmetics={NO_COSMETICS} decorative breathe={false} hop={false} />
        <View style={{ gap: space.s }}>
          <Text variant="title" accessibilityRole="alert">{title}</Text>
          {message ? null : <Text tone="muted">{copy.common.loadErrorHint}</Text>}
        </View>
        <Button label={actionLabel ?? copy.common.retry} onPress={onRetry} variant="secondary" />
      </View>
    </Screen>
  );
}

function EmptyBody({ message, title, actionLabel, onAction, inline, edges }: Extract<Props, { kind: 'empty' }>) {
  const { space, size } = useTheme();
  if (inline) return <Text variant="caption" tone="muted">{message}</Text>;
  return (
    <Screen edges={edges}>
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'flex-start', gap: space.m }}>
        {/* UX pass U5: prázdná obrazovka = pozvánka s opičkou (klidná, ne smutná), pak titulek a věta. */}
        <Mascot stage={1} mood="idle" size={size.stateMascot} cosmetics={NO_COSMETICS} decorative hop={false} />
        {title ? <Text variant="title">{title}</Text> : null}
        <Text tone="muted">{message}</Text>
        {actionLabel && onAction ? <Button label={actionLabel} onPress={onAction} variant="secondary" /> : null}
      </View>
    </Screen>
  );
}

/** Zpožděné zobrazení: do `ms` nic (prázdné `base`), pak obsah. */
function useDelayed(ms: number) {
  const [shown, setShown] = useState(ms <= 0);
  useEffect(() => {
    if (ms <= 0) return;
    const t = setTimeout(() => setShown(true), ms);
    return () => clearTimeout(t);
  }, [ms]);
  return shown;
}

const SV = motion.stateView;
const NEVER = { reduceMotion: ReduceMotion.Never };

/** Krytí řady `row` v čase `t` (0..1 cyklu pulzu): sinusový dech, každá další řada o `rowStagger` později. */
export function skeletonRowOpacity(t: number, row: number): number {
  'worklet';
  const phase = t - row * SV.rowStagger;
  const k = 0.5 - 0.5 * Math.cos(phase * 2 * Math.PI);
  return SV.pulseMin + (SV.pulseMax - SV.pulseMin) * k;
}

/** Řada zhasnutých teček `dotOff` (stand-in textu). `clock` = sdílený čas pulzu (null = statická). */
function DotLine({ count, dot, row, clock }: { count: number; dot: number; row: number; clock: SharedValue<number> | null }) {
  const { c, size, radius } = useTheme();
  const animated = clock !== null;
  const still = useSharedValue(0);
  const src = clock ?? still;
  const pulse = useAnimatedStyle(() => ({ opacity: skeletonRowOpacity(src.value, row) }));
  return (
    <Animated.View testID="skeleton-row" style={[{ flexDirection: 'row', gap: size.dotGap, overflow: 'hidden' }, animated ? pulse : null]}>
      {Array.from({ length: count }, (_, i) => (
        <View key={i} style={{ width: dot, height: dot, borderRadius: radius.full, backgroundColor: c.dotOff }} />
      ))}
    </Animated.View>
  );
}

function LoadingSkeleton({ edges }: { edges?: readonly Edge[] }) {
  const { c, space, size, radius } = useTheme();
  const shown = useDelayed(SV.skeletonDelayMs);
  const { reduced } = useMotionSafe();
  const clock = useSharedValue(0);
  const enter = useSharedValue(reduced ? 1 : 0);
  useEffect(() => {
    if (!shown || reduced) return;
    enter.value = withTiming(1, { duration: SV.revealMs, easing: ease.out, ...NEVER });
    clock.value = 0;
    clock.value = withRepeat(withTiming(1, { duration: SV.pulseMs, easing: Easing.linear, ...NEVER }), -1, false);
    return () => { cancelAnimation(clock); cancelAnimation(enter); };
  }, [shown, reduced, clock, enter]);
  const reveal = useAnimatedStyle(() => ({ opacity: enter.value, transform: [{ translateY: (1 - enter.value) * SV.revealRise }] }));
  const pulse = reduced ? null : clock;
  let body: ReactNode = null;
  if (shown) {
    body = (
      <Animated.View testID="skeleton" importantForAccessibility="no-hide-descendants" accessibilityElementsHidden style={[{ gap: space.l, paddingTop: space.l }, reduced ? null : reveal]}>
        {/* Titulek: dvě řady velkých teček (Doto). */}
        <View style={{ gap: space.s }}>
          <DotLine count={4} dot={size.dot} row={0} clock={pulse} />
          <DotLine count={9} dot={size.dot} row={1} clock={pulse} />
        </View>
        {[0, 1, 2].map((i) => (
          <View key={i} style={{ backgroundColor: c.tile, borderRadius: radius.tile, padding: space.m, gap: space.s, opacity: i === 0 ? 1 : opacity.future }}>
            <DotLine count={6} dot={size.loaderDot * 2} row={2 + i * 2} clock={pulse} />
            <DotLine count={24} dot={size.loaderDot} row={3 + i * 2} clock={pulse} />
          </View>
        ))}
      </Animated.View>
    );
  }
  return (
    <Screen edges={edges}>
      <View
        accessible
        accessibilityRole="progressbar"
        accessibilityLabel={copy.common.loading}
        accessibilityState={{ busy: true }}
        style={{ flex: 1 }}
      >
        {body}
      </View>
    </Screen>
  );
}
