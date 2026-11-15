import { renderWithTheme } from '../testing/renderWithTheme';
import { Image } from './index';

const mockCached = jest.fn((_props: object) => null);

jest.mock('react-native-turbo-image', () => ({
  __esModule: true,
  default: (props: object) => mockCached(props),
}));

describe('Image', () => {
  beforeEach(() => {
    mockCached.mockClear();
  });

  it('sends a remote image through the caching library, over a themed placeholder', async () => {
    await renderWithTheme(
      <Image source={{ uri: 'https://example.com/a.png' }} />,
    );

    expect(mockCached).toHaveBeenCalledWith(
      expect.objectContaining({
        source: { uri: 'https://example.com/a.png' },
        style: [{ backgroundColor: '#ECEEF2' }, undefined],
      }),
    );
  });

  it('renders a bundled image directly, since it needs no cache', async () => {
    await renderWithTheme(<Image source={1} accessibilityLabel="Logo" />);

    expect(mockCached).not.toHaveBeenCalled();
  });
});
