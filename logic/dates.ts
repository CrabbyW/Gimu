import type { ISODate } from '@/types';

const pad = (n: number) => String(n).padStart(2, '0');

export function toISODate(d: Date): ISODate {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function parseISODate(iso: ISODate): Date {
  const [y, m, d] = iso.split('-').map(Number);
  if (y === undefined || m === undefined || d === undefined || Number.isNaN(y + m + d)) {
    throw new Error(`Neplatné datum: ${iso}`);
  }
  return new Date(y, m - 1, d);
}

export function addDays(iso: ISODate, n: number): ISODate {
  const d = parseISODate(iso);
  d.setDate(d.getDate() + n);
  return toISODate(d);
}

/** Počet kalendářních dní a − b. Počítá se v UTC z data, takže DST neovlivní výsledek. */
export function diffDays(a: ISODate, b: ISODate): number {
  const ua = Date.UTC(...ymd(a)); const ub = Date.UTC(...ymd(b));
  return Math.round((ua - ub) / 86_400_000);
}

function ymd(iso: ISODate): [number, number, number] {
  const d = parseISODate(iso);
  return [d.getFullYear(), d.getMonth(), d.getDate()];
}

export function weekStart(d: Date): ISODate {
  const day = (d.getDay() + 6) % 7; // pondělí = 0
  return addDays(toISODate(d), -day);
}

export function weekEndsAt(d: Date): Date {
  return parseISODate(addDays(weekStart(d), 7));
}

export function formatCzDate(iso: ISODate): string {
  const d = parseISODate(iso);
  return `${d.getDate()}. ${d.getMonth() + 1}. ${d.getFullYear()}`;
}
