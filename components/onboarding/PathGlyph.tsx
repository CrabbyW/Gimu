import { useTheme } from '@/theme';
import type { PathId } from '@/types';
import { DreamGlyph } from './DreamGlyph';
import { PATH_GLYPH } from './dotGlyph';

interface Props { path: PathId; /** Barva teček (`muted`, u vybrané karty `text`). */ color: string; bg?: string }

/** Tečkový glyf cesty (výseč, rovnováha, kotouč). Rozměr `size.glyph`. Dekorativní: název nese text karty. */
export function PathGlyph({ path, color }: Props) {
  const { size } = useTheme();
  return <DreamGlyph glyph={PATH_GLYPH[path]} color={color} size={size.glyph} />;
}
