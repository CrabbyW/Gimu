import * as Haptics from 'expo-haptics';

// Haptika jen v klíčových momentech (spec §6.7). Na webu a zařízeních bez motoru
// API odmítne promise — to se tiše spolkne, haptika je jen doplněk.
const safe = (p: Promise<void>) => { p.catch(() => undefined); };

export const haptics = {
  /** Dopad kotouče na osu (úder). Potvrzení (success) přijde až s odměnou, spec §7.3 krok 3 a 6. */
  impact() { safe(Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)); },
  /** Odemčení uzlu na mapě. */
  unlock() { safe(Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)); },
  /** Konec výdrže. */
  holdDone() { safe(Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)); },
  /** Výběr v nabídce. */
  tick() { safe(Haptics.selectionAsync()); },
  /** Odměna po dopadu kotouče, stage-up a narození opice. */
  success() { safe(Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)); },
};
