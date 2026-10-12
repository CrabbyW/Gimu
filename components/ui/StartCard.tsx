import { Pressable, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { ArrowRight } from 'lucide-react-native';
import { feedback } from '@/lib/feedback';
import { motion } from '@/lib/motion';
import { opacity, stroke, useTheme } from '@/theme';
import { Text } from './Text';
import { usePressFeedback } from './usePressFeedback';

interface Props {
  /** Věta akce („Start Pull down“), Inter, hlavní řádek karty. */
  title: string;
  /** Mono řádek nad akcí („3 exercises · 20 XP“), verzálky dělá `telemetry`. */
  meta: string;
  onPress(): void;
}

/**
 * Kurogane spodní CTA mapy (maketa `kurogane.html`): jediná plná světlá plocha obrazovky (`text`),
 * vlevo mono kontext a název akce, vpravo kulatá „klávesa“ v `onText` se šipkou. Hierarchie: tohle je
 * nejsilnější prvek obrazovky, aktuální uzel nad ním nese jediný barevný akcent.
 */
export function StartCard({ title, meta, onPress }: Props) {
  const { c, space, size, radius } = useTheme();
  const press = usePressFeedback(motion.tilePress.scale);
  return (
    <Animated.View style={[{ alignSelf: 'stretch' }, press.style]}>
      <Pressable
        testID="start-card"
        onPress={onPress}
        onPressIn={() => { feedback('cta'); press.onPressIn(); }}
        onPressOut={press.onPressOut}
        accessibilityRole="button"
        accessibilityLabel={title}
        accessibilityHint={meta}
        style={({ pressed }) => ({
          minHeight: size.startCard, borderRadius: radius.tile, paddingLeft: space.l, paddingRight: space.s + space.xs,
          flexDirection: 'row', alignItems: 'center', gap: space.m, backgroundColor: pressed ? c.accentPressed : c.text,
        })}
      >
        <View style={{ flex: 1, gap: space.xs }}>
          <Text variant="telemetry" numberOfLines={1} style={{ color: c.onText, opacity: opacity.cardMeta }}>{meta}</Text>
          <Text variant="headline" numberOfLines={1} style={{ color: c.onText }}>{title}</Text>
        </View>
        <View
          importantForAccessibility="no"
          style={{ width: size.startKey, height: size.startKey, borderRadius: radius.full, backgroundColor: c.onText, alignItems: 'center', justifyContent: 'center' }}
        >
          <ArrowRight size={size.icon} color={c.text} strokeWidth={stroke.icon} />
        </View>
      </Pressable>
    </Animated.View>
  );
}
