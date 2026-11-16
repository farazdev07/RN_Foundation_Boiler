import { useEffect } from 'react';
import { CaptureProtection } from 'react-native-capture-protection';
import { env } from '@shared/config';
import { reportError } from '@shared/lib/monitoring';

// Counted, so two protected screens on the stack do not undo each other: the
// protection lifts only when the last one lets go.
let holders = 0;

const isEnabled = (): boolean => env.SCREEN_PROTECTION === 'on';

// Blocks screenshots and screen recording, and hides the app in the app
// switcher, until the returned function is called. On Android this is
// FLAG_SECURE on the window. On iOS a screenshot comes out blank and a
// recording shows a cover; iOS has no supported way to refuse either outright.
// Does nothing unless SCREEN_PROTECTION is "on".
export const protectScreen = (): (() => void) => {
  if (!isEnabled()) {
    return () => undefined;
  }
  holders += 1;
  if (holders === 1) {
    CaptureProtection.prevent({
      screenshot: true,
      record: true,
      appSwitcher: true,
    }).catch(reportError);
  }
  let released = false;
  return () => {
    if (released) {
      return;
    }
    released = true;
    holders -= 1;
    if (holders === 0) {
      CaptureProtection.allow().catch(reportError);
    }
  };
};

// Protects for as long as the component is mounted. For a screen that should
// be protected only while it is in front, call `protectScreen` from
// `useFocusEffect` instead.
export const useScreenProtection = (active: boolean = true): void => {
  useEffect(() => (active ? protectScreen() : undefined), [active]);
};
