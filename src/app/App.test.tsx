import { render, screen } from '@testing-library/react-native';
import App from '@app/App';

describe('App', () => {
  it('renders the first screen through the real provider stack', async () => {
    await render(<App />);

    expect(await screen.findByText('RN Foundation')).toBeOnTheScreen();
  });
});
