import {
  IConversationDTO,
  IMessageDTO,
  IConversationListResponse,
  IConversationResponse,
  IMessageListResponse,
  IChatSendResponse,
} from '@esparex/contracts';
import { apiClient } from '../../../infrastructure/api/apiClient';
import { IChatRepository } from './IChatRepository';

export class ApiChatRepository implements IChatRepository {
  async getConversations(): Promise<IConversationDTO[]> {
    const response = await apiClient.get<IConversationListResponse>('/v1/chat/list');
    return response.data.data;
  }

  async getConversationById(id: string): Promise<IConversationDTO> {
    const response = await apiClient.get<IConversationResponse>(`/v1/chat/${id}`);
    return response.data.data;
  }

  async getMessages(conversationId: string): Promise<IMessageDTO[]> {
    const response = await apiClient.get<IMessageListResponse>(`/v1/chat/${conversationId}/messages`);
    return response.data.data;
  }

  async sendMessage(conversationId: string, text: string): Promise<IMessageDTO> {
    const response = await apiClient.post<IChatSendResponse>('/v1/chat/send', {
      conversationId,
      text,
    });
    return response.data.message;
  }

  async markRead(conversationId: string): Promise<void> {
    await apiClient.post('/v1/chat/read', { conversationId });
  }
}
