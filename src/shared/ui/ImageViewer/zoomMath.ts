// Worklets: they run on the UI thread during gestures and in Jest as plain code.

export const MIN_SCALE = 1;
export const MAX_SCALE = 4;
export const DOUBLE_TAP_SCALE = 2.5;
export const DISMISS_DISTANCE = 120;
export const DISMISS_VELOCITY = 800;

export const clampScale = (scale: number): number => {
  'worklet';
  return Math.min(Math.max(scale, MIN_SCALE), MAX_SCALE);
};

// How far a zoomed image may move before its edge would leave the screen.
export const clampTranslate = (
  offset: number,
  scale: number,
  size: number,
): number => {
  'worklet';
  const limit = Math.max((size * (scale - 1)) / 2, 0);
  return Math.min(Math.max(offset, -limit), limit);
};

export const nextDoubleTapScale = (scale: number): number => {
  'worklet';
  return scale > MIN_SCALE + 0.01 ? MIN_SCALE : DOUBLE_TAP_SCALE;
};

// A long enough drag, or a quick flick, downwards closes the viewer.
export const shouldDismiss = (
  translationY: number,
  velocityY: number,
): boolean => {
  'worklet';
  return translationY > DISMISS_DISTANCE || velocityY > DISMISS_VELOCITY;
};
