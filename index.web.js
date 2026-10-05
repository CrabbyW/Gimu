// Web: Skia potřebuje CanvasKit (wasm) dřív, než se vyhodnotí jakýkoli modul, který importuje
// `@shopify/react-native-skia` (při importu z něj staví objekt Skia). Proto se aplikace načte až po LoadSkiaWeb.
// `@expo/metro-runtime` musí být první import kvůli Fast Refresh.
import '@expo/metro-runtime';
import { LoadSkiaWeb } from '@shopify/react-native-skia/lib/module/web';
import { renderRootComponent } from 'expo-router/build/renderRootComponent';

LoadSkiaWeb({ locateFile: (file) => `/${file}` })
  .catch((e) => console.warn('[skia] CanvasKit se nenačetl, tečková grafika se vypne', e))
  .finally(() => {
    // Záměrně líný require až po CanvasKit (statický import by vyhodnotil Skia příliš brzy).
    const { App } = require('expo-router/build/qualified-entry');
    renderRootComponent(App);
  });
