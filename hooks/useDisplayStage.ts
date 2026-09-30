import { useSettings } from '@/store/settings';
import type { MascotStage } from '@/types';

/** Stage opice k zobrazení: dev override z nastavení, jinak skutečná. */
export function useDisplayStage(real: MascotStage): MascotStage {
  const override = useSettings((s) => s.stageOverride);
  return override ?? real;
}
