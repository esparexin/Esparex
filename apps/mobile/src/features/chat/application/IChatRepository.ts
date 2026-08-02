import { IConversationDTO } from '@esparex/contracts';

export interface IChatRepository {
  getConversations(): Promise<IConversationDTO[]>;
  getConversationById(id: string): Promise<IConversationDTO>;
}
