import { useEffect, useState, type ReactNode } from 'react';
import { View } from 'react-native';
import type { Edge } from 'react-native-safe-area-context';
import { Mascot } from '@/components/mascot';
import { copy } from '@/data/copy';
import { motion } from '@/lib/motion';
import { opacity, useTheme } from '@/theme';
import { Button } from './Button';
import { Screen } from './Screen';
import { Text } from './Text';

/*
 * Jednotné stavy obrazovky (elite fáze 4, spec §4):
 * - loading = statický tečkový skeleton ve tvaru obsahu (titulek + dlaždice), ne spinner. Objeví se až po
 *   `motion.stateView.skeletonDelayMs`, takže rychlé načtení nebliká. Pulz teček dodá motion-agent.
 * - error = smutná opička + věta „co se pokazilo“ + věta „co udělat“ + [ZKUSIT ZNOVU].
 * - empty = pozvánka (co se tu objeví a čím), volitelně s akcí. `inline` = jen věta uvnitř sekce.
 */

const NO_COSMETICS = {} as const;

type Props =
  | { kind: 'loading'; edges?: readonly Edge[] }
  | {
      kind: 'error';
      /** Co se nepodařilo načíst, ve 4. pádě (`copy.common.loadTarget.*`). */
      what?: string;
      /** Vlastní zpráva (např. zamčená lekce); pak se nepřidá věta o ztrátě dat. */
      message?: string;
      actionLabel?: string;
      onRetry(): void;
      edges?: readonly Edge[];
    }
  | { kind: 'empty'; message: string; title?: string; actionLabel?: string; onAction?(): void; inline?: boolean; edges?: readonly Edge[] };

export function StateView(props: Props) {
  if (props.kind === 'loading') return <LoadingSkeleton edges={props.edges} />;
  if (props.kind === 'error') return <ErrorBody {...props} />;
  return <EmptyBody {...props} />;
}

function ErrorBody({ what, message, actionLabel, onRetry, edges }: Extract<Props, { kind: 'error' }>) {
  const { space } = useTheme();
  const title = message ?? copy.common.loadError(what ?? '');
  return (
    <Screen edges={edges}>
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'flex-start', gap: space.l }}>
        <Mascot stage={1} mood="sad" size="M" cosmetics={NO_COSMETICS} decorative breathe={false} hop={false} />
        <View style={{ gap: space.s }}>
          <Text variant="title" accessibilityRole="alert">{title}</Text>
          {message ? null : <Text tone="muted">{copy.common.loadErrorHint}</Text>}
        </View>
        <Button label={actionLabel ?? copy.common.retry} onPress={onRetry} variant="secondary" />
      </View>
    </Screen>
  );
}

function EmptyBody({ message, title, actionLabel, onAction, inline, edges }: Extract<Props, { kind: 'empty' }>) {
  const { space } = useTheme();
  if (inline) return <Text variant="caption" tone="muted">{message}</Text>;
  return (
    <Screen edges={edges}>
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'flex-start', gap: space.m }}>
        {title ? <Text variant="title">{title}</Text> : null}
        <Text tone="muted">{message}</Text>
        {actionLabel && onAction ? <Button label={actionLabel} onPress={onAction} variant="secondary" /> : null}
      </View>
    </Screen>
  );
}

/** Zpožděné zobrazení: do `ms` nic (prázdné `base`), pak obsah. */
function useDelayed(ms: number) {
  const [shown, setShown] = useState(ms <= 0);
  useEffect(() => {
    if (ms <= 0) return;
    const t = setTimeout(() => setShown(true), ms);
    return () => clearTimeout(t);
  }, [ms]);
  return shown;
}

/** Řada zhasnutých teček `dotOff` (stand-in textu). */
function DotLine({ count, dot }: { count: number; dot: number }) {
  const { c, size, radius } = useTheme();
  return (
    <View style={{ flexDirection: 'row', gap: size.dotGap, overflow: 'hidden' }}>
      {Array.from({ length: count }, (_, i) => (
        <View key={i} style={{ width: dot, height: dot, borderRadius: radius.full, backgroundColor: c.dotOff }} />
      ))}
    </View>
  );
}

function LoadingSkeleton({ edges }: { edges?: readonly Edge[] }) {
  const { c, space, size, radius } = useTheme();
  const shown = useDelayed(motion.stateView.skeletonDelayMs);
  let body: ReactNode = null;
  if (shown) {
    body = (
      <View importantForAccessibility="no-hide-descendants" accessibilityElementsHidden style={{ gap: space.l, paddingTop: space.l }}>
        {/* Titulek: dvě řady velkých teček (Doto). */}
        <View style={{ gap: space.s }}>
          <DotLine count={4} dot={size.dot} />
          <DotLine count={9} dot={size.dot} />
        </View>
        {[0, 1, 2].map((i) => (
          <View key={i} style={{ backgroundColor: c.tile, borderRadius: radius.tile, padding: space.m, gap: space.s, opacity: i === 0 ? 1 : opacity.future }}>
            <DotLine count={6} dot={size.loaderDot * 2} />
            <DotLine count={24} dot={size.loaderDot} />
          </View>
        ))}
      </View>
    );
  }
  return (
    <Screen edges={edges}>
      <View
        accessible
        accessibilityRole="progressbar"
        accessibilityLabel={copy.common.loading}
        accessibilityState={{ busy: true }}
        style={{ flex: 1 }}
      >
        {body}
      </View>
    </Screen>
  );
}
