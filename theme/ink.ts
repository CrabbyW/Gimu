import type { Colors } from './palettes';

/** WCAG 2.x relativní luminance hex barvy (#RRGGBB). */
export function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const v = parseInt(hex.slice(i, i + 2), 16) / 255;
    return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  }) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** WCAG kontrastní poměr dvou hex barev. */
export function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
}

/** Inkoust na výplni kotouče (plateXX): kontrastnější z `text` a `base` podle WCAG. Světlé kotouče
 *  mají tmavé číslo, tmavé světlé, v obou schématech. */
export const inkOn = (fill: string, c: Colors) => (contrast(c.text, fill) >= contrast(c.base, fill) ? c.text : c.base);
