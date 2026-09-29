import { useSettings } from '@/store/settings';

/** Jediný zdroj "teď" v appce. Dev menu posouvá čas přes devTimeOffsetMs. */
export function now(): Date {
  const offset = useSettings.getState().devTimeOffsetMs;
  // Poškozený settings blob (např. NaN z rozbité migrace) by jinak dal Invalid Date všude v appce.
  return new Date(Date.now() + (Number.isFinite(offset) ? offset : 0));
}
