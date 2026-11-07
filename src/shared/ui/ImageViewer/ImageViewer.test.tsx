import { fireEvent, screen } from '@testing-library/react-native';
import { renderWithTheme } from '../testing/renderWithTheme';
import { ImageViewer } from './index';
import {
  DOUBLE_TAP_SCALE,
  MAX_SCALE,
  clampScale,
  clampTranslate,
  nextDoubleTapScale,
  shouldDismiss,
} from './zoomMath';

const images = [
  { uri: 'https://cdn.test/1.png' },
  { uri: 'https://cdn.test/2.png' },
  { uri: 'https://cdn.test/3.png' },
];

describe('zoomMath', () => {
  it('keeps the scale between 1x and the maximum', () => {
    expect(clampScale(0.5)).toBe(1);
    expect(clampScale(2)).toBe(2);
    expect(clampScale(10)).toBe(MAX_SCALE);
  });

  it('stops a zoomed image at its edges and centres an unzoomed one', () => {
    expect(clampTranslate(500, 2, 400)).toBe(200);
    expect(clampTranslate(-500, 2, 400)).toBe(-200);
    expect(clampTranslate(50, 2, 400)).toBe(50);
    expect(clampTranslate(50, 1, 400)).toBe(0);
  });

  it('double tap zooms in, and out again', () => {
    expect(nextDoubleTapScale(1)).toBe(DOUBLE_TAP_SCALE);
    expect(nextDoubleTapScale(DOUBLE_TAP_SCALE)).toBe(1);
  });

  it('closes on a long drag or a quick flick down only', () => {
    expect(shouldDismiss(200, 0)).toBe(true);
    expect(shouldDismiss(20, 1500)).toBe(true);
    expect(shouldDismiss(40, 100)).toBe(false);
    expect(shouldDismiss(-300, -2000)).toBe(false);
  });
});

describe('ImageViewer', () => {
  it('opens at the given image and counts as it pages', async () => {
    await renderWithTheme(
      <ImageViewer
        visible
        images={images}
        initialIndex={1}
        onClose={jest.fn()}
      />,
    );

    expect(screen.getByText('2 / 3')).toBeOnTheScreen();

    await fireEvent(
      screen.getByTestId('image-viewer-pager'),
      'momentumScrollEnd',
      {
        nativeEvent: { contentOffset: { x: 750 * 2, y: 0 } },
      },
    );

    expect(screen.getByText('3 / 3')).toBeOnTheScreen();
  });

  it('closes from the close button', async () => {
    const onClose = jest.fn();
    await renderWithTheme(
      <ImageViewer visible images={images} onClose={onClose} />,
    );

    await fireEvent.press(screen.getByRole('button', { name: 'Close' }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('shows no counter for a single image', async () => {
    await renderWithTheme(
      <ImageViewer visible images={images.slice(0, 1)} onClose={jest.fn()} />,
    );

    expect(screen.queryByText(/\d \/ \d/)).toBeNull();
  });
});
