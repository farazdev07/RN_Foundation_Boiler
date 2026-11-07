import { useEffect, useState } from 'react';
import BootSplash from 'react-native-bootsplash';
import { RootNavigator } from '@app/navigation/RootNavigator';
import { AppProviders } from '@app/providers/AppProviders';
import { AppServices } from '@app/services/AppServices';
import { AnimatedSplash } from '@app/splash/AnimatedSplash'; // @unit:splash-animation

export default function App() {
  // Navigation is ready only after the saved session has been checked, so the
  // native splash covers the restore and never shows the wrong screen.
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (ready) {
      BootSplash.hide().catch(() => undefined);
    }
  }, [ready]);

  return (
    <AppProviders>
      <AppServices />
      <RootNavigator onReady={() => setReady(true)} />
      {/* @unit-start:splash-animation */}
      <AnimatedSplash ready={ready} />
      {/* @unit-end:splash-animation */}
    </AppProviders>
  );
}
