import { fireEvent, screen } from '@testing-library/react-native';
import { renderWithTheme } from '../testing/renderWithTheme';
import { Checkbox } from './index';

describe('Checkbox', () => {
  it.each([true, false])('toggles from %s', async checked => {
    const onChange = jest.fn();
    await renderWithTheme(
      <Checkbox label="Remember me" checked={checked} onChange={onChange} />,
    );

    const box = screen.getByRole('checkbox', { name: 'Remember me' });
    await fireEvent.press(box);

    expect(onChange).toHaveBeenCalledWith(!checked);
  });

  it('reports its state', async () => {
    await renderWithTheme(
      <Checkbox label="Remember me" checked onChange={jest.fn()} />,
    );

    expect(screen.getByRole('checkbox', { name: 'Remember me' })).toBeChecked();
  });

  it('ignores presses when disabled', async () => {
    const onChange = jest.fn();
    await renderWithTheme(
      <Checkbox
        label="Remember me"
        checked={false}
        onChange={onChange}
        disabled
      />,
    );

    await fireEvent.press(
      screen.getByRole('checkbox', { name: 'Remember me' }),
    );

    expect(onChange).not.toHaveBeenCalled();
  });
});
