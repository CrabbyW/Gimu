import { Redirect } from 'expo-router';
import { DotLoaderScreen } from '@/components/ui/DotLoader';
import { ErrorState } from '@/components/ui/ErrorState';
import { copy } from '@/data/copy';
import { useProfile } from '@/hooks/useProfile';

/** Vstupní brána: s profilem na mapu, bez něj na onboarding. */
export default function Index() {
  const profile = useProfile();
  if (profile.status === 'loading') return <DotLoaderScreen />;
  if (profile.status === 'error') return <ErrorState what={copy.common.loadTarget.profile} onRetry={profile.retry} />;
  return <Redirect href={profile.data ? '/(tabs)' : '/onboarding/path'} />;
}
