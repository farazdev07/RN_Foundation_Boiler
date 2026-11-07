import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import { useTranslation } from '@shared/lib/i18n';
import { Icon, Image, Text, makeStyles } from '@shared/ui';
import { formatPrice } from '../lib/format';
import type { ProductSummary } from '../model/product';

type Props = {
  product: ProductSummary;
  onPress: () => void;
  // A slot for an action from a feature, such as the favourite button. The
  // entity cannot import features, so the screen passes it in.
  action?: ReactNode;
};

const useStyles = makeStyles(({ colors, radii, spacing }) => ({
  card: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.sm,
  },
  pressed: { opacity: 0.7 },
  thumbnail: { borderRadius: radii.sm, height: 64, width: 64 },
  body: { flex: 1, gap: spacing.xs },
  meta: { alignItems: 'center', flexDirection: 'row', gap: spacing.xs },
}));

export function ProductCard({ product, onPress, action }: Props) {
  const styles = useStyles();
  const { t } = useTranslation('product');
  const price = formatPrice(product.price);

  return (
    <View style={styles.card}>
      <Pressable
        testID={`product-${product.id}`}
        accessibilityRole="button"
        accessibilityLabel={`${product.title}, ${price}`}
        onPress={onPress}
        style={({ pressed }) => [
          styles.body,
          styles.meta,
          pressed && styles.pressed,
        ]}
      >
        <Image source={{ uri: product.thumbnail }} style={styles.thumbnail} />
        <View style={styles.body}>
          <Text variant="label" numberOfLines={2}>
            {product.title}
          </Text>
          <Text color="textSecondary">{price}</Text>
          <View
            style={styles.meta}
            accessible
            accessibilityLabel={t('rating', { rating: product.rating })}
          >
            <Icon name="star" size={14} color="textSecondary" />
            <Text variant="caption" color="textSecondary">
              {product.rating.toFixed(1)}
            </Text>
          </View>
        </View>
      </Pressable>
      {action}
    </View>
  );
}
