import { useEffect, useState } from 'react';
import { now } from '@/lib/clock';
import { useSettings } from '@/store/settings';

/** Aktuální čas (přes `lib/clock`), překreslí se každých `intervalMs` a hned po změně dev posunu času. */
export function useNow(intervalMs = 30_000): Date {
  const offset = useSettings((s) => s.devTimeOffsetMs);
  const [value, setValue] = useState(() => now());
  // Změna dev posunu: nový čas hned při renderu (odvozený stav), ne setState v efektu.
  const [seenOffset, setSeenOffset] = useState(offset);
  if (seenOffset !== offset) { setSeenOffset(offset); setValue(now()); }
  useEffect(() => {
    const id = setInterval(() => setValue(now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return value;
}
