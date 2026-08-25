'use client';

import { io, Socket } from 'socket.io-client';
import { resolveRuntimeApiOrigin } from '@/lib/api/runtimeApiBase';
import { dispatchChatInboxUpdated } from '@/lib/chatEvents';
import type {
  IChatMessageEvent,
  IChatReadEvent,
  IChatTypingEvent,
} from '@esparex/contracts';

let socketInstance: Socket | null = null;
let boundInboxHandler = false;

const SOCKET_ORIGIN = resolveRuntimeApiOrigin();

/**
 * Single-Instance Socket Manager
 *
 * Ensures only ONE Socket.IO connection is opened per authenticated web session,
 * avoiding duplicate socket instances, memory leaks, and connection thrashing.
 */
export function getChatSocket(): Socket | null {
  if (typeof window === 'undefined') return null;

  if (!socketInstance) {
    socketInstance = io(SOCKET_ORIGIN, {
      withCredentials: true,
      transports: ['polling', 'websocket'],
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10_000,
      randomizationFactor: 0.5,
      reconnectionAttempts: Infinity,
      autoConnect: false,
    });
  }

  if (!boundInboxHandler && socketInstance) {
    socketInstance.on('chat:inbox_updated', () => {
      dispatchChatInboxUpdated();
    });
    boundInboxHandler = true;
  }

  if (!socketInstance.connected && !socketInstance.active) {
    socketInstance.connect();
  }

  return socketInstance;
}

/**
 * Disconnect socket and clear singleton state on user logout
 */
export function disconnectChatSocket(): void {
  if (socketInstance) {
    if (socketInstance.connected) {
      socketInstance.disconnect();
    }
    socketInstance = null;
    boundInboxHandler = false;
  }
}

export function emitChatTyping(conversationId: string, receiverId: string, isTyping: boolean): void {
  const socket = getChatSocket();
  if (socket?.connected) {
    socket.emit('chat:typing', { conversationId, receiverId, isTyping });
  }
}

export function queryPresenceStatus(
  targetUserId: string,
  callback: (status: { userId: string; isOnline: boolean }) => void
): void {
  const socket = getChatSocket();
  if (socket?.connected) {
    socket.emit('presence:get', { targetUserId }, callback);
  } else {
    callback({ userId: targetUserId, isOnline: false });
  }
}

export type { IChatMessageEvent, IChatReadEvent, IChatTypingEvent };
