import { useEffect, useRef, useState } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';
import { motion, useMotionSafe } from '@/lib/motion';
import { useTheme } from '@/theme';
import { Text } from './Text';

interface Props {
  /** Průběh 0–1 (mimo rozsah se ořízne). */
  progress: number;
  /** Mono popisek vlevo nad linkou, např. „SEKCE 01“. */
  label?: string;
  /** Hodnota vpravo nad linkou, např. „03/08“. */
  value?: string;
  accessibilityLabel: string;
  /** Linka leží na akcentové ploše oslavy: vše v `onAccent`, prošlý úsek odliší jen tloušťka. */
  onAccent?: boolean;
  /** Jen pro umístění v layoutu. */
  style?: StyleProp<ViewStyle>;
  /** Úvodní natažení (motion): linka se při mountu natáhne z tohoto podílu na `progress`. */
  drawFrom?: number;
  /** Zpoždění úvodního natažení (ms). */
  drawDelay?: number;
  /** Délka úvodního natažení (ms), výchozí `motion.reveal` 480. */
  drawMs?: number;
}

const clamp01 = (v: number) => Math.min(Math.max(Number.isFinite(v) ? v : 0, 0), 1);

/** Měřicí linka (R42): vlasová osa v `rule` s koncovými tiky, prošlý úsek v `text`
 *  zakončený vlastním tikem. Progres nese kontrast, ne akcent. */
export function MeasureLine({ progress, label, value, accessibilityLabel, onAccent = false, style, drawFrom, drawDelay = 0, drawMs = motion.reveal.duration }: Props) {
  const { c: theme, space, size, stroke } = useTheme();
  // Na akcentu je jediný čitelný inkoust `onAccent`: osa, tiky i prošlý úsek.
  const c = onAccent ? { ...theme, rule: theme.onAccent, muted: theme.onAccent, text: theme.onAccent } : theme;
  const tone = onAccent ? 'onAccent' : undefined;
  const p = clamp01(progress);
  // Motion: prošlý úsek je shared value. Úvodní natažení z `drawFrom`, každá další změna (další cvik,
  // dokončený uzel) se posune 260 ms ease-out. Omezený pohyb: hned. A11y nese vždy konečný podíl.
  const { reduced } = useMotionSafe();
  const [start] = useState(() => (drawFrom === undefined || reduced ? p : clamp01(drawFrom)));
  const shown = useSharedValue(start);
  const mounted = useRef(false);
  useEffect(() => {
    if (reduced) { shown.value = p; return; }
    shown.value = !mounted.current && start !== p
      ? withDelay(drawDelay, withTiming(p, { duration: drawMs, easing: motion.reveal.easing }))
      : withTiming(p, motion.enter);
    mounted.current = true;
    // Reaguje jen na změnu cíle; úvodní parametry platí pro mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [p, reduced]);
  const fill = useAnimatedStyle(() => ({ width: `${shown.value * 100}%` }));
  const head = useAnimatedStyle(() => ({ left: `${shown.value * 100}%`, opacity: shown.value > 0.001 && shown.value < 0.999 ? 1 : 0 }));
  const tick = (left: ViewStyle['left'], color: string) => (
    <View style={{ position: 'absolute', left, top: 0, width: 1, height: size.tick, backgroundColor: color, marginLeft: left === '100%' ? -1 : 0 }} />
  );
  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={{ min: 0, max: 100, now: Math.round(p * 100) }}
      style={[{ gap: space.xs }, style]}
    >
      {label || value ? (
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: space.s }}>
          <Text variant="telemetry" tone={tone ?? 'muted'} numberOfLines={1} style={{ flexShrink: 1 }}>{label ?? ''}</Text>
          {value ? <Text variant="telemetry" tone={tone ?? 'text'}>{value}</Text> : null}
        </View>
      ) : null}
      <View style={{ height: size.tick }}>
        {/* Osa uprostřed výšky tiku. */}
        <View style={{ position: 'absolute', left: 0, right: 0, top: (size.tick - 1) / 2, height: 1, backgroundColor: c.rule }} />
        <Animated.View style={[{ position: 'absolute', left: 0, top: (size.tick - stroke.measure) / 2, height: stroke.measure, backgroundColor: c.text }, fill]} />
        {tick(0, c.muted)}
        {tick('100%', c.muted)}
        <Animated.View style={[{ position: 'absolute', top: 0, width: 1, height: size.tick, backgroundColor: c.text }, head]} />
      </View>
    </View>
  );
}
