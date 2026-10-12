import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { SectionLabel } from '@/components/ui/SectionLabel';
import { Text } from '@/components/ui/Text';
import { copy } from '@/data/copy';
import { MASCOT_POSE_IDS } from '@/logic/mascotPoses';
import { useTheme } from '@/theme';
import { SvgMascot } from './SvgMascot';
import { MASCOT_SIZES } from './types';

/** Dev menu: všech 8 statických póz opice v2 pro vizuální kontrolu obou režimů. */
export function MascotGallery() {
  const { space } = useTheme();
  return (
    <View testID="mascot-gallery" style={{ gap: space.s }}>
      <SectionLabel>{copy.dev.poses}</SectionLabel>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.m }}>
        {MASCOT_POSE_IDS.map((id) => (
          <View key={id} style={{ alignItems: 'center', gap: space.xs }}>
            <SvgMascot stage={1} cosmetics={{}} mood="idle" pose={id} size={MASCOT_SIZES.M} breathe={false} hop={false} />
            <Text variant="label" tone="muted">{id}</Text>
          </View>
        ))}
      </View>
      <PoseCycler />
    </View>
  );
}

/** Motion: jedna opice prochází pózy dokola (přechody, smyčky mávnutí/visu/kliku/běhu, Zz). Krok `stepMs`. */
function PoseCycler({ stepMs = 2200 }: { stepMs?: number }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((n) => (n + 1) % MASCOT_POSE_IDS.length), stepMs);
    return () => clearInterval(t);
  }, [stepMs]);
  const id = MASCOT_POSE_IDS[i]!;
  return (
    <View testID="mascot-cycler" style={{ alignItems: 'flex-start' }}>
      <SvgMascot stage={1} cosmetics={{}} mood="idle" pose={id} size={MASCOT_SIZES.L} hop={false} />
      <Text variant="label" tone="muted">{id}</Text>
    </View>
  );
}
