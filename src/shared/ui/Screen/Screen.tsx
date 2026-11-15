import type { PropsWithChildren } from 'react';
import { ScrollView, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';
import { makeStyles } from '../theme';

type Props = PropsWithChildren<{
  // A native header already pads for the status bar; adding the top inset again
  // would leave an empty band under it.
  belowHeader?: boolean;
  scrollable?: boolean;
  // Scrolls focused inputs clear of the keyboard. Implies scrollable.
  keyboardAware?: boolean;
  padded?: boolean;
  // Content is centred in a readable column on wide windows. Turn this on for
  // a screen that lays out its own columns, such as a grid.
  fullWidth?: boolean;
}>;

const ALL_EDGES: readonly Edge[] = ['top', 'right', 'bottom', 'left'];
const BELOW_HEADER_EDGES: readonly Edge[] = ['right', 'bottom', 'left'];

const useStyles = makeStyles(({ colors, layout, spacing }) => ({
  screen: { backgroundColor: colors.background, flex: 1 },
  content: { flexGrow: 1 },
  padded: { padding: spacing.md },
  column: {
    alignSelf: 'center',
    maxWidth: layout.maxContentWidth,
    width: '100%',
  },
}));

export function Screen({
  belowHeader = false,
  scrollable = false,
  keyboardAware = false,
  padded = true,
  fullWidth = false,
  children,
}: Props) {
  const styles = useStyles();
  const content = [
    styles.content,
    padded && styles.padded,
    !fullWidth && styles.column,
  ];

  return (
    <SafeAreaView
      edges={belowHeader ? BELOW_HEADER_EDGES : ALL_EDGES}
      style={styles.screen}
    >
      {keyboardAware ? (
        <KeyboardAwareScrollView
          contentContainerStyle={content}
          keyboardShouldPersistTaps="handled"
        >
          {children}
        </KeyboardAwareScrollView>
      ) : scrollable ? (
        <ScrollView
          contentContainerStyle={content}
          keyboardShouldPersistTaps="handled"
        >
          {children}
        </ScrollView>
      ) : (
        <View style={content}>{children}</View>
      )}
    </SafeAreaView>
  );
}
