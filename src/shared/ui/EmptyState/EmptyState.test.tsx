import { fireEvent, screen } from '@testing-library/react-native';
import { renderWithTheme } from '../testing/renderWithTheme';
import { EmptyState } from './index';

describe('EmptyState', () => {
  it('shows the title alone', async () => {
    await renderWithTheme(<EmptyState title="No results" />);

    expect(screen.getByText('No results')).toBeOnTheScreen();
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('shows a message, icon and working action', async () => {
    const onAction = jest.fn();
    await renderWithTheme(
      <EmptyState
        title="No results"
        message="Try another search"
        icon="search"
        actionLabel="Clear"
        onAction={onAction}
      />,
    );

    await fireEvent.press(screen.getByRole('button', { name: 'Clear' }));

    expect(screen.getByText('Try another search')).toBeOnTheScreen();
    expect(onAction).toHaveBeenCalledTimes(1);
  });
});
