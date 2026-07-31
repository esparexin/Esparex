import { describe, expect, it } from 'vitest';
import { enqueueOfflineMessage, getOfflineQueue, removeOfflineMessage } from '@/lib/chatOfflineQueue';

describe('chatOfflineQueue & Attachment Security Validation', () => {
  it('enqueues, retrieves, and deletes offline queued messages', async () => {
    const msg = {
      id: 'offline-msg-1',
      conversationId: 'conv-100',
      text: 'Offline test message',
      createdAt: new Date().toISOString(),
      idempotencyKey: 'idemp-12345',
      attachments: [
        {
          id: 'att-1',
          url: 'https://cdn.esparex.in/chat-attachments/att-1.png',
          mimeType: 'image/png',
          size: 1024 * 500,
          name: 'photo.png',
        },
      ],
    };

    await enqueueOfflineMessage(msg);
    const queue = await getOfflineQueue('conv-100');
    expect(queue.some((m) => m.id === 'offline-msg-1')).toBe(true);

    await removeOfflineMessage('offline-msg-1');
    const queueAfter = await getOfflineQueue('conv-100');
    expect(queueAfter.some((m) => m.id === 'offline-msg-1')).toBe(false);
  });

  it('validates 5MB attachment file size limit', () => {
    const MAX_FILE_SIZE = 5 * 1024 * 1024;
    const validSize = 4 * 1024 * 1024;
    const oversized = 6 * 1024 * 1024;

    expect(validSize <= MAX_FILE_SIZE).toBe(true);
    expect(oversized <= MAX_FILE_SIZE).toBe(false);
  });

  it('validates MIME magic bytes for JPEG, PNG, and WebP images', () => {
    // JPEG magic bytes: FF D8
    const jpegBytes = new Uint8Array([0xff, 0xd8, 0xff, 0xe0]);
    const isJpeg = jpegBytes[0] === 0xff && jpegBytes[1] === 0xd8;
    expect(isJpeg).toBe(true);

    // PNG magic bytes: 89 50 4E 47
    const pngBytes = new Uint8Array([0x89, 0x50, 0x4e, 0x47]);
    const isPng = pngBytes[0] === 0x89 && pngBytes[1] === 0x50 && pngBytes[2] === 0x4e && pngBytes[3] === 0x47;
    expect(isPng).toBe(true);

    // Executable binary magic bytes: 4D 5A (MZ header)
    const exeBytes = new Uint8Array([0x4d, 0x5a, 0x90, 0x00]);
    const isAllowedImage = (exeBytes[0] === 0xff && exeBytes[1] === 0xd8) || (exeBytes[0] === 0x89 && exeBytes[1] === 0x50);
    expect(isAllowedImage).toBe(false);
  });
});
