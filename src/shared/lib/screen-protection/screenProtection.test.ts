import { CaptureProtection } from 'react-native-capture-protection';
import { renderHook } from '@testing-library/react-native';
import { env } from '@shared/config';
import {
  protectScreen,
  useScreenProtection,
} from '@shared/lib/screen-protection';

const prevent = jest.mocked(CaptureProtection.prevent);
const allow = jest.mocked(CaptureProtection.allow);

describe('screen protection', () => {
  beforeEach(() => {
    env.SCREEN_PROTECTION = 'on';
    prevent.mockClear();
    allow.mockClear();
  });

  afterEach(() => {
    delete env.SCREEN_PROTECTION;
  });

  it('protects on the first holder and lifts only when the last one lets go', () => {
    const releaseFirst = protectScreen();
    const releaseSecond = protectScreen();

    expect(prevent).toHaveBeenCalledTimes(1);
    expect(prevent).toHaveBeenCalledWith({
      screenshot: true,
      record: true,
      appSwitcher: true,
    });

    releaseFirst();
    expect(allow).not.toHaveBeenCalled();

    releaseSecond();
    expect(allow).toHaveBeenCalledTimes(1);
  });

  it('ignores a release that is called twice', () => {
    const releaseFirst = protectScreen();
    const releaseSecond = protectScreen();

    releaseFirst();
    releaseFirst();
    expect(allow).not.toHaveBeenCalled();

    releaseSecond();
  });

  it('protects while a component is mounted', async () => {
    const hook = await renderHook(() => useScreenProtection());
    expect(prevent).toHaveBeenCalledTimes(1);

    await hook.unmount();
    expect(allow).toHaveBeenCalledTimes(1);
  });

  it('does nothing when the env switch is off', () => {
    env.SCREEN_PROTECTION = 'off';

    protectScreen()();

    expect(prevent).not.toHaveBeenCalled();
    expect(allow).not.toHaveBeenCalled();
  });
});
