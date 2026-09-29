import * as Haptics from 'expo-haptics';

// Haptika jen v klíčových momentech (spec §6.7). Na webu a zařízeních bez motoru
// API odmítne promise — to se tiše spolkne, haptika je jen doplněk.
const safe = (p: Promise<void>) => { p.catch(() => undefined); };

export const haptics = {
  /** Nacvaknutí kotouče: úder a po 90 ms potvrzení. */
  snap() { safe(Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)); setTimeout(() => safe(Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)), 90); },
  /** Odemčení uzlu na mapě. */
  unlock() { safe(Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)); },
  /** Konec výdrže. */
  holdDone() { safe(Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)); },
  /** Výběr v nabídce. */
  tick() { safe(Haptics.selectionAsync()); },
  /** Stage-up a narození opice. */
  success() { safe(Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)); },
};
