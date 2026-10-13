import { useEffect, useRef } from 'react';
import { Redirect, router } from 'expo-router';
import { DotLoaderScreen } from '@/components/ui/DotLoader';
import { ErrorState } from '@/components/ui/ErrorState';
import { copy } from '@/data/copy';
import { useProfile } from '@/hooks/useProfile';
import { now } from '@/lib/clock';
import { DEMO_BUILD } from '@/lib/demo';
import { services } from '@/services';

/** Vstupní brána: s profilem na mapu, bez něj na onboarding (demo build: bez profilu rovnou demo profil). */
export default function Index() {
  const profile = useProfile();
  const seeding = DEMO_BUILD && profile.status === 'ready' && !profile.data;
  const started = useRef(false);
  useEffect(() => {
    if (!seeding || started.current) return;
    started.current = true;
    // Když se demo nepovede založit, pokračuje se jako bez dema (onboarding), ne nekonečný loader.
    void services.user.loadDemo(now()).then(() => router.replace('/(tabs)'), () => router.replace('/onboarding/path'));
  }, [seeding]);
  if (profile.status === 'loading' || seeding) return <DotLoaderScreen />;
  if (profile.status === 'error') return <ErrorState what={copy.common.loadTarget.profile} onRetry={profile.retry} />;
  return <Redirect href={profile.data ? '/(tabs)' : '/onboarding/path'} />;
}
