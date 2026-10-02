import { useSettings } from '@/store/settings';

/** Dev menu: posun času a override stage z nastavení (UI nesmí číst store přímo). */
export function useDevControls() {
  const offset = useSettings((s) => s.devTimeOffsetMs);
  const stage = useSettings((s) => s.stageOverride);
  const { setDevTimeOffset, setStageOverride, resetDev } = useSettings.getState();
  return { offset, stage, setDevTimeOffset, setStageOverride, resetDev };
}
