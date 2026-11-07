import { fireEvent, screen } from '@testing-library/react-native';
import { renderWithTheme } from '../testing/renderWithTheme';
import { Select } from './index';

const options = [
  { value: 'pk', label: 'Pakistan' },
  { value: 'ae', label: 'United Arab Emirates' },
  { value: 'gb', label: 'United Kingdom' },
] as const;

type Country = (typeof options)[number]['value'];

describe('Select', () => {
  it('shows the placeholder, then picks one value and closes', async () => {
    const onChange = jest.fn();
    await renderWithTheme(
      <Select<Country>
        label="Country"
        placeholder="Choose"
        options={options}
        value={null}
        onChange={onChange}
      />,
    );

    expect(screen.getByText('Choose')).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('button', { name: 'Country' }));
    await fireEvent.press(screen.getByRole('radio', { name: 'Pakistan' }));

    expect(onChange).toHaveBeenCalledWith('pk');
    expect(screen.queryByRole('radio', { name: 'Pakistan' })).toBeNull();
  });

  it('filters options by search text', async () => {
    await renderWithTheme(
      <Select<Country>
        label="Country"
        options={options}
        value="pk"
        searchable
        onChange={jest.fn()}
      />,
    );

    await fireEvent.press(screen.getByRole('button', { name: 'Country' }));
    await fireEvent.changeText(screen.getByLabelText('Search'), 'united');

    expect(screen.queryByRole('radio', { name: 'Pakistan' })).toBeNull();
    expect(
      screen.getByRole('radio', { name: 'United Kingdom' }),
    ).toBeOnTheScreen();
  });

  it('toggles several values in multiple mode', async () => {
    const onChange = jest.fn();
    await renderWithTheme(
      <Select<Country>
        label="Countries"
        options={options}
        multiple
        value={['pk']}
        onChange={onChange}
      />,
    );

    expect(screen.getByText('Pakistan')).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('button', { name: 'Countries' }));
    await fireEvent.press(
      screen.getByRole('checkbox', { name: 'United Kingdom' }),
    );
    await fireEvent.press(screen.getByRole('checkbox', { name: 'Pakistan' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Done' }));

    expect(onChange).toHaveBeenNthCalledWith(1, ['pk', 'gb']);
    expect(onChange).toHaveBeenNthCalledWith(2, []);
  });

  it('shows an error and ignores presses when disabled', async () => {
    await renderWithTheme(
      <Select<Country>
        label="Country"
        options={options}
        value={null}
        error="Required"
        disabled
        onChange={jest.fn()}
      />,
    );

    await fireEvent.press(screen.getByRole('button', { name: 'Country' }));

    expect(screen.getByText('Required')).toBeOnTheScreen();
    expect(screen.queryByRole('radio')).toBeNull();
  });
});
