// Worklets, so the same maths runs on the UI thread during a drag and in tests.

export const clamp = (value: number, lower: number, upper: number): number => {
  'worklet';
  return Math.min(Math.max(value, lower), upper);
};

// Rounds to the nearest step counted from `min`, then keeps it in range.
export const snap = (
  value: number,
  min: number,
  max: number,
  step: number,
): number => {
  'worklet';
  const stepped = min + Math.round((value - min) / step) * step;
  // Trims float noise such as 0.30000000000000004.
  return clamp(Number(stepped.toFixed(10)), min, max);
};

export const toPosition = (
  value: number,
  min: number,
  max: number,
  track: number,
): number => {
  'worklet';
  return max === min ? 0 : ((value - min) / (max - min)) * track;
};

export const toValue = (
  position: number,
  min: number,
  max: number,
  track: number,
): number => {
  'worklet';
  return track <= 0
    ? min
    : min + (clamp(position, 0, track) / track) * (max - min);
};
