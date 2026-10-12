import { AccBelt } from './AccBelt';
import { AccHeadband } from './AccHeadband';
import { AccWristbands } from './AccWristbands';
import { HoodieHood, OutfitHoodie } from './OutfitHoodie';
import { OutfitScarf } from './OutfitScarf';
import { OutfitTank } from './OutfitTank';
import type { LayerPart, MascotLayer } from './types';

export { SeasonScarf } from './SeasonScarf';
export { ArmPoseContext, type LayerPart, type LayerProps, type MascotLayer } from './types';

/** Vrstvy opice podle cosmetic id (spec §8). Jen sloty outfit a accessory; ostatní sloty nejsou vrstvy opice. */
export const MASCOT_LAYERS: Partial<Record<string, MascotLayer>> = {
  'outfit-winter-arc-scarf': { anchor: 'neck', z: 'front', Component: OutfitScarf },
  'outfit-tank-ember': { anchor: 'body', z: 'front', Component: OutfitTank },
  'outfit-hoodie-chalk': { anchor: 'body', z: 'front', Component: OutfitHoodie, parts: [{ anchor: 'neck', z: 'back', Component: HoodieHood }] },
  'acc-headband': { anchor: 'head', z: 'front', Component: AccHeadband },
  'acc-wristbands': { anchor: 'hands', z: 'front', Component: AccWristbands },
  'acc-belt': { anchor: 'body', z: 'front', Component: AccBelt },
};

/** Všechny části vrstvy (hlavní + doplňkové); neznámé nebo chybějící id = žádné části. */
export const layerParts = (id: string | undefined): LayerPart[] => {
  const l = id ? MASCOT_LAYERS[id] : undefined;
  if (!l) return [];
  return [{ anchor: l.anchor, z: l.z, Component: l.Component }, ...(l.parts ?? [])];
};
