import { useProfile } from './useProfile';

/** Taby bez profilu (např. přímý odkaz po resetu) → onboarding místo nekonečného načítání (QA demo f4, bug 7). */
export function useRequireProfile(): 'loading' | 'ok' | 'missing' {
  const profile = useProfile();
  if (profile.status !== 'ready') return profile.status === 'error' ? 'ok' : 'loading';
  return profile.data ? 'ok' : 'missing';
}
