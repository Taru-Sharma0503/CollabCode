import { io } from 'socket.io-client';
import { getAccessToken } from '../services/apiClient';

let socket = null;

export function getSocket() {
  if (socket && socket.connected) {
    return socket;
  }

  const token = getAccessToken();
  if (!token) {
    if (socket) {
      socket.disconnect();
      socket = null;
    }
    return null;
  }

  if (!socket) {
    socket = io('/', {
      auth: { token },
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000
    });

    socket.on('connect', () => {
      console.log('[Socket] Connected with ID:', socket.id);
    });

    socket.on('connect_error', (err) => {
      console.warn('[Socket] Connection error:', err.message);
    });
  } else {
    socket.auth = { token };
    if (!socket.connected) {
      socket.connect();
    }
  }

  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
