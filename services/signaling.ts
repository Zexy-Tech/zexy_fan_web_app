import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export const getSignalingSocket = () => {
  if (!socket) {
    const signalingUrl = process.env.NEXT_PUBLIC_SIGNALING_URL || 'http://localhost:3001';
    socket = io(signalingUrl, {
      path: '/socket.io',
      transports: ['websocket'],
    });
  }
  return socket;
};
