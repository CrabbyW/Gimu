import { COSMETICS } from '@/data/cosmetics';
import { BANANA_RULES } from '@/data/xp';
import { bananaBalance, canBuy, canEquip, isUnlocked, sanitizeEquipped } from '@/logic/cosmetics';
import { totalXp } from '@/logic/xp';
import { useDb } from '@/store/db';
import type { CosmeticSlot, UserProfile } from '@/types';
import type { CosmeticsService, WardrobeView } from '../contracts';
import { ownershipCtx } from './ownership';

const requireProfile = (): UserProfile => {
  const p = useDb.getState().profile;
  if (!p) throw new Error('Profile does not exist, run onboarding first.');
  return p;
};
const balanceOf = (p: UserProfile) => bananaBalance(totalXp(p.activity), p.owned, COSMETICS, BANANA_RULES.xpPerBanana);

export class MockCosmeticsService implements CosmeticsService {
  async getCatalog() { return COSMETICS; }

  async getWardrobe(): Promise<WardrobeView> {
    const p = requireProfile(); const ctx = ownershipCtx(p); const bananas = balanceOf(p);
    const equipped = sanitizeEquipped(p.equipped, COSMETICS, ctx);
    return {
      bananas, equipped,
      items: COSMETICS.map((cosmetic) => ({
        cosmetic, unlocked: isUnlocked(cosmetic, ctx), equipped: equipped[cosmetic.slot] === cosmetic.id, canBuy: canBuy(cosmetic, ctx, bananas),
      })),
    };
  }

  async equip(slot: CosmeticSlot, id: string | null) {
    const p = requireProfile();
    const equipped = { ...p.equipped };
    if (id === null) delete equipped[slot];
    else {
      const c = COSMETICS.find((x) => x.id === id);
      if (!c || c.slot !== slot || !canEquip(c, ownershipCtx(p))) throw new Error('Item cannot be equipped.');
      equipped[slot] = id;
    }
    useDb.getState().setProfile({ ...p, equipped });
  }

  // TODO(fáze 3): IAP.
  async acquireFromShop(id: string) {
    const p = requireProfile();
    const c = COSMETICS.find((x) => x.id === id);
    if (!c) throw new Error('notShop');
    const check = canBuy(c, ownershipCtx(p), balanceOf(p));
    if (check !== 'ok') throw new Error(check);
    useDb.getState().setProfile({ ...p, owned: [...p.owned, id] });
  }
}
