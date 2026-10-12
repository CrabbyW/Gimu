import { ScarfShape } from './OutfitScarf';
import type { LayerProps } from './types';

/** Sezónní vrstva Winter Arc (spec §6.3): kreslí se během sezóny vždy, nejde o equip.
 *  Když je nasazená šála jako outfit, SvgMascot sezónní vrstvu vynechá (LOG rozhodnutí 12). */
export function SeasonScarf(props: LayerProps) {
  return <ScarfShape {...props} />;
}
