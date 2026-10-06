import type { LucideIcon } from 'lucide-react-native';
import { useState } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { feedback } from '@/lib/feedback';
import { ease, motion } from '@/lib/motion';
import { fontScale, typography as type, useTheme } from '@/theme';
import { Reveal } from './choreo';
import { StatusLine, type StatusLineProps } from './StatusLine';
import { Text } from './Text';

export interface HeaderAction { icon: LucideIcon; label: string; onPress(): void }

interface Props {
  /** Titulek obrazovky v Doto (`display` 40). Krátký: jedno až dvě slova. */
  title: string;
  /** Kulatá ikonová tlačítka 44 vpravo (obr. 2), nejvýš dvě. */
  actions?: readonly HeaderAction[];
  /** Stavový řádek nad titulkem. */
  status?: StatusLineProps;
  /** Odsadit horní safe area (výchozí ano; obrazovka v SafeAreaView předá false). */
  insetTop?: boolean;
  /** Nástup hlavičky jako první úder sledu obrazovky (`motion.screenIn.headerAt`); volající rozhodne
   *  (`useFirstShow`), výchozí stojí. */
  intro?: boolean;
  /** Titulek na jeden řádek (při přetečení se zmenší): obrazovky, kde hlavička nesmí brát výšku obsahu (mapa). */
  singleLine?: boolean;
}

const HEADER_IN = { duration: motion.screenIn.durationMs, easing: ease.out };

/** Hlavička obrazovky (spec §2.3, obr. 2): stavový řádek, pod ním Doto titulek vlevo a kulatá tlačítka vpravo.
 *  Titulek je jediný Doto prvek hlavičky; vše ostatní ustupuje (mono, `muted`). */
export function ScreenHeader({ title, actions, status, insetTop = true, intro = false, singleLine = false }: Props) {
  const { c, space, size, radius, stroke } = useTheme();
  const insets = useSafeAreaInsets();
  // Web neumí adjustsFontSizeToFit (jen zkrátí výpustkou): jednořádkový titulek tam zmenší podle změřené šířky
  // řádku a odhadu šířky znaku Doto, se stejnou spodní mezí jako nativ (`fontScale.titleMin`).
  const [rowW, setRowW] = useState(0);
  const display = type.display;
  const actionsW = actions && actions.length > 0 ? actions.length * size.iconButton + (actions.length - 1) * space.s + space.m : 0;
  const webSize = Platform.OS === 'web' && singleLine && rowW > 0
    ? Math.max(display.fontSize * fontScale.titleMin, Math.min(display.fontSize, (rowW - actionsW) / (Math.max(1, title.length) * fontScale.dotAdvance)))
    : null;
  return (
    <Reveal play={intro} delay={motion.screenIn.headerAt} rise={motion.screenIn.rise} config={HEADER_IN} style={{ paddingTop: (insetTop ? insets.top : 0) + space.s, paddingHorizontal: space.l, paddingBottom: space.m, gap: space.s }}>
      {status ? <StatusLine {...status} /> : null}
      <View onLayout={Platform.OS === 'web' && singleLine ? (e) => setRowW(e.nativeEvent.layout.width) : undefined} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.m, minHeight: size.iconButton }}>
        <Text
          variant="display"
          accessibilityRole="header"
          numberOfLines={singleLine ? 1 : 2}
          // Jednořádkový titulek se při přetečení zmenší (iOS/Android), na webu zkrátí výpustkou.
          adjustsFontSizeToFit={singleLine}
          minimumFontScale={singleLine ? fontScale.titleMin : undefined}
          style={[{ flexShrink: 1 }, webSize ? { fontSize: webSize, lineHeight: webSize * (display.lineHeight / display.fontSize) } : null]}
        >
          {title}
        </Text>
        {actions && actions.length > 0 ? (
          <View style={{ flexDirection: 'row', gap: space.s }}>
            {actions.map(({ icon: Icon, label, onPress }) => (
              <Pressable
                key={label}
                onPress={onPress}
                onPressIn={() => feedback('tapLight')}
                accessibilityRole="button"
                accessibilityLabel={label}
                style={({ pressed }) => ({
                  width: size.iconButton, height: size.iconButton, borderRadius: radius.full,
                  alignItems: 'center', justifyContent: 'center',
                  backgroundColor: pressed ? c.tilePressed : c.tile,
                  borderWidth: StyleSheet.hairlineWidth, borderColor: c.edge,
                })}
              >
                <Icon size={size.icon} color={c.text} strokeWidth={stroke.icon} />
              </Pressable>
            ))}
          </View>
        ) : null}
      </View>
    </Reveal>
  );
}
