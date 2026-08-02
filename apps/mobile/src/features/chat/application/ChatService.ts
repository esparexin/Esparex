import { IConversationDTO } from '@esparex/contracts';
import { IChatRepository } from './IChatRepository';

export class ChatService {
  constructor(private readonly chatRepository: IChatRepository) {}

  async getConversations(): Promise<IConversationDTO[]> {
    return this.chatRepository.getConversations();
  }

  async getConversationById(id: string): Promise<IConversationDTO> {
    return this.chatRepository.getConversationById(id);
  }
}
