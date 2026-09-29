import type { Colors } from './palettes';

// Přibližný jas hex barvy (#RRGGBB); na volbu mezi dvěma inkousty stačí.
const luma = (hex: string) => {
  const n = parseInt(hex.slice(1, 7), 16);
  return (0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255;
};

/** Inkoust na výplni kotouče (plateXX): kontrastnější z `text` a `base`. Světlé kotouče mají
 *  tmavé číslo, tmavé světlé, v obou schématech. */
export const inkOn = (fill: string, c: Colors) => (Math.abs(luma(c.text) - luma(fill)) >= Math.abs(luma(c.base) - luma(fill)) ? c.text : c.base);
