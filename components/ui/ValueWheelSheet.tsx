import { Check } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { copy } from '@/data/copy';
import { feedback } from '@/lib/feedback';
import { useTheme, tabularNums } from '@/theme';
import { Button } from './Button';
import { Text } from './Text';

export interface WheelOption {
  key: string;
  /** Zobrazená hodnota, např. „18:00“ nebo „12 ×“. */
  label: string;
}

interface Props {
  visible: boolean;
  title: string;
  options: WheelOption[];
  selectedIndex: number;
  onSave(index: number): void;
  onClose(): void;
  /** Popisek tlačítka; výchozí „Uložit“. */
  saveLabel?: string;
}

const clampIndex = (i: number, n: number) => Math.min(Math.max(i, 0), Math.max(n - 1, 0));

/** Bottom sheet pro výběr hodnoty (Teplá litina §2.7): `surface`, radius 14 nahoře, pod ním `scrim`.
 *  Kolo: 5 viditelných řádků po 44 pt se snapem, aktivní řádek `headline text` + `Check` v `accentGraphic`
 *  (výběr = progres), ostatní `body muted`. Aktivní řádek ohraničují dvě linky `rule`, ne plocha.
 *  Statická kostra: vjezd sheetu a doznění snapu dodá motion-agent. */
export function ValueWheelSheet({ visible, title, options, selectedIndex, onSave, onClose, saveLabel = copy.wheel.save }: Props) {
  const { c, space, radius, size, stroke } = useTheme();
  const insets = useSafeAreaInsets();
  const row = size.wheelRow;
  const pad = row * Math.floor(size.wheelVisible / 2);
  const scroll = useRef<ScrollView>(null);
  const [index, setIndex] = useState(() => clampIndex(selectedIndex, options.length));
  const indexRef = useRef(index);

  // Při otevření (a změně výchozí hodnoty) se výběr vrátí na `selectedIndex`: odvozený stav při renderu,
  // ne setState v efektu (žádný kaskádový render).
  const openKey = `${visible}|${selectedIndex}|${options.length}`;
  const [seenKey, setSeenKey] = useState(openKey);
  if (seenKey !== openKey) {
    setSeenKey(openKey);
    if (visible) setIndex(clampIndex(selectedIndex, options.length));
  }
  useEffect(() => { indexRef.current = index; }, [index]);

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const i = clampIndex(Math.round(e.nativeEvent.contentOffset.y / row), options.length);
    if (i === indexRef.current) return;
    indexRef.current = i;
    setIndex(i);
    feedback('wheelStep');
  };
  const pick = (i: number) => scroll.current?.scrollTo({ y: i * row, animated: true });
  const current = options[index];

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <View style={{ flex: 1, justifyContent: 'flex-end' }}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={copy.wheel.close}
          onPress={onClose}
          style={[StyleSheet.absoluteFill, { backgroundColor: c.scrim }]}
        />
        <View
          accessibilityViewIsModal
          style={{
            backgroundColor: c.surface, borderTopLeftRadius: radius.l, borderTopRightRadius: radius.l,
            paddingHorizontal: space.l, paddingTop: space.s, paddingBottom: insets.bottom + space.l, gap: space.m,
          }}
        >
          <View style={{ alignSelf: 'center', width: size.sheetGrip, height: size.sheetGripH, borderRadius: radius.full, backgroundColor: c.faint }} />
          <Text variant="headline" accessibilityRole="header">{title}</Text>
          <View style={{ height: row * size.wheelVisible }}>
            <ScrollView
              ref={scroll}
              showsVerticalScrollIndicator={false}
              snapToInterval={row}
              decelerationRate="fast"
              contentOffset={{ x: 0, y: index * row }}
              contentContainerStyle={{ paddingVertical: pad }}
              onScroll={onScroll}
              scrollEventThrottle={16}
            >
              {options.map((o, i) => {
                const active = i === index;
                return (
                  <Pressable
                    key={o.key}
                    onPress={() => pick(i)}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    accessibilityLabel={o.label}
                    style={{ height: row, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
                  >
                    <Text variant={active ? 'headline' : 'body'} tone={active ? 'text' : 'muted'} style={tabularNums} maxFontSizeMultiplier={1.3}>
                      {o.label}
                    </Text>
                    {active ? <Check size={size.icon} color={c.accentGraphic} strokeWidth={stroke.icon} /> : null}
                  </Pressable>
                );
              })}
            </ScrollView>
            {/* Dvě linky `rule` vymezují aktivní řádek; dotyk propouští do kola. */}
            <View pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, top: pad, height: StyleSheet.hairlineWidth, backgroundColor: c.rule }} />
            <View pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, top: pad + row, height: StyleSheet.hairlineWidth, backgroundColor: c.rule }} />
          </View>
          <Button label={saveLabel} onPress={() => onSave(index)} disabled={current === undefined} />
        </View>
      </View>
    </Modal>
  );
}
