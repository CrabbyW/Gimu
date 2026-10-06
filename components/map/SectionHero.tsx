import { View } from 'react-native';
import { DotRow } from '@/components/dots';
import { Reveal } from '@/components/ui/choreo';
import { Text } from '@/components/ui/Text';
import { copy } from '@/data/copy';
import { intro as I, motion } from '@/lib/motion';
import type { LessonPathView } from '@/services/contracts';
import { dots, useTheme } from '@/theme';

const H = I.hero;
/** Nejvýš tolik teček na řádek; sekce má do 12 lekcí, takže pokrok je vždy jeden tenký řádek. */
const ROW_MAX = 12;

/** Sekce, ve které uživatel právě je: ta s aktuální lekcí, jinak poslední (vše hotovo). Čisté zobrazení. */
export function currentSection(view: LessonPathView) {
  return view.sections.find((s) => s.nodes.some((n) => n.lesson.id === view.currentLessonId)) ?? view.sections[view.sections.length - 1];
}

/**
 * Řádek pokroku sekce pod hlavičkou mapy: tečky lekcí sekce (rozsvícené hotové) vlevo, mono „0 / 9“ vpravo.
 * Záměrně bez dlaždice a velkého čísla: subjektem obrazovky je cesta s kotouči, hlavička jí má dát výšku.
 * Motion: tečky → číslo, stejný sled `intro.map.hero` jako dřív.
 */
export function SectionHero({ view, intro = false }: { view: LessonPathView; intro?: boolean }) {
  const { space } = useTheme();
  const section = currentSection(view);
  if (!section) return null;
  const done = section.nodes.filter((n) => n.state === 'done').length;
  const total = section.nodes.length;
  return (
    <View
      accessible
      accessibilityRole="summary"
      accessibilityLabel={copy.map.sectionProgressA11y(section.index, section.title, done, total)}
      style={{ paddingHorizontal: space.l, paddingBottom: space.s, flexDirection: 'row', alignItems: 'center', gap: space.m }}
    >
      <Reveal play={intro} delay={H.at} rise={H.rise} config={motion.reveal} style={{ flex: 1 }}>
        <DotRow total={total} fraction={total > 0 ? done / total : 0} columns={ROW_MAX} dot={dots.row.d} intro={intro ? H.at : false} />
      </Reveal>
      <Reveal play={intro} delay={H.at + H.step} rise={H.rise} config={motion.reveal}>
        <Text variant="label" tone="muted" numberOfLines={1}>{`${done} ${copy.map.sectionTotal(total)}`}</Text>
      </Reveal>
    </View>
  );
}
