import { env } from '@shared/config';
import { getAccessToken } from '../tokens';
import { createSocketClient, type SocketClient } from './socketClient';

const noop = () => undefined;

// Without SOCKET_URL the app has no realtime connection, and every call is a
// no-op, so features can use the socket without checking the environment.
const offline: SocketClient = {
  start: noop,
  stop: noop,
  emit: noop,
  on: () => noop,
  wake: noop,
  status: () => 'idle',
  onStatus: () => noop,
};

export const socket: SocketClient = env.SOCKET_URL
  ? createSocketClient({ url: env.SOCKET_URL, getToken: getAccessToken })
  : offline;
