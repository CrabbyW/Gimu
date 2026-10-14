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

/** Tečky po elipse natočené o `rot` (°); `t0`–`t1` = rozsah parametru ve stupních (90 = spodní bod = vpředu). */
function dotEllipse(cx: number, cy: number, rx: number, ry: number, rot: number, t0: number, t1: number, n: number, fill: string, key: string, r: number = R): Node[] {
  const q = (rot * Math.PI) / 180;
  return Array.from({ length: n }, (_, i) => {
    const t = ((t0 + ((t1 - t0) * i) / Math.max(1, n - 1)) * Math.PI) / 180;
    const x = Math.cos(t) * rx, y = Math.sin(t) * ry;
    return <Circle key={`${key}${i}`} cx={cx + x * Math.cos(q) - y * Math.sin(q)} cy={cy + x * Math.sin(q) + y * Math.cos(q)} r={r} fill={fill} />;
  });
}
/** Kotouč činky z čela: `cols` sloupců teček po `PROP.barbell.col`, výška `h` kolem `cy`. */
function dotColumn(x: number, cy: number, h: number, cols: number, fill: string, key: string): Node[] {
  const out: Node[] = [];
  for (let c = 0; c < cols; c++) out.push(...dotLine(x + c * PROP.barbell.col, cy - h / 2, x + c * PROP.barbell.col, cy + h / 2, fill, `${key}c${c}_`, R, PROP.barbell.col + 1));
  return out;
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
    // Činka za hlavou (QA d341d87): při výrazu od ramen nad hlavu tyč nejde přes obličej; nad hlavou nic nezakrývá.
    case 'barbell': { // Tyč nad dlaněmi, kotouče z teček; vnější pravý kotouč = část 1 (nacvaknutí).
      const b = PROP.barbell;
      const l = handWorld(pose, -1), r = handWorld(pose, 1);
      const y = Math.min(l.y, r.y) - b.lift;
      const x0 = l.x - b.overhang, x1 = r.x + b.overhang;
      return [
        part('bbM', 0, 2, (l.x + r.x) / 2, y, [
          ...dotLine(x0, y, x1, y, ink.prop, 'bb', R + 0.2),
          ...dotColumn(l.x - b.inner.dx - b.col, y, b.inner.h, 2, ink.fur, 'bbLi'),
          ...dotColumn(l.x - b.outer.dx - b.col * 2, y, b.outer.h, 2, ink.fur, 'bbLo'),
          ...dotColumn(r.x + b.inner.dx - b.col, y, b.inner.h, 2, ink.fur, 'bbRi'),
        ]),
        part('bbClick', 1, 2, r.x + b.outer.dx, y, dotColumn(r.x + b.outer.dx, y, b.outer.h, 2, ink.fur, 'bbRo')),
      ];
    }
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
    case 'seatPlate': { // Kotouč pod sedem: horní obvod a spodní (přední) hrana z teček, nohy visí přes čelo.
      const k = PROP.seatPlate;
      return [
        ...dotEllipse(C, k.cy, k.rx, k.ry, 0, 0, 360 - 360 / k.dots, k.dots, ink.prop, 'spT'),
        ...dotEllipse(C, k.cy + k.h, k.rx, k.ry, 0, 0, 180, Math.round(k.dots / 2) + 1, ink.prop, 'spB'),
        ...dotLine(C - k.rx, k.cy, C - k.rx, k.cy + k.h, ink.prop, 'spL'),
        ...dotLine(C + k.rx, k.cy, C + k.rx, k.cy + k.h, ink.prop, 'spR'),
      ];
    }
    case 'pointDots': { // Tři tečky ve směru natažené paže, zmenšují se (směr k Startu).
      const h = handWorld(pose, 1);
      const j = handWorld({ ...pose, reach: pose.reach * 0.5 }, 1);
      const len = Math.hypot(h.x - j.x, h.y - j.y) || 1;
      const ux = (h.x - j.x) / len, uy = (h.y - j.y) / len;
      const g = PROP.pointDots.gap;
      return [part('pdM', 0, 1, h.x, h.y, Array.from({ length: PROP.pointDots.n }, (_, i) => (
        <Circle key={`pd${i}`} cx={h.x + ux * g * (i + 1.4)} cy={h.y + uy * g * (i + 1.4)} r={R * (1 - i * 0.22)} fill={ink.prop} />
      )))];
    }
    case 'tangle': // Zadní polovina smyček lana (za tělem).
      return PROP.tangle.loops.flatMap(([x, y, rx, ry, rot], i) => dotEllipse(x + pose.dx, y + pose.dy, rx, ry, rot, 180, 360, 9, ink.prop, `tgB${i}`));
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
    case 'towelBottle': { // Ručník přes levé rameno (na srsti světlý), lahev v levé ruce, dvě kapky potu.
      const t = PROP.towel, bt = PROP.bottle;
      const h = handWorld(pose, -1);
      const bx = h.x - bt.w / 2, by = h.y - bt.h / 2;
      const bottle = haloed(dotPoly([[bx, by], [bx + bt.w, by], [bx + bt.w, by + bt.h], [bx, by + bt.h], [bx, by]], ink.prop, 'bt', R * 0.85), ink.face, 'bt');
      return [
        ...dotLine(t.x + pose.dx, t.top + pose.dy, t.x + pose.dx, t.bottom + pose.dy, ink.face, 'twA'),
        ...dotLine(t.x + t.gap + pose.dx, t.top + pose.dy, t.x + t.gap + pose.dx, t.bottom - t.gap + pose.dy, ink.face, 'twB'),
        part('btM', 0, 2, h.x, h.y, [
          ...bottle,
          <Rect key="btn" x={h.x - bt.neck / 2} y={by - bt.neck - 2} width={bt.neck} height={bt.neck} rx={1} fill={ink.prop} />,
        ]),
        part('swM', 1, 2, PROP.sweat[0][0] + pose.dx, PROP.sweat[0][1] + pose.dy, PROP.sweat.map(([x, y], i) => (
          <Circle key={`sw${i}`} cx={x + pose.dx} cy={y + pose.dy} r={R * (1 - i * 0.2)} fill={ink.prop} />
        ))),
      ];
    }
    case 'headband': { // Ručník kolem krku: dva pruhy po hrudi (čelenka je ve vrstvě obličeje).
      const n = PROP.neckTowel;
      return ([-1, 1] as const).flatMap((side) => [
        ...dotLine(cx + side * n.dx, n.top + pose.dy, cx + side * n.dx, n.bottom + pose.dy, ink.face, `nt${side}a`),
        ...dotLine(cx + side * (n.dx + n.gap), n.top + pose.dy, cx + side * (n.dx + n.gap), n.bottom - n.gap + pose.dy, ink.face, `nt${side}b`),
      ]);
    }
    case 'watch': { // Hodinky na levém zápěstí: světlý ciferník, ručička = jediná živá tečka.
      const w = PROP.watch;
      const h = handWorld(pose, -1);
      return [
        part('wM', 0, 2, h.x, h.y, [
          <Rect key="ws" x={h.x - w.strap / 2} y={h.y - w.r - w.strap} width={w.strap} height={(w.r + w.strap) * 2} rx={w.strap / 2} fill={ink.face} />,
          <Circle key="wf" cx={h.x} cy={h.y} r={w.r} fill={ink.face} />,
          <Circle key="wr" cx={h.x} cy={h.y} r={w.r - 2.4} stroke={ink.fur} strokeWidth={1.2} fill="none" />,
        ]),
        part('wL', 1, 2, h.x, h.y, [
          <Circle key="wl" testID="mascot-prop-live" cx={h.x} cy={h.y - 2.2} r={2.2} fill={ink.live} />,
        ]),
      ];
    }
    case 'tangle': { // Přední polovina smyček (s lemem, čitelná na srsti) a volný konec lana k zemi.
      const g = PROP.tangle;
      const loops = g.loops.flatMap(([x, y, rx, ry, rot], i) => dotEllipse(x + pose.dx, y + pose.dy, rx, ry, rot, 0, 180, 10, ink.prop, `tgF${i}`));
      return [part('tgM', 0, 1, cx, cy, [...haloed(loops, ink.face, 'tgF'), ...dotPoly(g.tail, ink.prop, 'tgT')])];
    }
    case 'openBox': { // Otevřená krabice před tělem: čtverec z teček a odklopené chlopně.
      const b = PROP.openBox;
      const x0 = cx - b.w / 2, x1 = cx + b.w / 2, y0 = b.y + pose.dy, y1 = y0 + b.h;
      return [part('obM', 0, 1, cx, y1, haloed([
        ...dotPoly([[x0, y0], [x0, y1], [x1, y1], [x1, y0], [x0, y0]], ink.prop, 'ob'),
        ...dotLine(x0, y0, x0 - b.flap * 0.75, y0 - b.flap, ink.prop, 'obL').slice(1),
        ...dotLine(x1, y0, x1 + b.flap * 0.75, y0 - b.flap, ink.prop, 'obR').slice(1),
      ], ink.face, 'ob'))];
    }
    default:
      return [];
  }
}

/**
 * Vrstva obličeje: kreslí se ve skupině hlavy (souřadnice V2 bez posunu pózy), takže jde s náklonem i
 * reakcemi hlavy. Smích (obloučky nad zavřenýma očima + otevřená pusa), zatnutí (obočí + zuby), čelenka.
 */
export function propsFace(extra: PoseExtra | null, ink: PropInk, eyeCy: number): Node[] {
  const H = V2.head, E = V2.eyes;
  switch (extra) {
    case 'laugh': {
      const L = PROP.laugh, m = L.mouth;
      const arc = (x: number, key: string) => (
        <Path key={key} d={`M${x - E.rx - 1} ${eyeCy} Q${x} ${eyeCy - L.arcH * 2} ${x + E.rx + 1} ${eyeCy}`} stroke={ink.fur} strokeWidth={PROP.faceStroke} strokeLinecap="round" fill="none" />
      );
      return [
        arc(H.cx - E.dx, 'lgL'), arc(H.cx + E.dx, 'lgR'),
        <Path key="lgM" d={`M${H.cx - m.w / 2} ${m.cy} H${H.cx + m.w / 2} Q${H.cx + m.w / 2} ${m.cy + m.h} ${H.cx} ${m.cy + m.h} Q${H.cx - m.w / 2} ${m.cy + m.h} ${H.cx - m.w / 2} ${m.cy} Z`} fill={ink.fur} />,
      ];
    }
    case 'clench': {
      const b = PROP.clench.brow, t = PROP.clench.teeth;
      const by = E.cy + b.dy;
      const brow = (side: -1 | 1) => {
        const x = H.cx + side * E.dx;
        return <Path key={`cb${side}`} d={`M${x + (side * b.len) / 2} ${by} L${x - (side * b.len) / 2} ${by + b.slant}`} stroke={ink.fur} strokeWidth={PROP.faceStroke} strokeLinecap="round" />;
      };
      const tx = H.cx - t.w / 2, ty = t.cy - t.h / 2;
      return [
        brow(-1), brow(1),
        <Rect key="ct" x={tx} y={ty} width={t.w} height={t.h} rx={2} fill={ink.fur} />,
        <Path key="ctl" d={`M${tx + 2} ${t.cy} H${tx + t.w - 2} M${H.cx - t.w / 4} ${ty + 1} V${ty + t.h - 1} M${H.cx} ${ty + 1} V${ty + t.h - 1} M${H.cx + t.w / 4} ${ty + 1} V${ty + t.h - 1}`} stroke={ink.face} strokeWidth={1} />,
      ];
    }
    case 'headband': {
      const k = PROP.headband;
      const rows = Array.from({ length: k.rows }, (_, r) => {
        const y = k.y + r * k.rowGap;
        const half = Math.sqrt(H.r * H.r - (y - H.cy) ** 2) - 3;
        return dotLine(H.cx - half, y, H.cx + half, y, ink.face, `hb${r}_`, R, k.step);
      }).flat();
      return [...rows, ...k.tail.map(([x, y], i) => <Circle key={`hbt${i}`} cx={x} cy={y} r={R} fill={ink.prop} />)];
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
