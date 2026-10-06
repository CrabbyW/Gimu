import { GestureDetector } from 'react-native-gesture-handler';
import { View } from 'react-native';
import { SectionLabel } from '@/components/ui/SectionLabel';
import { Text } from '@/components/ui/Text';
import { copy } from '@/data/copy';
import { useTheme } from '@/theme';
import { DotField, DotMatrix, DotPlate, DotRing, DotRow, useDotTouch, type DotPlateState } from './index';

const KGS = [2.5, 5, 10, 15, 20, 25] as const;
const STATES: readonly DotPlateState[] = ['locked', 'current', 'done'];
// Ukázková mřížka aktivity: 5 týdnů, svítí poslední dva (stejný vzor jako demo profil).
const MATRIX_LIT = Array.from({ length: 35 }, (_, i) => i >= 16 && i < 29);

/** Dev menu „Tečky“ (plán fáze 1, úkol 5 krok 5): všechny tečkové komponenty pro vizuální kontrolu obou režimů. */
export function DotGallery() {
  const { space, size } = useTheme();
  const { touch, gesture } = useDotTouch();
  const plate = size.node;
  return (
    <View style={{ gap: space.l }}>
      <SectionLabel>{copy.dev.dots}</SectionLabel>
      {STATES.map((state) => (
        <View key={state} style={{ gap: space.s }}>
          <Text variant="label" tone="muted">{copy.dev.dotState[state]}</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.m }}>
            {KGS.map((kg) => <DotPlate key={kg} kg={kg} size={plate} state={state} />)}
          </View>
        </View>
      ))}
      <DotRing progress={0.67} size={size.holdRing} />
      <DotRow total={24} fraction={0.67} columns={12} />
      <DotMatrix cols={7} rows={5} lit={MATRIX_LIT} today={28} />
      <GestureDetector gesture={gesture}>
        <View>
          <DotField width={size.holdRing} height={size.heroTile} touch={touch} />
        </View>
      </GestureDetector>
    </View>
  );
}
