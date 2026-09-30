import { View } from 'react-native';
import { TabHeader } from '@/components/ui/TabHeader';
import { copy } from '@/data/copy';
import { useTheme } from '@/theme';

/** Kostra tabu (Task 19). Obsah, loading a ErrorState doplní navazující task plánu B. */
export default function LeagueScreen() {
  const { c } = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: c.base }}>
      <TabHeader title={copy.tabs.league} />
    </View>
  );
}
