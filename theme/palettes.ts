// R43 Chalk & Iron (docs/superpowers/specs/2026-10-03-chalk-iron-geometry-design.md). Hodnoty jsou
// spočítané v OKLCH: železo h 65° (litina, chroma ≤ 0.008), křída h 95°, světlost neutrálů
// v rovnoměrných perceptuálních krocích. Akcent = červená 25kg kotouče podle soutěžního kódu IWF,
// OKLCH(0.63 0.215 29); svítí jen v oslavě dokončení. V light se jako text používá tmavší `accentText`.
// `shadow` = tmavý inkoust pro stín uzlu a stínovou stranu kotouče.
export const dark = {
  base: '#100E0D', surface: '#181614', raised: '#201E1B', rule: '#302D2A', text: '#F0EEE9', muted: '#A09A95',
  accent: '#EF3E31', onAccent: '#181613', accentText: '#F45343',
  // Litina: plate5 L 0.53 → plate25 L 0.27 po ΔL 0.065; plate5 ještě nese křídové číslo ≥ 4.5:1.
  plate5: '#6F6B67', plate10: '#5D5955', plate15: '#4B4743', plate20: '#393633', plate25: '#292623',
  plateRim: '#403C39', plateHighlight: 'rgba(255,250,240,0.10)', plateShade: 'rgba(0,0,0,0.28)', scrim: 'rgba(16,14,13,0.72)', danger: '#EF6661', success: '#53AF65',
  shadow: '#040303',
  // Zlatý materiál jen pro SourceBadge sezónní položky a plochu stage-up oslavy (spec §6.8, §7.8).
  seasonGold: '#C6A15B', onSeasonGold: '#181613',
} as const;
// Křídový papír a železný inkoust: stejné materiály, obrácené role.
export const light: Record<keyof typeof dark, string> = {
  base: '#F1F0EB', surface: '#E8E6E0', raised: '#F9F8F5', rule: '#C9C7C0', text: '#181613', muted: '#625D58',
  accent: '#EF3E31', onAccent: '#181613', accentText: '#B71B14',
  plate5: '#A9A39E', plate10: '#918B86', plate15: '#5C5753', plate20: '#383532', plate25: '#181613',
  plateRim: '#8B8580', plateHighlight: 'rgba(255,250,240,0.18)', plateShade: 'rgba(24,22,19,0.22)', scrim: 'rgba(241,240,235,0.76)', danger: '#B32228', success: '#1D7635',
  shadow: '#181613',
  seasonGold: '#C6A15B', onSeasonGold: '#181613',
};
export type Colors = Record<keyof typeof dark, string>;
