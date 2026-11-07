/**
 * @jest-environment node
 */
import { createServer, type Server as HttpServer } from 'http';
import type { AddressInfo } from 'net';
import { Server, type Socket as ServerSocket } from 'socket.io';
import { createSocketClient, type SocketClient } from './socketClient';

// A real socket.io server in the test process, so the client is exercised over
// a real WebSocket rather than against a mock.
let http: HttpServer;
let io: Server;
let url: string;
let client: SocketClient | undefined;
const tokensSeen: (string | null)[] = [];
const received: unknown[] = [];

const waitFor = (check: () => boolean, ms = 3000) =>
  new Promise<void>((resolve, reject) => {
    const started = Date.now();
    const tick = () => {
      if (check()) {
        resolve();
      } else if (Date.now() - started > ms) {
        reject(new Error('Timed out'));
      } else {
        setTimeout(tick, 10);
      }
    };
    tick();
  });

beforeEach(async () => {
  tokensSeen.length = 0;
  received.length = 0;
  http = createServer();
  io = new Server(http);
  io.on('connection', (socket: ServerSocket) => {
    tokensSeen.push((socket.handshake.auth as { token: string | null }).token);
    socket.on('message', payload => received.push(payload));
    socket.on('ping-me', () => socket.emit('pong', { ok: true }));
  });
  await new Promise<void>(resolve => http.listen(0, resolve));
  url = `http://localhost:${(http.address() as AddressInfo).port}`;
});

afterEach(async () => {
  client?.stop();
  client = undefined;
  await new Promise<void>(resolve => io.close(() => resolve()));
});

describe('createSocketClient', () => {
  it('connects with the current access token', async () => {
    client = createSocketClient({ url, getToken: () => 'access-1' });

    client.start();
    await waitFor(() => client!.status() === 'connected');

    expect(tokensSeen).toEqual(['access-1']);
  });

  it('queues emits until connected, then sends them in order', async () => {
    client = createSocketClient({ url, getToken: () => 'access-1' });

    client.emit('message', 1);
    client.emit('message', 2);
    client.start();

    await waitFor(() => received.length === 2);
    expect(received).toEqual([1, 2]);
  });

  it('drops the oldest queued emits past the limit', async () => {
    client = createSocketClient({
      url,
      getToken: () => 'access-1',
      maxQueued: 2,
    });

    [1, 2, 3].forEach(n => client!.emit('message', n));
    client.start();

    await waitFor(() => received.length === 2);
    expect(received).toEqual([2, 3]);
  });

  it('keeps listeners added before connecting, and lets them unsubscribe', async () => {
    client = createSocketClient({ url, getToken: () => 'access-1' });
    const pongs: unknown[] = [];
    const unsubscribe = client.on('pong', payload => pongs.push(payload));

    client.start();
    await waitFor(() => client!.status() === 'connected');
    client.emit('ping-me');
    await waitFor(() => pongs.length === 1);

    unsubscribe();
    client.emit('ping-me');
    await new Promise(resolve => setTimeout(resolve, 100));
    expect(pongs).toEqual([{ ok: true }]);
  });

  it('reconnects by itself after a dropped connection, with a fresh token and its listeners', async () => {
    let token = 'access-1';
    client = createSocketClient({ url, getToken: () => token });
    const pongs: unknown[] = [];
    client.on('pong', payload => pongs.push(payload));
    client.start();
    await waitFor(() => client!.status() === 'connected');

    token = 'access-2';
    // Closes the transport, as a lost network would.
    io.sockets.sockets.forEach(socket => socket.conn.close());
    await waitFor(() => tokensSeen.length === 2, 5000);
    await waitFor(() => client!.status() === 'connected');

    client.emit('ping-me');
    await waitFor(() => pongs.length === 1);
    expect(tokensSeen).toEqual(['access-1', 'access-2']);
  }, 10_000);

  it('stays off after the server disconnects it, until woken', async () => {
    let token = 'access-1';
    client = createSocketClient({ url, getToken: () => token });
    client.start();
    await waitFor(() => client!.status() === 'connected');

    // A server-side disconnect usually means "rejected"; socket.io does not
    // retry it on its own.
    io.disconnectSockets(true);
    await waitFor(() => client!.status() === 'disconnected');
    await new Promise(resolve => setTimeout(resolve, 1500));
    expect(tokensSeen).toEqual(['access-1']);

    token = 'access-2';
    client.wake();
    await waitFor(() => client!.status() === 'connected');
    expect(tokensSeen).toEqual(['access-1', 'access-2']);
  }, 10_000);

  it('stops cleanly and forgets queued emits from the ended session', async () => {
    client = createSocketClient({ url, getToken: () => 'access-1' });
    const statuses: string[] = [];
    client.onStatus(status => statuses.push(status));

    client.emit('message', 'from the old session');
    client.stop();
    client.start();
    await waitFor(() => client!.status() === 'connected');
    await new Promise(resolve => setTimeout(resolve, 100));

    expect(received).toEqual([]);
    expect(statuses).toEqual(['idle', 'connecting', 'connected']);
  });
});
