import { useEffect, useState } from 'react';
import { Keyboard, Platform } from 'react-native';

// iOS hlásí klávesnici předem (will*), Android až po zobrazení (did*).
const SHOW = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
const HIDE = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

/** Je softwarová klávesnice na obrazovce? */
export function useKeyboardVisible(): boolean {
  const [visible, setVisible] = useState(() => Keyboard.isVisible());
  useEffect(() => {
    const show = Keyboard.addListener(SHOW, () => setVisible(true));
    const hide = Keyboard.addListener(HIDE, () => setVisible(false));
    return () => { show.remove(); hide.remove(); };
  }, []);
  return visible;
}
