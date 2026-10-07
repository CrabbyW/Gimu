import { useEffect, useSyncExternalStore } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import Animated, { ReduceMotion, cancelAnimation, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { FullWindowOverlay } from 'react-native-screens';
import { scheduleOnRN } from 'react-native-worklets';
import { DotPlate } from '@/components/dots';
import { ease, motion, plateFlight as PF, useMotionSafe } from '@/lib/motion';
import { feedback } from '@/lib/feedback';
import { clear, getFlight, subscribe, type Flight } from '@/lib/plateFlight';

const NEVER = { reduceMotion: ReduceMotion.Never };

/**
 * Overlay letu kotouče (spec §2.3) nad celým Stackem, pointerEvents none: nic nebere dotyky, stav appky ani
 * navigaci neblokuje (lekce se otevře hned, let ji jen doprovází). Na iOS přes `FullWindowOverlay`, protože
 * lekce je nativní fullScreenModal a obyčejný sourozenec Stacku by ležel pod ní. Kreslí se jen během letu.
 */
export function PlateFlight() {
  const flight = useSyncExternalStore(subscribe, getFlight, getFlight);
  if (!flight) return null;
  const body = (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <FlyingPlate key={flight.id} flight={flight} />
    </View>
  );
  return Platform.OS === 'ios' ? <FullWindowOverlay>{body}</FullWindowOverlay> : body;
}

/** Kotouč: visí na místě, dokud lekce nezměří cíl; pak `PF.ms` `ease.exit` přeletí do středu řady teček,
 *  zmenší se na její výšku, pootočí o `PF.turns` a od `PF.fadeFrom` dráhy se rozpustí. Omezený pohyb: prolnutí na místě. */
function FlyingPlate({ flight }: { flight: Flight }) {
  const { reduced } = useMotionSafe();
  const p = useSharedValue(0);
  const fade = useSharedValue(1);
  const { from, to } = flight;
  const landed = to != null;

  // Omezený pohyb, nebo cíl nepřišel včas: kotouč se na místě prolne pryč.
  useEffect(() => {
    const out = () => { fade.value = withTiming(0, { ...motion.calmFade, ...NEVER }, (done) => { if (done) scheduleOnRN(clear); }); };
    if (reduced) { out(); return () => cancelAnimation(fade); }
    const t = setTimeout(() => { if (!getFlight()?.to) out(); }, PF.waitMaxMs);
    return () => { clearTimeout(t); cancelAnimation(fade); };
  }, [reduced, fade]);

  useEffect(() => {
    if (!landed || reduced) return;
    feedback('flightStart'); // kotouč se právě odlepil (omezený pohyb: let není, zvuk taky ne)
    p.value = withTiming(1, { duration: PF.ms, easing: ease.exit, ...NEVER }, (done) => { if (done) scheduleOnRN(clear); });
    return () => cancelAnimation(p);
  }, [landed, reduced, p]);

  // Do workletu jen čísla.
  const size = from.width;
  const dx = to ? to.x + to.width / 2 - (from.x + from.width / 2) : 0;
  const dy = to ? to.y + to.height / 2 - (from.y + from.height / 2) : 0;
  const end = to ? Math.max(0.06, Math.min(1, to.height / size)) : 1;
  const turnDeg = PF.turns * 360;
  const fadeFrom = PF.fadeFrom;
  const style = useAnimatedStyle(() => {
    const k = p.value;
    const tail = k <= fadeFrom ? 1 : 1 - (k - fadeFrom) / (1 - fadeFrom);
    return {
      opacity: fade.value * tail,
      transform: [{ translateX: dx * k }, { translateY: dy * k }, { scale: 1 + (end - 1) * k }, { rotate: `${turnDeg * k}deg` }],
    };
  });
  return (
    <Animated.View style={[{ position: 'absolute', left: from.x, top: from.y, width: size, height: size, alignItems: 'center', justifyContent: 'center' }, style]}>
      <DotPlate kg={flight.kg} size={size} state={flight.state} check={false} decorative />
    </Animated.View>
  );
}
