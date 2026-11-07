import { View } from 'react-native';
import { Button } from '../Button';
import { Icon, type IconName } from '../Icon';
import { Text } from '../Text';
import { makeStyles } from '../theme';

type Props = {
  title: string;
  message?: string;
  icon?: IconName;
  actionLabel?: string;
  onAction?: () => void;
};

const useStyles = makeStyles(({ spacing }) => ({
  container: {
    alignItems: 'center',
    flex: 1,
    gap: spacing.sm,
    justifyContent: 'center',
    padding: spacing.lg,
  },
}));

export function EmptyState({
  title,
  message,
  icon,
  actionLabel,
  onAction,
}: Props) {
  const styles = useStyles();

  return (
    <View style={styles.container}>
      {icon ? <Icon name={icon} size={40} color="textSecondary" /> : null}
      <Text variant="subtitle" align="center">
        {title}
      </Text>
      {message ? (
        <Text color="textSecondary" align="center">
          {message}
        </Text>
      ) : null}
      {actionLabel && onAction ? (
        <Button title={actionLabel} variant="ghost" onPress={onAction} />
      ) : null}
    </View>
  );
}
