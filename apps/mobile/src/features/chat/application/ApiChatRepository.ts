import { IConversationDTO } from '@esparex/contracts';
import { apiClient } from '../../../infrastructure/api/apiClient';
import { IChatRepository } from './IChatRepository';

export class ApiChatRepository implements IChatRepository {
  async getConversations(): Promise<IConversationDTO[]> {
    const response = await apiClient.get<IConversationDTO[]>('/api/v1/chat/list');
    return response.data;
  }

  async getConversationById(id: string): Promise<IConversationDTO> {
    const response = await apiClient.get<IConversationDTO>(`/api/v1/chat/${id}`);
    return response.data;
  }
}
