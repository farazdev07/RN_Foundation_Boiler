import { fireEvent, screen } from '@testing-library/react-native';
import { renderWithTheme } from '../testing/renderWithTheme';
import { RadioGroup } from './index';

const options = [
  { value: 'system', label: 'System' },
  { value: 'dark', label: 'Dark' },
] as const;

describe('RadioGroup', () => {
  it('marks only the selected option', async () => {
    await renderWithTheme(
      <RadioGroup
        label="Theme"
        options={options}
        value="dark"
        onChange={jest.fn()}
      />,
    );

    expect(screen.getByRole('radio', { name: 'Dark' })).toBeChecked();
    expect(screen.getByRole('radio', { name: 'System' })).not.toBeChecked();
  });

  it('reports the chosen value', async () => {
    const onChange = jest.fn();
    await renderWithTheme(
      <RadioGroup
        label="Theme"
        options={options}
        value={null}
        onChange={onChange}
      />,
    );

    await fireEvent.press(screen.getByRole('radio', { name: 'System' }));

    expect(onChange).toHaveBeenCalledWith('system');
  });
});
