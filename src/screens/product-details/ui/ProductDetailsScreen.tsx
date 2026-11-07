import { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';
import {
  useIsFocused,
  useNavigation,
  type StaticScreenProps,
} from '@react-navigation/native';
import { formatPrice, useGetProductQuery } from '@entities/product';
import { FavoriteButton, useFavorites } from '@features/toggle-favorite';
import { getErrorMessage, type AppError } from '@shared/api';
import { useTranslation } from '@shared/lib/i18n';
import {
  Carousel,
  EmptyState,
  Icon,
  Image,
  ImageViewer,
  Screen,
  Skeleton,
  Text,
  makeStyles,
} from '@shared/ui';

type Props = StaticScreenProps<{ id: number }>;

const useStyles = makeStyles(({ radii, spacing }) => ({
  content: { gap: spacing.md },
  image: { aspectRatio: 1, borderRadius: radii.md },
  heading: { alignItems: 'flex-start', flexDirection: 'row', gap: spacing.sm },
  title: { flex: 1, gap: spacing.xs },
  meta: { alignItems: 'center', flexDirection: 'row', gap: spacing.xs },
}));

export function ProductDetailsScreen({ route }: Props) {
  const { id } = route.params;
  const styles = useStyles();
  const { t } = useTranslation('productDetails');
  const navigation = useNavigation();
  const focused = useIsFocused();
  const { data: product, error, isLoading, refetch } = useGetProductQuery(id);
  // A favourite was saved with its summary, so it can still show offline.
  const saved = useFavorites().find(item => item.id === id);
  const summary = product ?? saved;
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);

  useEffect(() => {
    if (summary) {
      navigation.setOptions({ title: summary.title });
    }
  }, [navigation, summary]);

  if (!summary) {
    return (
      <Screen belowHeader>
        {isLoading ? (
          <View style={styles.content} testID="product-details-loading">
            <Skeleton height={320} />
            <Skeleton height={24} width="70%" />
            <Skeleton height={16} width="40%" />
          </View>
        ) : (
          <EmptyState
            icon="wifi-off"
            title={t('errorTitle')}
            {...(error && { message: getErrorMessage(error as AppError) })}
            actionLabel={t('retry')}
            onAction={() => refetch()}
          />
        )}
      </Screen>
    );
  }

  const images = product?.images.length ? product.images : [summary.thumbnail];

  return (
    <Screen belowHeader scrollable>
      <View style={styles.content} testID="product-details">
        <Carousel
          testID="product-images"
          data={images}
          autoPlay={false}
          paused={!focused || viewerIndex !== null}
          keyExtractor={uri => uri}
          renderItem={({ item, index, width }) => (
            <Pressable
              accessibilityRole="imagebutton"
              accessibilityLabel={t('openImage', {
                index: index + 1,
                count: images.length,
              })}
              onPress={() => setViewerIndex(index)}
            >
              <Image
                source={{ uri: item }}
                style={[styles.image, { width }]}
                resizeMode="contain"
              />
            </Pressable>
          )}
        />
        <View style={styles.heading}>
          <View style={styles.title}>
            <Text variant="subtitle">{summary.title}</Text>
            {product?.brand ? (
              <Text color="textSecondary">{product.brand}</Text>
            ) : null}
          </View>
          <FavoriteButton product={summary} />
        </View>
        <Text variant="title">{formatPrice(summary.price)}</Text>
        <View style={styles.meta}>
          <Icon name="star" size={16} color="textSecondary" />
          <Text color="textSecondary">{summary.rating.toFixed(1)}</Text>
          {product ? (
            <Text color="textSecondary">
              {' · '}
              {product.stock > 0
                ? t('inStock', { count: product.stock })
                : t('outOfStock')}
            </Text>
          ) : null}
        </View>
        {product ? (
          <Text>{product.description}</Text>
        ) : (
          <Text color="textSecondary">{t('offline')}</Text>
        )}
      </View>
      <ImageViewer
        images={images.map(uri => ({ uri }))}
        visible={viewerIndex !== null}
        initialIndex={viewerIndex ?? 0}
        onClose={() => setViewerIndex(null)}
        closeLabel={t('closeImage')}
      />
    </Screen>
  );
}
