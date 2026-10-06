// Nothing Dot (docs/superpowers/specs/2026-10-05-nothing-dot-redesign-design.md §2.1): monochrom bez akcentu.
// „Aktivní“ (CTA výplň, rozsvícená tečka, progres) = `text`. Barvu v UI nese jen opička.
// Starší klíče (`surface`, `raised`, `accent*`, `plate*`…) zůstávají kvůli stávajícím komponentám, mají monochromní hodnoty:
// `accent*` = `text`, `onAccent` = `onText`, `surface` = `tile`, `faint` = grafika ≥ 3:1, `dotDim` = čistě dekorativní tlumená tečka.
export const dark = {
  base: '#0B0B0C', surface: '#151517', raised: '#1C1C1F', raisedPressed: '#242428', rule: '#232326',
  // Dlaždice (obr. 2): pozadí `tile`, jediné oddělení = vlasová hrana `edge`.
  tile: '#151517', tilePressed: '#1C1C1F', edge: '#2A2A2E',
  text: '#EDEDEF', muted: '#8A8A90', faint: '#6A6A70',
  onText: '#0B0B0C',
  // Tečky: zhasnutá, tlumená (zamčené, ghost), záře aktivní (jen dark; v light se nekreslí).
  dotOff: '#2A2A2E', dotDim: '#4A4A50', glow: 'rgba(237,237,239,0.55)',
  accent: '#EDEDEF', accentPressed: '#C9C9CD', accentGraphic: '#EDEDEF', onAccent: '#0B0B0C', accentText: '#EDEDEF',
  plate5: '#8A8A90', plate10: '#646469', plate15: '#4E4E54', plate20: '#333338', plate25: '#1E1E21',
  plateRim: '#3A3A3F', plateHighlight: 'rgba(237,237,239,0.10)', plateShade: 'rgba(0,0,0,0.30)',
  scrimSoft: 'rgba(11,11,12,0.48)', scrim: 'rgba(11,11,12,0.76)', scrimDeep: 'rgba(11,11,12,0.92)',
  danger: '#EF5A5E', success: '#EDEDEF',
  shadow: '#050506',
  // Zlatý materiál jen pro SourceBadge sezónní položky a plochu stage-up oslavy (spec §6.8, §7.8).
  seasonGold: '#C6A15B', onSeasonGold: '#181613',
  // Tečky na zlaté ploše stage-up (fáze 2): zhasnutá a tlumená tečka jako tmavší tóny zlata (rozsvícená = `onSeasonGold`).
  goldDotOff: '#A88A4E', goldDotDim: '#8C7241',
} as const;
// Light (obr. 3): papírově bílá, černé tečky. Bez záře: aktivní = plná `text`.
export const light: Record<keyof typeof dark, string> = {
  base: '#F2F2EF', surface: '#FBFBF9', raised: '#FBFBF9', raisedPressed: '#E6E6E2', rule: '#DEDEDA',
  tile: '#FBFBF9', tilePressed: '#EDEDEA', edge: '#E2E2DE',
  text: '#131316', muted: '#62626A', faint: '#8A8A88',
  onText: '#F2F2EF',
  dotOff: '#DEDEDA', dotDim: '#B4B4AF', glow: 'rgba(19,19,22,0)',
  accent: '#131316', accentPressed: '#2A2A2E', accentGraphic: '#131316', onAccent: '#F2F2EF', accentText: '#131316',
  plate5: '#B4B4AF', plate10: '#8E8E8A', plate15: '#5E5E62', plate20: '#3A3A3E', plate25: '#1E1E21',
  plateRim: '#C9C9C5', plateHighlight: 'rgba(255,255,255,0.40)', plateShade: 'rgba(19,19,22,0.18)',
  scrimSoft: 'rgba(19,19,22,0.32)', scrim: 'rgba(19,19,22,0.56)', scrimDeep: 'rgba(19,19,22,0.88)',
  danger: '#C2272D', success: '#131316',
  shadow: '#CFCFCB',
  seasonGold: '#C6A15B', onSeasonGold: '#181613',
  goldDotOff: '#A88A4E', goldDotDim: '#8C7241',
};
export type Colors = Record<keyof typeof dark, string>;
