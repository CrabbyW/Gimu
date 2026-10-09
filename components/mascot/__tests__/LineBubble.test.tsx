import TestRenderer, { act } from 'react-test-renderer';
import { Text, View } from 'react-native';
import { buildTheme, type Scheme } from '@/theme';
import { ThemeContext } from '@/theme/ThemeProvider';
import { LineBubble } from '../LineBubble';

/* eslint-disable @typescript-eslint/no-require-imports -- oficiální jest mocky knihoven */
jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));
jest.mock('react-native-worklets', () => require('react-native-worklets/src/mock'));
/* eslint-enable @typescript-eslint/no-require-imports */

const render = (text: string, scheme: Scheme = 'dark') => {
  let r!: TestRenderer.ReactTestRenderer;
  act(() => {
    r = TestRenderer.create(
      <ThemeContext.Provider value={buildTheme(scheme, null)}>
        <LineBubble text={text} arrowX={40} />
      </ThemeContext.Provider>,
    );
  });
  return r;
};

describe('LineBubble', () => {
  it.each<Scheme>(['dark', 'light'])('ukáže repliku větou (sentence case, UX pass U4), max. 2 řádky (%s)', (scheme) => {
    const r = render('Day by day. Nice.', scheme);
    const t = r.root.findByType(Text);
    expect(t.props.children).toBe('Day by day. Nice.');
    expect(t.props.numberOfLines).toBe(2);
    act(() => r.unmount());
  });

  it('čtečka repliku ohlásí (live region) a bublina nebere dotyk opičce', () => {
    const r = render('Morning. Bar’s cold.');
    const root = r.root.findAll((n) => n.type === View && n.props.accessibilityLiveRegion === 'polite');
    expect(root).toHaveLength(1);
    expect(root[0]!.props.accessibilityLabel).toBe('Morning. Bar’s cold.');
    expect(root[0]!.props.accessible).toBe(true);
    expect(root[0]!.props.pointerEvents).toBe('none');
    act(() => r.unmount());
  });
});
