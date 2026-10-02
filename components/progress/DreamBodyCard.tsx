import { View } from 'react-native';
import { Text } from '@/components/ui/Text';
import { copy } from '@/data/copy';
import { useTheme } from '@/theme';

/** Dream body jako citát (§7.6): Inter 20 pt v `text`, bez ozdobných uvozovek. Svislá linka `text` vlevo
 *  je jediný ornament a čte se jako „citace“; mono štítek nad ní říká, co to je. */
export function DreamBodyCard({ text }: { text: string }) {
  const { c, space, stroke } = useTheme();
  return (
    <View style={{ gap: space.s }}>
      <Text variant="label" tone="muted">{copy.progress.dreamLabel}</Text>
      <View style={{ borderLeftWidth: stroke.focus, borderLeftColor: c.text, paddingLeft: space.m }}>
        <Text variant="input" accessibilityRole="text">{text}</Text>
      </View>
    </View>
  );
}
