import { useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { ReduceMotion, useAnimatedStyle, useSharedValue, withSequence, withTiming } from 'react-native-reanimated';
import { Text } from '@/components/ui/Text';
import { copy } from '@/data/copy';
import { pillText } from '@/components/ui/PillButton';
import { feedback } from '@/lib/feedback';
import { easeSafe, feelSwap } from '@/lib/motion';
import { useTheme } from '@/theme';
import type { Feel } from '@/types';

const FEELS: readonly Feel[] = ['easy', 'right', 'hard'];
const t = copy.complete;

interface Props {
  /** Uloží hodnocení (služba je idempotentní). Odmítnutí = krátká věta, že lekce platí i tak. */
  onRate(feel: Feel): Promise<void>;
  disabled?: boolean;
}

/**
 * „How did it feel?“ (UX pass U2): jedno ťuknutí po oslavě, nad [CONTINUE]. Přeskočitelné — nic se neuloží,
 * dokud uživatel nevybere. Tři stejně široké segmenty (`tile` + vlasová hrana), výběr = hrana `text` a popisek
 * v `text` (Nothing Dot: výběr nese kontrast, ne barva). Po výběru se ostatní volby ztlumí (zůstávají ťukací, volba
 * jde změnit) a otázka se v témž řádku vymění za potvrzení — výška bloku se nemění, [CONTINUE] neposkočí.
 */
export function FeelPicker({ onRate, disabled = false }: Props) {
  const { c, space, size, radius, stroke } = useTheme();
  const [picked, setPicked] = useState<Feel | null>(null);
  const [failed, setFailed] = useState(false);
  const busy = useRef(false);
  const retrying = useRef(false);
  // Výměna otázky za potvrzení: stejný řádek (výška stojí), nový text se prolne. Jen opacity → i s omezeným pohybem.
  const lineIn = useSharedValue(1);
  const lineStyle = useAnimatedStyle(() => ({ opacity: lineIn.value }));
  // Volbu jde změnit (2026-10-16): jiné ťuknutí hodnocení přepíše (služba přepočítá od hodnoty před pokusem).
  const pick = (feel: Feel) => {
    if (busy.current || picked === feel) return;
    busy.current = true;
    feedback('feelSelect');
    lineIn.set(withSequence(
      withTiming(0, { duration: 0, reduceMotion: ReduceMotion.Never }),
      withTiming(1, { duration: feelSwap.swapInMs, easing: easeSafe.out, reduceMotion: ReduceMotion.Never }),
    ));
    setPicked(feel);
    setFailed(false);
    onRate(feel).catch(() => setFailed(true)).finally(() => { busy.current = false; });
  };
  // QA: chyba uložení nabídne [TRY AGAIN] (stejná volba, idempotentní služba). Během pokusu se neopakuje.
  const retry = () => {
    if (!picked || retrying.current) return;
    retrying.current = true;
    feedback('tapLight');
    setFailed(false);
    onRate(picked).catch(() => setFailed(true)).finally(() => { retrying.current = false; });
  };
  const line = picked ? (failed ? t.feelError : t.feelDone[picked]) : t.feelQuestion;
  return (
    <View testID="feel-picker" style={{ gap: space.s }}>
      {/* Řádek otázky/potvrzení; při chybě vpravo [TRY AGAIN] (mono štítek, dotyková plocha 44 přes hitSlop),
          výška řádku se nemění, [CONTINUE] neposkočí. */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.m }}>
      <Animated.View style={[{ flex: 1 }, lineStyle]}>
      <Text testID="feel-line" variant="caption" tone={picked ? 'text' : 'muted'} accessibilityLiveRegion="polite" numberOfLines={1} adjustsFontSizeToFit>
        {line}
      </Text>
      </Animated.View>
      {failed ? (
        <Pressable
          testID="feel-retry"
          onPress={retry}
          accessibilityRole="button"
          accessibilityLabel={t.feelRetryA11y}
          hitSlop={{ top: space.m, bottom: space.m, left: space.s, right: space.s }}
          style={{ minWidth: size.hit, alignItems: 'flex-end' }}
        >
          <Text variant="label">{pillText(copy.common.retry)}</Text>
        </Pressable>
      ) : null}
      </View>
      <View accessibilityRole="radiogroup" accessibilityLabel={t.feelQuestion} style={{ flexDirection: 'row', gap: space.s }}>
        {FEELS.map((f) => {
          const on = picked === f;
          const off = picked !== null && !on;
          return (
            <Pressable
              key={f}
              onPress={() => pick(f)}
              disabled={disabled}
              accessibilityRole="radio"
              accessibilityLabel={t.feel[f]}
              accessibilityState={{ selected: on, disabled }}
              style={({ pressed }) => ({
                flex: 1, minHeight: size.feelChoice, borderRadius: radius.full,
                alignItems: 'center', justifyContent: 'center', paddingHorizontal: space.xs,
                backgroundColor: pressed ? c.tilePressed : c.tile,
                borderWidth: on ? stroke.focus : StyleSheet.hairlineWidth,
                borderColor: on ? c.text : c.edge,
              })}
            >
              <Text variant="pill" tone={off ? 'faint' : 'text'} numberOfLines={1}>{pillText(t.feel[f])}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
