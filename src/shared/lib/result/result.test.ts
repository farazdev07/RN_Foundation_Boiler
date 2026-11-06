import { err, ok } from '@shared/lib/result';

describe('Result', () => {
  it('wraps a value', () => {
    expect(ok(1)).toEqual({ ok: true, value: 1 });
  });

  it('wraps an error', () => {
    expect(err('nope')).toEqual({ ok: false, error: 'nope' });
  });
});
