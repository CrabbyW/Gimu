// Hodnoty podle spec §6.2. Akcent je v obou režimech stejný; jako text se v light
// režimu používá tmavší `accentText`, aby prošel kontrastem 4.5:1.
export const dark = {
  base: '#0E0D0C', surface: '#171615', raised: '#201E1C', rule: '#2C2926', text: '#EFEDE8', muted: '#8C8780',
  accent: '#FF6B35', onAccent: '#131316', accentText: '#FF6B35',
  plate5: '#6B6660', plate10: '#57534E', plate15: '#46423E', plate20: '#36332F', plate25: '#2A2724',
  plateRim: '#3A3632', plateHighlight: 'rgba(255,255,255,0.10)', plateShade: 'rgba(0,0,0,0.28)', scrim: 'rgba(14,13,12,0.72)', danger: '#EB5E62', success: '#46A758',
  // Zlatý materiál jen pro SourceBadge sezónní položky a plochu stage-up oslavy (spec §6.8, §7.8).
  seasonGold: '#C6A15B', onSeasonGold: '#131316',
} as const;
export const light: Record<keyof typeof dark, string> = {
  base: '#EFEEEA', surface: '#E5E4DF', raised: '#F6F5F2', rule: '#C9C7C0', text: '#131316', muted: '#5E5E63',
  accent: '#FF6B35', onAccent: '#131316', accentText: '#AE3A0B',
  plate5: '#A29E97', plate10: '#8A867F', plate15: '#5A5752', plate20: '#353331', plate25: '#131316',
  plateRim: '#8E8A83', plateHighlight: 'rgba(255,255,255,0.18)', plateShade: 'rgba(19,19,22,0.22)', scrim: 'rgba(239,238,234,0.76)', danger: '#B42328', success: '#2A7E3B',
  seasonGold: '#C6A15B', onSeasonGold: '#131316',
};
export type Colors = Record<keyof typeof dark, string>;
