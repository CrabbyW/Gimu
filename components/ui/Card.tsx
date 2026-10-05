import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { Tile } from './Tile';

interface Props {
  children?: ReactNode;
  /** Kompaktní padding 16 (husté seznamy); výchozí 20 (`tilePad`). */
  compact?: boolean;
  /** Tónová vrstva: `surface` (výchozí, dlaždice na podkladu) nebo `raised` (o tón výš, např. vlastní hodnota). */
  tone?: 'surface' | 'raised';
  style?: StyleProp<ViewStyle>;
}

/** Karta = statická dlaždice (Nothing Dot §2.3): radius 28, `tile` + vlasová hrana `edge`, bez stínu.
 *  API zůstává kvůli stávajícím obrazovkám (fáze 2 je převede přímo na Tile). */
export function Card({ children, compact = false, tone = 'surface', style }: Props) {
  return (
    <Tile pad={compact ? 'compact' : 'default'} tone={tone === 'raised' ? 'raised' : 'tile'} style={style}>
      {children}
    </Tile>
  );
}
