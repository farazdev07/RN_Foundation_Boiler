import { memo, useCallback, useState } from 'react';
import { RefreshControl, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import {
  ProductCard,
  useGetProductsInfiniteQuery,
  type ProductSummary,
} from '@entities/product';
import { FavoriteButton } from '@features/toggle-favorite';
import { getErrorMessage } from '@shared/api';
import { useDebounce } from '@shared/lib/debounce';
import { useTranslation } from '@shared/lib/i18n';
import {
  EmptyState,
  Icon,
  List,
  ListFooterSpinner,
  Skeleton,
  TextInput,
  makeStyles,
  useInfiniteQueryList,
  useResponsiveValue,
  useTheme,
} from '@shared/ui';

const SEARCH_DELAY_MS = 300;

const useStyles = makeStyles(({ colors, spacing }) => ({
  screen: { backgroundColor: colors.background, flex: 1 },
  search: { padding: spacing.md, paddingBottom: spacing.sm },
  // Half the gap on every side of a row, and the other half on the list, so
  // rows and columns end up one full gap apart.
  list: { paddingBottom: spacing.md, paddingHorizontal: spacing.md / 2 },
  row: { flex: 1, padding: spacing.sm / 2, paddingHorizontal: spacing.md / 2 },
  skeletons: { gap: spacing.sm, padding: spacing.md, paddingTop: 0 },
}));

type RowProps = { product: ProductSummary; onOpen: (id: number) => void };

// Memoised, with stable props, so typing in the search field or loading the
// next page re-renders only the rows whose product changed.
function ProductRowView({ product, onOpen }: RowProps) {
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

const ProductRow = memo(ProductRowView);

type ProductPage = { products: ProductSummary[] };

const selectProducts = (page: ProductPage) => page.products;
const keyOf = (product: ProductSummary) => String(product.id);

export function ProductListScreen() {
  const styles = useStyles();
  const { colors } = useTheme();
  const { t } = useTranslation('productList');
  const navigation = useNavigation();
  const [search, setSearch] = useState('');
  const query = useDebounce(search.trim(), SEARCH_DELAY_MS);
  // One column on a phone, two once the window is tablet-wide.
  const columns = useResponsiveValue({ compact: 1, medium: 2 });

  const products = useGetProductsInfiniteQuery(query);
  const { error, isLoading, refetch } = products;
  const list = useInfiniteQueryList(products, selectProducts);

  const open = useCallback(
    (id: number) => navigation.navigate('ProductDetails', { id }),
    [navigation],
  );

  const renderItem = useCallback(
    ({ item }: { item: ProductSummary }) => (
      <ProductRow product={item} onOpen={open} />
    ),
    [open],
  );

  const renderEmpty = () => {
    if (error) {
      return (
        <EmptyState
          icon="wifi-off"
          title={t('errorTitle')}
          message={getErrorMessage(error)}
          actionLabel={t('retry')}
          onAction={() => refetch()}
        />
      );
    }
    return (
      <EmptyState
        icon="search-x"
        title={t('emptyTitle')}
        {...(query && { message: t('emptySearch', { query }) })}
      />
    );
  };

  return (
    <View style={styles.screen}>
      <View style={styles.search}>
        <TextInput
          testID="product-search"
          value={search}
          onChangeText={setSearch}
          placeholder={t('searchPlaceholder')}
          accessibilityLabel={t('searchPlaceholder')}
          autoCorrect={false}
          returnKeyType="search"
          clearButtonMode="while-editing"
          start={<Icon name="search" size={18} color="textSecondary" />}
        />
      </View>
      {isLoading ? (
        <View style={styles.skeletons} testID="product-list-loading">
          {Array.from({ length: 6 }, (_, index) => (
            <Skeleton key={index} height={80} />
          ))}
        </View>
      ) : (
        <List
          testID="product-list"
          data={list.items}
          keyExtractor={keyOf}
          renderItem={renderItem}
          numColumns={columns}
          contentContainerStyle={styles.list}
          keyboardDismissMode="on-drag"
          ListEmptyComponent={renderEmpty}
          ListFooterComponent={<ListFooterSpinner loading={list.loadingMore} />}
          onEndReached={list.onEndReached}
          onEndReachedThreshold={0.5}
          refreshControl={
            <RefreshControl
              refreshing={list.refreshing}
              onRefresh={list.onRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
        />
      )}
    </View>
  );
}
