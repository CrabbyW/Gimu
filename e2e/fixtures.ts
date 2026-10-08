import path from 'node:path';
import { test as base } from '@playwright/test';

export { expect } from '@playwright/test';

const WASM = path.resolve(__dirname, '..', 'public', 'canvaskit.wasm');

/** Společný `test` pro všechny e2e specy.
 *  CanvasKit (8 MB wasm) se servíruje z disku: Metro statický middleware na 8081 po desítkách
 *  načtení zpomalí na desítky sekund na soubor (únik handlů v dev serveru), snímky by pak padaly na timeout.
 *  Je to tentýž soubor z `public/`, takže test pořád ověřuje skutečný build. */
export const test = base.extend<{ wasmFromDisk: void; intro: boolean; introSwitch: void }>({
  /** Intro OPICE při studeném startu je v testech vypnuté; `test.use({ intro: true })` ho zapne (flows/intro.spec.ts). */
  intro: [false, { option: true }],
  introSwitch: [
    async ({ context, intro }, use) => {
      if (!intro) await context.addInitScript('globalThis.__OPICE_NO_INTRO__ = true;');
      await use();
    },
    { auto: true },
  ],
  wasmFromDisk: [
    async ({ context }, use) => {
      await context.route('**/canvaskit.wasm', (route) =>
        route.fulfill({ path: WASM, contentType: 'application/wasm' }),
      );
      await use();
    },
    { auto: true },
  ],
});
