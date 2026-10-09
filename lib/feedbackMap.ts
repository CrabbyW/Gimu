// Mapa odezvy (elite fáze 2, spec §3): FeedbackId → [haptika, zvuk]. Čistá data, testovaná (pokrytí, existence zvuků,
// navigace bez zvuku). Gramatika: pokrok stoupá (tick → snap → unlock → success → levelUp), chyba klesá (error).
import type { HapticKind } from './haptics';
import type { SfxName } from './sound';

export type FeedbackId =
  | 'tab' | 'cta' | 'tapLight' | 'locked' | 'unlock' | 'monkeyHop'
  | 'countdown3' | 'countdown2' | 'countdown1' | 'go' | 'holdTick' | 'holdLast5' | 'holdLast4' | 'holdLast3' | 'holdLast2' | 'holdLast1' | 'holdDone'
  | 'impact' | 'xpTick' | 'seriesPlate' | 'wheelStep' | 'formError' | 'mascotTap' | 'mascotJoy'
  | 'flightStart' | 'lessonDone' | 'stageUp' | 'guideShow' | 'setupDone'
  | 'timerStart' | 'timerStop' | 'introPulse'
  | 'restTick' | 'restEnd' | 'restExtend' | 'feelSelect';

/** Navigace a ovládání: jen haptika, nikdy zvuk (zvuk je pro dění ve hře). */
export const NAVIGATION_IDS: readonly FeedbackId[] = ['tab', 'cta', 'tapLight', 'wheelStep'];

export const FEEDBACK_MAP: Record<FeedbackId, readonly [HapticKind | null, SfxName | null]> = {
  tab: ['selection', null],
  cta: ['light', null],
  // Vizuální stisk sekundárního tlačítka: bez haptiky i zvuku, existuje kvůli jednotnému API tlačítek.
  tapLight: [null, null],
  locked: ['warning', 'error'],
  unlock: ['rigid', 'unlock'],
  monkeyHop: ['soft', null],
  countdown3: ['light', 'tick'],
  countdown2: ['light', 'tick'],
  countdown1: ['rigid', 'tick'],
  go: ['heavy', 'snap'],
  holdTick: ['soft', null],
  holdLast5: ['soft', null],
  holdLast4: ['light', null],
  holdLast3: ['light', 'tick'],
  holdLast2: ['medium', 'tick'],
  holdLast1: ['medium', 'tick'],
  holdDone: ['heavy', 'snap'],
  impact: ['heavy', 'snap'],
  xpTick: [null, 'tick'],
  seriesPlate: ['rigid', 'tick'],
  wheelStep: ['selection', null],
  formError: ['warning', 'error'],
  // Reakce opičky: ťuknutí = krátký pop, salto a skok radosti = odměna.
  mascotTap: ['selection', 'pop'],
  mascotJoy: ['success', 'success'],
  // Elite fáze 1–2: let kotouče, konec lekce, stage-up, bublina průvodce, dokončení nastavení.
  flightStart: ['soft', 'swoosh'],
  lessonDone: ['success', 'success'],
  stageUp: ['success', 'levelUp'],
  guideShow: [null, 'tick'],
  setupDone: ['light', 'select'],
  // Elite fáze 5: stopky planku. Start = rozhodný úder s tikem (začíná výkon), stop = tvrdší potvrzení bez zvuku.
  timerStart: ['rigid', 'tick'],
  timerStop: ['medium', null],
  // Intro OPICE: jemný puls po rozsvícení nápisu, bez zvuku (intro je tiché).
  introPulse: ['soft', null],
  // UX pass U1: pauza mezi cviky. Poslední 3 s jemný tik (haptika jako holdLast3, zvuk tick přes sfxGate), konec
  // pauzy = výraznější úder se snapem (stejná gramatika jako konec výdrže, žádný nový WAV). +15 s = lehké potvrzení bez zvuku.
  restTick: ['soft', 'tick'],
  restEnd: ['heavy', 'snap'],
  restExtend: ['light', null],
  // UX pass U2: výběr pocitu po lekci = výběr volby (selection + select).
  feelSelect: ['selection', 'select'],
};
