import { Platform } from 'react-native';

declare const globalThis: { CanvasKit?: unknown };

/** Stav Skia: na nativu je vždy připravená. Na webu ji načítá `index.web.js` (LoadSkiaWeb) před startem appky;
 *  když CanvasKit selže, `ready` je false a tečkové komponenty se přes `SkiaGuard` vykreslí jako prázdný fallback. */
export const skiaState = { ready: Platform.OS !== 'web' || globalThis.CanvasKit != null };
