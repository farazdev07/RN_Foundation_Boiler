import { Pressable } from 'react-native';
import type { ProductSummary } from '@entities/product';
import { useTranslation } from '@shared/lib/i18n';
import { Icon, makeStyles } from '@shared/ui';
import { useIsFavorite, useToggleFavorite } from '../model/hooks';

type Props = { product: ProductSummary };

const useStyles = makeStyles(({ spacing }) => ({
  // At least 44 points, the smallest comfortable touch target.
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    minWidth: 44,
    padding: spacing.sm,
  },
  pressed: { opacity: 0.6 },
}));

export function FavoriteButton({ product }: Props) {
  const styles = useStyles();
  const { t } = useTranslation('favorite');
  const isFavorite = useIsFavorite(product.id);
  const toggle = useToggleFavorite();

  return (
    <Pressable
      testID={`favorite-${product.id}`}
      accessibilityRole="button"
      accessibilityLabel={t(isFavorite ? 'remove' : 'add')}
      accessibilityState={{ selected: isFavorite }}
      hitSlop={8}
      onPress={() => toggle(product, isFavorite)}
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}
    >
      <Icon
        name="heart"
        size={22}
        color={isFavorite ? 'error' : 'textSecondary'}
      />
    </Pressable>
  );
}
