import type { IdleContext } from '@/logic/mascotIdle';
import { SvgMascot } from './SvgMascot';
import type { MascotProps } from './types';
import { useMascotIdle } from './useMascotIdle';
import { useScreenFocused } from './useMascotReactions';

/**
 * Nehratelná opička se životem v klidu (idle repertoár) — např. vítěz na pódiu ligy. Plánovač hraje jen se
 * zaostřenou obrazovkou a mimo přehrávanou reakci (`reaction`). Omezený pohyb: jen mrkání.
 */
export function IdleMascot({ idleContext = 'default', ...props }: Omit<MascotProps, 'idle'> & { idleContext?: IdleContext }) {
  const idle = useMascotIdle({ context: idleContext, focused: useScreenFocused(), reaction: props.reaction });
  return <SvgMascot {...props} idle={idle} />;
}
