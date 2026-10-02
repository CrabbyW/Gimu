// Ochrana proti „propadnutí“ druhého tapu: po navigaci z oslavy/stage-upu na mapu by tap, který přijde
// ~100 ms po prvním, dopadl na tab bar pod zavřeným modalem (QA demo f4, bug 1). Tab bar ho po krátkou dobu ignoruje.
const GUARD_MS = 600;
let until = 0;

export const markNavigation = (): void => { until = Date.now() + GUARD_MS; };
export const isNavigationGuarded = (): boolean => Date.now() < until;
