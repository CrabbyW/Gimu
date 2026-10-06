import { router } from 'expo-router';
import { X } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { GestureDetector } from 'react-native-gesture-handler';
import { CosmeticTile, type WardrobeItem } from '@/components/cosmetics/CosmeticTile';
import { DotField, useDotTouch } from '@/components/dots';
import { Reveal } from '@/components/ui/choreo';
import { Mascot } from '@/components/mascot';
import { DotLoaderScreen } from '@/components/ui/DotLoader';
import { ErrorState } from '@/components/ui/ErrorState';
import { Screen } from '@/components/ui/Screen';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { Text } from '@/components/ui/Text';
import { Tile } from '@/components/ui/Tile';
import { copy } from '@/data/copy';
import { useDisplayStage } from '@/hooks/useDisplayStage';
import { useProfile } from '@/hooks/useProfile';
import { useProfileStats } from '@/hooks/useProfileStats';
import { useSeasonStatus } from '@/hooks/useSeason';
import { useWardrobe, wardrobeActions } from '@/hooks/useWardrobe';
import { haptics } from '@/lib/haptics';
import { hopMs, intro, motion, stagger } from '@/lib/motion';
import { useTheme } from '@/theme';
import type { CosmeticSlot } from '@/types';

const SLOTS: readonly CosmeticSlot[] = ['outfit', 'accessory', 'mapBackground', 'lessonEffect', 'profileFrame'];
const COLS = 3;
// Po doskoku ještě chvíli radost, než se opice vrátí do klidu.
const CHEER_TAIL_MS = 200;

/** Potvrzení nákupu. RN Web `Alert` nic nezobrazí, proto na webu `confirm` (jako v Dev menu). */
function confirmBuy(message: string, onYes: () => void) {
  if (Platform.OS === 'web') {
    if (globalThis.confirm(message)) onYes();
    return;
  }
  Alert.alert(copy.wardrobe.title, message, [{ text: copy.wardrobe.cancel, style: 'cancel' }, { text: copy.wardrobe.buyYes, onPress: onYes }]);
}

export default function WardrobeScreen() {
  const wardrobe = useWardrobe();
  return (
    <Screen edges={['top', 'bottom']} background="base">
      <Header />
      {wardrobe.status === 'loading' ? <DotLoaderScreen />
        : wardrobe.status === 'error' ? <ErrorState what={copy.wardrobe.errorWhat} onRetry={wardrobe.retry} />
          : <WardrobeBody items={wardrobe.data.items} bananas={wardrobe.data.bananas} equipped={wardrobe.data.equipped} />}
    </Screen>
  );
}

/** Hlavička modalu (Nothing Dot §2.3): Doto titulek vlevo, kulaté ikonové tlačítko 44 vpravo. */
function Header() {
  const { c, size, stroke, space, radius } = useTheme();
  // Motion: hlavička = první úder nástupu modalu (`screenIn.headerAt`), obsah navazuje `intro.modal`.
  return (
    <Reveal play delay={motion.screenIn.headerAt} rise={motion.screenIn.rise} config={motion.reveal} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.m, minHeight: size.hitLarge, paddingTop: space.s, paddingBottom: space.m }}>
      <Text variant="display" accessibilityRole="header" numberOfLines={1} style={{ flexShrink: 1 }}>{copy.wardrobe.title}</Text>
      <Pressable
        onPress={() => router.back()}
        accessibilityRole="button"
        accessibilityLabel={copy.wardrobe.close}
        style={({ pressed }) => ({
          width: size.iconButton, height: size.iconButton, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center',
          backgroundColor: pressed ? c.tilePressed : c.tile, borderWidth: StyleSheet.hairlineWidth, borderColor: c.edge,
        })}
      >
        <X size={size.icon} color={c.text} strokeWidth={stroke.icon} />
      </Pressable>
    </Reveal>
  );
}

interface BodyProps { items: WardrobeItem[]; bananas: number; equipped: Partial<Record<CosmeticSlot, string>> }

/** Šatník (§7.8). Nahoře živý náhled (překresluje se z hooku po každém nasazení), vedle zůstatek banánů;
 *  pod tím sloty a mřížka 3 sloupce. Tap na odemčenou položku ji hned nasadí / sundá, na shop položku koupí. */
function WardrobeBody({ items, bananas, equipped }: BodyProps) {
  const { space, size } = useTheme();
  const profile = useProfile();
  const stats = useProfileStats(profile.status === 'ready' ? profile.data : null);
  const stage = useDisplayStage(stats?.stage ?? 1);
  const season = useSeasonStatus();
  const [slot, setSlot] = useState<CosmeticSlot>('outfit');
  // Motion: nástup obsahu modalu (náhled → přepínač → dlaždice po 35 ms); změna slotu přehraje jen
  // mřížku, rychleji (`motion.ui`, po 30 ms).
  // Modal je nová scéna: nástup se hraje při každém otevření.
  const first = true;
  const [changed, setChanged] = useState(false);
  const M = intro.modal;
  const [width, setWidth] = useState(0);
  const [previewW, setPreviewW] = useState(0);
  const field = useDotTouch();
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  // Náhled: při nasazení opice jednou poskočí (`happy` spouští `motion.hop`), pak zpět do klidu.
  const [cheer, setCheer] = useState(false);
  const cheerTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (cheerTimer.current) clearTimeout(cheerTimer.current); }, []);
  const hopOnce = () => {
    if (cheerTimer.current) clearTimeout(cheerTimer.current);
    setCheer(true);
    cheerTimer.current = setTimeout(() => setCheer(false), hopMs() + CHEER_TAIL_MS);
  };

  const seasonName = (seasonId?: string) =>
    season.status === 'ready' && season.data && season.data.season.id === seasonId ? season.data.season.name : undefined;
  const visible = items.filter((i) => i.cosmetic.slot === slot);
  const gap = space.m;
  const tile = width > 0 ? Math.floor((width - gap * (COLS - 1)) / COLS) : 0;

  const run = async (fn: () => Promise<void>) => {
    if (busy) return;
    setBusy(true); setNote(null);
    try { await fn(); } catch { setNote(copy.wardrobe.actionError); } finally { setBusy(false); }
  };

  const onTile = (item: WardrobeItem) => {
    const c = item.cosmetic;
    if (item.unlocked) {
      haptics.tick();
      const equipping = !item.equipped;
      void run(async () => { await wardrobeActions.equip(c.slot, equipping ? c.id : null); if (equipping) hopOnce(); });
      return;
    }
    if (item.canBuy === 'insufficient') { setNote(copy.wardrobe.insufficient); return; }
    if (item.canBuy !== 'ok' || c.priceBananas === undefined) return;
    const price = c.priceBananas;
    confirmBuy(copy.wardrobe.buyConfirm(c.name, price), () => {
      void run(async () => {
        await wardrobeActions.buy(c.id);
        haptics.success();
        await wardrobeActions.equip(c.slot, c.id);
        hopOnce();
      });
    });
  };

  return (
    <ScrollView contentContainerStyle={{ paddingBottom: space.xxl, gap: space.l }} showsVerticalScrollIndicator={false}>
      {/* Náhled (Nothing Dot fáze 2): opička na tečkovém poli v dlaždici, pole reaguje na dotek. Vpravo dole
          zůstatek banánů (Doto `dotStat` + mono štítek): měna je kontext nákupu, ne hrdina. 1 plátno. */}
      <Reveal play={first} delay={M.at} rise={M.rise}>
        <GestureDetector gesture={field.gesture}>
          <View onLayout={(e) => setPreviewW(e.nativeEvent.layout.width)}>
            <Tile pad="none" style={{ height: size.profileField }}>
              {previewW > 0 ? (
                <DotField width={previewW} height={size.profileField} touch={field.touch} style={{ position: 'absolute', left: 0, top: 0 }} />
              ) : null}
              <View style={{ flex: 1, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', padding: size.tilePad, gap: space.m }}>
                <Mascot stage={stage} mood={cheer ? 'happy' : 'idle'} size={size.wardrobePreview} cosmetics={equipped} accessibilityLabel={copy.wardrobe.preview} />
                <View accessible accessibilityLabel={copy.wardrobe.bananasA11y(bananas)} style={{ alignItems: 'flex-end' }}>
                  <Text variant="dotStat">{bananas}</Text>
                  <Text variant="label" tone="muted">{copy.wardrobe.bananas}</Text>
                </View>
              </View>
            </Tile>
          </View>
        </GestureDetector>
      </Reveal>

      <Reveal play={first} delay={M.at + M.step} rise={M.rise}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ minWidth: size.slotSegment * SLOTS.length }}>
        <View style={{ width: size.slotSegment * SLOTS.length }}>
          <SegmentedControl
            options={SLOTS.map((s) => ({ value: s, label: copy.wardrobe.slots[s] }))}
            value={slot}
            onChange={(s) => { haptics.tick(); setSlot(s); setChanged(true); setNote(null); }}
          />
        </View>
      </ScrollView>
      </Reveal>

      {note ? <Text variant="caption" tone="muted" accessibilityLiveRegion="polite">{note}</Text> : null}

      <View onLayout={(e) => setWidth(e.nativeEvent.layout.width)} style={{ flexDirection: 'row', flexWrap: 'wrap', columnGap: gap, rowGap: space.l }}>
        {visible.length === 0 ? <Text variant="body" tone="muted">{copy.wardrobe.empty}</Text>
          : tile > 0 ? visible.map((item, i) => {
            const opening = !changed;
            return (
              <Reveal
                key={`${slot}:${item.cosmetic.id}`}
                play={opening ? first : true}
                delay={opening ? M.at + M.step * 2 + stagger(i, 35) : stagger(i, 30)}
                rise={8}
                config={opening ? motion.enter : motion.ui}
              >
                <CosmeticTile
                  item={item}
                  width={tile}
                  stage={stage}
                  seasonName={seasonName(item.cosmetic.seasonId)}
                  disabled={busy}
                  onPress={() => onTile(item)}
                />
              </Reveal>
            );
          }) : null}
      </View>
    </ScrollView>
  );
}
