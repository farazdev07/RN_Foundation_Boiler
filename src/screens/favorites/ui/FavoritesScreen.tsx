import { memo, useCallback } from 'react';
import { View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ProductCard, type ProductSummary } from '@entities/product';
import { FavoriteButton, useFavorites } from '@features/toggle-favorite';
import { useTranslation } from '@shared/lib/i18n';
import { EmptyState, List, makeStyles, useResponsiveValue } from '@shared/ui';

const useStyles = makeStyles(({ colors, spacing }) => ({
  screen: { backgroundColor: colors.background, flex: 1 },
  list: { padding: spacing.md / 2 },
  row: { flex: 1, padding: spacing.sm / 2, paddingHorizontal: spacing.md / 2 },
}));

type RowProps = { product: ProductSummary; onOpen: (id: number) => void };

function FavoriteRowView({ product, onOpen }: RowProps) {
  const styles = useStyles();

  return (
    <View style={styles.row}>
      <ProductCard
        product={product}
        onPress={() => onOpen(product.id)}
        action={<FavoriteButton product={product} />}
      />
    </View>
  );
}

const FavoriteRow = memo(FavoriteRowView);

const keyOf = (product: ProductSummary) => String(product.id);

// Reads only from the store, which is loaded from disk at launch, so this tab
// works with no connection at all.
export function FavoritesScreen() {
  const styles = useStyles();
  const { t } = useTranslation('favorites');
  const navigation = useNavigation();
  const favorites = useFavorites();
  const columns = useResponsiveValue({ compact: 1, medium: 2 });

  const open = useCallback(
    (id: number) => navigation.navigate('ProductDetails', { id }),
    [navigation],
  );

  const renderItem = useCallback(
    ({ item }: { item: ProductSummary }) => (
      <FavoriteRow product={item} onOpen={open} />
    ),
    [open],
  );

  return (
    <View style={styles.screen}>
      <List
        testID="favorites-list"
        data={favorites}
        keyExtractor={keyOf}
        renderItem={renderItem}
        numColumns={columns}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <EmptyState
            icon="heart"
            title={t('emptyTitle')}
            message={t('emptyMessage')}
          />
        }
      />
    </View>
  );
}
