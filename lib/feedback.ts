import { fire, type HapticKind } from './haptics';
import { playSfx, type SfxName } from './sound';

/** Jednotné API odezvy (motion spec §6.3): haptika + zvuk ve stejném ticku, každé pod vlastním přepínačem.
 *  Co tu není, haptiku nemá (§2). Oslavné vzory jdou přes `play()` z `lib/haptics`. */
export type FeedbackId =
  | 'tab' | 'cta' | 'tapLight' | 'locked' | 'unlock' | 'monkeyHop'
  | 'countdown3' | 'countdown2' | 'countdown1' | 'go' | 'holdTick' | 'holdLast5' | 'holdLast4' | 'holdLast3' | 'holdLast2' | 'holdLast1' | 'holdDone'
  | 'impact' | 'xpTick' | 'seriesPlate' | 'wheelStep' | 'formError';

const MAP: Record<FeedbackId, readonly [HapticKind | null, SfxName | null]> = {
  tab: ['selection', null],
  cta: ['light', null],
  // Vizuální stisk sekundárního tlačítka: bez haptiky i zvuku, existuje kvůli jednotnému API tlačítek.
  tapLight: [null, null],
  locked: ['warning', null],
  unlock: ['rigid', 'unlock'],
  monkeyHop: ['soft', null],
  countdown3: ['light', 'tick'],
  countdown2: ['light', 'tick'],
  countdown1: ['rigid', 'tick'],
  go: ['heavy', 'plateSnap'],
  holdTick: ['soft', null],
  holdLast5: ['soft', null],
  holdLast4: ['light', null],
  holdLast3: ['light', 'tick'],
  holdLast2: ['medium', 'tick'],
  holdLast1: ['medium', 'tick'],
  holdDone: ['heavy', 'plateSnap'],
  impact: ['heavy', 'plateSnap'],
  xpTick: [null, 'tick'],
  seriesPlate: ['rigid', 'tick'],
  wheelStep: ['selection', null],
  formError: ['warning', null],
};

export function feedback(id: FeedbackId): void {
  const [h, s] = MAP[id];
  if (h) fire(h);
  if (s) playSfx(s);
}
