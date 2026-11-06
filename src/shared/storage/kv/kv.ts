import { createMMKV } from 'react-native-mmkv';
import type { z } from 'zod';
import { devWarn } from '@shared/lib/logger';

// cache: disposable, a version change is simply a miss.
// user: the user's own data, so a version change must not silently lose it.
export type KeyKind = 'cache' | 'user';
// device: survives logout. account: wiped on logout.
export type KeyScope = 'device' | 'account';

type KeyDefinition<T> = {
  name: string;
  schema: z.ZodType<T>;
  version: number;
  kind: KeyKind;
  scope: KeyScope;
  // Upgrades data written by an older version. Only meaningful for user data.
  migrate?: (stored: unknown, fromVersion: number) => unknown;
};

export type StorageKey<T> = {
  get: () => T | undefined;
  set: (value: T) => void;
  remove: () => void;
};

type Envelope = { v: number; d: unknown };

// Separate instances, so logout is one clearAll and account data cannot survive
// it by being left out of some list of keys.
const stores: Record<KeyScope, ReturnType<typeof createMMKV>> = {
  device: createMMKV({ id: 'device' }),
  account: createMMKV({ id: 'account' }),
};

const isEnvelope = (value: unknown): value is Envelope =>
  typeof value === 'object' &&
  value !== null &&
  typeof (value as Envelope).v === 'number' &&
  'd' in value;

const readEnvelope = (raw: string): Envelope | undefined => {
  try {
    const parsed: unknown = JSON.parse(raw);
    return isEnvelope(parsed) ? parsed : undefined;
  } catch {
    return undefined;
  }
};

export function defineKey<T>({
  name,
  schema,
  version,
  kind,
  scope,
  migrate,
}: KeyDefinition<T>): StorageKey<T> {
  const store = stores[scope];

  const set = (value: T): void => {
    store.set(name, JSON.stringify({ v: version, d: value }));
  };

  const remove = (): void => {
    store.remove(name);
  };

  const discard = (reason: string): undefined => {
    devWarn(`storage: discarding "${name}": ${reason}`);
    remove();
    return undefined;
  };

  // User data that cannot be read right now stays on disk, so a later release
  // with a fixed migration can still recover it.
  const keep = (reason: string): undefined => {
    devWarn(`storage: leaving "${name}" unread: ${reason}`);
    return undefined;
  };

  const upgrade = ({ v, d }: Envelope): T | undefined => {
    if (kind === 'cache') {
      return discard(`version ${v} is not ${version}`);
    }
    if (!migrate || v > version) {
      return keep(`no migration from version ${v} to ${version}`);
    }

    try {
      const parsed = schema.safeParse(migrate(d, v));
      if (!parsed.success) {
        return keep(`migration from version ${v} produced an invalid shape`);
      }
      set(parsed.data);
      return parsed.data;
    } catch {
      return keep(`migration from version ${v} threw`);
    }
  };

  const get = (): T | undefined => {
    const raw = store.getString(name);
    if (raw === undefined) {
      return undefined;
    }

    const envelope = readEnvelope(raw);
    if (!envelope) {
      return discard('stored value is not readable');
    }
    if (envelope.v !== version) {
      return upgrade(envelope);
    }

    const parsed = schema.safeParse(envelope.d);
    return parsed.success ? parsed.data : discard('stored shape is invalid');
  };

  return { get, set, remove };
}

export const clearAccountStorage = (): void => {
  stores.account.clearAll();
};
