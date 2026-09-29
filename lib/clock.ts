import { useSettings } from '@/store/settings';

/** Jediný zdroj "teď" v appce. Dev menu posouvá čas přes devTimeOffsetMs. */
export function now(): Date {
  return new Date(Date.now() + useSettings.getState().devTimeOffsetMs);
}
