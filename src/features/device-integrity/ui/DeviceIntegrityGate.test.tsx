import JailMonkey from 'jail-monkey';
import { createMMKV } from 'react-native-mmkv';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { common, initI18n } from '@shared/lib/i18n';
import { ThemeProvider } from '@shared/ui';
import { deviceIntegrityStrings } from '../i18n';
import type { IntegrityPolicy } from '../model/deviceIntegrity';
import { DeviceIntegrityGate } from './DeviceIntegrityGate';

const renderGate = (policy: IntegrityPolicy) =>
  render(
    <ThemeProvider>
      <DeviceIntegrityGate policy={policy} />
    </ThemeProvider>,
  );

describe('DeviceIntegrityGate', () => {
  beforeAll(() => {
    initI18n({ common, deviceIntegrity: deviceIntegrityStrings });
  });

  beforeEach(() => {
    createMMKV({ id: 'device' }).clearAll();
    jest.mocked(JailMonkey.isJailBroken).mockReturnValue(true);
  });

  afterEach(() => {
    jest.mocked(JailMonkey.isJailBroken).mockReturnValue(false);
  });

  it('blocks a rooted device with no way through', async () => {
    await renderGate('block');

    expect(screen.getByTestId('device-integrity-blocked')).toBeOnTheScreen();
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('warns once, and remembers the answer on the device', async () => {
    await renderGate('warn');

    await fireEvent.press(screen.getByTestId('device-integrity-acknowledge'));

    expect(screen.queryByTestId('device-integrity-acknowledge')).toBeNull();
    expect(
      createMMKV({ id: 'device' }).getString('deviceIntegrity.acknowledged'),
    ).toBe('{"v":1,"d":true}');
  });

  it('does not warn again after it was acknowledged', async () => {
    createMMKV({ id: 'device' }).set(
      'deviceIntegrity.acknowledged',
      '{"v":1,"d":true}',
    );
    await renderGate('warn');

    expect(screen.queryByTestId('device-integrity-acknowledge')).toBeNull();
  });

  it('does not run the check when the policy is off', async () => {
    jest.mocked(JailMonkey.isJailBroken).mockClear();
    await renderGate('off');

    expect(JailMonkey.isJailBroken).not.toHaveBeenCalled();
  });
});
