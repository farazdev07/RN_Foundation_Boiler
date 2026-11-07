import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toSummary, type ProductSummary } from '@entities/product';
import { useTranslation } from '@shared/lib/i18n';
import { showToast } from '@shared/ui';
import {
  favoriteToggled,
  selectFavorites,
  selectIsFavorite,
} from './favoritesSlice';

export const useFavorites = (): ProductSummary[] =>
  useSelector(selectFavorites);

export const useIsFavorite = (id: number): boolean =>
  useSelector(selectIsFavorite(id));

export const useToggleFavorite = () => {
  const dispatch = useDispatch();
  const { t } = useTranslation('favorite');

  return useCallback(
    (product: ProductSummary, isFavorite: boolean) => {
      // A full product arrives from the details screen; only the summary is kept.
      dispatch(favoriteToggled(toSummary(product)));
      showToast(t(isFavorite ? 'removed' : 'added'), 'success');
    },
    [dispatch, t],
  );
};
