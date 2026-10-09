/** Tip techniky (UX pass U1): první věta popisu cviku je vždy vidět nad [DONE], zbytek popisu zůstává v kartě.
 *  Věta končí `.`, `!` nebo `?` následovanými mezerou; bez dalšího konce je tipem celý popis. */
export function splitTip(description: string): { tip: string; rest: string } {
  const text = description.trim();
  const m = /[.!?](\s+)/.exec(text);
  if (!m) return { tip: text, rest: '' };
  const end = m.index + 1;
  return { tip: text.slice(0, end), rest: text.slice(end).trim() };
}
