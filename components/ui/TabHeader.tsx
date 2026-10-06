import { Settings } from 'lucide-react-native';
import { copy } from '@/data/copy';
import { ScreenHeader } from './ScreenHeader';

interface Props {
  title: string;
  /** Ozubené kolo nastavení vpravo (kulaté tlačítko 44). Jen Profil; ostatní taby ho nemají. */
  onSettings?(): void;
  /** Nástup hlavičky (viz ScreenHeader). */
  intro?: boolean;
}

/** Hlavička tabu = ScreenHeader (Nothing Dot §2.3): Doto titulek vlevo, volitelně kulaté tlačítko nastavení. */
export function TabHeader({ title, onSettings, intro }: Props) {
  return (
    <ScreenHeader
      title={title}
      intro={intro}
      actions={onSettings ? [{ icon: Settings, label: copy.header.settings, onPress: onSettings }] : undefined}
    />
  );
}
