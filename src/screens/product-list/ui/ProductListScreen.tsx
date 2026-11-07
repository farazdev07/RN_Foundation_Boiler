import { useState } from 'react';
import { FlatList, RefreshControl, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import {
  ProductCard,
  useGetProductsInfiniteQuery,
  type ProductSummary,
} from '@entities/product';
import { FavoriteButton } from '@features/toggle-favorite';
import { getErrorMessage, type AppError } from '@shared/api';
import { useDebounce } from '@shared/lib/debounce';
import { useTranslation } from '@shared/lib/i18n';
import {
  EmptyState,
  Icon,
  ListFooterSpinner,
  Skeleton,
  TextInput,
  makeStyles,
  useTheme,
} from '@shared/ui';

const SEARCH_DELAY_MS = 300;

const useStyles = makeStyles(({ colors, spacing }) => ({
  screen: { backgroundColor: colors.background, flex: 1 },
  search: { padding: spacing.md, paddingBottom: spacing.sm },
  list: { flexGrow: 1, gap: spacing.sm, padding: spacing.md, paddingTop: 0 },
  skeletons: { gap: spacing.sm, padding: spacing.md, paddingTop: 0 },
}));

export function ProductListScreen() {
  const styles = useStyles();
  const { colors } = useTheme();
  const { t } = useTranslation('productList');
  const navigation = useNavigation();
  const [search, setSearch] = useState('');
  const query = useDebounce(search.trim(), SEARCH_DELAY_MS);

  const {
    data,
    error,
    isLoading,
    isFetching,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch,
  } = useGetProductsInfiniteQuery(query);

  const products = data?.pages.flatMap(page => page.products) ?? [];
  const refreshing = isFetching && !isLoading && !isFetchingNextPage;

  const open = (product: ProductSummary) =>
    navigation.navigate('ProductDetails', { id: product.id });

  const renderEmpty = () => {
    if (error) {
      return (
        <EmptyState
          icon="wifi-off"
          title={t('errorTitle')}
          message={getErrorMessage(error as AppError)}
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
        <FlatList
          testID="product-list"
          data={products}
          keyExtractor={item => String(item.id)}
          renderItem={({ item }) => (
            <ProductCard
              product={item}
              onPress={() => open(item)}
              action={<FavoriteButton product={item} />}
            />
          )}
          contentContainerStyle={styles.list}
          keyboardDismissMode="on-drag"
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={renderEmpty}
          ListFooterComponent={
            <ListFooterSpinner loading={isFetchingNextPage} />
          }
          onEndReached={() => {
            if (hasNextPage && !isFetching) {
              fetchNextPage();
            }
          }}
          onEndReachedThreshold={0.5}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                refetch();
              }}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
        />
      )}
    </View>
  );
}
