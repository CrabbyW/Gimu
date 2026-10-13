import { Platform } from 'react-native';

/**
 * Je zařízení zjevně offline? Web: `navigator.onLine === false`. Nativ zatím neví (bez NetInfo) → false,
 * chybový stav pak ukáže obecnou chybu (zamotané lano) místo wifi.
 */
export function isOffline(): boolean {
  if (Platform.OS !== 'web') return false;
  return typeof navigator !== 'undefined' && navigator.onLine === false;
}
