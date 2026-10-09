import type { SilhouetteId } from '@/types';

/** Bod ve viewBoxu siluety (120×120, zem na y=108). */
export type Pt = readonly [number, number];
export type Joint = 'neck' | 'hip' | 'handL' | 'handR' | 'elbowL' | 'elbowR' | 'kneeL' | 'kneeR' | 'footL' | 'footR';

/** Jedna klíčová póza: střed hlavy + 10 kloubů. */
export interface Pose { head: Pt; joints: Readonly<Record<Joint, Pt>> }
/** Pohyb cviku: 2–3 klíčové pózy. t = 0 první, t = 1 poslední (viz logic/silhouette.ts). */
export interface PoseLoop { kind: 'reps' | 'hold'; keys: readonly Pose[] }

export const JOINTS: readonly Joint[] = ['neck', 'hip', 'elbowL', 'handL', 'elbowR', 'handR', 'kneeL', 'footL', 'kneeR', 'footR'];
/** Kostra: trup neck→hip, paže neck→elbow→hand, nohy hip→knee→foot. */
export const BONES: readonly (readonly [Joint, Joint])[] = [
  ['neck', 'hip'],
  ['neck', 'elbowL'], ['elbowL', 'handL'], ['neck', 'elbowR'], ['elbowR', 'handR'],
  ['hip', 'kneeL'], ['kneeL', 'footL'], ['hip', 'kneeR'], ['kneeR', 'footR'],
];

export const GROUND_Y = 108;
export const HEAD_R = 7;
/** Rozsah souřadnic, ve kterém musí ležet každý bod (výskok sahá nad 0). */
export const BOUNDS = { minX: 0, maxX: 120, minY: -10, maxY: GROUND_Y } as const;
/** Geometrie tečkové postavy (jednotky viewBoxu, ne pt): rozteč teček na kosti, poloměr, tečky země. */
export const DOT = { pitch: 5, r: 2.1, groundPitch: 6, groundR: 1 } as const;

type P = [number, number];
const pose = (head: P, neck: P, hip: P, elbowL: P, handL: P, elbowR: P, handR: P, kneeL: P, footL: P, kneeR: P, footR: P): Pose =>
  ({ head, joints: { neck, hip, elbowL, handL, elbowR, handR, kneeL, footL, kneeR, footR } });

/** Opakování = technika (nahoře / uprostřed / dole). Výdrž = poloha + jemný „dech“ (≤ 4 jednotky),
 *  žádný předstíraný pohyb. */
export const SILHOUETTES: Readonly<Record<SilhouetteId, PoseLoop>> = {
  // Plank na předloktích: lokty pod rameny; dech = pánev o kousek výš, linie zůstává rovná.
  plank: { kind: 'hold', keys: [
    pose([21,82],[30,87],[70,93],[31,106],[16,106],[33,106],[18,106],[88,99],[106,106],[88,100],[106,106]),
    pose([21,81],[30,86],[70,91],[31,106],[16,106],[33,106],[18,106],[88,98],[106,106],[88,99],[106,106])] },
  // Bok: spodní ruka pod ramenem, horní ke stropu; dech = boky drží nahoře (dříve mávala paže).
  sidePlank: { kind: 'hold', keys: [
    pose([24,68],[32,74],[68,87],[30,91],[28,108],[44,60],[52,46],[86,97],[104,106],[86,96],[104,104]),
    pose([24,66],[32,72],[68,85],[30,90],[28,108],[44,58],[52,44],[86,96],[104,106],[86,95],[104,104])] },
  // Klik: nahoře propnuté paže → půl cesty → hrudník u země, tělo celou dobu rovné.
  pushup: { kind: 'reps', keys: [
    pose([22,70],[30,76],[72,86],[30,92],[30,108],[32,92],[32,108],[90,94],[106,104],[90,95],[106,104]),
    pose([22,79],[30,84],[72,91],[36,96],[30,108],[38,96],[32,108],[90,97],[106,104],[90,98],[106,104]),
    pose([22,88],[30,92],[72,96],[40,98],[30,108],[42,98],[32,108],[90,100],[106,104],[90,100],[106,104])] },
  // Dřep: stoj → boky dozadu → dřep pod paralelu s pažemi vpřed na rovnováhu.
  squat: { kind: 'reps', keys: [
    pose([60,18],[60,28],[60,62],[52,44],[50,60],[68,44],[70,60],[56,84],[54,108],[64,84],[66,108]),
    pose([58,28],[59,38],[63,70],[50,50],[42,58],[56,50],[44,58],[52,86],[54,108],[58,86],[64,108]),
    pose([56,40],[58,50],[66,78],[46,54],[34,52],[50,56],[36,54],[46,86],[54,108],[50,88],[62,108])] },
  // Výpad: stoj v rozkroku → zadní koleno těsně nad zem, trup kolmo.
  lunge: { kind: 'reps', keys: [
    pose([60,18],[60,28],[60,62],[54,44],[54,62],[66,44],[66,62],[46,84],[40,108],[74,84],[80,108]),
    pose([60,32],[60,42],[60,76],[54,58],[54,76],[66,58],[66,76],[42,82],[40,108],[74,100],[92,108])] },
  // Hollow: bedra v zemi, ruce i nohy nad zemí; dech = drobné doladění výšky končetin.
  hollow: { kind: 'hold', keys: [
    pose([28,87],[36,91],[70,100],[23,85],[11,80],[25,86],[13,81],[88,95],[106,88],[88,96],[106,89]),
    pose([28,85],[36,90],[70,100],[22,83],[10,78],[24,85],[12,79],[88,94],[106,86],[88,95],[106,87])] },
  // Superman: leh na břiše → ruce i nohy zvednuté.
  superman: { kind: 'reps', keys: [
    pose([28,92],[36,96],[70,100],[24,92],[12,88],[26,93],[14,89],[88,98],[106,94],[88,99],[106,95]),
    pose([28,86],[36,92],[70,100],[22,86],[10,80],[24,87],[12,81],[88,96],[106,88],[88,97],[106,89])] },
  // Stoj u zdi: dlaně na zemi, tělo v linii; dech = drobná korekce chodidel u zdi.
  handstandWall: { kind: 'hold', keys: [
    pose([60,90],[60,78],[60,44],[53,93],[52,108],[67,93],[68,108],[61,26],[62,6],[63,26],[64,6]),
    pose([60,89],[60,77],[60,43],[53,92],[52,108],[67,92],[68,108],[60,25],[60,5],[62,25],[62,5])] },
  // L-sit: dlaně v zemi, nohy vodorovně; dech = nohy drží výšku (dříve kmitaly o 8).
  lsit: { kind: 'hold', keys: [
    pose([58,39],[58,49],[58,83],[48,67],[46,86],[68,67],[70,86],[76,83],[96,82],[76,84],[96,83]),
    pose([58,37],[58,47],[58,81],[48,66],[46,86],[68,66],[70,86],[76,81],[96,80],[76,82],[96,81])] },
  // Dip: propnuté paže na bradlech → lokty 90°.
  dip: { kind: 'reps', keys: [
    pose([60,20],[60,30],[60,62],[48,46],[44,62],[72,46],[76,62],[56,84],[56,104],[64,84],[64,104]),
    pose([60,34],[60,44],[60,76],[44,48],[44,62],[76,48],[76,62],[56,96],[52,108],[64,96],[68,108])] },
  // Shyb: vis → půl cesty → brada nad hrazdou.
  pullup: { kind: 'reps', keys: [
    pose([60,40],[60,50],[60,82],[44,30],[46,12],[76,30],[74,12],[56,96],[56,108],[64,96],[64,108]),
    pose([60,29],[60,39],[60,71],[43,27],[46,12],[77,27],[74,12],[56,86],[56,100],[64,86],[64,100]),
    pose([60,18],[60,28],[60,60],[42,24],[46,12],[78,24],[74,12],[56,76],[56,92],[64,76],[64,92])] },
  // Vis: aktivní lopatky; dech = tělo se o kousek zvedne stažením lopatek.
  hang: { kind: 'hold', keys: [
    pose([60,26],[60,34],[60,68],[48,20],[46,10],[72,20],[74,10],[57,86],[57,104],[63,86],[63,104]),
    pose([60,23],[60,31],[60,65],[48,18],[46,10],[72,18],[74,10],[57,83],[57,101],[63,83],[63,101])] },
  // Most: pánev ze země → nahoru do linie kolena–ramena.
  bridge: { kind: 'reps', keys: [
    pose([24,100],[32,102],[66,98],[36,106],[48,108],[38,106],[50,108],[84,88],[92,108],[84,89],[94,108]),
    pose([24,100],[32,100],[66,80],[36,106],[48,108],[38,106],[50,108],[84,78],[92,108],[84,79],[94,108])] },
  // Vrána: kolena na pažích, váha vpřed; dech = drobný přesun těžiště.
  crow: { kind: 'hold', keys: [
    pose([44,75],[50,79],[70,69],[50,92],[50,108],[58,92],[58,108],[60,86],[80,86],[64,86],[82,86]),
    pose([43,77],[49,81],[70,67],[50,93],[50,108],[58,93],[58,108],[59,85],[80,83],[63,85],[82,83])] },
  // Výskok: dřep → odraz (propnutí) → let.
  jump: { kind: 'reps', keys: [
    pose([56,40],[58,50],[66,78],[46,54],[34,52],[50,56],[36,54],[46,86],[54,108],[50,88],[62,108]),
    pose([60,18],[60,28],[60,62],[54,30],[52,14],[66,30],[68,14],[57,85],[56,108],[63,85],[64,108]),
    pose([60,8],[60,18],[60,50],[52,4],[48,-6],[68,4],[72,-6],[56,72],[56,92],[64,72],[64,92])] },
};
