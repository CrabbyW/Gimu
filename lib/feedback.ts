import { fire } from './haptics';
import { createSfxGate } from '@/logic/sfxGate';
import { FEEDBACK_MAP, type FeedbackId } from './feedbackMap';
import { playSfx } from './sound';

export const SFX_MIN_GAP_MS = 40;

/** Jednotné API odezvy (motion spec §6.3): haptika + zvuk ve stejném ticku, každé pod vlastním přepínačem.
 *  Co tu není, haptiku nemá (§2). Oslavné vzory jdou přes `play()` z `lib/haptics`. */
export type { FeedbackId } from './feedbackMap';

/** Stejný zvuk nejvýš jednou za 40 ms (spec fáze 2 §4). */
const gate = createSfxGate(SFX_MIN_GAP_MS);

export function feedback(id: FeedbackId): void {
  const [h, s] = FEEDBACK_MAP[id];
  if (h) fire(h);
  if (s && gate.allow(s, Date.now())) playSfx(s);
}
