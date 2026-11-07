import {
  ActivityIndicator,
  StyleSheet,
  View,
  type ActivityIndicatorProps,
} from 'react-native';
import { useTheme, type ColorTokens } from '../theme';

type Props = Omit<ActivityIndicatorProps, 'color'> & {
  color?: keyof ColorTokens;
};

export function Spinner({ color = 'primary', ...rest }: Props) {
  const { colors } = useTheme();

  return <ActivityIndicator color={colors[color]} {...rest} />;
}

// For a list's ListFooterComponent: renders only while the next page loads.
export function ListFooterSpinner({
  loading,
  ...rest
}: Props & { loading: boolean }) {
  if (!loading) {
    return null;
  }

  return (
    <View style={styles.footer}>
      <Spinner {...rest} />
    </View>
  );
}

const styles = StyleSheet.create({
  footer: {
    alignItems: 'center',
    paddingVertical: 16,
  },
});
