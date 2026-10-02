// Hodnoty podle spec §6.2, tmavá paleta přepsaná rulingem R42 na Kurogane (neutrální kov, bez
// teplého nádechu). Akcent je v obou režimech stejný a podle R42 svítí jen v oslavě dokončení;
// jako text se v light režimu používá tmavší `accentText`, aby prošel kontrastem 4.5:1.
// `shadow` = tmavý inkoust pro stín uzlu a stínovou stranu kotouče (dřív se zneužíval `onAccent`).
export const dark = {
  base: '#0B0B0C', surface: '#141416', raised: '#1C1C1F', rule: '#26262A', text: '#EDEDEF', muted: '#8A8A90',
  accent: '#FF6B35', onAccent: '#131316', accentText: '#FF6B35',
  // Monochromní ocel: plate5 je nejsvětlejší, ale ještě nese světlé číslo (text) s kontrastem ≥ 4.5:1.
  plate5: '#69696E', plate10: '#57575B', plate15: '#46464A', plate20: '#36363A', plate25: '#2A2A2D',
  plateRim: '#3C3C40', plateHighlight: 'rgba(255,255,255,0.10)', plateShade: 'rgba(0,0,0,0.28)', scrim: 'rgba(11,11,12,0.72)', danger: '#EB5E62', success: '#46A758',
  shadow: '#050506',
  // Zlatý materiál jen pro SourceBadge sezónní položky a plochu stage-up oslavy (spec §6.8, §7.8).
  seasonGold: '#C6A15B', onSeasonGold: '#131316',
} as const;
export const light: Record<keyof typeof dark, string> = {
  base: '#EFEEEA', surface: '#E5E4DF', raised: '#F6F5F2', rule: '#C9C7C0', text: '#131316', muted: '#5E5E63',
  accent: '#FF6B35', onAccent: '#131316', accentText: '#AE3A0B',
  plate5: '#A29E97', plate10: '#8A867F', plate15: '#5A5752', plate20: '#353331', plate25: '#131316',
  plateRim: '#8E8A83', plateHighlight: 'rgba(255,255,255,0.18)', plateShade: 'rgba(19,19,22,0.22)', scrim: 'rgba(239,238,234,0.76)', danger: '#B42328', success: '#2A7E3B',
  shadow: '#131316',
  seasonGold: '#C6A15B', onSeasonGold: '#131316',
};
export type Colors = Record<keyof typeof dark, string>;
