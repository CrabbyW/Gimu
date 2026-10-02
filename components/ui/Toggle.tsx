import { Pressable, View } from 'react-native';
import { opacity, useTheme } from '@/theme';

interface Props {
  value: boolean;
  onChange(next: boolean): void;
  /** Hlasitý popis (např. „Denní připomínka“). */
  label: string;
  disabled?: boolean;
}

/** Přepínač 52×32 v ploše min. 44 pt (Task 29, R42). Vypnutý: stopa `rule`, knoflík `muted`.
 *  Zapnutý: stopa `text`, knoflík `base` — stav nese kontrast a poloha knoflíku, ne akcent.
 *  Bez animace (pohyb knoflíku doplní motion-agent). */
export function Toggle({ value, onChange, label, disabled = false }: Props) {
  const { c, size, radius } = useTheme();
  const inset = (size.toggleHeight - size.toggleKnob) / 2;
  return (
    <Pressable
      onPress={() => onChange(!value)}
      disabled={disabled}
      accessibilityRole="switch"
      accessibilityLabel={label}
      accessibilityState={{ checked: value, disabled }}
      style={{ minWidth: size.hit, minHeight: size.hit, alignItems: 'center', justifyContent: 'center', opacity: disabled ? opacity.disabled : 1 }}
    >
      <View style={{ width: size.toggleWidth, height: size.toggleHeight, borderRadius: radius.full, backgroundColor: value ? c.text : c.rule, justifyContent: 'center' }}>
        <View
          style={{
            width: size.toggleKnob, height: size.toggleKnob, borderRadius: radius.full,
            backgroundColor: value ? c.base : c.muted,
            marginLeft: value ? size.toggleWidth - size.toggleKnob - inset : inset,
          }}
        />
      </View>
    </Pressable>
  );
}
