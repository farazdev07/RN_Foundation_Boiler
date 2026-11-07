import {
  createListenerMiddleware,
  createSlice,
  type PayloadAction,
} from '@reduxjs/toolkit';
import { z } from 'zod';
import { productSummarySchema, type ProductSummary } from '@entities/product';
import { defineKey } from '@shared/storage';

export type FavoritesState = { items: ProductSummary[] };

type WithFavorites = { favorites: FavoritesState };

// Account scope, so logout deletes it with the rest of the user's data. The
// stored copy is the whole summary, which lets the list render offline.
const favoritesKey = defineKey({
  name: 'favorites',
  schema: z.array(productSummarySchema),
  version: 1,
  kind: 'user',
  scope: 'account',
});

const initialState: FavoritesState = { items: [] };

export const favoritesSlice = createSlice({
  name: 'favorites',
  initialState,
  reducers: {
    // Newest first, which is also the order the Favorites tab shows.
    favoriteToggled: (state, { payload }: PayloadAction<ProductSummary>) => {
      const index = state.items.findIndex(item => item.id === payload.id);
      if (index === -1) {
        state.items.unshift(payload);
      } else {
        state.items.splice(index, 1);
      }
    },
  },
});

export const { favoriteToggled } = favoritesSlice.actions;

export const selectFavorites = (state: WithFavorites): ProductSummary[] =>
  state.favorites.items;

export const selectIsFavorite =
  (id: number) =>
  (state: WithFavorites): boolean =>
    state.favorites.items.some(item => item.id === id);

// Read synchronously when the store is created, so the first render already
// has the saved favourites and there is no empty flash or loading state.
export const loadFavorites = (): FavoritesState => ({
  items: favoritesKey.get() ?? [],
});

// Writes after every change. The list is small, so a full rewrite is cheaper
// than tracking what changed.
export const favoritesPersistence = createListenerMiddleware();

favoritesPersistence.startListening({
  actionCreator: favoriteToggled,
  effect: (_action, api) => {
    favoritesKey.set(selectFavorites(api.getState() as WithFavorites));
  },
});
