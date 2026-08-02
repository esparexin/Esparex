import { IConversationDTO, IMessageDTO } from '@esparex/contracts';
import { IChatRepository } from './IChatRepository';

export class ChatService {
  constructor(private readonly chatRepository: IChatRepository) {}

  async getConversations(): Promise<IConversationDTO[]> {
    return this.chatRepository.getConversations();
  }

  async getConversationById(id: string): Promise<IConversationDTO> {
    return this.chatRepository.getConversationById(id);
  }

  async getMessages(conversationId: string): Promise<IMessageDTO[]> {
    return this.chatRepository.getMessages(conversationId);
  }

  async sendMessage(conversationId: string, text: string): Promise<IMessageDTO> {
    return this.chatRepository.sendMessage(conversationId, text);
  }

  async markRead(conversationId: string): Promise<void> {
    return this.chatRepository.markRead(conversationId);
  }
}
