import { useMemo } from 'react';
import { View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { copy } from '@/data/copy';
import type { IdleContext } from '@/logic/mascotIdle';
import type { ReactionId } from '@/logic/mascotReactions';
import { MonkeyBack, MonkeyFront, SvgMascot } from './SvgMascot';
import { resolveMascotSize, type MascotProps } from './types';
import { useMascotIdle } from './useMascotIdle';
import type { MascotReactions } from './useMascotReactions';

/** Podržení = mazlení. Kratší dotek je ťuknutí (poskok, trojité = salto). */
const LONG_PRESS_MS = 450;

interface Props extends Omit<MascotProps, 'reaction' | 'gaze' | 'idle'> {
  /** Kontext života v klidu (`map` = smí se podívat dolů na kotouč). */
  idleContext?: IdleContext;
  /** Stav reakcí z `useMascotReactions` (obrazovka ho sdílí, aby mohla hlásit i vlastní události). */
  reactions: MascotReactions;
  /** Sedí na kotouči: dvě vrstvy (`MonkeyBack` + `MonkeyFront`), kotouč patří mezi ně (mapa). */
  seated?: boolean;
  onReaction?(id: ReactionId): void;
}

/**
 * Opička, se kterou si jde hrát (spec §4.4): ťuknutí = poskok (trojité do 600 ms = salto), podržení = mazlení,
 * tah prstu = pohled za prstem. Gesta běží souběžně se scrollem rodiče: Tap selže při pohybu, LongPress
 * se aktivuje až po podržení. Pohled za prstem čte `reactions.touch` (`Manual`, nikdy se neaktivuje), které
 * obrazovka připojí na širší plochu (celá mapa, hero profilu) — dotyky na opičce jím projdou také.
 * Pro čtečku je opička tlačítko „pohladit“ (aktivace = poskok).
 */
export function ReactiveMascot({ reactions, seated = false, onReaction, idleContext = 'default', ...mascot }: Props) {
  const { report, tap: tapNow } = reactions;
  const gesture = useMemo(() => {
    const emit = (id: ReactionId | null) => { if (id) onReaction?.(id); };
    const tap = Gesture.Tap().runOnJS(true).onEnd((_e, ok) => { if (ok) emit(tapNow()); });
    const hold = Gesture.LongPress().minDuration(LONG_PRESS_MS).runOnJS(true).onStart(() => emit(report({ type: 'longPress' })));
    return Gesture.Exclusive(hold, tap);
  }, [report, tapNow, onReaction]);
  const px = resolveMascotSize(mascot.size);
  // Život v klidu: jeden plánovač pro obě vrstvy sedící opičky (stejný klíč = synchronní pohyb).
  const idle = useMascotIdle({ context: idleContext, focused: reactions.focused, reaction: reactions.reaction, sinceInteraction: reactions.sinceInteraction });
  const shared = { ...mascot, reaction: reactions.reaction, gaze: reactions.gaze, idle };
  const label = mascot.accessibilityLabel ?? copy.mascot.label[mascot.mood];
  return (
    <GestureDetector gesture={gesture}>
      <View
        accessible
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityHint={copy.mascot.playHint}
        onAccessibilityTap={() => { tapNow(); }}
        accessibilityActions={[{ name: 'activate' }, { name: 'longpress' }]}
        onAccessibilityAction={(e) => {
          if (e.nativeEvent.actionName === 'longpress') report({ type: 'longPress' });
          else tapNow();
        }}
        style={{ width: px, height: px }}
      >
        {seated ? (
          <>
            <View pointerEvents="none" style={{ position: 'absolute', left: 0, top: 0 }}>
              <MonkeyBack {...shared} decorative />
            </View>
            <View pointerEvents="none" style={{ position: 'absolute', left: 0, top: 0 }}>
              <MonkeyFront {...shared} />
            </View>
          </>
        ) : (
          <View pointerEvents="none"><SvgMascot {...shared} decorative /></View>
        )}
      </View>
    </GestureDetector>
  );
}
