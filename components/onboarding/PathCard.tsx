import { Text } from '@/components/ui/Text';
import { useTheme } from '@/theme';
import type { PathMeta } from '@/types';
import { PathGlyph } from './PathGlyph';
import { SelectTile } from './SelectTile';

interface Props { path: PathMeta; selected: boolean; onPress(): void }

/** Velká karta cesty (Nothing Dot): dlaždice s tečkovým glyfem vlevo, název `title` a věta `caption muted`.
 *  Výběr = hrana `text` + štítek VYBRÁNO; glyf přejde z `muted` do `text`. */
export function PathCard({ path, selected, onPress }: Props) {
  const { c, size } = useTheme();
  return (
    <SelectTile
      selected={selected}
      onPress={onPress}
      accessibilityLabel={`${path.name}. ${path.tagline}`}
      glyph={<PathGlyph path={path.id} color={selected ? c.text : c.muted} />}
    >
      <Text variant="title" style={{ minHeight: size.hit / 2 }}>{path.name}</Text>
      <Text variant="caption" tone="muted">{path.tagline}</Text>
    </SelectTile>
  );
}
