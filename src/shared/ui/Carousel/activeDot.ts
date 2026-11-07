// With more slides than dots, the active dot moves proportionally, so one is
// always lit instead of the indicator running out past the last dot.
export const activeDotIndex = (
  index: number,
  slideCount: number,
  maxDots: number,
): number => {
  const dots = Math.min(slideCount, maxDots);
  if (dots <= 1) {
    return 0;
  }
  if (slideCount <= maxDots) {
    return Math.min(Math.max(index, 0), dots - 1);
  }
  const ratio = Math.min(Math.max(index, 0), slideCount - 1) / (slideCount - 1);
  return Math.round(ratio * (dots - 1));
};
