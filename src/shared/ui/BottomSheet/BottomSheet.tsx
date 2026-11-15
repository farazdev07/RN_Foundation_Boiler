import { useEffect, useId, useRef, type PropsWithChildren } from 'react';
import { View } from 'react-native';
import { TrueSheet, type SheetDetent } from '@lodev09/react-native-true-sheet';
import { useDirection } from '@shared/lib/i18n';
import { reportError } from '@shared/lib/monitoring';
import { Text } from '../Text';
import { makeStyles, useTheme } from '../theme';

type Props = PropsWithChildren<{
  visible: boolean;
  // Called when the sheet has closed, whether the app closed it or the user
  // dragged it down or tapped outside. Set `visible` to false here.
  onClose: () => void;
  title?: string;
  // Heights the sheet rests at: 'auto' fits the content; a number from 0 to 1
  // is a fraction of the screen.
  snapPoints?: SheetDetent[];
  // False for a sheet the user must answer rather than swipe away.
  dismissible?: boolean;
  testID?: string;
}>;

const useStyles = makeStyles(({ spacing }) => ({
  content: { gap: spacing.md, padding: spacing.lg },
}));

const DEFAULT_SNAP_POINTS: SheetDetent[] = ['auto'];

// The platform's own sheet (see ADR 0013), driven by `visible` like Modal.
export function BottomSheet({
  visible,
  onClose,
  title,
  snapPoints = DEFAULT_SNAP_POINTS,
  dismissible = true,
  testID,
  children,
}: Props) {
  const styles = useStyles();
  const { colors, radii } = useTheme();
  const sheet = useRef<TrueSheet>(null);
  // The sheet is its own native root, so the direction is set again here.
  const direction = useDirection();
  const name = useId();
  // What the native sheet was last told, so a re-render does not present it
  // twice and a user's swipe is not answered with a second dismiss.
  const presented = useRef(false);

  useEffect(() => {
    if (visible === presented.current) {
      return;
    }
    presented.current = visible;
    const change = visible
      ? sheet.current?.present()
      : sheet.current?.dismiss();
    change?.catch(reportError);
  }, [visible]);

  return (
    <TrueSheet
      ref={sheet}
      name={name}
      testID={testID}
      detents={snapPoints}
      dismissible={dismissible}
      grabber={dismissible}
      cornerRadius={radii.lg}
      backgroundColor={colors.surface}
      onDidDismiss={() => {
        presented.current = false;
        onClose();
      }}
    >
      <View style={[styles.content, { direction }]}>
        {title ? (
          <Text variant="subtitle" accessibilityRole="header">
            {title}
          </Text>
        ) : null}
        {children}
      </View>
    </TrueSheet>
  );
}
