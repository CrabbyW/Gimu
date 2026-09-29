import { useDb } from '@/store/db';

export const useHydrated = () => useDb((s) => s.hydrated);
