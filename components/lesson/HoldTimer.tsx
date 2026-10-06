import { useEffect, useRef } from 'react';
import { View } from 'react-native';
import Animated, { FadeOut, useAnimatedStyle, useSharedValue, withSequence, withSpring, withTiming } from 'react-native-reanimated';
import { DotRing } from '@/components/dots';
import { Text } from '@/components/ui/Text';
import { copy } from '@/data/copy';
import { ease, intro, motion, useMotionSafe } from '@/lib/motion';
import { typography, useTheme } from '@/theme';
import type { HoldTimer as HoldTimerState } from './useHoldTimer';

const PULSE_FROM = motion.holdPulse.fromS;

interface Props {
  timer: HoldTimerState;
  /** Délka výdrže v sekundách (zdroj podílu rozsvícených teček). Bez ní prstenec svítí celý. */
  total?: number;
}

/** Podíl rozsvíceného prstence: zbývající / celkem (1 → 0), ořezaný; neznámá délka = plný. */
export const holdFraction = (secondsLeft: number, total?: number) =>
  (total && total > 0 ? Math.min(1, Math.max(0, secondsLeft / total)) : 1);

/** Odpočet výdrže (Nothing Dot, obr. 3): tečkový prstenec zhasíná po směru hodin, uprostřed Doto sekundy
 *  a mono jednotka. Číslo je nejdůležitější věc obrazovky během výdrže, prstenec ho jen rámuje.
 *  Stav a ovládání drží `useHoldTimer` v rodiči, který kreslí i akční lištu. */
export function HoldTimer({ timer, total }: Props) {
  const { space, size } = useTheme();
  const { reduced } = useMotionSafe();
  const { secondsLeft, status, countdown } = timer;

  const scale = useSharedValue(1);
  useEffect(() => {
    if (reduced || status !== 'running' || secondsLeft > PULSE_FROM || secondsLeft === 0) return;
    scale.set(withSequence(withTiming(1.06, motion.press), withTiming(1, motion.release)));
  }, [secondsLeft, status, reduced, scale]);
  // Start výdrže (motion): měřidlo se nadechne (0.97, press 90 ms) a rozhodně vrátí (release 220 ms punch),
  // potvrzení, že výdrž běží. Jen po odpočtu 3-2-1, ne při pokračování po pauze.
  const prev = useRef(status);
  useEffect(() => {
    const from = prev.current;
    prev.current = status;
    if (reduced || from !== 'countdown' || status !== 'running') return;
    scale.set(withSequence(withTiming(intro.holdStart.dip, motion.press), withTiming(1, motion.release)));
  }, [status, reduced, scale]);
  // Konec výdrže (UX2): číslo i prstenec jednou tvrdě „dosednou“ spolu s haptikou Medium (1 → 1.1 → 1).
  useEffect(() => {
    if (reduced || status !== 'done') return;
    scale.set(withSequence(withTiming(motion.holdPulse.to, { duration: motion.holdPulse.inMs, easing: ease.punch }), withTiming(1, motion.release)));
  }, [status, reduced, scale]);
  const pulse = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  // Odpočet 3-2-1 (motion spec §2): každé číslo nastoupí scale 1.2 → 1 pružinou `slam` (ζ ≈ 0.8),
  // ve stejném ticku jako haptika z useHoldTimer. Reduce motion: prolnutí 200 ms bez měřítka.
  const cdScale = useSharedValue(1);
  const cdOpacity = useSharedValue(1);
  useEffect(() => {
    if (status !== 'countdown' || countdown === 0) return;
    if (reduced) {
      cdOpacity.set(0);
      cdOpacity.set(withTiming(1, motion.calmFade));
    } else {
      cdScale.set(1.2);
      cdScale.set(withSpring(1, motion.slam));
    }
  }, [countdown, status, reduced, cdScale, cdOpacity]);
  const cdStyle = useAnimatedStyle(() => ({ opacity: cdOpacity.value, transform: [{ scale: cdScale.value }] }));
  const counting = status === 'countdown' && countdown > 0;

  return (
    <View
      accessible
      accessibilityRole="timer"
      accessibilityLabel={`${secondsLeft} ${copy.lesson.seconds.toLowerCase()}`}
      // Prstenec na středu obrazovky; uvnitř jen Doto číslo, štítek stojí pod prstencem (nikdy přes tečky).
      style={{ alignSelf: 'center', alignItems: 'center', gap: space.s }}
    >
      <Animated.View style={pulse}>
        <DotRing progress={holdFraction(secondsLeft, total)} size={size.holdRing}>
          {counting ? (
            <Animated.View style={cdStyle}>
              <Text variant="hero" maxFontSizeMultiplier={1}>{countdown}</Text>
            </Animated.View>
          ) : (
            <Text variant="hero" maxFontSizeMultiplier={1}>{secondsLeft}</Text>
          )}
        </DotRing>
      </Animated.View>
      {/* Pevná výška řádku štítku: přepnutí PŘIPRAV SE → SEKUND → nic neposune obsah pod ním. */}
      <View style={{ minHeight: typography.label.lineHeight, alignItems: 'center' }}>
        {status === 'ready' ? (
          <Animated.View exiting={FadeOut.duration(motion.uiExit.duration).easing(motion.uiExit.easing)}>
            <Text variant="label" tone="muted">{copy.lesson.holdReady}</Text>
          </Animated.View>
        ) : counting ? null : (
          <Text variant="label" tone="muted">{copy.lesson.seconds}</Text>
        )}
      </View>
    </View>
  );
}
