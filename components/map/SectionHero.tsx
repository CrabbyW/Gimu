import { View } from 'react-native';
import Svg, { Line, Rect } from 'react-native-svg';
import { Reveal } from '@/components/ui/choreo';
import { Text } from '@/components/ui/Text';
import { copy } from '@/data/copy';
import { intro as I, motion } from '@/lib/motion';
import type { LessonPathView, MapNode } from '@/services/contracts';
import { useCompact, useTheme } from '@/theme';
import type { PlateKg } from '@/types';

/** Výška kotouče podle váhy: 25 kg plná výška činky, 5 kg 60 % (litina se zmenšuje s hmotností). */
const H = I.hero;

const plateScale = (kg: PlateKg) => 0.5 + kg / 50;

/** Sekce, ve které uživatel právě je: ta s aktuální lekcí, jinak poslední (vše hotovo). Čisté zobrazení. */
export function currentSection(view: LessonPathView) {
  return view.sections.find((s) => s.nodes.some((n) => n.lesson.id === view.currentLessonId)) ?? view.sections[view.sections.length - 1];
}

/**
 * Hero hlavička mapy (hloubka a materiál, 2026-10-03): mono štítek „SEKCE 01“, název sekce `title`
 * a jedno velké číslo pokroku `hero` („3“ + `/ 8` muted). Pod názvem malá činka se sloty: každá
 * lekce sekce (bez bosse, ten je činka sama) = kotouč v tónu své litiny s obrysem `muted`
 * (tmavé plate20/25 by na `base` zanikly), nehotová = jen obrys `faint`.
 * Bez akcentu: progres tady nese kov a číslo, jantar zůstává pilulce série a CTA.
 */
export function SectionHero({ view, intro = false }: { view: LessonPathView; intro?: boolean }) {
  const { space } = useTheme();
  // 320×568: plná hero (~150 pt) + karta první lekce + tab bar nechaly mapě ~170 pt a aktuální uzel 88 pt
  // s opičkou se do nich nevešel. Kompaktně: název na jeden řádek, bez činky (pokrok nese číslo), číslo `display`.
  const compact = useCompact();
  const section = currentSection(view);
  if (!section) return null;
  const done = section.nodes.filter((n) => n.state === 'done').length;
  const total = section.nodes.length;
  return (
    <View
      accessible
      accessibilityRole="header"
      accessibilityLabel={copy.map.sectionProgressA11y(section.index, section.title, done, total)}
      style={{ flexDirection: 'row', alignItems: 'flex-end', gap: space.m, paddingHorizontal: space.l, paddingTop: space.m, paddingBottom: space.m }}
    >
      {/* Motion (polish 2026-10-05): štítek+název → číslo → činka, část úvodního sledu mapy (`intro.map.hero`). */}
      <View style={{ flex: 1, minWidth: 0, gap: compact ? space.xs : space.s }}>
        <Reveal play={intro} delay={H.at} rise={H.rise} config={motion.reveal} style={{ gap: compact ? space.xs : space.s }}>
          <Text variant="label" tone="muted">{copy.map.sectionKicker(section.index)}</Text>
          <Text variant="title" numberOfLines={compact ? 1 : 2}>{section.title}</Text>
        </Reveal>
        {compact ? null : (
          <Reveal play={intro} delay={H.at + H.step * 2} rise={H.rise} config={motion.reveal}>
            <SectionBarbell nodes={section.nodes.filter((n) => !n.lesson.isBoss)} />
          </Reveal>
        )}
      </View>
      <Reveal play={intro} delay={H.at + H.step} rise={H.rise} config={motion.reveal} style={{ alignItems: 'flex-end' }}>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: space.xs }}>
          <Text variant={compact ? 'display' : 'hero'}>{done}</Text>
          <Text variant="headline" tone="muted">{copy.map.sectionTotal(total)}</Text>
        </View>
        <Text variant="caption" tone="muted">{copy.map.sectionCaption(total)}</Text>
      </Reveal>
    </View>
  );
}

/** Malá činka sekce: osa `muted`, objímky, sloty od středu ven střídavě vlevo/vpravo (jako činka série). */
function SectionBarbell({ nodes }: { nodes: MapNode[] }) {
  const { c, size, material, stroke } = useTheme();
  const W = size.heroBarbellW;
  const H = size.heroBarbellH;
  const mid = H / 2;
  const half = W / 2;
  const collarGap = material.heroPlateGap * 2;
  const step = material.heroPlateW + material.heroPlateGap;
  return (
    <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        <Line x1={0} y1={mid} x2={W} y2={mid} stroke={c.muted} strokeWidth={material.heroBar} strokeLinecap="round" />
        <Rect x={half - collarGap - material.heroBar} y={mid - H / 4} width={material.heroBar} height={H / 2} fill={c.muted} />
        <Rect x={half + collarGap} y={mid - H / 4} width={material.heroBar} height={H / 2} fill={c.muted} />
        {nodes.map((n, i) => {
          const depth = Math.floor(i / 2);
          const right = i % 2 === 1;
          const h = H * plateScale(n.lesson.plateKg);
          const offset = collarGap + material.heroBar + material.heroPlateGap + depth * step;
          const x = right ? half + offset : half - offset - material.heroPlateW;
          const y = mid - h / 2;
          if (n.state !== 'done') {
            const sw = stroke.slot;
            return (
              <Rect key={n.lesson.id} x={x + sw / 2} y={y + sw / 2} width={material.heroPlateW - sw} height={h - sw}
                rx={material.streakPlateLg} fill="none" stroke={c.faint} strokeWidth={sw} />
            );
          }
          return (
            <Rect key={n.lesson.id} x={x} y={y} width={material.heroPlateW} height={h} rx={material.streakPlateLg}
              fill={c[`plate${n.lesson.plateKg}`]} stroke={c.muted} strokeWidth={stroke.slot} />
          );
        })}
      </Svg>
    </View>
  );
}
