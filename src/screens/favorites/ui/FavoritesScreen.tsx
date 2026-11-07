import { FlatList, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ProductCard } from '@entities/product';
import { FavoriteButton, useFavorites } from '@features/toggle-favorite';
import { useTranslation } from '@shared/lib/i18n';
import { EmptyState, makeStyles } from '@shared/ui';

const useStyles = makeStyles(({ colors, spacing }) => ({
  screen: { backgroundColor: colors.background, flex: 1 },
  list: { flexGrow: 1, gap: spacing.sm, padding: spacing.md },
}));

// Reads only from the store, which is loaded from disk at launch, so this tab
// works with no connection at all.
export function FavoritesScreen() {
  const styles = useStyles();
  const { t } = useTranslation('favorites');
  const navigation = useNavigation();
  const favorites = useFavorites();

  return (
    <View style={styles.screen}>
      <FlatList
        testID="favorites-list"
        data={favorites}
        keyExtractor={item => String(item.id)}
        renderItem={({ item }) => (
          <ProductCard
            product={item}
            onPress={() =>
              navigation.navigate('ProductDetails', { id: item.id })
            }
            action={<FavoriteButton product={item} />}
          />
        )}
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
