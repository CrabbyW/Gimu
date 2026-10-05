import { Platform } from 'react-native';

/** Stav Skia: na nativu je hned připravená, na webu až po načtení CanvasKit (wasm).
 *  Tečkové komponenty se přes `SkiaGuard` při `ready === false` vykreslí jako prázdný fallback. */
export const skiaState = { ready: Platform.OS !== 'web' };

/** Na webu načte CanvasKit z `public/canvaskit.wasm` (zkopírováno z balíčku canvaskit-wasm). Selhání nic neshodí. */
export async function loadSkia(): Promise<boolean> {
  if (Platform.OS !== 'web') return true;
  try {
    const { LoadSkiaWeb } = await import('@shopify/react-native-skia/lib/module/web');
    await LoadSkiaWeb({ locateFile: (file: string) => `/${file}` });
    skiaState.ready = true;
  } catch (e) {
    console.warn('[skia] CanvasKit se nenačetl, tečková grafika se vypne', e);
    skiaState.ready = false;
  }
  return skiaState.ready;
}
