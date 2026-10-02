import { useState, type ReactNode } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { TextField } from '@/components/ui/TextField';
import { copy } from '@/data/copy';
import { useTheme } from '@/theme';

interface Props {
  visible: boolean;
  title: string;
  fieldLabel: string;
  unit?: string;
  initial: string;
  /** Vrátí chybovou hlášku, nebo null (hodnota je v pořádku a uloží se přes `onSubmit`). */
  validate(raw: string): string | null;
  onSubmit(raw: string): Promise<void>;
  onClose(): void;
  /** Volitelný obsah nad polem (např. tlačítko pro binární milník). */
  extra?: ReactNode;
  hideField?: boolean;
}

/** Spodní panel s jedním numerickým polem a „Uložit“. Plocha `raised` na scrimu, jen hairline nahoře. */
export function NumberSheet({ visible, title, fieldLabel, unit, initial, validate, onSubmit, onClose, extra, hideField }: Props) {
  const { c, space, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const [raw, setRaw] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Reset při otevření během renderu (ne v effectu): https://react.dev/learn/you-might-not-need-an-effect
  const [openedFor, setOpenedFor] = useState<string | null>(null);
  const openKey = visible ? initial : null;
  if (openKey !== openedFor) {
    setOpenedFor(openKey);
    if (visible) { setRaw(initial); setError(null); }
  }

  const save = async () => {
    if (busy) return;
    const e = validate(raw);
    setError(e);
    if (e) return;
    setBusy(true);
    try { await onSubmit(raw); } catch { setError(copy.progress.saveError); } finally { setBusy(false); }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, justifyContent: 'flex-end' }}>
        <Pressable accessibilityRole="button" accessibilityLabel={copy.progress.cancel} onPress={onClose} style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: c.scrim }} />
        <View
          accessibilityViewIsModal
          style={{
            backgroundColor: c.raised, borderTopLeftRadius: radius.l, borderTopRightRadius: radius.l,
            paddingHorizontal: space.l, paddingTop: space.l, paddingBottom: space.l + insets.bottom, gap: space.l,
          }}
        >
          <Text variant="choiceTitle" accessibilityRole="header">{title}</Text>
          {extra}
          {hideField ? null : (
            <TextField
              label={fieldLabel}
              unit={unit}
              value={raw}
              onChangeText={(t) => { setRaw(t); if (error) setError(null); }}
              keyboardType="decimal-pad"
              autoFocus
              error={error}
              onSubmitEditing={save}
              returnKeyType="done"
            />
          )}
          {hideField && error ? <Text variant="caption" style={{ color: c.danger }} accessibilityLiveRegion="polite">{error}</Text> : null}
          <View style={{ flexDirection: 'row', gap: space.s }}>
            <Button label={copy.progress.cancel} variant="secondary" onPress={onClose} style={{ flex: 1 }} />
            {hideField ? null : <Button label={copy.progress.save} onPress={save} disabled={busy} style={{ flex: 1 }} />}
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
