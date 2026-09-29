import { now } from '@/lib/clock';
import { services } from '@/services';
import type { PathId } from '@/types';
import { useServiceQuery } from './useServiceQuery';

/** Cesta z profilu: volající předá `pathId` (typicky `profile.path`). */
export function useLessonPath(pathId: PathId | undefined) {
  return useServiceQuery(
    () => services.lessons.getPath(pathId as PathId, now()),
    [pathId],
    { enabled: pathId !== undefined },
  );
}
