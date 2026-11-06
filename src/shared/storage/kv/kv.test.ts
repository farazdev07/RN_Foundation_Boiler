import { createMMKV } from 'react-native-mmkv';
import { z } from 'zod';
import { clearAccountStorage, defineKey } from '@shared/storage';

const schema = z.object({ count: z.number() });

const device = createMMKV({ id: 'device' });
const account = createMMKV({ id: 'account' });

const cacheKey = (version = 1) =>
  defineKey({ name: 'k', schema, version, kind: 'cache', scope: 'device' });

const write = (value: string) => device.set('k', value);

describe('defineKey', () => {
  beforeEach(() => {
    device.clearAll();
    account.clearAll();
    jest.spyOn(console, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('round-trips a value', () => {
    const key = cacheKey();

    key.set({ count: 1 });

    expect(key.get()).toEqual({ count: 1 });
  });

  it('returns undefined for a key never written', () => {
    expect(cacheKey().get()).toBeUndefined();
  });

  it('removes a value', () => {
    const key = cacheKey();
    key.set({ count: 1 });

    key.remove();

    expect(key.get()).toBeUndefined();
  });

  describe('corrupt data is a miss, not a crash', () => {
    it.each([
      ['unparseable JSON', '{not json'],
      ['JSON without an envelope', '{"count":1}'],
      ['a JSON primitive', '42'],
      ['the wrong shape', '{"v":1,"d":{"count":"one"}}'],
    ])('for %s, and the value is deleted', (_name, raw) => {
      write(raw);

      expect(cacheKey().get()).toBeUndefined();
      expect(device.contains('k')).toBe(false);
    });
  });

  describe('cache keys', () => {
    it('treat a version change as a miss and delete the value', () => {
      cacheKey(1).set({ count: 1 });

      expect(cacheKey(2).get()).toBeUndefined();
      expect(device.contains('k')).toBe(false);
    });
  });

  describe('user keys', () => {
    const userKey = (migrate?: (stored: unknown, from: number) => unknown) =>
      defineKey({
        name: 'k',
        schema,
        version: 2,
        kind: 'user',
        scope: 'device',
        ...(migrate && { migrate }),
      });

    beforeEach(() => {
      write('{"v":1,"d":{"total":5}}');
    });

    it('migrate old data and persist the upgrade', () => {
      const migrate = jest.fn((stored: unknown) => ({
        count: (stored as { total: number }).total,
      }));

      expect(userKey(migrate).get()).toEqual({ count: 5 });
      expect(migrate).toHaveBeenCalledWith({ total: 5 }, 1);
      expect(device.getString('k')).toBe('{"v":2,"d":{"count":5}}');
    });

    it.each([
      ['there is no migration', undefined],
      [
        'the migration throws',
        () => {
          throw new Error('boom');
        },
      ],
      ['the migration returns a bad shape', () => ({ count: 'five' })],
    ])('keep the stored data when %s', (_name, migrate) => {
      expect(userKey(migrate).get()).toBeUndefined();
      expect(device.getString('k')).toBe('{"v":1,"d":{"total":5}}');
    });

    it('do not run a migration on data from a newer version', () => {
      write('{"v":3,"d":{"count":1}}');
      const migrate = jest.fn();

      expect(userKey(migrate).get()).toBeUndefined();
      expect(migrate).not.toHaveBeenCalled();
      expect(device.contains('k')).toBe(true);
    });
  });

  describe('clearAccountStorage', () => {
    it('wipes account keys and leaves device keys', () => {
      const accountKey = defineKey({
        name: 'a',
        schema,
        version: 1,
        kind: 'user',
        scope: 'account',
      });
      const deviceKey = defineKey({
        name: 'd',
        schema,
        version: 1,
        kind: 'user',
        scope: 'device',
      });
      accountKey.set({ count: 1 });
      deviceKey.set({ count: 2 });

      clearAccountStorage();

      expect(accountKey.get()).toBeUndefined();
      expect(deviceKey.get()).toEqual({ count: 2 });
    });

    it('also wipes values no key definition knows about', () => {
      account.set('orphan', 'left behind');

      clearAccountStorage();

      expect(account.contains('orphan')).toBe(false);
    });
  });
});
