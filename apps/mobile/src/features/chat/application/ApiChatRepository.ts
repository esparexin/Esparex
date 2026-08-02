import { IConversationDTO, IMessageDTO } from '@esparex/contracts';
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

  async getMessages(conversationId: string): Promise<IMessageDTO[]> {
    const response = await apiClient.get<IMessageDTO[]>(`/api/v1/chat/${conversationId}/messages`);
    return response.data;
  }

  async sendMessage(conversationId: string, text: string): Promise<IMessageDTO> {
    const response = await apiClient.post<IMessageDTO>(`/api/v1/chat/${conversationId}/messages`, {
      conversationId,
      text,
    });
    return response.data;
  }

  async markRead(conversationId: string): Promise<void> {
    await apiClient.patch(`/api/v1/chat/${conversationId}/read`);
  }
}
