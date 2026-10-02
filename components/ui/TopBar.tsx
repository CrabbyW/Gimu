import { Flame } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { copy } from '@/data/copy';
import { useTheme } from '@/theme';
import { MeasureLine } from './MeasureLine';
import { Telemetry } from './Telemetry';
import { Text } from './Text';

/** Průběh aktuální sekce mapy (počty z `LessonPathView`, nic dopočítaného navíc). */
export interface SectionProgress { index: number; title: string; done: number; total: number }

interface Props { streak: number; streakBroken: boolean; xp: number; tierLabel: string; section?: SectionProgress | null }

/** Hlavička mapy (R42, instrument vrstva), vážená vlevo:
 *  1. streak — plamen v obrysu a číslo v display řezu (jediný velký prvek hlavičky),
 *  2. telemetrický pruh `XP: 340 · LIGA: BRONZ`,
 *  3. měřicí linka aktuální sekce, která zároveň dělí hlavičku od mapy (místo vlasové linky).
 *  Žádný akcent: přerušený streak ztlumí plamen i číslo do `muted`. */
export function TopBar({ streak, streakBroken, xp, tierLabel, section = null }: Props) {
  const { c, space, seasonal, size, stroke } = useTheme();
  const insets = useSafeAreaInsets();
  const tone = streakBroken ? 'muted' : 'text';
  const measured = section !== null && section.total > 0 ? section : null;
  return (
    <View
      style={{
        backgroundColor: seasonal.headerBase,
        paddingTop: insets.top + space.m,
        // Asymetrie: levý okraj m, pravý xl — obsah visí z levé hrany, vpravo zůstává vzduch.
        paddingLeft: space.m, paddingRight: space.xl, paddingBottom: space.m,
        gap: space.s,
        // Bez sekce chybí měřicí linka; dělicí roli pak převezme vlasová linka.
        borderBottomWidth: measured ? 0 : StyleSheet.hairlineWidth, borderBottomColor: c.rule,
      }}
    >
      <View
        accessible
        accessibilityLabel={copy.map.streakA11y(streak)}
        style={{ flexDirection: 'row', alignItems: 'center', gap: space.s, minHeight: size.hit }}
      >
        <Flame size={size.icon} color={streakBroken ? c.muted : c.text} strokeWidth={stroke.icon} />
        <Text variant="title" tone={tone} maxFontSizeMultiplier={1}>{streak}</Text>
        <Text variant="telemetry" tone="muted">{copy.map.days}</Text>
      </View>
      <Telemetry
        items={[
          { key: copy.map.xp, value: xp, a11y: copy.map.xpA11y(xp) },
          { key: copy.map.tier, value: tierLabel, a11y: copy.map.leagueA11y(tierLabel) },
        ]}
      />
      {measured ? (
        <MeasureLine
          progress={measured.done / measured.total}
          label={copy.map.sectionLabel(measured.index, measured.title)}
          value={copy.map.sectionProgress(measured.done, measured.total)}
          accessibilityLabel={copy.map.sectionProgressA11y(measured.index, measured.title, measured.done, measured.total)}
          style={{ marginTop: space.s }}
        />
      ) : null}
    </View>
  );
}
