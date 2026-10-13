/**
 * Skok opice k aktuální lekci po splashi (studený start, jednou za JS kontext).
 * Splash ohlásí `splashShown()` (opice na mapě se do skoku schová) a na konci `splashDone()`. Mapa se přihlásí
 * `subscribeIntroHop` a skok si vezme `takeIntroHop()`: platí jen jednou a jen do `graceMs` po konci splashe
 * (když po splashi následuje onboarding nebo /dev, pozdější mapa už neskáče). Návrat na tab neskáče nikdy.
 */
type Phase = 'none' | 'showing' | 'done' | 'taken';
let phase: Phase = 'none';
let doneAt = 0;
const listeners = new Set<() => void>();
const GRACE_MS = 1500;

export function splashShown(): void {
  if (phase === 'none') phase = 'showing';
}

export function splashDone(now: number = Date.now()): void {
  if (phase !== 'showing') return;
  phase = 'done';
  doneAt = now;
  listeners.forEach((l) => l());
}

/** Má se opice na mapě schovat a čekat na skok? (splash ještě běží, nebo právě skončil a skok nebyl vybrán) */
export function introHopPending(now: number = Date.now()): boolean {
  return phase === 'showing' || (phase === 'done' && now - doneAt <= GRACE_MS);
}

/** Skok teď: true jen jednou, po konci splashe a do `GRACE_MS`. */
export function takeIntroHop(now: number = Date.now()): boolean {
  if (phase !== 'done' || now - doneAt > GRACE_MS) return false;
  phase = 'taken';
  return true;
}

export function subscribeIntroHop(listener: () => void): () => void {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

/** Jen testy. */
export function resetIntroHop(): void {
  phase = 'none';
  doneAt = 0;
  listeners.clear();
}
