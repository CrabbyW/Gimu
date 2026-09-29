// Hodnoty podle spec §6.2. Akcent je v obou režimech stejný; jako text se v light
// režimu používá tmavší `accentText`, aby prošel kontrastem 4.5:1.
export const dark = {
  base: '#0E0D0C', surface: '#171615', raised: '#201E1C', rule: '#2C2926', text: '#EFEDE8', muted: '#8C8780',
  accent: '#FF6B35', onAccent: '#131316', accentText: '#FF6B35',
  plate5: '#6B6660', plate10: '#57534E', plate15: '#46423E', plate20: '#36332F', plate25: '#2A2724',
  plateRim: '#3A3632', plateHighlight: 'rgba(255,255,255,0.10)', danger: '#E5484D', success: '#46A758',
} as const;
export const light: Record<keyof typeof dark, string> = {
  base: '#EFEEEA', surface: '#E5E4DF', raised: '#F6F5F2', rule: '#C9C7C0', text: '#131316', muted: '#6B6B70',
  accent: '#FF6B35', onAccent: '#131316', accentText: '#C2410C',
  plate5: '#A29E97', plate10: '#7D7A74', plate15: '#5A5752', plate20: '#353331', plate25: '#131316',
  plateRim: '#8E8A83', plateHighlight: 'rgba(255,255,255,0.18)', danger: '#CE2C31', success: '#2A7E3B',
};
export type Colors = Record<keyof typeof dark, string>;
