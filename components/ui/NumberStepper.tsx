import { Minus, Plus, type LucideIcon } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { feedback } from '@/lib/feedback';
import { opacity, tabularNums, typography, useTheme } from '@/theme';
import { Text } from './Text';

interface Props {
  value: number;
  onChange(next: number): void;
  min?: number;
  max: number;
  /** Krok tlačítek ± (pole přijme libovolné celé číslo v mezích). */
  step?: number;
  /** Mono jednotka pod číslem (`REPS`, `S`). */
  unit: string;
  /** Hlasitý název pole („Push-ups in a row“). */
  label: string;
  minusLabel: string;
  plusLabel: string;
  /** Hodnotu teď nastavuje něco jiného (běžící stopky): pole i tlačítka jsou jen ke čtení. */
  readOnly?: boolean;
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/**
 * Číselný vstup testu (Nothing Dot): uprostřed obří Doto číslo, které je samo editovatelné pole (číselná klávesnice),
 * po stranách kulatá tlačítka − / + 56 pt (`hitLarge`) na ploše `tile` s vlasovou hranou `edge`. Pod číslem mono
 * jednotka. Rozpracovaný text drží lokální koncept (prázdné pole se smí smazat), ven jde vždy celé číslo v mezích.
 */
export function NumberStepper({ value, onChange, min = 0, max, step = 1, unit, label, minusLabel, plusLabel, readOnly = false }: Props) {
  const { c, space } = useTheme();
  const [draft, setDraft] = useState<string | null>(null);
  const shown = draft ?? String(value);
  const set = (v: number) => { setDraft(null); onChange(clamp(v, min, max)); };
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.m }}>
      <RoundButton icon={Minus} label={minusLabel} disabled={readOnly || value <= min} onPress={() => { feedback('wheelStep'); set(value - step); }} />
      <View style={{ flex: 1, alignItems: 'center' }}>
        <TextInput
          value={readOnly ? String(value) : shown}
          editable={!readOnly}
          onChangeText={(raw) => {
            const digits = raw.replace(/\D/g, '').slice(0, String(max).length);
            setDraft(digits);
            onChange(clamp(digits === '' ? 0 : Number(digits), min, max));
          }}
          onBlur={() => setDraft(null)}
          keyboardType="number-pad"
          inputMode="numeric"
          maxLength={String(max).length}
          selectTextOnFocus
          accessibilityLabel={label}
          accessibilityValue={{ text: `${value} ${unit}` }}
          selectionColor={c.muted}
          cursorColor={c.text}
          maxFontSizeMultiplier={1.2}
          style={[typography.display, tabularNums, { color: c.text, textAlign: 'center', alignSelf: 'stretch', minHeight: typography.display.lineHeight, padding: 0 }]}
        />
        <Text variant="telemetry" tone="muted" accessibilityElementsHidden importantForAccessibility="no">{unit}</Text>
      </View>
      <RoundButton icon={Plus} label={plusLabel} disabled={readOnly || value >= max} onPress={() => { feedback('wheelStep'); set(value + step); }} />
    </View>
  );
}

/** Kulaté ikonové tlačítko 56 pt: plocha `tile`, hrana `edge`, stisk `tilePressed`, zakázané `opacity.disabled`. */
function RoundButton({ icon: Icon, label, onPress, disabled }: { icon: LucideIcon; label: string; onPress(): void; disabled: boolean }) {
  const { c, size, stroke, radius } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      style={({ pressed }) => ({
        width: size.hitLarge, height: size.hitLarge, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center',
        backgroundColor: pressed ? c.tilePressed : c.tile, borderWidth: StyleSheet.hairlineWidth, borderColor: c.edge,
        opacity: disabled ? opacity.disabled : 1,
      })}
    >
      <Icon size={size.icon} color={c.text} strokeWidth={stroke.icon} />
    </Pressable>
  );
}
