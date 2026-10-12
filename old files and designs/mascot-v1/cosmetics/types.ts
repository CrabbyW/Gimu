import { createContext, type ComponentType } from 'react';
import type { SharedValue } from 'react-native-reanimated';
import type { MascotStage } from '@/types';
import type { Anchor, AnchorName } from '../anchors';

/** Vrstva kreslí v souřadnicích kotvy: tvar navržený pro stage 1 kolem (0,0), SvgMascot ho posune a zvětší. */
export type LayerProps = { anchor: Anchor; stage: MascotStage; ink: string };
export type LayerPart = { anchor: AnchorName | 'hands'; z: 'back' | 'front'; Component: ComponentType<LayerProps> };
/** Hlavní část vrstvy + případné další části na jiných kotvách (kapuce mikiny za hlavou). */
export type MascotLayer = LayerPart & { parts?: LayerPart[] };

/** Póza paží pro vrstvy na rukou: kreslí se po ose paže, takže se zvedají s celebrate. */
export const ArmPoseContext = createContext<{ raise: SharedValue<number>; upAngle: number } | null>(null);

export const anchorTransform = (a: Anchor) => `translate(${a.x} ${a.y}) scale(${a.scale})`;
