import { chatApi } from "@/lib/api/chatApi";
import type { IMessageDTO } from "@esparex/contracts";

export async function uploadChatAttachment(
  conversationId: string,
  attachmentFile: File
): Promise<IMessageDTO['attachments']> {
  try {
    const presigned = await chatApi.uploadUrl(conversationId, attachmentFile.type, attachmentFile.name);
    if (presigned?.data?.uploadUrl) {
      await fetch(presigned.data.uploadUrl, {
        method: 'PUT',
        body: attachmentFile,
        headers: { 'Content-Type': attachmentFile.type },
      });
      return [
        {
          url: presigned.data.publicUrl,
          displayUrl: presigned.data.publicUrl,
          mimeType: attachmentFile.type,
          size: attachmentFile.size,
          name: attachmentFile.name,
          status: 'available' as const,
        },
      ];
    }
    return undefined;
  } catch {
    throw new Error('Failed to upload image attachment');
  }
}
