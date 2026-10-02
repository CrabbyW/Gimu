import { useWindowDimensions } from 'react-native';
import { breakpoint } from './tokens';

/** true na displejích užších než `breakpoint.compact` (320 pt třída). */
export function useCompact(): boolean {
  const { width } = useWindowDimensions();
  return width < breakpoint.compact;
}
