import { fireEvent, screen } from '@testing-library/react-native';
import { renderWithTheme } from '../testing/renderWithTheme';
import { Button } from './index';

describe('Button', () => {
  it('fires onPress', async () => {
    const onPress = jest.fn();
    await renderWithTheme(<Button title="Save" onPress={onPress} />);

    await fireEvent.press(screen.getByRole('button', { name: 'Save' }));

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it.each([
    ['disabled', { disabled: true }],
    ['loading', { loading: true }],
  ])('ignores presses while %s', async (_name, props) => {
    const onPress = jest.fn();
    await renderWithTheme(<Button title="Save" onPress={onPress} {...props} />);

    await fireEvent.press(screen.getByRole('button', { name: 'Save' }));

    expect(onPress).not.toHaveBeenCalled();
  });

  it('announces its busy state', async () => {
    await renderWithTheme(<Button title="Save" loading />);

    const button = screen.getByRole('button', { name: 'Save' });

    expect(button).toBeBusy();
    expect(button).toBeDisabled();
  });

  it.each(['primary', 'secondary', 'ghost', 'destructive'] as const)(
    'renders the %s variant with an icon',
    async variant => {
      await renderWithTheme(
        <Button title="Go" variant={variant} icon="house" />,
      );

      expect(screen.getByText('Go')).toBeOnTheScreen();
    },
  );
});
