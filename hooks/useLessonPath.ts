import { now } from '@/lib/clock';
import { services } from '@/services';
import type { PathId } from '@/types';
import { useServiceQuery } from './useServiceQuery';

/** Cesta z profilu: volající předá `pathId` (typicky `profile.path`). */
export function useLessonPath(pathId: PathId | undefined) {
  return useServiceQuery(
    () => {
      if (!pathId) return Promise.reject(new Error('Missing path'));
      return services.lessons.getPath(pathId, now());
    },
    [pathId],
    { enabled: pathId !== undefined },
  );
}
