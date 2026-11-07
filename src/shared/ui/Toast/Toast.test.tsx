import { act, fireEvent, screen } from '@testing-library/react-native';
import { renderWithTheme } from '../testing/renderWithTheme';
import { hideToast, showToast, ToastViewport } from './index';

describe('Toast', () => {
  afterEach(async () => {
    await act(async () => hideToast());
    jest.useRealTimers();
  });

  it('shows a message and dismisses on tap', async () => {
    await renderWithTheme(<ToastViewport />);

    await act(async () => showToast('Saved', 'success'));
    expect(screen.getByText('Saved')).toBeOnTheScreen();

    await fireEvent.press(screen.getByRole('alert'));
    expect(screen.queryByText('Saved')).toBeNull();
  });

  it('hides itself after a few seconds', async () => {
    jest.useFakeTimers();
    await renderWithTheme(<ToastViewport />);

    await act(async () => showToast('Saved'));
    await act(async () => jest.advanceTimersByTime(3000));

    expect(screen.queryByText('Saved')).toBeNull();
  });

  it('renders only in the newest viewport, so it sits above a modal', async () => {
    await renderWithTheme(
      <>
        <ToastViewport />
        <ToastViewport />
      </>,
    );

    await act(async () => showToast('Once', 'error'));

    expect(screen.getAllByText('Once')).toHaveLength(1);
  });

  it('returns to the root viewport when a modal closes', async () => {
    function Harness({ modalOpen }: { modalOpen: boolean }) {
      return (
        <>
          <ToastViewport />
          {modalOpen ? <ToastViewport /> : null}
        </>
      );
    }
    const { rerender } = await renderWithTheme(<Harness modalOpen />);

    await rerender(<Harness modalOpen={false} />);
    await act(async () => showToast('Back'));

    expect(screen.getAllByText('Back')).toHaveLength(1);
  });
});
