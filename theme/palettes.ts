// Teplá litina (docs/superpowers/specs/2026-10-03-tepla-litina-redesign-design.md §2): teplá hnědočerná
// báze, mléčná křída, jediný akcent = jantar #F2A33A (barva šálu v protisvětle), nahrazuje IWF červenou z R43.
// Akcent jen pro primární CTA, sérii, progres a oslavu. Role: `accent` výplň CTA, `accentGraphic` prstence/tečky/
// proužky/výplň progresu, `accentText` akcent jako text; v dark stejná hodnota, v light se liší kvůli kontrastu.
// `faint` jen grafika (ghost data, zamčené siluety) a jen na base/surface (na dark raised 2.8:1).
// `shadow` = tmavý inkoust pro stín uzlu a stínovou stranu kotouče.
export const dark = {
  base: '#14110E', surface: '#1D1915', raised: '#26211C', raisedPressed: '#2F2924', rule: '#332C25',
  text: '#EFE8DE', muted: '#A39A8F', faint: '#6E665D',
  accent: '#F2A33A', accentPressed: '#E8952A', accentGraphic: '#F2A33A', onAccent: '#14110E', accentText: '#F2A33A',
  // Litina: plate5 (o krok tmavší kvůli světlejší křídě textu) → plate25 L 0.27 po ΔL 0.065; plate5 ještě nese křídové číslo ≥ 4.5:1.
  plate5: '#6A6662', plate10: '#5D5955', plate15: '#4B4743', plate20: '#393633', plate25: '#292623',
  plateRim: '#403C39', plateHighlight: 'rgba(255,250,240,0.10)', plateShade: 'rgba(0,0,0,0.28)',
  scrimSoft: 'rgba(20,17,14,0.48)', scrim: 'rgba(20,17,14,0.76)', scrimDeep: 'rgba(20,17,14,0.92)',
  danger: '#E8775F', success: '#8DB580',
  shadow: '#060504',
  // Zlatý materiál jen pro SourceBadge sezónní položky a plochu stage-up oslavy (spec §6.8, §7.8).
  seasonGold: '#C6A15B', onSeasonGold: '#181613',
} as const;
// Teplý papír a litinový inkoust: stejné materiály, obrácené role. Plný jantar jen jako výplň CTA.
export const light: Record<keyof typeof dark, string> = {
  base: '#F4EEE5', surface: '#EAE2D6', raised: '#FBF7F1', raisedPressed: '#EAE2D6', rule: '#D6CCBE',
  text: '#1E1813', muted: '#6B6157', faint: '#857B6E',
  accent: '#F2A33A', accentPressed: '#E8952A', accentGraphic: '#B26A10', onAccent: '#1E1813', accentText: '#8A500C',
  plate5: '#A9A39E', plate10: '#918B86', plate15: '#5C5753', plate20: '#383532', plate25: '#181613',
  plateRim: '#8B8580', plateHighlight: 'rgba(255,250,240,0.18)', plateShade: 'rgba(24,22,19,0.22)',
  scrimSoft: 'rgba(30,24,19,0.32)', scrim: 'rgba(30,24,19,0.56)', scrimDeep: 'rgba(30,24,19,0.88)',
  danger: '#B23A22', success: '#3F6B34',
  shadow: '#181613',
  seasonGold: '#C6A15B', onSeasonGold: '#181613',
};
export type Colors = Record<keyof typeof dark, string>;
