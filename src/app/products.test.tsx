import { Linking } from 'react-native';
import { createMMKV } from 'react-native-mmkv';
import * as Keychain from 'react-native-keychain';
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react-native';
import App from '@app/App';
import { navigationRef } from '@app/navigation/RootNavigator';
import { store } from '@app/store/store';
import { logout } from '@entities/session';
import { favoritesSlice } from '@features/toggle-favorite';

// The products unit end to end: list, search, paging, details, favourites and
// their wipe on logout. Part of the unit, so it goes when the unit is removed.
const TOTAL = 30;

const makeProduct = (id: number) => ({
  id,
  title: id === 3 ? 'Blue Phone' : `Product ${id}`,
  price: id * 10,
  rating: 4.5,
  thumbnail: `https://cdn.test/${id}/thumb.png`,
  description: `About product ${id}`,
  brand: 'Acme',
  category: 'things',
  stock: 5,
  images: [`https://cdn.test/${id}/1.png`, `https://cdn.test/${id}/2.png`],
});

const summary = ({
  id,
  title,
  price,
  rating,
  thumbnail,
}: ReturnType<typeof makeProduct>) => ({
  id,
  title,
  price,
  rating,
  thumbnail,
});

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

let detailsOffline = false;

const fakeServer = async (
  input: string | Request,
  init?: RequestInit,
): Promise<Response> => {
  const request = new Request(input, init);
  const url = new URL(request.url);
  const path = url.pathname;

  if (path === '/auth/refresh') {
    return json(200, {
      accessToken: 'access-emilys-2',
      refreshToken: 'refresh-emilys-2',
    });
  }
  if (path === '/auth/me') {
    return json(200, {
      id: 1,
      username: 'emilys',
      email: 'e@test',
      firstName: 'Emily',
      lastName: 'Test',
    });
  }
  if (path === '/products' || path === '/products/search') {
    const query = (url.searchParams.get('q') ?? '').toLowerCase();
    const limit = Number(url.searchParams.get('limit'));
    const skip = Number(url.searchParams.get('skip'));
    const all = Array.from({ length: TOTAL }, (_, i) =>
      makeProduct(i + 1),
    ).filter(p => p.title.toLowerCase().includes(query));
    return json(200, {
      products: all.slice(skip, skip + limit).map(summary),
      total: all.length,
      skip,
      limit,
    });
  }
  const match = /^\/products\/(\d+)$/.exec(path);
  if (match) {
    if (detailsOffline) {
      throw new TypeError('Network request failed');
    }
    return json(200, makeProduct(Number(match[1])));
  }
  return json(404, { message: 'Not found' });
};

const account = () => createMMKV({ id: 'account' });

const requestedPaths = () =>
  jest.mocked(globalThis.fetch).mock.calls.map(([input, init]) => {
    const url = new URL(new Request(input as string, init).url);
    return `${url.pathname}${url.search}`;
  });

const launchSignedIn = async ({ atHome = true } = {}) => {
  createMMKV({ id: 'device' }).set('app.installed', '{"v":1,"d":true}');
  await Keychain.setGenericPassword('auth.refreshToken', 'refresh-emilys-1', {
    service: 'auth.refreshToken',
  });
  await render(<App />);
  if (atHome) {
    await screen.findByText('Hi, Emily');
  }
};

describe('products', () => {
  // See App.test.tsx: RTK Query's timers must not hold the worker open.
  const realSetTimeout = globalThis.setTimeout;
  beforeAll(() => {
    globalThis.setTimeout = ((...args: Parameters<typeof setTimeout>) => {
      const timer = realSetTimeout(...args);
      (timer as unknown as { unref?: () => void }).unref?.();
      return timer;
    }) as typeof setTimeout;
  });

  afterAll(() => {
    globalThis.setTimeout = realSetTimeout;
  });

  beforeEach(() => {
    detailsOffline = false;
    globalThis.fetch = jest.fn(fakeServer) as typeof fetch;
  });

  afterEach(async () => {
    screen.unmount();
    await logout(store.dispatch);
    createMMKV({ id: 'device' }).clearAll();
    jest.restoreAllMocks();
  });

  it('lists products, loads the next page at the end and searches', async () => {
    await launchSignedIn();
    await fireEvent.press(screen.getByTestId('tab-products'));

    expect(await screen.findByText('Product 1')).toBeOnTheScreen();
    expect(requestedPaths()).toContain(
      '/products?limit=20&skip=0&select=title%2Cprice%2Crating%2Cthumbnail',
    );

    await fireEvent(screen.getByTestId('product-list'), 'onEndReached');
    await waitFor(() =>
      expect(requestedPaths()).toContain(
        '/products?limit=20&skip=20&select=title%2Cprice%2Crating%2Cthumbnail',
      ),
    );

    await fireEvent.changeText(screen.getByTestId('product-search'), 'blue');
    expect(await screen.findByText('Blue Phone')).toBeOnTheScreen();
    await waitFor(() => expect(screen.queryByText('Product 1')).toBeNull());
    expect(
      requestedPaths().some(
        p => p.startsWith('/products/search?') && p.includes('q=blue'),
      ),
    ).toBe(true);
  });

  it('favourites a product from its details and keeps it for the Favorites tab', async () => {
    await launchSignedIn();
    await fireEvent.press(screen.getByTestId('tab-products'));
    await fireEvent.press(await screen.findByTestId('product-3'));

    const details = await screen.findByTestId('product-details');
    expect(within(details).getByText('About product 3')).toBeOnTheScreen();
    await fireEvent.press(
      within(details).getByRole('button', { name: 'Add to favourites' }),
    );
    expect(await screen.findByText('Added to favourites')).toBeOnTheScreen();

    // Stored as the summary only, in account scope.
    expect(JSON.parse(account().getString('favorites') ?? '')).toEqual({
      v: 1,
      d: [summary(makeProduct(3))],
    });

    // Jest's native stack has no header to press, so go back directly.
    await act(() => navigationRef.goBack());
    await fireEvent.press(screen.getByTestId('tab-favorites'));
    const list = await screen.findByTestId('favorites-list');
    expect(within(list).getByText('Blue Phone')).toBeOnTheScreen();

    await fireEvent.press(
      within(list).getByRole('button', { name: 'Remove from favourites' }),
    );
    expect(await screen.findByText('No favourites yet')).toBeOnTheScreen();
  });

  it('opens a product from a deep link and still shows a favourite offline', async () => {
    // Saved earlier, so it is on disk and in the store before launch. Seeded
    // through the store rather than a first render: with RNTL 14, repeated
    // unmount-and-render cycles in one test left later renders empty.
    store.dispatch(
      favoritesSlice.actions.favoriteToggled(summary(makeProduct(3))),
    );
    detailsOffline = true;
    jest
      .mocked(Linking.getInitialURL)
      .mockResolvedValueOnce('rn-foundation-dev://products/3');

    await launchSignedIn({ atHome: false });

    const details = await screen.findByTestId('product-details');
    expect(within(details).getByText('Blue Phone')).toBeOnTheScreen();
    expect(
      within(details).getByText(
        'Details will appear once you are back online.',
      ),
    ).toBeOnTheScreen();
  });

  it('wipes favourites on logout', async () => {
    await launchSignedIn();
    await fireEvent.press(screen.getByTestId('tab-products'));
    await fireEvent.press(await screen.findByTestId('favorite-1'));
    expect(store.getState().favorites.items).toHaveLength(1);

    await fireEvent.press(screen.getByTestId('tab-settings'));
    await fireEvent.press(screen.getByTestId('settings-logout'));
    await fireEvent.press(screen.getByTestId('logout-dialog-confirm'));
    await screen.findByTestId('login-submit');

    expect(store.getState().favorites.items).toEqual([]);
    expect(account().contains('favorites')).toBe(false);
  });
});
