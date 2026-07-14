import { MongoChatRepositoryAdapter } from '../adapters/outbound/database/chat/MongoChatRepositoryAdapter';
import { ChatRepositoryPort } from '../domains/chat';

export const chatRepository: ChatRepositoryPort = new MongoChatRepositoryAdapter();
