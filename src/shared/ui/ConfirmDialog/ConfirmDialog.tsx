import { View } from 'react-native';
import { useTranslation } from '@shared/lib/i18n';
import { Button } from '../Button';
import { Modal } from '../Modal';
import { Text } from '../Text';
import { makeStyles } from '../theme';

type Props = {
  visible: boolean;
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

const useStyles = makeStyles(({ spacing }) => ({
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'flex-end',
  },
}));

export function ConfirmDialog({
  visible,
  title,
  message,
  confirmLabel,
  cancelLabel,
  destructive = false,
  loading = false,
  onConfirm,
  onCancel,
}: Props) {
  const styles = useStyles();
  const { t } = useTranslation();

  return (
    <Modal visible={visible} onRequestClose={onCancel} dismissible={!loading}>
      <Text variant="subtitle" accessibilityRole="header">
        {title}
      </Text>
      {message ? <Text color="textSecondary">{message}</Text> : null}
      <View style={styles.actions}>
        <Button
          title={cancelLabel ?? t('cancel')}
          variant="ghost"
          disabled={loading}
          onPress={onCancel}
        />
        <Button
          title={confirmLabel ?? t('confirm')}
          variant={destructive ? 'destructive' : 'primary'}
          loading={loading}
          onPress={onConfirm}
        />
      </View>
    </Modal>
  );
}
