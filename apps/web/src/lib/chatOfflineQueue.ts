/**
 * ESPAREX — Chat Offline Queue (IndexedDB + Memory Fallback)
 *
 * Persists queued offline messages so dispatches survive browser refreshes,
 * tab evictions, or app crashes until connection is restored.
 */

export interface QueuedMessage {
  id: string;
  conversationId: string;
  text: string;
  createdAt: string;
  idempotencyKey: string;
  attachments?: Array<{
    id?: string;
    url: string;
    mimeType: string;
    size: number;
    name?: string;
  }>;
}

const DB_NAME = 'esparex_chat_offline';
const STORE_NAME = 'queued_messages';
const DB_VERSION = 1;

let memoryQueue: QueuedMessage[] = [];

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !('indexedDB' in window)) {
      reject(new Error('IndexedDB unavailable'));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function enqueueOfflineMessage(msg: QueuedMessage): Promise<void> {
  memoryQueue = memoryQueue.filter((m) => m.id !== msg.id);
  memoryQueue.push(msg);
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put(msg);
    await new Promise((resolve) => {
      tx.oncomplete = resolve;
    });
  } catch {
    /* Fallback to memoryQueue */
  }
}

export async function removeOfflineMessage(id: string): Promise<void> {
  memoryQueue = memoryQueue.filter((m) => m.id !== id);
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).delete(id);
    await new Promise((resolve) => {
      tx.oncomplete = resolve;
    });
  } catch {
    /* Fallback to memoryQueue */
  }
}

export async function getOfflineQueue(conversationId?: string): Promise<QueuedMessage[]> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const all = await new Promise<QueuedMessage[]>((resolve, reject) => {
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result as QueuedMessage[]);
      req.onerror = () => reject(req.error);
    });
    if (conversationId) {
      return all.filter((m) => m.conversationId === conversationId);
    }
    return all;
  } catch {
    if (conversationId) {
      return memoryQueue.filter((m) => m.conversationId === conversationId);
    }
    return memoryQueue;
  }
}
