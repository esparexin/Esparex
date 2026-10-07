import { MongoChatRepositoryAdapter } from '../adapters/outbound/database/chat/MongoChatRepositoryAdapter';
import type { ChatRepositoryPort } from '../domains/communications/ports/ChatRepositoryPort';

export const chatRepository: ChatRepositoryPort = new MongoChatRepositoryAdapter();
