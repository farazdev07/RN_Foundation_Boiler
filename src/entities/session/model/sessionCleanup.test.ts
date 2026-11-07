import {
  onSessionEnd,
  wipeSessionData,
  whenSessionWiped,
} from './sessionCleanup';

describe('wipeSessionData', () => {
  it('runs wipes one at a time and settles only when all are done', async () => {
    const order: string[] = [];
    let release: () => void = () => undefined;
    const firstBlocks = new Promise<void>(resolve => {
      release = resolve;
    });
    let calls = 0;
    const unregister = onSessionEnd(async () => {
      calls += 1;
      const call = calls;
      order.push(`start ${call}`);
      if (call === 1) {
        await firstBlocks;
      }
      order.push(`end ${call}`);
    });
    const dispatch = jest.fn();

    const first = wipeSessionData(dispatch);
    const second = wipeSessionData(dispatch);
    let settled = false;
    whenSessionWiped().then(() => {
      settled = true;
    });

    await Promise.resolve();
    expect(settled).toBe(false);

    release();
    await Promise.all([first, second]);
    await whenSessionWiped();

    expect(order).toEqual(['start 1', 'end 1', 'start 2', 'end 2']);
    expect(settled).toBe(true);
    unregister();
  });

  it('keeps going after a cleanup fails', async () => {
    const unregister = onSessionEnd(() => {
      throw new Error('cleanup failed');
    });

    await expect(wipeSessionData(jest.fn())).resolves.toBeUndefined();
    unregister();
  });
});
