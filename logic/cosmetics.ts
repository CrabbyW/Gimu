// Kosmetika (spec §7.8): odemčení, banány, nákup, nasazení.
// Milestone položky se neukládají do `owned` — jsou odvozené z pravidla (stejně jako XP z aktivity).
import type { Cosmetic, CosmeticSlot, Milestone } from '@/types';
import { isMilestoneDone } from './progress';

export interface OwnershipCtx { owned: string[]; milestones: Milestone[]; longestStreak: number }
export type BuyCheck = 'ok' | 'owned' | 'notShop' | 'insufficient';
type Equipped = Partial<Record<CosmeticSlot, string>>;

export function isUnlocked(c: Cosmetic, ctx: OwnershipCtx): boolean {
  if (c.source !== 'milestone') return ctx.owned.includes(c.id);
  const rule = c.milestoneRule;
  if (!rule) return false;
  return rule.kind === 'milestoneCompleted'
    ? ctx.milestones.filter(isMilestoneDone).length >= rule.count
    : ctx.longestStreak >= rule.days;
}

/** Banány = floor(XP / kurz) − cena vlastněných shop položek (sezónní jsou zdarma). */
export function bananaBalance(totalXp: number, owned: string[], catalog: Cosmetic[], xpPerBanana: number): number {
  const spent = catalog.filter((c) => c.source === 'shop' && owned.includes(c.id)).reduce((s, c) => s + (c.priceBananas ?? 0), 0);
  return Math.floor(totalXp / xpPerBanana) - spent;
}

export function canBuy(c: Cosmetic, ctx: OwnershipCtx, balance: number): BuyCheck {
  if (c.source !== 'shop' || c.priceBananas === undefined) return 'notShop';
  if (ctx.owned.includes(c.id)) return 'owned';
  return balance >= c.priceBananas ? 'ok' : 'insufficient';
}

export const canEquip = (c: Cosmetic | undefined, ctx: OwnershipCtx): boolean => Boolean(c && isUnlocked(c, ctx));

export function sanitizeEquipped(eq: Equipped, catalog: Cosmetic[], ctx: OwnershipCtx): Equipped {
  const out: Equipped = {};
  for (const [slot, id] of Object.entries(eq) as [CosmeticSlot, string | undefined][]) {
    const c = catalog.find((x) => x.id === id);
    if (c && c.slot === slot && isUnlocked(c, ctx)) out[slot] = c.id;
  }
  return out;
}

export function newlyUnlocked(catalog: Cosmetic[], before: OwnershipCtx, after: OwnershipCtx): string[] {
  return catalog.filter((c) => !isUnlocked(c, before) && isUnlocked(c, after)).map((c) => c.id);
}
