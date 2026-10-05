import { View } from 'react-native';
import { DotRow } from '@/components/dots';
import { Reveal } from '@/components/ui/choreo';
import { Text } from '@/components/ui/Text';
import { Tile } from '@/components/ui/Tile';
import { copy } from '@/data/copy';
import { intro as I, motion } from '@/lib/motion';
import type { LessonPathView } from '@/services/contracts';
import { dots, useCompact, useTheme } from '@/theme';

const H = I.hero;
/** Nejvýš tolik teček na řádek, pak se řádek zalomí (obr. 5: 12 × 2). */
const ROW_MAX = 12;

/** Sekce, ve které uživatel právě je: ta s aktuální lekcí, jinak poslední (vše hotovo). Čisté zobrazení. */
export function currentSection(view: LessonPathView) {
  return view.sections.find((s) => s.nodes.some((n) => n.lesson.id === view.currentLessonId)) ?? view.sections[view.sections.length - 1];
}

/**
 * Hero dlaždice mapy (Nothing Dot §6, obr. 2 + 5): jedno velké Doto číslo hotových lekcí s malou jednotkou
 * „/ 8“, pod ním řádek teček (jedna tečka = jedna lekce sekce, rozsvícené hotové) a vlevo dole název
 * a další lekce. Název sekce nese hlavička obrazovky, tady jen pokrok: číslo je nejdůležitější věc dlaždice.
 * Kompaktně (320 pt / velké písmo) menší číslo a bez podtitulku, ať mapě zůstane výška.
 */
export function SectionHero({ view, intro = false }: { view: LessonPathView; intro?: boolean }) {
  const { space, size } = useTheme();
  const compact = useCompact();
  const section = currentSection(view);
  if (!section) return null;
  const done = section.nodes.filter((n) => n.state === 'done').length;
  const total = section.nodes.length;
  const next = section.nodes.find((n) => n.lesson.id === view.currentLessonId);
  const sub = next ? copy.hero.next(next.lesson.isBoss ? copy.map.bossTitle : next.lesson.title) : copy.hero.allDone;
  return (
    <View
      accessible
      accessibilityRole="summary"
      accessibilityLabel={copy.map.sectionProgressA11y(section.index, section.title, done, total)}
      // Mezera pod hero: mapa začíná až pod ní (horní hrana výřezu mapy nesmí sedět na hraně dlaždice).
      style={{ paddingHorizontal: space.l, paddingBottom: space.m }}
    >
      <Tile style={{ minHeight: compact ? undefined : size.heroTile, justifyContent: 'space-between', gap: compact ? space.s : space.m }}>
        {/* Motion (úvodní sled mapy `intro.map.hero`): číslo → tečky → název, každý úder `motion.reveal`. */}
        <Reveal play={intro} delay={H.at} rise={H.rise} config={motion.reveal}>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: space.s }}>
            <Text variant={compact ? 'display' : 'hero'}>{done}</Text>
            <Text variant="headline" tone="muted">{copy.map.sectionTotal(total)}</Text>
          </View>
        </Reveal>
        <Reveal play={intro} delay={H.at + H.step} rise={H.rise} config={motion.reveal}>
          <DotRow total={total} fraction={total > 0 ? done / total : 0} columns={ROW_MAX} dot={dots.row.d} />
        </Reveal>
        <Reveal play={intro} delay={H.at + H.step * 2} rise={H.rise} config={motion.reveal}>
          <Text variant="headline" numberOfLines={1}>{copy.hero.name}</Text>
          {compact ? null : <Text variant="caption" tone="muted" numberOfLines={1}>{sub}</Text>}
        </Reveal>
      </Tile>
    </View>
  );
}
