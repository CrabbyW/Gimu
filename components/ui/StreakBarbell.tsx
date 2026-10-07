import { View } from 'react-native';
import Svg, { Line, Rect } from 'react-native-svg';
import { copy } from '@/data/copy';
import { useTheme, tabularNums } from '@/theme';
import { Text } from './Text';

export type StreakBarbellVariant = 'sm' | 'lg';

/** Stav činky odvozený z čísel série (čisté zobrazení, žádná herní logika). */
export interface StreakBarbellState {
  kind: 'empty' | 'normal' | 'broken';
  /** Počet naložených kotoučů (0..sloty). */
  loaded: number;
  /** Dnešní slot (index `loaded`) se kreslí jako obrys `faint`: série žije, dnes ještě nic. */
  pendingSlot: boolean;
  /** Počet plných činek při přetečení (0 = bez podpisu ×K). */
  overflow: number;
  /** Spadlé kotouče přerušené série (kreslí jen `lg`). */
  fallen: number;
}

export function streakBarbellState(streak: number, longest: number, todayDone: boolean, slots: number): StreakBarbellState {
  if (streak <= 0) {
    const broken = longest >= 2;
    return { kind: broken ? 'broken' : 'empty', loaded: 0, pendingSlot: false, overflow: 0, fallen: broken ? Math.min(longest, slots) : 0 };
  }
  const over = streak > slots;
  const rem = streak % slots;
  const loaded = over ? (rem === 0 ? slots : rem) : streak;
  return { kind: 'normal', loaded, pendingSlot: !todayDone && loaded < slots, overflow: over ? Math.floor(streak / slots) : 0, fallen: 0 };
}

// Geometrie činky v pt (fyzický tvar, ne UI škála): mezera mezi objímkami, objímka, kotouč, krok.
// sm 28 × 16: 3 kotouče na stranu; lg 160 × 56: 7 na stranu, pod osou místo pro spadlé kotouče.
const GEO = {
  sm: { perSide: 3, centerGap: 2.5, collarW: 1, collarH: 8, inset: 0.5, pw: 2.5, gap: 0.75, plateH: 16, axisY: 8 },
  lg: { perSide: 7, centerGap: 12, collarW: 3, collarH: 14, inset: 2, pw: 7, gap: 2, plateH: 36, axisY: 20 },
} as const;
// Kotouče se směrem ven zmenšují o 12 % výšky na stupeň (100 / 88 / 76 …): silueta zůstane čitelná i 16 pt vysoká.
const TAPER = 0.12;
const FALLEN_W = 10;
const FALLEN_H = 4;
const FALLEN_STEP = 12;

interface Props {
  variant: StreakBarbellVariant;
  streak: number;
  longest: number;
  todayDone: boolean;
}

/** Symbol série (Teplá litina §2.7, nahrazuje plamen): každý den série = kotouč na čince,
 *  nakládá se od středu ven střídavě vlevo/vpravo. Osa a objímky `muted`, kotouče `accentGraphic`,
 *  prázdné sloty (jen lg) a dnešní čekající slot v obrysu `faint`, spadlé kotouče přerušené série `faint`.
 *  Dekorativní: popis nese pilulka / karta, která činku obaluje. */
export function StreakBarbell({ variant, streak, longest, todayDone }: Props) {
  const { c, size, stroke, material } = useTheme();
  const g = GEO[variant];
  const W = variant === 'sm' ? size.streakSmW : size.streakLgW;
  const H = variant === 'sm' ? size.streakSmH : size.streakLgH;
  const slots = g.perSide * 2;
  const s = streakBarbellState(streak, longest, todayDone, slots);
  const rx = variant === 'sm' ? material.streakPlateSm : material.streakPlateLg;
  const half = W / 2;
  const start = g.centerGap + g.collarW + g.inset;

  const slot = (i: number) => {
    const depth = Math.floor(i / 2);
    const right = i % 2 === 1;
    const h = g.plateH * (1 - TAPER * depth);
    const offset = start + depth * (g.pw + g.gap);
    const x = right ? half + offset : half - offset - g.pw;
    return { x, y: g.axisY - h / 2, h };
  };

  const plates = Array.from({ length: slots }, (_, i) => {
    const r = slot(i);
    if (i < s.loaded) return <Rect key={i} x={r.x} y={r.y} width={g.pw} height={r.h} rx={rx} fill={c.accentGraphic} />;
    const pending = s.pendingSlot && i === s.loaded;
    if (pending || variant === 'lg') {
      const sw = stroke.slot;
      return (
        <Rect key={i} x={r.x + sw / 2} y={r.y + sw / 2} width={g.pw - sw} height={r.h - sw} rx={rx}
          fill="none" stroke={c.faint} strokeWidth={sw} />
      );
    }
    return null;
  });

  const fallen = variant === 'lg' && s.kind === 'broken'
    ? Array.from({ length: s.fallen }, (_, i) => {
      // Rozkutálené pod osou: střídavě vlevo a vpravo od středu, jako by spadly z obou konců.
      const k = Math.floor(i / 2) + 1;
      const x = half + (i % 2 === 0 ? -1 : 1) * k * FALLEN_STEP - FALLEN_W / 2;
      return <Rect key={`f${i}`} x={x} y={H - FALLEN_H} width={FALLEN_W} height={FALLEN_H} rx={rx} fill={c.faint} />;
    })
    : null;

  const axis = variant === 'sm' ? stroke.streakAxis : stroke.streakAxisLg;
  return (
    <View
      style={{ flexDirection: 'row', alignItems: 'flex-end' }}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        <Line x1={0} y1={g.axisY} x2={W} y2={g.axisY} stroke={c.muted} strokeWidth={axis} strokeLinecap="round" />
        <Rect x={half - g.centerGap - g.collarW} y={g.axisY - g.collarH / 2} width={g.collarW} height={g.collarH} fill={c.muted} />
        <Rect x={half + g.centerGap} y={g.axisY - g.collarH / 2} width={g.collarW} height={g.collarH} fill={c.muted} />
        {plates}
        {fallen}
      </Svg>
      {s.overflow > 0 ? (
        <Text variant="caption" tone="accent" style={tabularNums}>{copy.streak.overflow(s.overflow)}</Text>
      ) : null}
    </View>
  );
}
