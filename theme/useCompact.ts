import { useWindowDimensions } from 'react-native';
import { breakpoint } from './tokens';

/** true na displejích užších než `breakpoint.compact` (320 pt třída). */
export function useCompact(): boolean {
  const { width } = useWindowDimensions();
  return width < breakpoint.compact;
}

/** true na nízkých displejích (výška < `breakpoint.short`, 568 pt třída). */
export function useShort(): boolean {
  const { height } = useWindowDimensions();
  return height < breakpoint.short;
}
