import { View } from 'react-native';
import { Card } from '@/components/ui/Card';
import { Text } from '@/components/ui/Text';
import { copy } from '@/data/copy';
import { useTheme } from '@/theme';

/** Vize těla jako citát (§7.6; hloubka a materiál 2026-10-03): karta `surface` s horní hranou světla,
 *  mono štítek a text v `title` (Inter 600 24) — vize je důvod, proč appka existuje, takže má váhu nadpisu,
 *  ne poznámky. Svislá linka `text` vlevo zůstává jediným ornamentem a čte se jako „citace“. */
export function DreamBodyCard({ text }: { text: string }) {
  const { c, space, stroke } = useTheme();
  return (
    <Card style={{ gap: space.m }}>
      <Text variant="label" tone="muted">{copy.progress.dreamLabel}</Text>
      <View style={{ borderLeftWidth: stroke.focus, borderLeftColor: c.text, paddingLeft: space.m }}>
        <Text variant="title" accessibilityRole="text">{text}</Text>
      </View>
    </Card>
  );
}
