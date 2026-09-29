import { Redirect, type Href } from 'expo-router';
import { ErrorState } from '@/components/ui/ErrorState';
import { copy } from '@/data/copy';
import { useProfile } from '@/hooks/useProfile';

// Route onboardingu vzniká až v Task 10. Do té doby ji vygenerované typed routes neznají,
// proto přetypování; Task 10 ho odstraní.
const ONBOARDING_START = '/onboarding/path' as Href;

/** Vstupní brána: s profilem na mapu, bez něj na onboarding. */
export default function Index() {
  const profile = useProfile();
  if (profile.status === 'loading') return null;
  if (profile.status === 'error') return <ErrorState what={copy.common.loadTarget.profile} onRetry={profile.retry} />;
  return <Redirect href={profile.data ? '/(tabs)' : ONBOARDING_START} />;
}
