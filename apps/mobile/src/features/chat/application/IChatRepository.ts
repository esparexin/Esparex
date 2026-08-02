import { IConversationDTO, IMessageDTO } from '@esparex/contracts';

export interface IChatRepository {
  getConversations(): Promise<IConversationDTO[]>;
  getConversationById(id: string): Promise<IConversationDTO>;
  getMessages(conversationId: string): Promise<IMessageDTO[]>;
  sendMessage(conversationId: string, text: string): Promise<IMessageDTO>;
  markRead(conversationId: string): Promise<void>;
}
