import { useCallback, useState } from 'react';
import { nextGuide, type GuideId, type GuideScreen } from '@/logic/guide';
import { services } from '@/services';
import { useProfile } from './useProfile';

/** Opička průvodce: bublina pro obrazovku (nebo null) a `dismiss`, které ji schová hned a zapíše jako viděnou.
 *  Lokální `hidden` drží bublinu schovanou i během zápisu (profil se načte znovu až po revizi DB). */
export function useGuide(screen: GuideScreen): { id: GuideId | null; dismiss(): void } {
  const profile = useProfile();
  const [hidden, setHidden] = useState(false);
  const id = !hidden && profile.status === 'ready' ? nextGuide(screen, profile.data) : null;
  const dismiss = useCallback(() => {
    if (!id) return;
    setHidden(true);
    services.user.markGuideSeen(id).catch((e: unknown) => console.warn('[guide] zápis selhal', e));
  }, [id]);
  return { id, dismiss };
}
