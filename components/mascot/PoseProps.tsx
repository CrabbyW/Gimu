import type { ReactElement } from 'react';
import { Circle, Ellipse, Path, Rect } from 'react-native-svg';
import type { MascotPose, PoseExtra } from '@/logic/mascotPoses';
import { handWorld, PROP, V2 } from './monkeyGeometry';
import { PropPart } from './PropMotion';

/**
 * Rekvizity 22 póz z reference `opice-v2-pozy.png` jako samostatné vrstvy z teček a čar (statické, design-agent).
 * Barvy jen z inkoustu opice (theme): `prop` = tečková grafika vedle postavy, `face` = rekvizita na hrudi
 * (světlá na srsti, stejně jako obličej), `fur` = pevná hmota (hrana, schody), `live` = jediná červená
 * (jen kde je červená v referenci: loader, varování, zvonek, plamen).
 * Souřadnice ve viewBoxu 200; geometrie v `monkeyGeometry.PROP`. Pohyblivé části obaluje `PropPart`
 * (motion-agent, worklet `propPart` v `lib/poseMotion`): index části = její role v pohybu pózy.
 */
export interface PropInk { fur: string; face: string; prop: string; live: string }

type Node = ReactElement;
const R = PROP.dot;

/** Tečky po úsečce (včetně konců), rozestup ≈ `step`. */
function dotLine(x1: number, y1: number, x2: number, y2: number, fill: string, key: string, r: number = R, step: number = PROP.step): Node[] {
  const n = Math.max(1, Math.round(Math.hypot(x2 - x1, y2 - y1) / step));
  const out: Node[] = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    out.push(<Circle key={`${key}${i}`} cx={x1 + (x2 - x1) * t} cy={y1 + (y2 - y1) * t} r={r} fill={fill} />);
  }
  return out;
}
/** Tečky po lomené čáře (body bez zdvojení v kloubech). */
function dotPoly(pts: readonly (readonly [number, number])[], fill: string, key: string, r: number = R): Node[] {
  return pts.slice(1).flatMap(([x, y], i) => {
    const [px, py] = pts[i]!;
    return dotLine(px, py, x, y, fill, `${key}${i}_`, r).slice(i === 0 ? 0 : 1);
  });
}
/** Tečky s lemem barvy obličeje: tečkovaná rekvizita před postavou je čitelná na srsti i na pozadí. */
function haloed(nodes: Node[], halo: string, key: string): Node[] {
  const rim = nodes.map((n, i) => {
    const p = n.props as { cx: number; cy: number; r: number };
    return <Circle key={`${key}h${i}`} cx={p.cx} cy={p.cy} r={p.r + PROP.halo} fill={halo} />;
  });
  return [...rim, ...nodes];
}
/** Tečky po oblouku (úhly ve stupních SVG: 0 = vpravo, 90 = dolů). */
function dotArc(cx: number, cy: number, rad: number, a0: number, a1: number, n: number, fill: string, key: string, r: number = R): Node[] {
  const out: Node[] = [];
  for (let i = 0; i < n; i++) {
    const a = ((a0 + ((a1 - a0) * i) / Math.max(1, n - 1)) * Math.PI) / 180;
    out.push(<Circle key={`${key}${i}`} cx={cx + Math.cos(a) * rad} cy={cy + Math.sin(a) * rad} r={r} fill={fill} />);
  }
  return out;
}
/** Šipka (plný trojúhelník) na konci oblouku ve směru po směru hodin. */
function arrowHead(cx: number, cy: number, rad: number, deg: number, fill: string, key: string): Node {
  const a = (deg * Math.PI) / 180;
  const x = cx + Math.cos(a) * rad, y = cy + Math.sin(a) * rad;
  const tx = -Math.sin(a), ty = Math.cos(a);
  const nx = Math.cos(a), ny = Math.sin(a);
  const s = PROP.arrow;
  const d = `M${x + tx * s} ${y + ty * s} L${x - tx * s * 0.4 + nx * s * 0.8} ${y - ty * s * 0.4 + ny * s * 0.8} L${x - tx * s * 0.4 - nx * s * 0.8} ${y - ty * s * 0.4 - ny * s * 0.8} Z`;
  return <Path key={key} d={d} fill={fill} />;
}
/** Lupa: dvojitý tah (světlý lem pod tmavým), aby byla vidět na srsti i na obličeji. */
/** Jedna pohyblivá část (index `i` z `n`) s pivotem (cx, cy). */
const part = (key: string, i: number, n: number, cx: number, cy: number, nodes: Node[]): Node => (
  <PropPart key={key} i={i} n={n} cx={cx} cy={cy}>{nodes}</PropPart>
);
/** Každá tečka zvlášť (kreslení po tečkách, vlna po kruhu): pivot = střed tečky. */
const perDot = (nodes: Node[], key: string): Node[] => nodes.map((d, i) => {
  const q = d.props as { cx: number; cy: number };
  return part(`${key}p${i}`, i, nodes.length, q.cx, q.cy, [d]);
});

function loupe(cx: number, cy: number, r: number, hx: number, hy: number, ink: PropInk, key: string): Node[] {
  const a = Math.atan2(hy - cy, hx - cx);
  const sx = cx + Math.cos(a) * r, sy = cy + Math.sin(a) * r;
  const handle = `M${sx} ${sy} L${hx} ${hy}`;
  return [
    <Path key={`${key}hl`} d={handle} stroke={ink.face} strokeWidth={PROP.loupe.handle + 3} strokeLinecap="round" />,
    <Circle key={`${key}rl`} cx={cx} cy={cy} r={r} stroke={ink.face} strokeWidth={PROP.loupe.ring + 3} fill="none" />,
    <Path key={`${key}h`} d={handle} stroke={ink.fur} strokeWidth={PROP.loupe.handle} strokeLinecap="round" />,
    <Circle key={`${key}r`} cx={cx} cy={cy} r={r} stroke={ink.fur} strokeWidth={PROP.loupe.ring} fill="none" />,
  ];
}

/** Vrstva za postavou (tečkové kruhy, značky vedle těla, schody). */
export function propsBack(extra: PoseExtra | null, pose: MascotPose, ink: PropInk): Node[] {
  const C = PROP.center;
  switch (extra) {
    case 'ring': // Loader: 12 teček kolem hlavy, horní živá.
      return [part('ringM', 0, 1, C, C, Array.from({ length: 12 }, (_, i) => {
        const a = ((i * 30 - 90) * Math.PI) / 180;
        return <Circle key={`ring${i}`} testID={i === 0 ? 'mascot-prop-live' : undefined} cx={C + Math.cos(a) * PROP.ring} cy={C + Math.sin(a) * PROP.ring} r={PROP.ringDot} fill={i === 0 ? ink.live : ink.prop} />;
      }))];
    case 'syncArrows': // Dva tečkované oblouky se šipkami po směru hodin (obíhají jako celek).
      return [part('saM', 0, 1, C, C, [
        ...dotArc(C, C, PROP.ring, 205, 318, 9, ink.prop, 'sa'), arrowHead(C, C, PROP.ring, 330, ink.prop, 'sah'),
        ...dotArc(C, C, PROP.ring, 25, 138, 9, ink.prop, 'sb'), arrowHead(C, C, PROP.ring, 150, ink.prop, 'sbh'),
      ])];
    case 'avatarRing':
      return perDot(dotArc(C, C, PROP.avatar, 0, 360 - 360 / 44, 44, ink.prop, 'av'), 'av');
    case 'hourglass': {
      const { x, top, bottom, half } = PROP.hourglass;
      return [part('hgM', 0, 1, x, (top + bottom) / 2, dotPoly([[x - half, top], [x + half, top], [x - half, bottom], [x + half, bottom], [x - half, top]], ink.prop, 'hg'))];
    }
    case 'check':
      return perDot(dotPoly([[140, 158], [152, 172], [180, 136]], ink.prop, 'ck'), 'ck');
    case 'cross':
      return perDot([...dotLine(142, 140, 176, 174, ink.prop, 'xa'), ...dotLine(176, 140, 142, 174, ink.prop, 'xb')], 'x');
    case 'flame': {
      const f = PROP.flame;
      return [
        part('flM', 0, 2, f.x, f.y + 20, dotPoly(f.outline.map(([x, y]) => [f.x + x, f.y + y] as const), ink.prop, 'fl')),
        part('flL', 1, 2, f.x, f.y + f.liveDy, [<Circle key="flLive" testID="mascot-prop-live" cx={f.x} cy={f.y + f.liveDy} r={PROP.liveDot} fill={ink.live} />]),
      ];
    }
    case 'stairs':
      return PROP.stairs.map(([x, y, w], i) => <Rect key={`st${i}`} x={x} y={y} width={w} height={PROP.stairH} rx={PROP.stairRx} fill={ink.fur} />);
    case 'rope': {
      const h = handWorld(pose, 1);
      return [part('rpM', 0, 1, h.x, h.y, dotLine(h.x + 6, h.y, 196, h.y, ink.prop, 'rp'))];
    }
    default:
      return [];
  }
}

/** Vrstva před postavou (rekvizity v rukou a na hrudi, hrana, lupy). */
export function propsFront(extra: PoseExtra | null, pose: MascotPose, ink: PropInk): Node[] {
  // Střed hrudi ve světových souřadnicích (pózy s rekvizitou na hrudi stojí rovně, body = 0).
  const cx = V2.hip.x + pose.dx;
  const cy = V2.torso.y + V2.torso.h / 2 + pose.dy + 2;
  const eyeY = V2.eyes.cy + pose.dy + pose.head.dy;
  switch (extra) {
    case 'ledge': {
      const L = PROP.ledge;
      return [
        <Rect key="lg" x={L.x} y={L.y} width={L.w} height={L.h} rx={L.h / 2} fill={ink.fur} />,
        // Pokrok: podklad 6 teček, plné tečky jako překryv (pohyb je plní dokola, staticky 4 ze 6).
        ...Array.from({ length: 6 }, (_, i) => (
          <Circle key={`lgd${i}`} cx={L.x + 20 + i * L.dotGap} cy={L.y + L.h + 12} r={L.dot} fill={ink.prop} />
        )),
        ...Array.from({ length: 6 }, (_, i) => part(`lgf${i}`, i, 6, L.x + 20 + i * L.dotGap, L.y + L.h + 12, [
          <Circle key={`lgf${i}c`} cx={L.x + 20 + i * L.dotGap} cy={L.y + L.h + 12} r={L.dot} fill={ink.fur} />,
        ])),
      ];
    }
    case 'triangle': {
      const t = PROP.triangle;
      const ty = cy + t.dy;
      return [
        ...haloed(dotPoly([[cx, ty - t.h / 2], [cx + t.w / 2, ty + t.h / 2], [cx - t.w / 2, ty + t.h / 2], [cx, ty - t.h / 2]], ink.prop, 'tr'), ink.face, 'tr'),
        part('exM', 0, 1, cx, ty + 4, [
          ...dotLine(cx, ty - 6, cx, ty + 6, ink.live, 'ex', PROP.liveDot * 0.62, 4),
          <Circle key="exd" testID="mascot-prop-live" cx={cx} cy={ty + 13} r={PROP.liveDot * 0.62} fill={ink.live} />,
        ]),
      ];
    }
    case 'wifiOff': {
      const w = PROP.wifi;
      const x = cx + w.dx, y = cy + w.dy;
      return [
        part('wfM0', 0, 4, x, y, [<Circle key="wf0" cx={x} cy={y} r={R + 0.6} fill={ink.prop} />]),
        ...w.arcs.map((r, i) => part(`wfM${i + 1}`, i + 1, 4, x, y, dotArc(x, y, r, 225, 315, 4 + i * 2, ink.prop, `wf${i + 1}`))),
        ...dotLine(x - w.slash, y + 4, x + w.slash, y - w.slash * 1.5, ink.fur, 'wfs', R + 0.4),
      ];
    }
    case 'emptyBox': {
      const b = PROP.box;
      const x = cx - b.s / 2;
      return haloed(dotPoly([[x, b.y], [x + b.s, b.y], [x + b.s, b.y + b.s], [x, b.y + b.s], [x, b.y]], ink.prop, 'bx'), ink.face, 'bx');
    }
    case 'loupe': {
      const lx = V2.head.cx + V2.eyes.dx + pose.dx;
      return [part('lpM', 0, 1, lx, eyeY, loupe(lx, eyeY, PROP.loupe.small, 140 + pose.dx, 98 + pose.dy, ink, 'lp'))];
    }
    case 'bigLoupe': {
      const lx = V2.head.cx + V2.eyes.dx + 4 + pose.dx;
      return [part('blM', 0, 1, lx, eyeY - 2, loupe(lx, eyeY - 2, PROP.loupe.big, 130 + pose.dx, 118 + pose.dy, ink, 'bl'))];
    }
    case 'bell': {
      const s = PROP.chest;
      return [
        part('bellM', 0, 2, cx, cy - s, [
        <Path key="bell"d={`M${cx - s} ${cy + s * 0.6} C${cx - s} ${cy - s * 0.6} ${cx - s * 0.6} ${cy - s} ${cx} ${cy - s} C${cx + s * 0.6} ${cy - s} ${cx + s} ${cy - s * 0.6} ${cx + s} ${cy + s * 0.6} L${cx + s * 1.25} ${cy + s * 0.95} L${cx - s * 1.25} ${cy + s * 0.95} Z`} fill={ink.face} />,
        <Circle key="bellc" cx={cx} cy={cy + s * 1.25} r={s * 0.25} fill={ink.face} />,
        ]),
        part('bellL', 1, 2, cx + s * 0.8, cy - s * 0.85, [
          <Circle key="belll" testID="mascot-prop-live" cx={cx + s * 0.8} cy={cy - s * 0.85} r={PROP.liveDot} fill={ink.live} />,
        ]),
      ];
    }
    case 'gear': {
      const s = PROP.chest;
      return [part('gM', 0, 1, cx, cy, [
        ...dotArc(cx, cy, s * 1.05, 0, 315, 8, ink.face, 'gt', s * 0.32),
        <Circle key="gb" cx={cx} cy={cy} r={s * 0.85} fill={ink.face} />,
        <Circle key="gh" cx={cx} cy={cy} r={s * 0.32} fill={ink.fur} />,
      ])];
    }
    case 'padlock': {
      const s = PROP.chest;
      return [part('pM', 0, 1, cx, cy - s * 0.65, [
        <Path key="ps"d={`M${cx - s * 0.62} ${cy - s * 0.2} V${cy - s * 0.65} A${s * 0.62} ${s * 0.62} 0 0 1 ${cx + s * 0.62} ${cy - s * 0.65} V${cy - s * 0.2}`} stroke={ink.face} strokeWidth={s * 0.3} fill="none" />,
        <Rect key="pb" x={cx - s} y={cy - s * 0.25} width={s * 2} height={s * 1.55} rx={s * 0.3} fill={ink.face} />,
        <Circle key="pk" cx={cx} cy={cy + s * 0.35} r={s * 0.22} fill={ink.fur} />,
        <Rect key="pk2" x={cx - s * 0.08} y={cy + s * 0.35} width={s * 0.16} height={s * 0.5} fill={ink.fur} />,
      ])];
    }
    case 'cup': {
      const s = PROP.chest;
      return [part('cM', 0, 1, cx, cy, [
        <Path key="cb"d={`M${cx - s} ${cy - s} H${cx + s} V${cy - s * 0.3} C${cx + s} ${cy + s * 0.45} ${cx + s * 0.45} ${cy + s * 0.7} ${cx} ${cy + s * 0.7} C${cx - s * 0.45} ${cy + s * 0.7} ${cx - s} ${cy + s * 0.45} ${cx - s} ${cy - s * 0.3} Z`} fill={ink.face} />,
        <Path key="ch" d={`M${cx - s} ${cy - s * 0.75} H${cx - s * 1.45} V${cy - s * 0.3} Q${cx - s * 1.45} ${cy + s * 0.15} ${cx - s * 0.8} ${cy + s * 0.25} M${cx + s} ${cy - s * 0.75} H${cx + s * 1.45} V${cy - s * 0.3} Q${cx + s * 1.45} ${cy + s * 0.15} ${cx + s * 0.8} ${cy + s * 0.25}`} stroke={ink.face} strokeWidth={s * 0.22} fill="none" strokeLinejoin="round" />,
        <Rect key="cs" x={cx - s * 0.15} y={cy + s * 0.6} width={s * 0.3} height={s * 0.5} fill={ink.face} />,
        <Rect key="cf" x={cx - s * 0.65} y={cy + s * 1.05} width={s * 1.3} height={s * 0.3} rx={s * 0.1} fill={ink.face} />,
      ])];
    }
    case 'medal': {
      const s = PROP.chest;
      const top = V2.neck.y + pose.dy - 2;
      return [part('mM', 0, 1, cx, top, [
        <Path key="mr"d={`M${cx - s * 0.9} ${top} L${cx} ${cy} L${cx + s * 0.9} ${top}`} stroke={ink.face} strokeWidth={s * 0.3} fill="none" strokeLinejoin="round" strokeLinecap="round" />,
        <Circle key="md" cx={cx} cy={cy + s * 0.55} r={s * 0.85} fill={ink.face} />,
        <Circle key="mi" cx={cx} cy={cy + s * 0.55} r={s * 0.5} stroke={ink.fur} strokeWidth={1.2} fill="none" />,
      ])];
    }
    default:
      return [];
  }
}

/** Busta (profil): široká ramena místo trupu, ořez dělá `clipY` pózy. */
export function bustShape(ink: PropInk): Node {
  const b = PROP.bust;
  return <Ellipse key="bust" cx={V2.hip.x} cy={b.cy} rx={b.rx} ry={b.ry} fill={ink.fur} />;
}
