import {
  IConversationDTO,
  IMessageDTO,
  IChatStartResponse,
  IConversationListResponse,
  IConversationResponse,
  IMessageListResponse,
  IChatSendResponse,
} from '@esparex/contracts';
import { apiClient } from '../../../infrastructure/api/apiClient';
import { IChatRepository } from './IChatRepository';

export class ApiChatRepository implements IChatRepository {
  async startChat(adId: string): Promise<string> {
    const response = await apiClient.post<IChatStartResponse>('/chat/start', { adId });
    return response.data.conversationId;
  }

  async getConversations(): Promise<IConversationDTO[]> {
    const response = await apiClient.get<IConversationListResponse>('/chat/list');
    return response.data.data;
  }

  async getConversationById(id: string): Promise<IConversationDTO> {
    const response = await apiClient.get<IConversationResponse>(`/chat/${id}`);
    return response.data.data;
  }

  async getMessages(conversationId: string): Promise<IMessageDTO[]> {
    const response = await apiClient.get<IMessageListResponse>(`/chat/${conversationId}/messages`);
    return response.data.data;
  }

  async sendMessage(conversationId: string, text: string): Promise<IMessageDTO> {
    const response = await apiClient.post<IChatSendResponse>('/chat/send', {
      conversationId,
      text,
    });
    return response.data.message;
  }

  async markRead(conversationId: string): Promise<void> {
    await apiClient.post('/chat/read', { conversationId });
  }
}
