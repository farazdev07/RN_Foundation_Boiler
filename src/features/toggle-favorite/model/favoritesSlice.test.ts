import { configureStore } from '@reduxjs/toolkit';
import { createMMKV } from 'react-native-mmkv';
import {
  favoriteToggled,
  favoritesPersistence,
  favoritesSlice,
  loadFavorites,
  selectFavorites,
} from './favoritesSlice';

const product = (id: number) => ({
  id,
  title: `Product ${id}`,
  price: 10,
  rating: 4,
  thumbnail: 't.png',
});

const makeStore = () =>
  configureStore({
    reducer: { favorites: favoritesSlice.reducer },
    preloadedState: { favorites: loadFavorites() },
    middleware: getDefault =>
      getDefault().prepend(favoritesPersistence.middleware),
  });

beforeEach(() => {
  createMMKV({ id: 'account' }).clearAll();
});

describe('favorites', () => {
  it('adds newest first and removes on a second toggle', () => {
    const store = makeStore();
    store.dispatch(favoriteToggled(product(1)));
    store.dispatch(favoriteToggled(product(2)));
    expect(selectFavorites(store.getState()).map(p => p.id)).toEqual([2, 1]);

    store.dispatch(favoriteToggled(product(1)));
    expect(selectFavorites(store.getState()).map(p => p.id)).toEqual([2]);
  });

  it('survives a restart through the preloaded state', () => {
    const first = makeStore();
    first.dispatch(favoriteToggled(product(7)));

    const second = makeStore();
    expect(selectFavorites(second.getState())).toEqual([product(7)]);
  });

  it('starts empty when the stored list is unreadable', () => {
    createMMKV({ id: 'account' }).set('favorites', 'not json');
    expect(loadFavorites()).toEqual({ items: [] });
  });
});
