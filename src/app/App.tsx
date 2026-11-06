import { AppServices } from '@app/services/AppServices';
import { RootNavigator } from '@app/navigation/RootNavigator';
import { AppProviders } from '@app/providers/AppProviders';

export default function App() {
  return (
    <AppProviders>
      <AppServices />
      <RootNavigator />
    </AppProviders>
  );
}
