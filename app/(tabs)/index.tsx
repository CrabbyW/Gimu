import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { View, useWindowDimensions } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { ReduceMotion, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DotField, DotRing, ScrollIntentProvider, useDotTouch, useScrollIntent } from '@/components/dots';
import { backgroundPitch } from '@/components/dots/geometry';
import { FinishSetupTile } from '@/components/map/FinishSetupTile';
import { LessonMap } from '@/components/map/LessonMap';
import { PullIndicator, usePullRefresh } from '@/components/map/PullRefresh';
import { ReturnLine } from '@/components/map/ReturnLine';
import { GuideBubble } from '@/components/mascot/GuideBubble';
import { MapTour, type TourStep } from '@/components/map/MapTour';
import { useMascotAct, useMascotReactions, useScreenFocused } from '@/components/mascot';
import { eventToRepertoire } from '@/logic/mascotRepertoire';
import { useMascotLine } from '@/hooks/useMascotLine';
import { currentSection, SectionHero } from '@/components/map/SectionHero';
import { Card } from '@/components/ui/Card';
import { EdgeFade } from '@/components/ui/EdgeFade';
import { tabBarClearance } from '@/components/ui/FloatingTabBar';
import { Reveal, useFirstShow } from '@/components/ui/choreo';
import { ErrorState } from '@/components/ui/ErrorState';
import { StartCard } from '@/components/ui/StartCard';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { DotWordmark } from '@/components/ui/DotWordmark';
import { Text } from '@/components/ui/Text';
import { copy } from '@/data/copy';
import { ease, motion, overlayResize, plateFlight, useMotionSafe } from '@/lib/motion';
import { endStart, launchFromPlate, measurePlate, measureRect, tryBeginStart } from '@/lib/plateFlight';
import type { GuideId } from '@/logic/guide';
import { useFinishSetup } from '@/hooks/useGoals';
import { useGuide } from '@/hooks/useGuide';
import { useLeague } from '@/hooks/useLeague';
import { useLessonMinutes } from '@/hooks/useLessonMinutes';
import { useLessonPath } from '@/hooks/useLessonPath';
import { useProfile } from '@/hooks/useProfile';
import { useProfileStats } from '@/hooks/useProfileStats';
import { useReturnLine } from '@/hooks/useReturnLine';
import { dots, opacity, useShort, useTheme } from '@/theme';

/** Nástup hlavičky (motion.screenIn): shared value, ne layout animace (ta na webu nechá prvek `absolute`). */
const HEADER_IN = { duration: motion.screenIn.durationMs, easing: ease.out };

/**
 * Trénink (Nothing Dot §6): stavový řádek „SEKCE 01 · ● 12 DNÍ“, jednořádkový Doto titulek sekce, tenký řádek
 * pokroku (tečky + „0 / 9“), pod ním mapa tečkových kotoučů s opičkou na aktuálním a plovoucí pilulka `[ZAČÍT LEKCI]`.
 * Hierarchie: nejsilnější plocha obrazovky je jediná plná pilulka; nejsilnější číslo je pokrok v hero.
 * Mapa běží přes celou výšku (i pod tab barem); hlavička + řádek sekce jsou překryv se závojem `base`
 * (EdgeFade), pod kterým cesta plynule odjíždí. Tečkové pole patří hlavičce a stojí.
 */
export default function TrainingScreen() {
  const { c, space, size } = useTheme();
  const { width, height: screenH } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  // Rezerva scény pro plovoucí tab bar; mapa ji záporným okrajem přebírá a jede i pod tab barem.
  const clearance = tabBarClearance(insets.bottom, size.tabPill, space.m);
  // Výška překryvu (hlavička + řádek sekce) = horní odsazení obsahu mapy.
  const [overlayH, setOverlayH] = useState(0);
  // Změna výšky překryvu (zmizí bublina nebo dlaždice): obsah mapy a závoj dojedou timingem z rozdílu
  // starého a nového odsazení k nule (UI vlákno), takže mapa neposkočí. Při mountu (0) bez animace.
  const { reduced } = useMotionSafe();
  const insetShift = useSharedValue(0);
  const onOverlayLayout = (h: number) => { if (h !== overlayH) setOverlayH(h); };
  // Veil (EdgeFade) kreslený pro novou výšku se během dojezdu natáhne shora na starou (scaleY od horní hrany).
  const veilH = overlayH + size.edgeFade;
  const veilStyle = useAnimatedStyle(() => {
    const k = veilH > 0 ? (veilH + insetShift.value) / veilH : 1;
    return { transform: [{ translateY: ((k - 1) * veilH) / 2 }, { scaleY: k }] };
  });
  const { unlocked } = useLocalSearchParams<{ unlocked?: string }>();
  const profile = useProfile();
  const data = profile.status === 'ready' ? profile.data : null;
  const view = useLessonPath(data?.path);
  const viewData = view.status === 'ready' ? view.data : null;
  const minutesOf = useLessonMinutes(viewData, data?.fitnessTest, data?.progression);
  const stats = useProfileStats(data);
  // UX pass U4: „Next: <lekce> · N min“ a stav série pod pokrokem sekce.
  const returnLine = useReturnLine(data, viewData, minutesOf);
  // Pull-to-refresh (tah dolů na začátku mapy): znovu načte profil i cestu přes `refresh` hooků; indikátor
  // (opičí hlava) se točí, dokud obě obnovy nedoběhnou.
  const refreshMap = () => Promise.all([
    profile.status === 'ready' ? profile.refresh() : undefined,
    view.status === 'ready' ? view.refresh() : undefined,
  ]);
  const ptr = usePullRefresh(refreshMap);
  // Liga při načtení vyhodnotí uplynulý týden (postup/sestup), i když mapa úroveň už neukazuje.
  useLeague();
  // Po sekvenci se parametr smaže, aby se při návratu na tab nepřehrála znovu.
  const clearUnlocked = useCallback(() => router.setParams({ unlocked: undefined }), []);
  // Dotyková vlna tečkového pole za hlavičkou (spec §4.1): gesto jen čte dotyky, scroll ani tapy nebere.
  const field = useDotTouch();
  // Reakce opičky (fáze 3): sleduje prst po celé obrazovce (gesto jen čte dotyky), usíná při nečinnosti
  // zaostřené mapy, mává po návratu do appky a kývne na start lekce.
  // Repertoár (26 animací): akce opičky na mapě (idle, ťuknutí, návrat do appky, ztracená série). Návrat po ≥ 60 s
  // = zamává oběma a doběhne k uzlu (`waveRun`) místo starého mávnutí.
  const acts = useMascotAct();
  const reactions = useMascotReactions(useScreenFocused(), {
    onAppReturn: (awayMs) => {
      const id = eventToRepertoire({ type: 'appReturn', awayMs });
      return id ? acts.play(id) : false;
    },
  });
  // Záměr scrollu: mapa (`IntentScrollView`) se rozjede jen při jasně svislém tahu, jinak tah patří tečkám.
  const play = useScrollIntent();
  // First run (elite fáze 1): průvodce „Tap Start to begin“ a řádek „Finish setup“ v hlavičkovém překryvu.
  const guide = useGuide('map');
  // Prohlídka mapy (nový uživatel): místo bubliny `mapStart`; cíle se měří přes ref (measureInWindow).
  const touring = guide.id === 'mapTour';
  const streakRef = useRef<View>(null);
  const progressRef = useRef<View>(null);
  const startRef = useRef<View>(null);
  // Odcházející bublina: zápis „viděno“ proběhne hned, bublina se ještě `overlayResize.outMs` prolíná pryč.
  const [ghost, setGhost] = useState<GuideId | null>(null);
  const ghostTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (ghostTimer.current) clearTimeout(ghostTimer.current); }, []);
  const dismissGuide = () => {
    if (!guide.id) return;
    setGhost(guide.id);
    guide.dismiss();
    if (ghostTimer.current) clearTimeout(ghostTimer.current);
    ghostTimer.current = setTimeout(() => setGhost(null), overlayResize.outMs);
  };
  // Start lekce je zamčený proti dvojímu ťuknutí; návrat na mapu ho odemkne.
  useFocusEffect(useCallback(() => { endStart(); }, []));
  // Replika opičky (elite fáze 3): ťuknutí na opičku = krátká věta v bublině; při průvodci mlčí.
  const mascotLine = useMascotLine(stats, Boolean(guide.id ?? ghost));
  const setup = useFinishSetup();
  // Nízký displej (568): kompaktní bublina průvodce (bez štítku, jeden řádek), ať aktuální kotouč zůstane nad CTA.
  const short = useShort();
  // Nízký displej v prvním průchodu: mapa sjede o `space.l` níž (opička celá pod bublinou, popisek končí `space.s` nad CTA), ať opička nesahá pod bublinu (šipka plave
  // vedle ní a výšku nezabírá); nadpis sekce pod bublinou zakryje bublina přes celou šířku.
  const lift = short && !touring && (guide.id ?? ghost) && viewData?.currentLessonId ? -space.l : 0;
  const inset = overlayH - lift;
  // Změna odsazení mapy (zmizí bublina, dlaždice nebo zdvih): obsah a závoj dojedou timingem z rozdílu
  // starého a nového odsazení k nule (UI vlákno), takže mapa neposkočí. Při mountu (0) bez animace.
  const lastInset = useRef(0);
  useLayoutEffect(() => {
    const prev = lastInset.current;
    if (overlayH <= 0 || inset === prev) return;
    lastInset.current = inset;
    if (prev > 0 && !reduced) {
      insetShift.value = insetShift.value + (prev - inset);
      insetShift.value = withTiming(0, { duration: overlayResize.ms, easing: ease.out, reduceMotion: ReduceMotion.Never });
    }
  }, [inset, overlayH, reduced, insetShift]);
  const ptrGesture = ptr.gesture;
  const touch = useMemo(() => Gesture.Simultaneous(field.gesture, reactions.touch, play, ptrGesture), [field.gesture, reactions.touch, play, ptrGesture]);

  if (profile.status === 'error') return <ErrorState edges={['top']} what={copy.common.loadTarget.profile} onRetry={profile.retry} />;
  if (view.status === 'error') return <ErrorState edges={['top']} what={copy.common.loadTarget.path} onRetry={view.retry} />;
  if (!viewData || !stats || !data) return <MapSkeleton />;

  const section = currentSection(viewData);
  const sad = !stats.isNew && stats.mood === 'sad';
  const currentId = viewData.currentLessonId;
  const currentNode = viewData.sections.flatMap((s) => s.nodes).find((n) => n.lesson.id === currentId);
  // Start lekce (CTA i popover uzlu): dvojí ťuknutí = jedna navigace. Kotouč se změří a vzlétne (overlay
  // `PlateFlight`), navigace jde hned po měření (max `plateFlight.measureMaxMs`); selhání měření = bez letu.
  const open = (id: string) => {
    if (!tryBeginStart()) return;
    dismissGuide();
    reactions.report({ type: 'lessonStart' });
    const go = () => router.push({ pathname: '/lesson/[id]', params: { id } });
    launchFromPlate(id, plateFlight.measureMaxMs).then(go, go);
  };
  const bubbleId = touring ? null : guide.id ?? ghost;
  const tourSteps: TourStep[] = !touring ? [] : [
    ...(currentNode ? [{ id: 'plate' as const, text: copy.mapTour.plate(currentNode.exerciseCount, minutesOf[currentNode.lesson.id] ?? 0), measure: () => measurePlate(currentNode.lesson.id, plateFlight.measureMaxMs) }] : []),
    { id: 'streak' as const, text: copy.mapTour.streak, measure: () => measureRect(streakRef.current, plateFlight.measureMaxMs) },
    ...(section ? [{ id: 'progress' as const, text: copy.mapTour.progress(section.nodes.length), measure: () => measureRect(progressRef.current, plateFlight.measureMaxMs) }] : []),
    ...(currentNode ? [{ id: 'start' as const, text: copy.mapTour.start, measure: () => measureRect(startRef.current, plateFlight.measureMaxMs) }] : []),
  ];
  return (
    <MapContent
      unlocked={unlocked ?? null}
      render={(intro) => (
        <ScrollIntentProvider gesture={play} together={ptrGesture}>
        {/* Provider vně: GestureDetector potřebuje View jako přímého potomka, jinak se gesto nepřipojí
            (tečky přestaly reagovat). */}
        <GestureDetector gesture={touch}>
        {/* Obrazovka sahá až pod plovoucí tab bar (záporný okraj ruší rezervu scény): mapa jede přes celou výšku. */}
        <View style={{ flex: 1, backgroundColor: c.base, marginBottom: -clearance }}>
          {/* Reaktivní tečkové pozadí přes celou obrazovku (jako ReactiveBackground jinde): stojí, mapa jede nad ním,
              vlna z dotyku sedí na prstu (gesto `field` je na kořeni spolu s reakcemi opičky). */}
          <DotField
            width={width}
            height={screenH}
            pitch={backgroundPitch(width, screenH, dots.field.pitch, dots.field.max)}
            touch={field.touch}
            restOpacity={dots.background.restOpacity}
            style={{ position: 'absolute', left: 0, top: 0 }}
          />
          {/* Mapa přes celou výšku; mountuje se až se změřenou hlavičkou, aby úvodní dojetí na aktuální uzel
              počítalo se správným výřezem. */}
          {overlayH > 0 ? (
            <View style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}>
              <LessonMap
                view={viewData}
                stats={stats}
                minutesOf={minutesOf}
                cosmetics={data.equipped}
                unlockedLessonId={unlocked ?? null}
                onOpenLesson={open}
                onUnlockSequenceEnd={clearUnlocked}
                intro={intro}
                topInset={inset}
                insetShift={insetShift}
                // Pod posledním uzlem: tab bar + pilulka CTA, ať jde poslední prvek odscrollovat nad ně.
                footerSpace={clearance + (currentId ? size.startCard + space.m * 2 : space.m)}
                reactions={reactions}
                acts={acts}
                streakAtRisk={returnLine?.risk === 'atRisk'}
                greet={stats.isNew}
                line={mascotLine.line?.text ?? null}
                onMascotTap={mascotLine.say}
                pull={ptr.pull}
                scrollOut={ptr.scrollY}
              />
            </View>
          ) : null}
          {/* Závoj `base` za hlavičkou: plný přes status bar i text hlavičky, na spodní hraně `opacity.veilEdge`,
              pod ní dozní do průhledna. Cesta pod hlavičkou ustupuje do hloubky, titulek zůstává čitelný. */}
          <Animated.View pointerEvents="none" style={[{ position: 'absolute', left: 0, top: 0 }, veilStyle]}>
          <EdgeFade
            direction="down"
            width={width}
            height={overlayH + size.edgeFade}
            stops={[
              { at: 0, opacity: 1 },
              { at: insets.top / (overlayH + size.edgeFade), opacity: 1 },
              // Elite fáze 4: za textem hlavičky plný závoj (odscrollované popisky uzlů za titulkem neprosvítají
              // jako duchové); prolnutí do `veilEdge` až v posledních `space.s` pod obsahem hlavičky.
              { at: Math.max(0, overlayH - space.s) / (overlayH + size.edgeFade), opacity: 1 },
              { at: overlayH / (overlayH + size.edgeFade), opacity: opacity.veilEdge },
              { at: 1, opacity: 0 },
            ]}
          />
          </Animated.View>
          {/* Pull-to-refresh: opičí hlava v mezeře, kterou tah otevře pod hlavičkou (vynoří se zpod její hrany). */}
          {overlayH > 0 ? <PullIndicator pull={ptr.pull} refreshing={ptr.refreshing} top={overlayH} width={width} stage={stats.stage} /> : null}
          {/* Překryv: hlavička + řádek sekce. Prázdná místa propouští tah do mapy pod sebou. */}
          <View
            pointerEvents="box-none"
            onLayout={(e) => onOverlayLayout(Math.round(e.nativeEvent.layout.height))}
            style={{ position: 'absolute', left: 0, right: 0, top: 0 }}
          >
          {/* Plné `base` pod textem hlavičky, pokroku a řádku Next: závoj tu je stejně neprůhledný (stopa 1 až do
              `overlayH − space.s`), ale popisky uzlů odjeté pod hlavičku tak spolehlivě zmizí i při velkém písmu,
              kdy hlavička naroste dřív, než mapa dostane nové odsazení. */}
          <View pointerEvents="box-none" style={{ backgroundColor: c.base }}>
          {/* Nástup obrazovky (motion.screenIn): hlavička 0 → hero 80 (vnitřní sled SectionHero) → kotouče mapy. */}
          <Reveal play={intro} delay={motion.screenIn.headerAt} rise={motion.screenIn.rise} config={HEADER_IN}>
          <ScreenHeader
            singleLine
            title={copy.app.name}
            logo={<DotWordmark />}
            subtitle={section?.title ?? copy.tabs.training}
            status={{
              left: section ? copy.map.sectionKicker(section.index) : copy.tabs.training.toUpperCase(),
              right: copy.status.streak(stats.streak),
              // Tečka bliká, dokud dnes nic nebylo: živý údaj = „série čeká na dnešek“.
              live: !stats.todayDone,
              rightA11y: copy.status.streakA11y(stats.streak, stats.todayDone),
              rightRef: streakRef,
            }}
          />
          </Reveal>
          {/* Nízký displej v prvním průchodu (svítí bublina): prázdná řada pokroku 0/9 ustoupí, aby aktuální kotouč
              i s opičkou a popiskem zůstal mezi překryvem a CTA. Po startu lekce se vrátí. */}
          {short && bubbleId && currentId ? null : <View ref={progressRef} collapsable={false}><SectionHero view={viewData} intro={intro} /></View>}
          {/* Důvod se vrátit (U4). Při bublině průvodce mlčí: ta už říká, co udělat, a first run má být řídký. */}
          {returnLine && !bubbleId ? (
            <Reveal play={intro} delay={motion.screenIn.heroAt} rise={motion.screenIn.rise}>
              <ReturnLine line={returnLine} />
            </Reveal>
          ) : null}
          </View>
          {/* Karta „První lekce“ zrušena: minuty a XP nese popisek aktuálního uzlu, mapě zůstane výška. */}
          {sad ? (
            <Card style={{ marginHorizontal: space.l, marginTop: space.s, gap: space.xs }}>
              <Text variant="headline">{copy.map.brokenTitle}</Text>
              <Text tone="muted">{copy.map.brokenBody(stats.longestStreak)}</Text>
            </Card>
          ) : null}
          {/* Krátký onboarding: jednořádková dlaždice (výška 44), ne karta, aby cesta nepřišla o místo. */}
          {setup.needed ? <FinishSetupTile /> : null}
          {/* Průvodce: pod hlavičkou, šipka dolů k aktuálnímu kotouči (ten je hned pod překryvem). Nikdy u CTA dole. */}
          {bubbleId && currentId ? (
            <View style={{ paddingHorizontal: space.l, marginTop: short ? space.xs : space.s }}>
              <GuideBubble
                id={bubbleId}
                arrow="down"
                compact={short}
                // Nízký displej: bublina přes celou šířku (zakryje nadpis sekce, který pod ní projíždí) a plovoucí
                // šipka vedle opičky na hranu kotouče: nezabírá výšku, uzel i s popiskem se vejde nad CTA.
                stretch={short}
                arrowOffset={short ? -dots.guide.sideOffset : undefined}
                onDismiss={dismissGuide} leaving={!guide.id} delay={motion.screenIn.headerAt} />
            </View>
          ) : null}
          </View>
          {currentId ? (
            // Mapa jede i pod pilulkou a tab barem. Jemný závoj za pilulkou (plná strana dole, `veilEdge` → 0)
            // utlumí tečky cesty kolem CTA, aby se nesrážely s hranou pilulky; pilulka sama je plná výplň.
            <View pointerEvents="box-none" style={{ position: 'absolute', left: 0, right: 0, bottom: clearance, paddingHorizontal: space.l, paddingTop: space.m, paddingBottom: space.m }}>
              <EdgeFade
                direction="up"
                width={width}
                height={size.edgeFade + size.startCard + space.m * 2}
                stops={[{ at: 0, opacity: opacity.veilEdge }, { at: 1, opacity: 0 }]}
                style={{ position: 'absolute', left: 0, bottom: 0 }}
              />
              {/* Nízký displej (QA f1 k3 ⚠️): mezi pilulkou a tab barem prosvítal scrollovaný text mapy.
                  Plný závoj `base` od spodní hrany pilulky až ke dnu obrazovky (pod tab barem). */}
              {short ? <View pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, bottom: -clearance, height: clearance + space.m, backgroundColor: c.base }} /> : null}
              {currentNode ? (
                <View ref={startRef} collapsable={false}>
                <StartCard
                  title={copy.map.startNamed(currentNode.lesson.title)}
                  meta={copy.map.startMeta(currentNode.exerciseCount, currentNode.xp)}
                  onPress={() => open(currentId)}
                />
                </View>
              ) : null}
            </View>
          ) : null}
          {touring && tourSteps.length > 0 ? (
            <MapTour steps={tourSteps} stage={stats.stage} cosmetics={data.equipped} mood={stats.mood} onFinish={guide.dismiss} />
          ) : null}
        </View>
        </GestureDetector>
        </ScrollIntentProvider>
      )}
    />
  );
}

/** Načítání mapy: kostra tří uzlů jako prázdné tečkové prstence (tvar obsahu, ne spinner). */
function MapSkeleton() {
  const { c, space, size } = useTheme();
  const insets = useSafeAreaInsets();
  const offsets = [0, size.node, 0];
  return (
    <View
      accessible
      accessibilityLabel={copy.common.loading}
      accessibilityState={{ busy: true }}
      style={{ flex: 1, backgroundColor: c.base, paddingTop: insets.top + space.xxl, alignItems: 'center', gap: space.xl }}
    >
      {offsets.map((dx, i) => (
        <View key={i} style={{ marginLeft: dx }} importantForAccessibility="no-hide-descendants">
          <DotRing progress={0} size={size.node} />
        </View>
      ))}
    </View>
  );
}

/** Úvodní sled mapy (motion) jen při prvním zobrazení obsahu a ne přes odemykací sekvenci. Samostatná
 *  komponenta, aby se „první zobrazení“ rozhodlo až s daty (ne během načítání). */
function MapContent({ unlocked, render }: { unlocked: string | null; render(intro: boolean): ReactNode }) {
  const first = useFirstShow('tab:map');
  const [intro] = useState(first && !unlocked);
  return <>{render(intro)}</>;
}
