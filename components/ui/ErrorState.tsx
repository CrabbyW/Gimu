import type { Edge } from 'react-native-safe-area-context';
import { StateView } from './StateView';

interface Props {
  /** Co se nepodařilo načíst, ve 4. pádě (`copy.common.loadTarget.*`). Nepoužije se, když je zadané `message`. */
  what?: string;
  /** Vlastní zpráva místo standardního „Nepodařilo se načíst …“ (např. zamčená lekce). */
  message?: string;
  /** Popisek akčního tlačítka; výchozí je `copy.common.retry`. */
  actionLabel?: string;
  onRetry(): void;
  /** Safe-area hrany; uvnitř tabu pod `TabHeader` předat `[]`, jinak se inset zdvojí. */
  edges?: readonly Edge[];
}

/** Jednotný chybový stav obrazovky (spec §9, elite fáze 4): opička + co selhalo + co udělat + Retry. Tenký obal `StateView`. */
export function ErrorState(props: Props) {
  return <StateView kind="error" {...props} />;
}
