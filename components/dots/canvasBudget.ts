/**
 * Rozpočet Skia pláten (Nothing Dot fáze 2, Task 1). Chrome drží jen ~16 WebGL kontextů a nad limit zahazuje
 * nejstarší (bílé „rozbité“ plátno). Taby zůstávají připojené, proto na webu kreslí plátna jen zaostřená obrazovka.
 * Na nativu limit není.
 */
export function shouldMountCanvas(platform: string, focused: boolean): boolean {
  return platform !== 'web' || focused;
}
