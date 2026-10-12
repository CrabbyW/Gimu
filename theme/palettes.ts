// Nothing Dot (docs/superpowers/specs/2026-10-05-nothing-dot-redesign-design.md §2.1): monochrom bez akcentu.
// Barevný grading 2026-10-06 (docs/design/color-system.md): chladný grafit, neutrály OKLCH h 255 / C ≤ 0.006,
// aby teplá opička (jediná barva) vystoupila jako subjekt. Hodnoty spočítané a kontrast ověřený (WCAG 2.2 + APCA).
// „Aktivní“ (CTA výplň, rozsvícená tečka, progres) = `text`. Barvu v UI nese jen opička.
// Starší klíče (`surface`, `raised`, `accent*`, `plate*`…) zůstávají kvůli stávajícím komponentám, mají monochromní hodnoty:
// `accent*` = `text`, `onAccent` = `onText`, `surface` = `tile`, `faint` = grafika ≥ 3:1, `dotDim` = čistě dekorativní tlumená tečka.
export const dark = {
  base: '#0B0B0C', surface: '#131518', raised: '#1B1D20', raisedPressed: '#232528', rule: '#202225',
  // Dlaždice (obr. 2): pozadí `tile`, jediné oddělení = vlasová hrana `edge`.
  tile: '#131518', tilePressed: '#1B1D20', edge: '#2E3033',
  text: '#E9EBEE', muted: '#A2A5A8', faint: '#84868A',
  onText: '#0B0B0C',
  // Tečky: zhasnutá, tlumená (zamčené, ghost), záře aktivní (jen dark; v light se nekreslí).
  dotOff: '#292B2E', dotDim: '#4E5053', glow: 'rgba(233,235,238,0.55)',
  accent: '#E9EBEE', accentPressed: '#C9C9CD', accentGraphic: '#E9EBEE', onAccent: '#0B0B0C', accentText: '#E9EBEE',
  plate5: '#8A8A90', plate10: '#646469', plate15: '#4E4E54', plate20: '#333338', plate25: '#1E1E21',
  plateRim: '#3A3A3F', plateHighlight: 'rgba(237,237,239,0.10)', plateShade: 'rgba(0,0,0,0.30)',
  scrimSoft: 'rgba(11,11,12,0.48)', scrim: 'rgba(11,11,12,0.76)', scrimDeep: 'rgba(11,11,12,0.92)',
  danger: '#F66D67', success: '#E9EBEE',
  shadow: '#050506',
  // Zlatý materiál jen pro SourceBadge sezónní položky a plochu stage-up oslavy (spec §6.8, §7.8).
  seasonGold: '#C6A15B', onSeasonGold: '#181613',
  // Tečky na zlaté ploše stage-up (fáze 2): zhasnutá a tlumená tečka jako tmavší tóny zlata (rozsvícená = `onSeasonGold`).
  goldDotOff: '#A88A4E', goldDotDim: '#8C7241',
  // Popisek tmavé pilulky na zlaté ploše (výplň `onSeasonGold`): stejný v obou režimech, ~16:1.
  onGoldPill: '#F2F2EF',
  // Barevný systém 2026-10-06 (docs/design/color-system.md): hranice ovládacích prvků ≥ 3:1 (pole, přepínač,
  // segment), fokus, zakázaný stav a stavové barvy (success/warning/info jen pro stavy a data, ne jako akcent UI).
  borderStrong: '#67696C', focus: '#E9EBEE', disabled: '#535559',
  stateSuccess: '#7CCD8E', stateWarning: '#EEC05B', stateInfo: '#7BB9E5',
  // Kurogane (2026-10-12): jediný akcent mapy = signální červená, jen pro „živé“ (aktuální uzel, tečka radosti opice), < 5 % plochy.
  // Color typography 2026-10-12 (docs/design/color-typography.md): dark `live` zvednut z #E01B22 (4.07:1 na base,
  // 3.79:1 na tile) na #F0333A — „gain“ akcentu: jas ↑, sytost drží, ≥ 4.5:1 na base i tile, takže smí nést i malý text.
  live: '#F0333A',
  // Opice v2 (plná silueta): v dark negativ — světlá srst `text`, tmavý obličej, světlé oči (čte se jako tisk na černé).
  // `mascotProp` = tečkové doplňky (Zz, záblesk, hrazda), tlumené jako sekundární grafika.
  mascotFur: '#E9EBEE', mascotFace: '#3A3C40', mascotEye: '#E9EBEE', mascotProp: '#84868A',
} as const;
// Light (obr. 3): papírově bílá, černé tečky. Bez záře: aktivní = plná `text`.
export const light: Record<keyof typeof dark, string> = {
  base: '#F1F3F5', surface: '#FAFBFD', raised: '#FAFBFD', raisedPressed: '#E7EAED', rule: '#DBDEE2',
  tile: '#FAFBFD', tilePressed: '#E7EAED', edge: '#D2D4D8',
  text: '#15171A', muted: '#595B5E', faint: '#67696C',
  onText: '#F1F3F5',
  dotOff: '#D5D8DB', dotDim: '#A2A5A8', glow: 'rgba(19,19,22,0)',
  accent: '#15171A', accentPressed: '#2A2A2E', accentGraphic: '#15171A', onAccent: '#F1F3F5', accentText: '#15171A',
  plate5: '#B4B4AF', plate10: '#8E8E8A', plate15: '#5E5E62', plate20: '#3A3A3E', plate25: '#1E1E21',
  plateRim: '#C9C9C5', plateHighlight: 'rgba(255,255,255,0.40)', plateShade: 'rgba(19,19,22,0.18)',
  scrimSoft: 'rgba(19,19,22,0.32)', scrim: 'rgba(19,19,22,0.56)', scrimDeep: 'rgba(19,19,22,0.88)',
  danger: '#C2272D', success: '#15171A',
  shadow: '#CFCFCB',
  seasonGold: '#C6A15B', onSeasonGold: '#181613',
  goldDotOff: '#A88A4E', goldDotDim: '#8C7241',
  onGoldPill: '#F2F2EF',
  borderStrong: '#84868A', focus: '#15171A', disabled: '#A8ABAF',
  stateSuccess: '#145A2B', stateWarning: '#A46400', stateInfo: '#006AA0',
  live: '#D0161D',
  // Opice v2 v light = originál z reference: černá silueta, světle šedý obličej, tmavé oči.
  mascotFur: '#15171A', mascotFace: '#D5D8DB', mascotEye: '#15171A', mascotProp: '#67696C',
};
export type Colors = Record<keyof typeof dark, string>;
