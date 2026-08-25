import type { IMessageDTO } from '@esparex/contracts';

/**
 * mergePaginatedMessages — merges historical messages and current messages,
 * deduplicating by ID or tempId, and sorting in ascending chronological order.
 */
export function mergePaginatedMessages(
  currentMessages: readonly IMessageDTO[],
  olderMessages: readonly IMessageDTO[]
): IMessageDTO[] {
  const messageMap = new Map<string, IMessageDTO>();

  // Add older messages first
  for (const msg of olderMessages) {
    const key = msg.tempId || msg.id;
    if (key) messageMap.set(key, msg);
  }

  // Overlay current messages (current status takes priority)
  for (const msg of currentMessages) {
    const key = msg.tempId || msg.id;
    if (key) messageMap.set(key, msg);
  }

  return Array.from(messageMap.values()).sort((a, b) => {
    const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return timeA - timeB;
  });
}

/**
 * reconcileOptimisticMessage — replaces an in-flight optimistic temp message
 * with the confirmed message returned by the server.
 */
export function reconcileOptimisticMessage(
  messages: readonly IMessageDTO[],
  optimisticTempId: string,
  confirmedMessage: IMessageDTO
): IMessageDTO[] {
  let replaced = false;
  const result: IMessageDTO[] = [];

  for (const msg of messages) {
    if (msg.tempId === optimisticTempId || msg.id === optimisticTempId) {
      result.push(confirmedMessage);
      replaced = true;
    } else {
      result.push(msg);
    }
  }

  if (!replaced) {
    result.push(confirmedMessage);
  }

  return result;
}
