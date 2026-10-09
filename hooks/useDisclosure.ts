import { useMemo } from 'react';
import { FEATURE_AFTER, featureOpen, lessonsDone, lessonsUntil, type Feature } from '@/logic/disclosure';
import type { UserProfile } from '@/types';
import { useProfile } from './useProfile';

export type { Feature };

/** Stav jedné funkce pro UI: otevřená, kolik lekcí zbývá, kolik je hotovo z kolika. */
export interface FeatureGate { open: boolean; left: number; done: number; need: number }

export interface Disclosure {
  /** Profil načtený; do té doby je vše „otevřené“ (tab bar nesmí bliknout zámkem při startu). */
  ready: boolean;
  gate(f: Feature): FeatureGate;
}

const OPEN: FeatureGate = { open: true, left: 0, done: 0, need: 0 };

/** Čistý výpočet (testovatelný bez renderu). Legacy = profil bez `guideSeen`: vše otevřené. */
export function disclosureOf(profile: Pick<UserProfile, 'activity' | 'guideSeen'> | null | undefined): Disclosure {
  if (!profile) return { ready: false, gate: () => OPEN };
  const legacy = !profile.guideSeen;
  const done = lessonsDone(profile.activity);
  return {
    ready: true,
    gate: (f) => {
      const open = featureOpen(f, profile.activity, legacy);
      return { open, left: open ? 0 : lessonsUntil(f, profile.activity), done: Math.min(done, FEATURE_AFTER[f]), need: FEATURE_AFTER[f] };
    },
  };
}

/** Progresivní odhalení (UX pass U4): Šatník po 2 lekcích, Liga po 3, Sezóna po 5 (`logic/disclosure`). */
export function useDisclosure(): Disclosure {
  const profile = useProfile();
  const data = profile.status === 'ready' ? profile.data : null;
  return useMemo(() => disclosureOf(data), [data]);
}
