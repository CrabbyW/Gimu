import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/theme';
import { Text } from './Text';

/** Hlavička tabu v jazyce TopBaru: mono štítek názvu nad vlasovou linkou. */
export function TabHeader({ title }: { title: string }) {
  const { c, space, seasonal, size } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View
      style={{
        backgroundColor: seasonal.headerBase, paddingTop: insets.top, height: size.hitLarge + insets.top,
        paddingHorizontal: space.l, justifyContent: 'center',
        borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: c.rule,
      }}
    >
      <Text variant="label" tone="muted" accessibilityRole="header">{title.toUpperCase()}</Text>
    </View>
  );
}
