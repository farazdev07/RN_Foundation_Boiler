import { screen } from '@testing-library/react-native';
import { renderWithTheme } from '../testing/renderWithTheme';
import { Icon } from './index';

describe('Icon', () => {
  it('exposes a label when it carries meaning', async () => {
    await renderWithTheme(<Icon name="house" accessibilityLabel="Home" />);

    expect(screen.getByLabelText('Home')).toBeOnTheScreen();
  });

  it('stays out of the accessibility tree when decorative', async () => {
    await renderWithTheme(<Icon name="house" color="primary" size={12} />);

    expect(screen.queryByLabelText('Home')).toBeNull();
  });
});
