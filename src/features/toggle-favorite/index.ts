export { favorite as favoriteStrings } from './i18n/en';
export {
  favoritesPersistence,
  favoritesSlice,
  loadFavorites,
  type FavoritesState,
} from './model/favoritesSlice';
export { useFavorites } from './model/hooks';
export { FavoriteButton } from './ui/FavoriteButton';
