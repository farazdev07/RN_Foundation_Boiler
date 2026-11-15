import { RELOCK_AFTER_MS, shouldRelock } from './relock';

describe('shouldRelock', () => {
  it('does not lock an app that never left', () => {
    expect(shouldRelock(null, 1_000_000)).toBe(false);
  });

  it('locks once the absence reaches the limit, not before', () => {
    expect(shouldRelock(0, RELOCK_AFTER_MS - 1)).toBe(false);
    expect(shouldRelock(0, RELOCK_AFTER_MS)).toBe(true);
  });

  it('takes a custom limit, where 0 locks on every return', () => {
    expect(shouldRelock(500, 500, 0)).toBe(true);
  });
});
