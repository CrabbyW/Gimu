import { useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from '@/components/ui/Text';
import { copy } from '@/data/copy';
import { pillText } from '@/components/ui/PillButton';
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
 * v `text` (Nothing Dot: výběr nese kontrast, ne barva). Po výběru se ostatní volby ztlumí a otázka se v témž
 * řádku vymění za potvrzení — výška bloku se nemění, [CONTINUE] neposkočí.
 */
export function FeelPicker({ onRate, disabled = false }: Props) {
  const { c, space, size, radius, stroke } = useTheme();
  const [picked, setPicked] = useState<Feel | null>(null);
  const [failed, setFailed] = useState(false);
  const busy = useRef(false);
  const pick = (feel: Feel) => {
    if (busy.current || picked) return;
    busy.current = true;
    setPicked(feel);
    onRate(feel).catch(() => setFailed(true));
  };
  const line = picked ? (failed ? t.feelError : t.feelDone[picked]) : t.feelQuestion;
  return (
    <View testID="feel-picker" style={{ gap: space.s }}>
      <Text testID="feel-line" variant="caption" tone={picked ? 'text' : 'muted'} accessibilityLiveRegion="polite" numberOfLines={1} adjustsFontSizeToFit>
        {line}
      </Text>
      <View accessibilityRole="radiogroup" accessibilityLabel={t.feelQuestion} style={{ flexDirection: 'row', gap: space.s }}>
        {FEELS.map((f) => {
          const on = picked === f;
          const off = picked !== null && !on;
          return (
            <Pressable
              key={f}
              onPress={() => pick(f)}
              disabled={disabled || picked !== null}
              accessibilityRole="radio"
              accessibilityLabel={t.feel[f]}
              accessibilityState={{ selected: on, disabled: disabled || picked !== null }}
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
