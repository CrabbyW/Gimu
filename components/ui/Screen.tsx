import type { ReactNode } from 'react';
import { ScrollView, View } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';
import { useTheme } from '@/theme';

interface Props {
  /** Výchozí horní i spodní hrana. Obrazovka s BigActionBar předá ['top'] — lišta si spodní safe area odsadí sama. */
  edges?: readonly Edge[];
  scroll?: boolean;
  children?: ReactNode;
}

export function Screen({ edges = ['top', 'bottom'], scroll = false, children }: Props) {
  const { c, space } = useTheme();
  return (
    <SafeAreaView edges={edges} style={{ flex: 1, backgroundColor: c.base }}>
      {scroll ? (
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ flexGrow: 1, paddingHorizontal: space.l, paddingBottom: space.xl }}
        >
          {children}
        </ScrollView>
      ) : (
        <View style={{ flex: 1, paddingHorizontal: space.l }}>{children}</View>
      )}
    </SafeAreaView>
  );
}
