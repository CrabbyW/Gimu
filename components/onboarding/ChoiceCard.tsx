import type { ReactNode } from 'react';
import { Text } from '@/components/ui/Text';
import { useTheme } from '@/theme';
import { SelectTile } from './SelectTile';

interface Props {
  title: string;
  line: string;
  selected: boolean;
  onPress(): void;
  /** Glyf vlevo; dostane barvu podle výběru (`text` / `muted`) a barvu podkladu dlaždice. */
  renderGlyph(color: string, bg: string): ReactNode;
}

/**
 * Kompaktní karta volby (onboarding, vize těla). Stejná gramatika jako `PathCard` (`SelectTile`, okraj `compact`):
 * výběr = hrana `text` + štítek VYBRÁNO, glyf `muted` → `text`. Titulek `headline` drží 7 karet na výšku
 * jednoho a půl displeje i na 320 pt.
 */
export function ChoiceCard({ title, line, selected, onPress, renderGlyph }: Props) {
  const { c } = useTheme();
  return (
    <SelectTile
      selected={selected}
      onPress={onPress}
      pad="compact"
      accessibilityLabel={`${title}. ${line}`}
      glyph={(color) => renderGlyph(color, c.tile)}
    >
      <Text variant="headline">{title}</Text>
      <Text variant="caption" tone="muted">{line}</Text>
    </SelectTile>
  );
}
