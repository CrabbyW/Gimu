import { useMemo } from 'react';
import { View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { copy } from '@/data/copy';
import type { IdleContext } from '@/logic/mascotIdle';
import type { ReactionId } from '@/logic/mascotReactions';
import { eventToRepertoire, tapZone } from '@/logic/mascotRepertoire';
import { MonkeyBack, MonkeyFront, SvgMascot } from './SvgMascot';
import { resolveMascotSize, type MascotProps } from './types';
import { useMascotIdle } from './useMascotIdle';
import type { MascotReactions } from './useMascotReactions';
import type { MascotActs } from './useMascotAct';

/** Podržení = mazlení. Kratší dotek je ťuknutí (poskok, trojité = salto). */
const LONG_PRESS_MS = 450;

interface Props extends Omit<MascotProps, 'reaction' | 'gaze' | 'idle' | 'act'> {
  /** Akce repertoáru obrazovky (`useMascotAct`): ťuk na hlavu / břicho, vis na prstu; běžící akce vypne drobný idle. */
  acts?: MascotActs;
  /** Kontext života v klidu (`map` = smí se podívat dolů na kotouč). */
  idleContext?: IdleContext;
  /** Stav reakcí z `useMascotReactions` (obrazovka ho sdílí, aby mohla hlásit i vlastní události). */
  reactions: MascotReactions;
  /** Sedí na kotouči: dvě vrstvy (`MonkeyBack` + `MonkeyFront`), kotouč patří mezi ně (mapa). */
  seated?: boolean;
  onReaction?(id: ReactionId): void;
  /** Každé ťuknutí na opičku (i přes čtečku), bez ohledu na cooldown reakcí: replika opičky (elite fáze 3). */
  onTap?(): void;
}

/**
 * Opička, se kterou si jde hrát (spec §4.4): ťuknutí = poskok (trojité do 600 ms = salto), podržení = mazlení,
 * tah prstu = pohled za prstem. Gesta běží souběžně se scrollem rodiče: Tap selže při pohybu, LongPress
 * se aktivuje až po podržení. Pohled za prstem čte `reactions.touch` (`Manual`, nikdy se neaktivuje), které
 * obrazovka připojí na širší plochu (celá mapa, hero profilu) — dotyky na opičce jím projdou také.
 * Pro čtečku je opička tlačítko „pohladit“ (aktivace = poskok).
 */
export function ReactiveMascot({ reactions, acts, seated = false, onReaction, onTap, idleContext = 'default', ...mascot }: Props) {
  const { report, tap: tapNow } = reactions;
  const px = resolveMascotSize(mascot.size);
  const play = acts?.play;
  // Ťuknutí: série ťuknutí dál dává salto (logic/mascotReactions); jednotlivé ťuknutí s repertoárem = akce zóny
  // (`tapZone`: hlava → zatřese hlavou, břicho → nic) místo obyčejného poskoku.
  const tapAt = useMemo(() => (y: number): ReactionId | null => {
    if (!play) return tapNow();
    const r = report({ type: 'tap', at: Date.now() }, { quietHop: true });
    if (r === 'hop') {
      const id = eventToRepertoire({ type: 'tapZone', zone: tapZone(px > 0 ? y / px : 0) });
      if (id) play(id);
    }
    return r;
  }, [play, report, tapNow, px]);
  const gesture = useMemo(() => {
    const emit = (id: ReactionId | null) => { if (id) onReaction?.(id); };
    const tap = Gesture.Tap().runOnJS(true).onEnd((e, ok) => { if (ok) { emit(tapAt(e.y)); onTap?.(); } });
    const hold = Gesture.LongPress().minDuration(LONG_PRESS_MS).runOnJS(true).onStart(() => emit(report({ type: 'longPress' })));
    const base = Gesture.Exclusive(hold, tap);
    if (!play) return base;
    // Dlouhý stisk s tahem: opička se chytí prstu a visí (`hangFinger`), nahradí mazlení.
    const drag = Gesture.Pan().activateAfterLongPress(LONG_PRESS_MS).runOnJS(true).onStart(() => {
      const id = eventToRepertoire({ type: 'longPressDrag' });
      if (id) play(id);
    });
    return Gesture.Simultaneous(base, drag);
  }, [report, tapAt, play, onReaction, onTap]);
  // Život v klidu: jeden plánovač pro obě vrstvy sedící opičky (stejný klíč = synchronní pohyb). Během akce
  // repertoáru stojí (jedna akce najednou).
  const act = acts?.act ?? null;
  const idle = useMascotIdle({ context: idleContext, focused: reactions.focused, reaction: reactions.reaction, sinceInteraction: reactions.sinceInteraction, enabled: act === null });
  const shared = { ...mascot, reaction: reactions.reaction, gaze: reactions.gaze, idle, act };
  const label = mascot.accessibilityLabel ?? copy.mascot.label[mascot.mood];
  return (
    <GestureDetector gesture={gesture}>
      <View
        accessible
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityHint={copy.mascot.playHint}
        onAccessibilityTap={() => { tapAt(0); onTap?.(); }}
        accessibilityActions={[{ name: 'activate' }, { name: 'longpress' }]}
        onAccessibilityAction={(e) => {
          if (e.nativeEvent.actionName === 'longpress') report({ type: 'longPress' });
          else { tapAt(0); onTap?.(); }
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
