import { io, type Socket } from 'socket.io-client';

export type SocketStatus = 'idle' | 'connecting' | 'connected' | 'disconnected';

type Handler = (payload: unknown) => void;

type Options = {
  url: string;
  // Read on every connect and reconnect, so a refreshed token is used.
  getToken: () => string | null;
  // Emits made while offline wait here, oldest dropped first past this size.
  maxQueued?: number;
  // Test seam; the app uses socket.io-client's io().
  connect?: typeof io;
};

export type SocketClient = {
  start: () => void;
  stop: () => void;
  // Sends now when connected, otherwise once the connection is back.
  emit: (event: string, payload?: unknown) => void;
  // Survives reconnects. Returns an unsubscribe function.
  on: (event: string, handler: Handler) => () => void;
  // Skips the backoff wait, for when the network or the app comes back. Also
  // the only way back after the server itself disconnects the client, which
  // socket.io treats as deliberate and does not retry.
  wake: () => void;
  status: () => SocketStatus;
  onStatus: (listener: (status: SocketStatus) => void) => () => void;
};

export const createSocketClient = ({
  url,
  getToken,
  maxQueued = 50,
  connect = io,
}: Options): SocketClient => {
  let socket: Socket | null = null;
  let status: SocketStatus = 'idle';
  const queue: { event: string; payload: unknown }[] = [];
  const handlers = new Map<string, Set<Handler>>();
  const statusListeners = new Set<(status: SocketStatus) => void>();

  const setStatus = (next: SocketStatus) => {
    status = next;
    statusListeners.forEach(listener => listener(next));
  };

  const flush = () => {
    while (socket?.connected && queue.length > 0) {
      const { event, payload } = queue.shift()!;
      socket.emit(event, payload);
    }
  };

  const start = () => {
    if (socket) {
      return;
    }
    // socket.io keeps the exponential backoff; listeners stay attached to the
    // Socket object across reconnects.
    socket = connect(url, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 30_000,
      randomizationFactor: 0.5,
      auth: callback => callback({ token: getToken() }),
    });
    setStatus('connecting');
    socket.on('connect', () => {
      setStatus('connected');
      flush();
    });
    socket.on('disconnect', () => setStatus('disconnected'));
    socket.on('connect_error', () => setStatus('disconnected'));
    handlers.forEach((set, event) =>
      set.forEach(handler => socket?.on(event, handler)),
    );
  };

  const stop = () => {
    socket?.removeAllListeners();
    socket?.disconnect();
    socket = null;
    // Queued emits belong to the session that is ending.
    queue.length = 0;
    setStatus('idle');
  };

  const emit = (event: string, payload?: unknown) => {
    if (socket?.connected) {
      socket.emit(event, payload);
      return;
    }
    queue.push({ event, payload });
    if (queue.length > maxQueued) {
      queue.shift();
    }
  };

  const on = (event: string, handler: Handler) => {
    const set = handlers.get(event) ?? new Set<Handler>();
    set.add(handler);
    handlers.set(event, set);
    socket?.on(event, handler);
    return () => {
      set.delete(handler);
      socket?.off(event, handler);
    };
  };

  const wake = () => {
    if (socket && !socket.connected && !socket.active) {
      socket.connect();
    }
  };

  return {
    start,
    stop,
    emit,
    on,
    wake,
    status: () => status,
    onStatus: listener => {
      statusListeners.add(listener);
      return () => statusListeners.delete(listener);
    },
  };
};
