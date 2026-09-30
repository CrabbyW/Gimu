// Fáze 3: přechod na Rive. Postup je v README, sekce „Přechod na Rive“.
// rive-react-native neběží v Expo Go (potřebuje development build), proto je import zakomentovaný.
// import Rive, { type RiveRef } from 'rive-react-native';
//
// Mapování (spec §8):
//   stage       → number input `stage` (1–3)
//   mood        → trigger `happy` | `celebrate` | `sad`; idle = výchozí stav state machine
//   kosmetika   → number input pro každý slot = Cosmetic.variantIndex (0 = nic)
// Výpočet vstupů je v riveInputs.ts a je pokrytý testem.
//
// export function RiveMascot(props) {
//   const ref = useRef<RiveRef>(null);
//   const { numbers, trigger } = riveInputs(props, variantOf);
//   useEffect(() => { for (const [k, v] of Object.entries(numbers)) ref.current?.setInputState('Mascot', k, v); }, [numbers]);
//   useEffect(() => { if (trigger) ref.current?.fireState('Mascot', trigger); }, [trigger]);
//   return <Rive ref={ref} resourceName="opice" stateMachineName="Mascot" style={{ width: px, height: px }} />;
// }
import { SvgMascot } from './SvgMascot';
import type { MascotProps } from './types';

/** Stub: dokud neběží Rive, vykreslí SvgMascot se stejnými props. `variantOf` použije až Rive. */
export function RiveMascot({ variantOf: _variantOf, ...props }: MascotProps & { variantOf?: (id: string) => number }) {
  return <SvgMascot {...props} />;
}
