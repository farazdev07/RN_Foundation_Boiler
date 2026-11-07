import { fireEvent, screen } from '@testing-library/react-native';
import { common, initI18n } from '@shared/lib/i18n';
import { renderWithTheme } from '../testing/renderWithTheme';
import { ConfirmDialog } from './index';

describe('ConfirmDialog', () => {
  beforeAll(() => {
    initI18n({ common });
  });

  it('confirms and cancels with default labels', async () => {
    const onConfirm = jest.fn();
    const onCancel = jest.fn();
    await renderWithTheme(
      <ConfirmDialog
        visible
        title="Log out?"
        message="You will need to sign in again."
        onConfirm={onConfirm}
        onCancel={onCancel}
      />,
    );

    await fireEvent.press(screen.getByRole('button', { name: 'Confirm' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Cancel' }));

    expect(
      screen.getByText('You will need to sign in again.'),
    ).toBeOnTheScreen();
    expect(onConfirm).toHaveBeenCalled();
    expect(onCancel).toHaveBeenCalled();
  });

  it('blocks both actions while confirming', async () => {
    const onCancel = jest.fn();
    await renderWithTheme(
      <ConfirmDialog
        visible
        destructive
        loading
        title="Delete?"
        confirmLabel="Delete"
        cancelLabel="Keep"
        onConfirm={jest.fn()}
        onCancel={onCancel}
      />,
    );

    await fireEvent.press(screen.getByRole('button', { name: 'Keep' }));

    expect(onCancel).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Delete' })).toBeBusy();
  });
});
