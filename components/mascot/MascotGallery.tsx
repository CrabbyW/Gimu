import { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';
import { PillButton } from '@/components/ui/PillButton';
import { SectionLabel } from '@/components/ui/SectionLabel';
import { Text } from '@/components/ui/Text';
import { copy } from '@/data/copy';
import { MASCOT_POSE_GRID, type MascotPoseId } from '@/logic/mascotPoses';
import { useTheme } from '@/theme';
import { SvgMascot } from './SvgMascot';
import { MASCOT_SIZES } from './types';

const ALL: readonly MascotPoseId[] = ['idle', ...MASCOT_POSE_GRID];

/**
 * Dev menu: klid + 30 póz opice v2 v pořadí reference `opice-v2-pozy.png` (5 × 6) pro kontrolu obou režimů.
 * Náhledy jsou statické (`still`): 31 živých smyček by zbytečně vytížilo UI vlákno. Pohyb hraje přehrávač
 * nad mřížkou: ťuknutí na náhled přehraje tu pózu (znovu = znovu od vstupu), „Play all“ projde všechny dokola.
 */
export function MascotGallery() {
  const { space, c } = useTheme();
  const [sel, setSel] = useState<{ id: MascotPoseId; key: number } | null>(null);
  return (
    <View testID="mascot-gallery" style={{ gap: space.s }}>
      <SectionLabel>{copy.dev.poses}</SectionLabel>
      <PosePlayer pick={sel} onAuto={() => setSel(null)} />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.m }}>
        {ALL.map((id) => (
          <Pressable
            key={id}
            testID={`pose-${id}`}
            accessibilityRole="button"
            accessibilityLabel={copy.dev.posePlay(id)}
            accessibilityState={{ selected: sel?.id === id }}
            onPress={() => setSel((s) => ({ id, key: (s?.key ?? 0) + 1 }))}
            style={{ alignItems: 'center', gap: space.xs, borderBottomWidth: 2, borderColor: sel?.id === id ? c.text : 'transparent' }}
          >
            <SvgMascot stage={1} cosmetics={{}} mood="idle" pose={id} size={MASCOT_SIZES.M} breathe={false} hop={false} still decorative />
            <Text variant="label" tone={sel?.id === id ? 'text' : 'muted'}>{id}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

/** Přehrávač: vybraná póza (živá smyčka, rekvizity), bez výběru prochází všech 31 dokola po `stepMs`. */
function PosePlayer({ pick, onAuto, stepMs = 3000 }: { pick: { id: MascotPoseId; key: number } | null; onAuto: () => void; stepMs?: number }) {
  const { space } = useTheme();
  const [i, setI] = useState(0);
  const auto = pick === null;
  useEffect(() => {
    if (!auto) return;
    const t = setInterval(() => setI((n) => (n + 1) % ALL.length), stepMs);
    return () => clearInterval(t);
  }, [auto, stepMs]);
  const id = pick?.id ?? ALL[i]!;
  return (
    <View testID="mascot-cycler" style={{ alignItems: 'flex-start', gap: space.xs }}>
      <SvgMascot stage={1} cosmetics={{}} mood="idle" pose={id} size={MASCOT_SIZES.L} hop={false} />
      <Text variant="label" tone="muted" testID="mascot-cycler-pose">{id}</Text>
      {auto ? null : <PillButton label={copy.dev.poseAuto} variant="secondary" onPress={onAuto} />}
    </View>
  );
}
