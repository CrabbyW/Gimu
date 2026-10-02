import { services } from '@/services';
import type { CosmeticSlot } from '@/types';
import { useServiceQuery } from './useServiceQuery';

export const useWardrobe = () => useServiceQuery(() => services.cosmetics.getWardrobe(), []);

export const wardrobeActions = {
  equip: (slot: CosmeticSlot, id: string | null) => services.cosmetics.equip(slot, id),
  buy: (id: string) => services.cosmetics.acquireFromShop(id),
};
