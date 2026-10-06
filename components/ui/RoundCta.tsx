import { PillButton } from './PillButton';

export interface CtaAction {
  label: string; onPress(): void; disabled?: boolean;
  /** Na akcentové ploše oslavy: plocha `onAccent`, popisek v akcentu; neaktivní = obrys `onAccent`. */
  onAccent?: boolean;
  /** Na zlaté ploše stage-up: tmavá pilulka `onSeasonGold` se světlým popiskem (hrana ≥ 3:1 v obou režimech). */
  onGold?: boolean;
}

// Inter SemiBold 16 pt ≈ 9 pt na znak: do dřívějšího kulatého CTA 88 pt se vešlo 7 znaků.
const MAX_ROUND_CHARS = 7;

/** Krátký popisek? BigActionBar podle toho dělí šířku mezi vedlejší a hlavní akci (krátké CTA = půl, dlouhé = 2/3). */
export const fitsRoundCta = (label: string): boolean => label.length <= MAX_ROUND_CHARS;

/** Hlavní CTA spodní lišty. Nothing Dot §2.3: místo kruhu pilulka 56 `[POPISEK]` na šířku buňky (obr. 1). */
export function RoundCta({ label, onPress, disabled = false, onAccent = false, onGold = false }: CtaAction) {
  return <PillButton label={label} onPress={onPress} disabled={disabled} onAccent={onAccent} onGold={onGold} />;
}
