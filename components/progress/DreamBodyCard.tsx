import { Text } from '@/components/ui/Text';
import { Tile } from '@/components/ui/Tile';
import { copy } from '@/data/copy';
import { useTheme } from '@/theme';

/** Vize těla (Nothing Dot fáze 2): dlaždice s mono štítkem `VIZE` a textem vize v `title`. Vize je důvod,
 *  proč appka existuje, proto váha nadpisu; jediné oddělení je hrana dlaždice, žádná další linka. */
export function DreamBodyCard({ text }: { text: string }) {
  const { space } = useTheme();
  return (
    <Tile style={{ gap: space.m }}>
      <Text variant="label" tone="muted" accessibilityRole="header">{copy.progress.visionLabel}</Text>
      <Text variant="title">{text}</Text>
    </Tile>
  );
}
