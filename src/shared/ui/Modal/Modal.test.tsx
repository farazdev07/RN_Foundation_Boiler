import { Text } from 'react-native';
import { fireEvent, screen } from '@testing-library/react-native';
import { renderWithTheme } from '../testing/renderWithTheme';
import { Modal } from './index';

describe('Modal', () => {
  it('shows its content when visible', async () => {
    await renderWithTheme(
      <Modal visible onRequestClose={jest.fn()}>
        <Text>Body</Text>
      </Modal>,
    );

    expect(screen.getByText('Body')).toBeOnTheScreen();
  });

  it('closes from the backdrop when dismissible', async () => {
    const onRequestClose = jest.fn();
    await renderWithTheme(
      <Modal visible onRequestClose={onRequestClose}>
        <Text>Body</Text>
      </Modal>,
    );

    await fireEvent.press(screen.getByRole('button', { name: 'Close' }));

    expect(onRequestClose).toHaveBeenCalled();
  });

  it('ignores the backdrop when not dismissible', async () => {
    const onRequestClose = jest.fn();
    await renderWithTheme(
      <Modal visible dismissible={false} onRequestClose={onRequestClose}>
        <Text>Body</Text>
      </Modal>,
    );

    await fireEvent.press(screen.getByRole('button', { name: 'Close' }));

    expect(onRequestClose).not.toHaveBeenCalled();
  });
});
