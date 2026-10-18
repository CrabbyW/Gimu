import { useEffect, useMemo, useRef, useState } from 'react';
import { View } from 'react-native';
import { copy } from '@/data/copy';
import { registerWordmark, splashActive, subscribeIntroHop } from '@/lib/introHop';
import { SPLASH_GLYPHS, textDots } from '@/logic/dotGlyphs';
import { dots, useTheme } from '@/theme';

const WORD = 'GIMU';
/** Index písmene s živou tečkou nahoře (I), stejně jako splash. */
const LIVE_LETTER = 1;

/** Logo appky z teček (statické): stejné písmo jako splash, tečka nad I v `live`. Splash na něj doletí a předá se
 *  (`lib/introHop`): dokud běží, logo je skryté, ukáže se ve snímku konce splashe. */
export function DotWordmark() {
  const { c } = useTheme();
  const { cell, dotFrac } = dots.wordmark;
  const layout = useMemo(() => textDots(WORD, SPLASH_GLYPHS), []);
  const d = Math.max(1, Math.round(cell * dotFrac));
  const ref = useRef<View>(null);
  const [hidden, setHidden] = useState(splashActive);

  useEffect(() => {
    registerWordmark((cb) => ref.current?.measureInWindow((x, y, width, height) => cb({ x, y, width, height })));
    const off = subscribeIntroHop(() => setHidden(false));
    // Splash mohl skončit mezi prvním renderem a přihlášením.
    if (!splashActive()) queueMicrotask(() => setHidden(false));
    return () => { off(); registerWordmark(null); };
  }, []);

  return (
    <View
      ref={ref}
      testID="wordmark"
      accessible
      accessibilityRole="header"
      accessibilityLabel={copy.app.name}
      style={{ width: cell * layout.cols, height: cell * layout.rows, opacity: hidden ? 0 : 1 }}
    >
      {layout.dots.map((p, i) => (
        <View
          key={i}
          style={{
            position: 'absolute', left: p.x * cell + (cell - d) / 2, top: p.y * cell + (cell - d) / 2,
            width: d, height: d, borderRadius: d / 2,
            backgroundColor: p.li === LIVE_LETTER && p.y === 0 ? c.live : c.text,
          }}
        />
      ))}
    </View>
  );
}
