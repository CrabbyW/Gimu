import { View, type StyleProp, type ViewStyle } from 'react-native';
import { Text } from './Text';

/** Prázdný stav uvnitř sekce: jedna věta `caption muted`, která říká, co se tu objeví a čím (pozvánka, ne omluva).
 *  Žádná ilustrace ani tlačítko; akci nese obrazovka. */
export function EmptyHint({ children, style }: { children: string; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={style}>
      <Text variant="caption" tone="muted">{children}</Text>
    </View>
  );
}
