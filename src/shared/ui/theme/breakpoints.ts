import { useWindowDimensions } from 'react-native';

// Window width classes, not device types: a phone in landscape or a tablet in
// split view lands in whichever class its window is. The limits follow the
// Material window size classes.
export const breakpoints = { compact: 0, medium: 600, expanded: 840 } as const;

export type Breakpoint = keyof typeof breakpoints;

// Widest first, so the first match is the class.
const ORDER: readonly Breakpoint[] = ['expanded', 'medium', 'compact'];

export const breakpointFor = (width: number): Breakpoint =>
  ORDER.find(name => width >= breakpoints[name]) ?? 'compact';

export type Responsive<T> = { compact: T } & Partial<Record<Breakpoint, T>>;

// The value for this class, or the nearest narrower one that was given.
export const pickResponsive = <T>(
  values: Responsive<T>,
  breakpoint: Breakpoint,
): T => {
  const narrower = ORDER.slice(ORDER.indexOf(breakpoint));
  const match = narrower.find(name => values[name] !== undefined);
  return match ? (values[match] as T) : values.compact;
};

// Re-renders when the window changes class, such as on rotation or split view.
export const useBreakpoint = (): Breakpoint =>
  breakpointFor(useWindowDimensions().width);

// useResponsiveValue({ compact: 1, medium: 2 }) gives 2 on medium and expanded.
export const useResponsiveValue = <T>(values: Responsive<T>): T =>
  pickResponsive(values, useBreakpoint());
