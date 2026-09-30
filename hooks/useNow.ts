import { useEffect, useState } from 'react';
import { now } from '@/lib/clock';
import { useSettings } from '@/store/settings';

/** Aktuální čas (přes `lib/clock`), překreslí se každých `intervalMs` a hned po změně dev posunu času. */
export function useNow(intervalMs = 30_000): Date {
  const offset = useSettings((s) => s.devTimeOffsetMs);
  const [value, setValue] = useState(() => now());
  useEffect(() => {
    setValue(now());
    const id = setInterval(() => setValue(now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs, offset]);
  return value;
}
