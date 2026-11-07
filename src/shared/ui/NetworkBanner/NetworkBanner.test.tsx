import NetInfo from '@react-native-community/netinfo';
import { act, screen } from '@testing-library/react-native';
import { common, initI18n } from '@shared/lib/i18n';
import { renderWithTheme } from '../testing/renderWithTheme';
import { NetworkBanner } from './index';

describe('NetworkBanner', () => {
  beforeAll(() => {
    initI18n({ common });
  });

  it('appears only while offline', async () => {
    let emit: (state: object) => void = () => undefined;
    jest.mocked(NetInfo.addEventListener).mockImplementationOnce(listener => {
      emit = listener as (state: object) => void;
      return jest.fn();
    });
    await renderWithTheme(<NetworkBanner />);

    expect(screen.queryByText("You're offline")).toBeNull();

    await act(async () =>
      emit({ isConnected: false, isInternetReachable: null }),
    );
    expect(screen.getByText("You're offline")).toBeOnTheScreen();

    await act(async () =>
      emit({ isConnected: true, isInternetReachable: true }),
    );
    expect(screen.queryByText("You're offline")).toBeNull();
  });
});
